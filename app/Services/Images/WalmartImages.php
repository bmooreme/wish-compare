<?php

namespace App\Services\Images;

use Illuminate\Support\Facades\Http;

/**
 * Walmart Affiliate API (walmart.io). Requires an approved affiliate account,
 * a consumer ID and the RSA private key you registered with Walmart. Each
 * request is signed as the API requires.
 */
class WalmartImages implements ImageProvider
{
    private const BASE = 'https://developer.api.walmart.com/api-proxy/service/affil/product/v2';

    public function key(): string
    {
        return 'walmart';
    }

    public function enabled(): bool
    {
        return filled(config('services.walmart.consumer_id')) && filled($this->privateKey());
    }

    public function search(string $query, ?string $upc = null): array
    {
        [$path, $params] = $upc
            ? ['/items', ['upc' => $upc]]
            : ['/search', ['query' => $query, 'numItems' => 6]];

        $params['publisherId'] = config('services.walmart.publisher_id');

        $response = Http::timeout(8)
            ->withHeaders($this->signedHeaders())
            ->get(self::BASE.$path, array_filter($params));

        if (! $response->successful()) {
            return [];
        }

        return collect($response->json('items', []))
            ->take(6)
            ->map(fn ($i) => [
                'url' => $i['largeImage'] ?? $i['mediumImage'] ?? null,
                'title' => (string) ($i['name'] ?? ''),
                'source' => 'Walmart',
            ])
            ->filter(fn ($c) => is_string($c['url']) && str_starts_with($c['url'], 'https://'))
            ->values()
            ->all();
    }

    /** @return array<string, string> */
    public function signedHeaders(?int $timestampMs = null): array
    {
        $consumerId = (string) config('services.walmart.consumer_id');
        $keyVersion = (string) config('services.walmart.key_version', '1');
        $timestamp = (string) ($timestampMs ?? (int) floor(microtime(true) * 1000));

        $payload = "{$consumerId}\n{$timestamp}\n{$keyVersion}\n";
        openssl_sign($payload, $signature, $this->privateKey(), OPENSSL_ALGO_SHA256);

        return [
            'WM_CONSUMER.ID' => $consumerId,
            'WM_CONSUMER.INTIMESTAMP' => $timestamp,
            'WM_SEC.KEY_VERSION' => $keyVersion,
            'WM_SEC.AUTH_SIGNATURE' => base64_encode((string) $signature),
        ];
    }

    private function privateKey(): ?string
    {
        $path = config('services.walmart.private_key_path');

        if ($path && is_readable($path)) {
            return file_get_contents($path) ?: null;
        }

        $inline = config('services.walmart.private_key');

        return $inline ? str_replace('\n', "\n", $inline) : null;
    }
}
