<?php

namespace App\Services\Images;

interface ImageProvider
{
    /** Short machine name, e.g. "bestbuy". */
    public function key(): string;

    /** True when credentials are configured. */
    public function enabled(): bool;

    /**
     * Product photos licensed for affiliate display.
     *
     * @return list<array{url: string, title: string, source: string}>
     */
    public function search(string $query, ?string $upc = null): array;
}
