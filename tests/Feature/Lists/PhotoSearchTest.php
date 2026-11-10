<?php

namespace Tests\Feature\Lists;

use App\Models\GiftList;
use App\Models\ListItem;
use App\Models\User;
use App\Services\Images\ProductImageSearch;
use App\Services\Images\WalmartImages;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PhotoSearchTest extends TestCase
{
    use RefreshDatabase;

    private function bestBuyResponse(): array
    {
        return ['products' => [
            ['sku' => 1, 'name' => 'KitchenAid Artisan 5 Quart Stand Mixer - Empire Red', 'largeImage' => 'https://pisces.bbystatic.com/image2/mixer.jpg', 'image' => 'https://pisces.bbystatic.com/image2/mixer-s.jpg'],
            ['sku' => 2, 'name' => 'No image product', 'largeImage' => null, 'image' => null],
        ]];
    }

    public function test_photo_search_is_hidden_until_a_provider_is_configured(): void
    {
        config(['services.bestbuy.api_key' => null, 'services.walmart.consumer_id' => null]);
        $user = User::factory()->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('features.imageSearch', false));

        $this->actingAs($user)->postJson(route('images.search'), ['title' => 'Mixer'])->assertNotFound();
    }

    public function test_best_buy_results_are_returned_as_candidates(): void
    {
        config(['services.bestbuy.api_key' => 'test-key']);
        Http::fake(['api.bestbuy.com/*' => Http::response($this->bestBuyResponse())]);
        $user = User::factory()->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('features.imageSearch', true));

        $this->actingAs($user)
            ->postJson(route('images.search'), ['title' => 'KitchenAid Artisan KSM150PS 5-Quart Stand Mixer (Empire Red), Pack of 1'])
            ->assertOk()
            ->assertJsonPath('query', 'KitchenAid Artisan KSM150PS 5-Quart Stand Mixer')
            ->assertJsonCount(1, 'candidates')
            ->assertJsonPath('candidates.0.source', 'Best Buy')
            ->assertJsonPath('candidates.0.url', 'https://pisces.bbystatic.com/image2/mixer.jpg');

        Http::assertSent(fn (Request $r) => str_contains(urldecode($r->url()), 'products(search=KitchenAid&search=Artisan&search=KSM150PS')
            && $r['apiKey'] === 'test-key');
    }

    public function test_a_upc_is_tried_before_the_name(): void
    {
        config(['services.bestbuy.api_key' => 'test-key']);
        Http::fake(['api.bestbuy.com/*' => Http::response($this->bestBuyResponse())]);

        app(ProductImageSearch::class)->search('Some mixer', '883049118949');

        Http::assertSent(fn (Request $r) => str_contains(urldecode($r->url()), 'products(upc=883049118949)'));
    }

    public function test_isbns_are_not_treated_as_upcs(): void
    {
        config(['services.bestbuy.api_key' => 'test-key']);
        Http::fake(['api.bestbuy.com/*' => Http::response(['products' => []])]);

        app(ProductImageSearch::class)->search('Dune', '9780441172719');

        Http::assertNotSent(fn (Request $r) => str_contains(urldecode($r->url()), 'upc='));
    }

    public function test_walmart_requests_are_signed(): void
    {
        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($key, $pem);
        config([
            'services.walmart.consumer_id' => 'consumer-123',
            'services.walmart.key_version' => '2',
            'services.walmart.private_key' => $pem,
        ]);
        Http::fake(['developer.api.walmart.com/*' => Http::response(['items' => [
            ['name' => 'Dutch Oven', 'largeImage' => 'https://i5.walmartimages.com/oven.jpeg'],
        ]])]);

        $results = app(WalmartImages::class)->search('Dutch oven');

        $this->assertSame('Walmart', $results[0]['source']);
        Http::assertSent(function (Request $r) use ($key) {
            $payload = "consumer-123\n{$r->header('WM_CONSUMER.INTIMESTAMP')[0]}\n2\n";
            $public = openssl_pkey_get_details($key)['key'];

            return $r->header('WM_CONSUMER.ID')[0] === 'consumer-123'
                && openssl_verify($payload, base64_decode($r->header('WM_SEC.AUTH_SIGNATURE')[0]), $public, OPENSSL_ALGO_SHA256) === 1;
        });
    }

    public function test_provider_errors_do_not_break_the_picker(): void
    {
        config(['services.bestbuy.api_key' => 'test-key']);
        Http::fake(['api.bestbuy.com/*' => Http::response('nope', 500)]);

        $this->assertSame([], app(ProductImageSearch::class)->search('Anything'));
    }

    public function test_owners_can_save_a_chosen_photo_and_amazon_photos_are_refused(): void
    {
        $list = GiftList::factory()->create();
        $item = ListItem::factory()->for($list, 'list')->create(['image_url' => null]);

        $this->actingAs($list->user)
            ->patch(route('items.update', [$list, $item]), ['image_url' => 'https://pisces.bbystatic.com/image2/mixer.jpg'])
            ->assertSessionHasNoErrors();
        $this->assertSame('https://pisces.bbystatic.com/image2/mixer.jpg', $item->fresh()->image_url);

        $this->actingAs($list->user)
            ->patch(route('items.update', [$list, $item]), ['image_url' => 'https://m.media-amazon.com/images/I/abc.jpg']);
        $this->assertNull($item->fresh()->image_url);
    }
}
