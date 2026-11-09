<?php

namespace App\Services\Images;

use Illuminate\Support\Facades\Http;

/**
 * Best Buy Products API. Free with a developer key (developer.bestbuy.com);
 * product images are provided for affiliates to display.
 */
class BestBuyImages implements ImageProvider
{
    public function key(): string
    {
        return 'bestbuy';
    }

    public function enabled(): bool
    {
        return filled(config('services.bestbuy.api_key'));
    }

    public function search(string $query, ?string $upc = null): array
    {
        if ($upc) {
            $filter = 'upc='.$upc;
        } else {
            $words = array_slice(preg_split('/\s+/', preg_replace('/[^\pL\pN ]+/u', ' ', $query), -1, PREG_SPLIT_NO_EMPTY), 0, 8);
            if ($words === []) {
                return [];
            }
            $filter = implode('&', array_map(fn ($w) => 'search='.$w, $words));
        }

        $response = Http::timeout(8)->get("https://api.bestbuy.com/v1/products({$filter})", [
            'apiKey' => config('services.bestbuy.api_key'),
            'format' => 'json',
            'show' => 'sku,name,largeImage,image',
            'pageSize' => 6,
        ]);

        if (! $response->successful()) {
            return [];
        }

        return collect($response->json('products', []))
            ->map(fn ($p) => [
                'url' => $p['largeImage'] ?? $p['image'] ?? null,
                'title' => (string) ($p['name'] ?? ''),
                'source' => 'Best Buy',
            ])
            ->filter(fn ($c) => is_string($c['url']) && str_starts_with($c['url'], 'https://'))
            ->values()
            ->all();
    }
}
