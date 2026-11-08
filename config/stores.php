<?php

/*
|--------------------------------------------------------------------------
| Retailers & affiliate links
|--------------------------------------------------------------------------
|
| Each store can carry affiliate tracking in one of three ways:
|
|   'param'  – append a query parameter to the destination URL
|              (Amazon Associates: ?tag=yourtag-20).
|   'wrap'   – send the shopper through a network deep-link URL, where
|              {url} is replaced by the URL-encoded destination
|              (Impact, CJ, Rakuten, Awin all support this).
|   null     – no program configured yet: link straight to the store.
|
| Anything not covered falls back to AFFILIATE_FALLBACK_TEMPLATE, which
| is designed for Sovrn Commerce or Skimlinks style link wrappers that
| monetise thousands of merchants with one account.
|
| "featured" stores get a "Buy at…" button on every item. "books" stores
| are only offered for items that look like books (ISBN or a bookstore URL).
|
*/

$config = [

    'fallback_template' => env('AFFILIATE_FALLBACK_TEMPLATE'),

    'retailers' => [

        'amazon' => [
            'name' => 'Amazon',
            'domains' => ['amazon.com', 'amzn.to', 'a.co'],
            'search' => 'https://www.amazon.com/s?k={query}',
            'featured' => true,
            'affiliate' => env('AMAZON_ASSOCIATE_TAG')
                ? ['type' => 'param', 'param' => 'tag', 'value' => env('AMAZON_ASSOCIATE_TAG')]
                : null,
        ],

        'walmart' => [
            'name' => 'Walmart',
            'domains' => ['walmart.com'],
            'search' => 'https://www.walmart.com/search?q={query}',
            'featured' => true,
            'affiliate' => env('WALMART_AFFILIATE_TEMPLATE')
                ? ['type' => 'wrap', 'template' => env('WALMART_AFFILIATE_TEMPLATE')]
                : null,
        ],

        'target' => [
            'name' => 'Target',
            'domains' => ['target.com'],
            'search' => 'https://www.target.com/s?searchTerm={query}',
            'featured' => true,
            'affiliate' => env('TARGET_AFFILIATE_TEMPLATE')
                ? ['type' => 'wrap', 'template' => env('TARGET_AFFILIATE_TEMPLATE')]
                : null,
        ],

        'bestbuy' => [
            'name' => 'Best Buy',
            'domains' => ['bestbuy.com'],
            'search' => 'https://www.bestbuy.com/site/searchpage.jsp?st={query}',
            'featured' => true,
            'affiliate' => env('BESTBUY_AFFILIATE_TEMPLATE')
                ? ['type' => 'wrap', 'template' => env('BESTBUY_AFFILIATE_TEMPLATE')]
                : null,
        ],

        'barnesandnoble' => [
            'name' => 'Barnes & Noble',
            'domains' => ['barnesandnoble.com'],
            'search' => 'https://www.barnesandnoble.com/s/{query}',
            'featured' => 'books',
            'affiliate' => env('BARNESANDNOBLE_AFFILIATE_TEMPLATE')
                ? ['type' => 'wrap', 'template' => env('BARNESANDNOBLE_AFFILIATE_TEMPLATE')]
                : null,
        ],

        // Recognised when a product is added from these sites, so the original
        // product link is credited correctly. Add a *_AFFILIATE_TEMPLATE once
        // you're approved, or rely on the fallback wrapper.
        'etsy' => ['name' => 'Etsy', 'domains' => ['etsy.com']],
        'wayfair' => ['name' => 'Wayfair', 'domains' => ['wayfair.com']],
        'crateandbarrel' => ['name' => 'Crate & Barrel', 'domains' => ['crateandbarrel.com']],
        'williamssonoma' => ['name' => 'Williams Sonoma', 'domains' => ['williams-sonoma.com']],
        'potterybarn' => ['name' => 'Pottery Barn', 'domains' => ['potterybarn.com', 'potterybarnkids.com']],
        'macys' => ['name' => "Macy's", 'domains' => ['macys.com']],
        'kohls' => ['name' => "Kohl's", 'domains' => ['kohls.com']],
        'bedbathbeyond' => ['name' => 'Bed Bath & Beyond', 'domains' => ['bedbathandbeyond.com']],
        'buybuybaby' => ['name' => 'buybuy BABY', 'domains' => ['buybuybaby.com']],
        'homedepot' => ['name' => 'The Home Depot', 'domains' => ['homedepot.com']],
        'lowes' => ['name' => "Lowe's", 'domains' => ['lowes.com']],
        'rei' => ['name' => 'REI', 'domains' => ['rei.com']],
        'dicks' => ['name' => "Dick's Sporting Goods", 'domains' => ['dickssportinggoods.com']],
        'nordstrom' => ['name' => 'Nordstrom', 'domains' => ['nordstrom.com']],
        'sephora' => ['name' => 'Sephora', 'domains' => ['sephora.com']],
        'ulta' => ['name' => 'Ulta Beauty', 'domains' => ['ulta.com']],
    ],

];

// Stores without an explicit program pick one up from <KEY>_AFFILIATE_TEMPLATE,
// e.g. ETSY_AFFILIATE_TEMPLATE="https://www.awin1.com/cread.php?awinmid=…&ued={url}".
foreach ($config['retailers'] as $key => $store) {
    if (! array_key_exists('affiliate', $store)) {
        $template = env(strtoupper($key).'_AFFILIATE_TEMPLATE');
        $config['retailers'][$key]['affiliate'] = $template ? ['type' => 'wrap', 'template' => $template] : null;
    }
}

return $config;
