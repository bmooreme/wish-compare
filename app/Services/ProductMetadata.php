<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * Reads the product name, image and identifiers from a pasted product URL
 * using the Open Graph / schema.org markup most stores publish.
 *
 * Fetching is defensive: only public http(s) hosts, a handful of redirects,
 * short timeouts and a capped body size. Any failure just returns what we
 * know, so the user can fill the rest in by hand.
 */
class ProductMetadata
{
    private const MAX_REDIRECTS = 4;

    private const MAX_BYTES = 2_000_000;

    public function __construct(private Retailers $retailers) {}

    /** @return array{title: ?string, image_url: ?string, identifier: ?string, store_key: ?string, store_name: ?string, url: string} */
    public function lookup(string $url): array
    {
        $result = [
            'url' => $url,
            'title' => null,
            'image_url' => null,
            'identifier' => null,
            'store_key' => $this->retailers->detect($url),
            'store_name' => $this->retailers->labelFor($url),
        ];

        try {
            [$finalUrl, $html] = $this->fetch($url);
        } catch (Throwable) {
            return $result;
        }

        $parsed = $this->parse($html, $finalUrl);

        $result['title'] = $parsed['title'];
        $result['image_url'] = $parsed['image_url'];
        $result['identifier'] = $parsed['identifier'];
        $result['store_key'] ??= $this->retailers->detect($finalUrl);
        $result['store_name'] = $this->retailers->labelFor($finalUrl, $result['store_key']);

        return $result;
    }

    /** @return array{title: ?string, image_url: ?string, identifier: ?string} */
    public function parse(string $html, string $baseUrl): array
    {
        $doc = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="utf-8"?>'.$html, LIBXML_NONET | LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $xpath = new DOMXPath($doc);
        $product = $this->jsonLdProduct($xpath);

        $title = $product['name'] ?? null;
        $title = $title ?: $this->meta($xpath, ['og:title', 'twitter:title']);
        $title = $title ?: $this->text($xpath, '//title');

        $image = $this->firstImage($product['image'] ?? null);
        $image = $image ?: $this->meta($xpath, ['og:image', 'og:image:secure_url', 'twitter:image']);

        $identifier = null;
        foreach (['isbn', 'gtin13', 'gtin12', 'gtin', 'gtin14', 'gtin8'] as $field) {
            $value = $product[$field] ?? null;
            if (is_scalar($value) && preg_match('/^[0-9Xx-]{8,17}$/', (string) $value)) {
                $identifier = strtoupper(str_replace('-', '', (string) $value));
                break;
            }
        }
        $identifier ??= $this->meta($xpath, ['books:isbn', 'product:upc', 'product:ean']);

        return [
            'title' => $title ? Str::of(html_entity_decode($title, ENT_QUOTES | ENT_HTML5))->squish()->limit(250, '')->toString() : null,
            'image_url' => $image ? $this->absolute($image, $baseUrl) : null,
            'identifier' => $identifier ? Str::limit($identifier, 32, '') : null,
        ];
    }

    /** @return array{0: string, 1: string} */
    private function fetch(string $url): array
    {
        for ($i = 0; $i <= self::MAX_REDIRECTS; $i++) {
            $ip = $this->assertPublicUrl($url);
            $host = parse_url($url, PHP_URL_HOST);
            $port = parse_url($url, PHP_URL_PORT) ?: (str_starts_with(strtolower($url), 'https') ? 443 : 80);

            // Pin the connection to the address we validated (prevents DNS rebinding).
            $response = Http::withOptions([
                'allow_redirects' => false,
                'curl' => [CURLOPT_RESOLVE => ["{$host}:{$port}:{$ip}"]],
            ])
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (compatible; '.config('app.name').'LinkPreview/1.0)',
                    'Accept' => 'text/html,application/xhtml+xml',
                    'Accept-Language' => 'en-US,en;q=0.9',
                ])
                ->connectTimeout(4)
                ->timeout(8)
                ->get($url);

            if ($response->redirect() && ($location = $response->header('Location'))) {
                $url = $this->absolute($location, $url);

                continue;
            }

            $body = substr($response->body(), 0, self::MAX_BYTES);

            return [$url, $body];
        }

        throw new \RuntimeException('Too many redirects.');
    }

    /** Refuse anything that isn't a public internet address (SSRF guard). */
    public function assertPublicUrl(string $url): string
    {
        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        $host = $parts['host'] ?? null;

        if (! in_array($scheme, ['http', 'https'], true) || ! $host) {
            throw new \InvalidArgumentException('Only http(s) URLs are supported.');
        }

        if (isset($parts['port']) && ! in_array((int) $parts['port'], [80, 443], true)) {
            throw new \InvalidArgumentException('Non-standard ports are not allowed.');
        }

        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : (gethostbynamel($host) ?: []);

        if ($ips === []) {
            throw new \InvalidArgumentException('Host could not be resolved.');
        }

        foreach ($ips as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                throw new \InvalidArgumentException('Private addresses are not allowed.');
            }
        }

        return $ips[0];
    }

    /** @return array<string, mixed> */
    private function jsonLdProduct(DOMXPath $xpath): array
    {
        foreach ($xpath->query('//script[@type="application/ld+json"]') as $node) {
            $data = json_decode(trim($node->textContent), true);

            if (! is_array($data)) {
                continue;
            }

            $candidates = array_is_list($data) ? $data : [$data];
            if (isset($data['@graph']) && is_array($data['@graph'])) {
                $candidates = array_merge($candidates, $data['@graph']);
            }

            foreach ($candidates as $candidate) {
                $type = (array) ($candidate['@type'] ?? []);
                if (array_intersect($type, ['Product', 'Book', 'IndividualProduct', 'ProductModel'])) {
                    return $candidate;
                }
            }
        }

        return [];
    }

    private function meta(DOMXPath $xpath, array $names): ?string
    {
        foreach ($names as $name) {
            foreach (['property', 'name', 'itemprop'] as $attr) {
                $node = $xpath->query("//meta[@{$attr}='{$name}']/@content")->item(0);
                if ($node && trim($node->nodeValue) !== '') {
                    return trim($node->nodeValue);
                }
            }
        }

        return null;
    }

    private function text(DOMXPath $xpath, string $query): ?string
    {
        $node = $xpath->query($query)->item(0);

        return $node ? (trim($node->textContent) ?: null) : null;
    }

    private function firstImage(mixed $image): ?string
    {
        if (is_string($image)) {
            return $image;
        }

        if (is_array($image)) {
            if (isset($image['url']) && is_string($image['url'])) {
                return $image['url'];
            }

            return $this->firstImage($image[0] ?? null);
        }

        return null;
    }

    private function absolute(string $url, string $base): string
    {
        if (preg_match('#^https?://#i', $url)) {
            return $url;
        }

        $parts = parse_url($base);
        $origin = ($parts['scheme'] ?? 'https').'://'.($parts['host'] ?? '');

        if (str_starts_with($url, '//')) {
            return ($parts['scheme'] ?? 'https').':'.$url;
        }

        if (str_starts_with($url, '/')) {
            return $origin.$url;
        }

        $path = isset($parts['path']) ? rtrim(dirname($parts['path']), '/') : '';

        return $origin.$path.'/'.$url;
    }
}
