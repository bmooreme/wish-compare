<?php

namespace App\Services\Images;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Throwable;

/**
 * Finds licensed product photos for an item by searching retailer affiliate
 * APIs with a cleaned-up version of the product name (or its UPC). The
 * owner always picks the photo; nothing is attached automatically.
 */
class ProductImageSearch
{
    /** @var list<ImageProvider> */
    private array $providers;

    public function __construct(BestBuyImages $bestBuy, WalmartImages $walmart)
    {
        $this->providers = [$bestBuy, $walmart];
    }

    public function enabled(): bool
    {
        return $this->activeProviders() !== [];
    }

    /** @return list<array{url: string, title: string, source: string}> */
    public function search(string $title, ?string $identifier = null): array
    {
        $query = $this->queryFrom($title);
        $upc = $this->upcFrom($identifier);

        if ($query === '' && ! $upc) {
            return [];
        }

        $cacheKey = 'image-search:'.sha1($query.'|'.$upc);

        return Cache::remember($cacheKey, now()->addDay(), function () use ($query, $upc) {
            $results = [];

            foreach ($this->activeProviders() as $provider) {
                try {
                    // An exact UPC match beats a name search; fall back if it finds nothing.
                    $found = $upc ? $provider->search($query, $upc) : [];
                    if ($found === [] && $query !== '') {
                        $found = $provider->search($query);
                    }
                    array_push($results, ...$found);
                } catch (Throwable $e) {
                    report($e);
                }
            }

            return collect($results)->unique('url')->take(12)->values()->all();
        });
    }

    /**
     * Strip a long marketplace title down to brand + product + model:
     * drop bracketed asides, marketing tails after separators, sizes like
     * "Pack of 2", and cap the length.
     */
    public function queryFrom(string $title): string
    {
        $q = html_entity_decode($title, ENT_QUOTES | ENT_HTML5);
        $q = preg_replace('/[\(\[\{][^\)\]\}]*[\)\]\}]/u', ' ', $q);          // (3rd Gen) [2024 model]
        $q = preg_split('/\s+[|–—]\s+|\s+-\s+|,\s+|:\s+/u', $q)[0] ?? $q;      // "Name - long marketing tail"
        $q = preg_replace('/\b(pack|set|count|ct)\s+of\s+\d+\b|\b\d+\s*-?\s*(pack|count|ct)\b/iu', ' ', $q);
        $q = preg_replace('/[^\pL\pN&\'\.\- ]+/u', ' ', $q);
        $words = preg_split('/\s+/', trim($q), -1, PREG_SPLIT_NO_EMPTY);

        return Str::of(implode(' ', array_slice($words, 0, 8)))->squish()->toString();
    }

    private function upcFrom(?string $identifier): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $identifier);

        // 12/13-digit codes that aren't ISBNs (978/979) are UPC/EAN barcodes.
        if (in_array(strlen($digits), [12, 13], true) && ! preg_match('/^97[89]/', $digits)) {
            return $digits;
        }

        return null;
    }

    /** @return list<ImageProvider> */
    private function activeProviders(): array
    {
        return array_values(array_filter($this->providers, fn (ImageProvider $p) => $p->enabled()));
    }
}
