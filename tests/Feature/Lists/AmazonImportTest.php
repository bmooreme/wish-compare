<?php

namespace Tests\Feature\Lists;

use App\Models\GiftList;
use App\Models\ListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AmazonImportTest extends TestCase
{
    use RefreshDatabase;

    private function item(array $overrides = []): array
    {
        return [
            'title' => 'Echo Dot',
            'url' => 'https://www.amazon.com/dp/B07FZ8S74R',
            'image_url' => 'https://m.media-amazon.com/images/I/6182S7MYC2L.jpg',
            'quantity' => 2,
            'most_wanted' => true,
            'notes' => 'Charcoal',
            ...$overrides,
        ];
    }

    public function test_the_import_page_lists_my_lists(): void
    {
        $user = User::factory()->create();
        $list = GiftList::factory()->for($user)->create();
        GiftList::factory()->create();

        $this->actingAs($user)->get(route('import.amazon', ['list' => $list->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('lists/import-amazon')
                ->has('lists', 1)
                ->where('selectedListId', $list->id));
    }

    public function test_parse_returns_items_and_flags_duplicates(): void
    {
        $list = GiftList::factory()->create();
        ListItem::factory()->for($list, 'list')->create(['url' => 'https://www.amazon.com/Echo/dp/B07FZ8S74R?tag=x', 'store_key' => 'amazon']);

        $this->actingAs($list->user)
            ->postJson(route('import.amazon.parse'), [
                'html' => file_get_contents(base_path('tests/Fixtures/amazon-wishlist.html')),
                'list_id' => $list->id,
            ])
            ->assertOk()
            ->assertJsonCount(3, 'items')
            ->assertJsonPath('items.0.duplicate', true)
            ->assertJsonPath('items.1.duplicate', false);
    }

    public function test_items_import_into_an_existing_registry_skipping_duplicates(): void
    {
        $list = GiftList::factory()->registry()->create();
        ListItem::factory()->for($list, 'list')->create(['url' => 'https://www.amazon.com/dp/B0BSHF7WHW', 'store_key' => 'amazon']);

        $this->actingAs($list->user)->post(route('import.amazon.store'), [
            'list_id' => $list->id,
            'items' => [$this->item(), $this->item(['title' => 'AirPods', 'url' => 'https://www.amazon.com/dp/B0BSHF7WHW'])],
        ])->assertRedirect(route('lists.show', $list))->assertSessionHas('success', 'Imported 1 item from Amazon.');

        $echo = $list->items()->where('title', 'Echo Dot')->first();
        $this->assertSame('amazon', $echo->store_key);
        $this->assertSame(2, $echo->quantity);
        $this->assertTrue($echo->most_wanted);
        $this->assertSame('Charcoal', $echo->notes);
        $this->assertSame(2, $list->items()->count());
    }

    public function test_items_can_go_into_a_brand_new_wish_list(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('import.amazon.store'), [
            'new_title' => 'From Amazon',
            'new_type' => 'wishlist',
            'items' => [$this->item()],
        ])->assertSessionHasNoErrors();

        $list = $user->giftLists()->first();
        $this->assertSame('From Amazon', $list->title);
        $this->assertSame('wishlist', $list->type);
        $this->assertSame(1, $list->items()->first()->quantity, 'Wish lists always use quantity 1');
    }

    public function test_only_amazon_links_are_accepted(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('import.amazon.store'), [
            'new_title' => 'Sneaky',
            'items' => [$this->item(['url' => 'https://evil.example.com/dp/B07FZ8S74R'])],
        ])->assertSessionHasErrors('items.0.url');

        $this->assertSame(0, GiftList::count());
    }

    public function test_you_cannot_import_into_someone_elses_list(): void
    {
        $list = GiftList::factory()->create();

        $this->actingAs(User::factory()->create())->post(route('import.amazon.store'), [
            'list_id' => $list->id,
            'items' => [$this->item()],
        ])->assertForbidden();

        $this->assertSame(0, $list->items()->count());
    }

    public function test_guests_must_log_in(): void
    {
        $this->get(route('import.amazon'))->assertRedirect('/login');
    }
}
