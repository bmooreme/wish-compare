<?php

namespace App\Services;

use App\Models\ListItem;
use Illuminate\Support\Str;

/**
 * Knows which retailers exist, recognises them from URLs and builds
 * affiliate-tagged outbound links.
 */
class Retailers
{
    /** @return array<string, array<string, mixed>> */
    public function all(): array
    {
        return config('stores.retailers', []);
    }

    public function name(?string $key): ?string
    {
        return $key ? data_get($this->all(), "{$key}.name") : null;
    }

    public function exists(?string $key): bool
    {
        return $key !== null && array_key_exists($key, $this->all());
    }

    /** Identify a retailer from a product URL. */
    public function detect(?string $url): ?string
    {
        $host = $this->host($url);

        if (! $host) {
            return null;
        }

        foreach ($this->all() as $key => $store) {
            foreach ($store['domains'] ?? [] as $domain) {
                if ($host === $domain || Str::endsWith($host, '.'.$domain)) {
                    return $key;
                }
            }
        }

        return null;
    }

    /** Readable label for the store a URL points at, even when unknown. */
    public function labelFor(?string $url, ?string $storeKey = null): ?string
    {
        if ($name = $this->name($storeKey ?? $this->detect($url))) {
            return $name;
        }

        $host = $this->host($url);

        return $host ? Str::of($host)->replaceStart('www.', '')->toString() : null;
    }

    /**
     * Amazon product photos may only be shown when they come through Amazon's
     * own affiliate API, so we never store photos hosted on Amazon's servers.
     */
    public function isAmazonImage(?string $url): bool
    {
        $host = $this->host($url);

        return $host !== null && (bool) preg_match('/(^|\.)(media-amazon\.com|ssl-images-amazon\.com|images-amazon\.com|amazon\.com)$/', $host);
    }

    public function isBook(ListItem $item): bool
    {
        $id = preg_replace('/[^0-9X]/i', '', (string) $item->identifier);

        return $item->store_key === 'barnesandnoble'
            || (strlen($id) === 13 && (str_starts_with($id, '978') || str_starts_with($id, '979')))
            || strlen($id) === 10;
    }

    /**
     * The stores a shopper can buy an item from, in display order:
     * the original store first, then the featured stores.
     *
     * @return list<array{key: string, name: string, direct: bool}>
     */
    public function shopOptions(ListItem $item): array
    {
        $options = [];

        if ($item->url) {
            $options[] = [
                'key' => $item->store_key ?? 'source',
                'name' => $this->labelFor($item->url, $item->store_key) ?? 'Original store',
                'direct' => true,
            ];
        }

        $isBook = $this->isBook($item);

        foreach ($this->all() as $key => $store) {
            $featured = $store['featured'] ?? false;

            if ($featured === false || ($featured === 'books' && ! $isBook)) {
                continue;
            }

            if ($key === $item->store_key && $item->url) {
                continue;
            }

            $options[] = ['key' => $key, 'name' => $store['name'], 'direct' => false];
        }

        return $options;
    }

    /** Resolve the final outbound URL for an item at a given store. */
    public function outboundUrl(ListItem $item, string $storeKey): ?string
    {
        if ($storeKey === 'source' || ($storeKey === $item->store_key && $item->url)) {
            return $item->url ? $this->tag($item->url, $item->store_key) : null;
        }

        $template = data_get($this->all(), "{$storeKey}.search");

        if (! $template) {
            return null;
        }

        $url = str_replace('{query}', rawurlencode($this->searchQuery($item, $storeKey)), $template);

        return $this->tag($url, $storeKey);
    }

    public function searchQuery(ListItem $item, string $storeKey): string
    {
        if ($this->isBook($item) && $item->identifier) {
            return preg_replace('/[^0-9X]/i', '', $item->identifier);
        }

        return Str::of($item->title)->squish()->limit(90, '')->toString();
    }

    /** Apply the store's affiliate program (or the global fallback) to a URL. */
    public function tag(string $url, ?string $storeKey): string
    {
        $program = $storeKey ? data_get($this->all(), "{$storeKey}.affiliate") : null;

        if ($program && $program['type'] === 'param') {
            return $this->withQueryParam($url, $program['param'], $program['value']);
        }

        if ($program && $program['type'] === 'wrap') {
            return str_replace('{url}', rawurlencode($url), $program['template']);
        }

        if ($fallback = config('stores.fallback_template')) {
            return str_replace('{url}', rawurlencode($url), $fallback);
        }

        return $url;
    }

    private function withQueryParam(string $url, string $param, string $value): string
    {
        $parts = parse_url($url);
        parse_str($parts['query'] ?? '', $query);
        $query[$param] = $value;

        $rebuilt = ($parts['scheme'] ?? 'https').'://'.($parts['host'] ?? '')
            .(isset($parts['port']) ? ':'.$parts['port'] : '')
            .($parts['path'] ?? '/')
            .'?'.http_build_query($query);

        return isset($parts['fragment']) ? $rebuilt.'#'.$parts['fragment'] : $rebuilt;
    }

    private function host(?string $url): ?string
    {
        $host = $url ? parse_url($url, PHP_URL_HOST) : null;

        return $host ? Str::lower($host) : null;
    }
}
