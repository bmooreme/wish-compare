<?php

namespace Tests\Unit;

use App\Services\AmazonListParser;
use Tests\TestCase;

class AmazonListParserTest extends TestCase
{
    private function items(): array
    {
        return app(AmazonListParser::class)->parse(file_get_contents(base_path('tests/Fixtures/amazon-wishlist.html')));
    }

    public function test_it_finds_each_product_once_in_page_order(): void
    {
        $items = $this->items();

        $this->assertSame(['B07FZ8S74R', '0593135202', 'B0BSHF7WHW'], array_column($items, 'asin'));
    }

    public function test_it_reads_title_image_quantity_priority_and_comment(): void
    {
        $echo = $this->items()[0];

        $this->assertSame('Echo Dot (3rd Gen) - Smart speaker with Alexa - Charcoal', $echo['title']);
        $this->assertSame('https://www.amazon.com/dp/B07FZ8S74R', $echo['url']);
        $this->assertNull($echo['image_url'], 'Amazon photos are never imported');
        $this->assertSame(2, $echo['quantity']);
        $this->assertTrue($echo['most_wanted']);
        $this->assertSame('Charcoal, not white', $echo['notes']);
    }

    public function test_it_ignores_buttons_and_non_amazon_links(): void
    {
        $items = $this->items();
        $book = $items[1];

        $this->assertSame('Project Hail Mary: A Novel', $book['title']);
        $this->assertFalse($book['most_wanted']);
        $this->assertSame(1, $book['quantity']);
        $this->assertNotContains('B000000000', array_column($items, 'asin'));
    }

    public function test_items_without_a_link_title_use_the_link_text(): void
    {
        $this->assertSame('Apple AirPods Pro (2nd Generation)', $this->items()[2]['title']);
    }

    public function test_plain_text_links_are_parsed_with_titles_from_the_url(): void
    {
        $items = app(AmazonListParser::class)->parse(null, "Check these:\nhttps://www.amazon.com/Hario-V60-Coffee-Dripper/dp/B000P4D5GE?th=1\nhttps://amazon.com/dp/B0BSHF7WHW\nhttps://www.amazon.com/dp/B0BSHF7WHW/ref=x");

        $this->assertCount(2, $items);
        $this->assertSame('Hario V60 Coffee Dripper', $items[0]['title']);
        $this->assertSame('https://www.amazon.com/dp/B000P4D5GE', $items[0]['url']);
        $this->assertSame('Amazon item B0BSHF7WHW', $items[1]['title']);
    }

    public function test_unrelated_content_yields_nothing(): void
    {
        $this->assertSame([], app(AmazonListParser::class)->parse('<p>Hello <a href="https://target.com/p/x">x</a></p>', 'no links here'));
    }
}
