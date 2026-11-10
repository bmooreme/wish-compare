<?php

namespace Tests\Unit;

use App\Models\ListItem;
use App\Services\Retailers;
use Tests\TestCase;

class RetailersTest extends TestCase
{
    public function test_it_detects_stores_from_product_urls(): void
    {
        $r = app(Retailers::class);

        $this->assertSame('amazon', $r->detect('https://www.amazon.com/dp/B0001'));
        $this->assertSame('amazon', $r->detect('https://smile.amazon.com/x'));
        $this->assertSame('barnesandnoble', $r->detect('https://www.barnesandnoble.com/w/book'));
        $this->assertNull($r->detect('https://notamazon.com/x'));
        $this->assertNull($r->detect('https://example.org'));
    }

    public function test_param_programs_append_a_tag_and_wrap_programs_deep_link(): void
    {
        config([
            'stores.retailers.amazon.affiliate' => ['type' => 'param', 'param' => 'tag', 'value' => 'me-20'],
            'stores.retailers.walmart.affiliate' => ['type' => 'wrap', 'template' => 'https://goto.walmart.com/c/1/2/3?u={url}'],
        ]);
        $r = app(Retailers::class);

        $this->assertSame('https://www.amazon.com/dp/B1?th=1&tag=me-20', $r->tag('https://www.amazon.com/dp/B1?th=1', 'amazon'));
        $this->assertSame('https://goto.walmart.com/c/1/2/3?u=https%3A%2F%2Fwww.walmart.com%2Fip%2F1', $r->tag('https://www.walmart.com/ip/1', 'walmart'));
    }

    public function test_the_fallback_wrapper_covers_stores_without_a_program(): void
    {
        config(['stores.fallback_template' => 'https://go.example/?u={url}']);

        $this->assertSame('https://go.example/?u=https%3A%2F%2Fshop.example.com%2Fa', app(Retailers::class)->tag('https://shop.example.com/a', null));
    }

    public function test_barnes_and_noble_is_offered_only_for_books(): void
    {
        $r = app(Retailers::class);
        $book = new ListItem(['title' => 'Dune', 'identifier' => '9780441172719']);
        $mixer = new ListItem(['title' => 'Mixer']);

        $this->assertContains('barnesandnoble', collect($r->shopOptions($book))->pluck('key'));
        $this->assertNotContains('barnesandnoble', collect($r->shopOptions($mixer))->pluck('key'));
        $this->assertSame('9780441172719', $r->searchQuery($book, 'amazon'));
    }

    public function test_the_original_store_comes_first_and_is_not_duplicated(): void
    {
        $item = new ListItem(['title' => 'Lamp', 'url' => 'https://www.target.com/p/lamp', 'store_key' => 'target']);

        $keys = collect(app(Retailers::class)->shopOptions($item))->pluck('key')->all();

        $this->assertSame('target', $keys[0]);
        $this->assertSame(1, array_count_values($keys)['target']);
    }

    public function test_it_recognises_amazon_hosted_images(): void
    {
        $r = app(Retailers::class);

        $this->assertTrue($r->isAmazonImage('https://m.media-amazon.com/images/I/6182S7MYC2L.jpg'));
        $this->assertTrue($r->isAmazonImage('https://images-na.ssl-images-amazon.com/images/I/x.jpg'));
        $this->assertFalse($r->isAmazonImage('https://pisces.bbystatic.com/image2/mixer.jpg'));
        $this->assertFalse($r->isAmazonImage('https://notamazon.com/x.jpg'));
        $this->assertFalse($r->isAmazonImage(null));
    }
}
