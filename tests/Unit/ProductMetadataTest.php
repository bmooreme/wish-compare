<?php

namespace Tests\Unit;

use App\Services\ProductMetadata;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProductMetadataTest extends TestCase
{
    public function test_it_reads_schema_org_product_data(): void
    {
        $html = <<<'HTML'
        <html><head>
        <title>Fallback title</title>
        <meta property="og:image" content="/og.jpg">
        <script type="application/ld+json">
        {"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"Product","name":"KitchenAid Mixer &amp; Bowl","image":["https://cdn.example.com/mixer.jpg"],"gtin12":"883049118949"}]}
        </script></head><body></body></html>
        HTML;

        $result = app(ProductMetadata::class)->parse($html, 'https://shop.example.com/p/1');

        $this->assertSame([
            'title' => 'KitchenAid Mixer & Bowl',
            'image_url' => 'https://cdn.example.com/mixer.jpg',
            'identifier' => '883049118949',
        ], $result);
    }

    public function test_it_falls_back_to_open_graph_and_resolves_relative_images(): void
    {
        $html = '<html><head><meta property="og:title" content="Linen Sheets"><meta property="og:image" content="/img/sheets.png"></head></html>';

        $result = app(ProductMetadata::class)->parse($html, 'https://shop.example.com/p/2');

        $this->assertSame('Linen Sheets', $result['title']);
        $this->assertSame('https://shop.example.com/img/sheets.png', $result['image_url']);
    }

    public static function unsafeUrls(): array
    {
        return [
            ['http://127.0.0.1/admin'],
            ['http://10.0.0.5/'],
            ['http://169.254.169.254/latest/meta-data'],
            ['file:///etc/passwd'],
            ['https://8.8.8.8:8080/'],
        ];
    }

    #[DataProvider('unsafeUrls')]
    public function test_it_refuses_private_and_non_http_addresses(string $url): void
    {
        $this->expectException(InvalidArgumentException::class);

        app(ProductMetadata::class)->assertPublicUrl($url);
    }
}
