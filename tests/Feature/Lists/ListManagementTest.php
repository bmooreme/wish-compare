<?php

namespace Tests\Feature\Lists;

use App\Models\GiftList;
use App\Models\ListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ListManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owners_can_create_a_wishlist(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/lists', [
            'type' => 'wishlist',
            'title' => 'Birthday 2027',
            'theme' => 'sage',
            'privacy' => 'unlisted',
            'notify_on_purchase' => true,
        ]);

        $list = GiftList::first();
        $response->assertRedirect(route('lists.show', $list));
        $this->assertSame('Birthday 2027', $list->title);
        $this->assertSame($user->id, $list->user_id);
        $this->assertSame(12, strlen($list->share_token));
    }

    public function test_a_password_is_required_for_password_protected_lists(): void
    {
        $this->actingAs(User::factory()->create())->post('/lists', [
            'type' => 'wishlist', 'title' => 'Secret', 'theme' => 'sage', 'privacy' => 'password',
        ])->assertSessionHasErrors('access_password');
    }

    public function test_registries_store_an_encrypted_shipping_address(): void
    {
        $this->actingAs(User::factory()->create())->post('/lists', [
            'type' => 'registry',
            'title' => 'Our wedding',
            'theme' => 'blush',
            'privacy' => 'public',
            'shipping_enabled' => true,
            'shipping_address' => ['name' => 'Sam & Alex', 'line1' => '1 Main St', 'city' => 'Austin', 'state' => 'TX', 'postal_code' => '78701'],
        ])->assertSessionHasNoErrors();

        $list = GiftList::first();
        $this->assertSame('1 Main St', $list->shipping_address['line1']);
        $this->assertStringNotContainsString('Main St', $list->getRawOriginal('shipping_address'));
    }

    public function test_wishlists_never_keep_a_shipping_address(): void
    {
        $this->actingAs(User::factory()->create())->post('/lists', [
            'type' => 'wishlist', 'title' => 'Mine', 'theme' => 'blush', 'privacy' => 'public',
            'shipping_enabled' => true,
            'shipping_address' => ['line1' => '1 Main St', 'city' => 'Austin', 'state' => 'TX', 'postal_code' => '78701'],
        ]);

        $this->assertFalse(GiftList::first()->shipping_enabled);
        $this->assertNull(GiftList::first()->shipping_address);
    }

    public function test_dashboard_lists_only_my_lists(): void
    {
        $user = User::factory()->create();
        GiftList::factory()->for($user)->create(['title' => 'Mine']);
        GiftList::factory()->create(['title' => 'Not mine']);

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('lists', 1)
                ->where('lists.0.title', 'Mine'));
    }

    public function test_other_users_cannot_manage_my_list(): void
    {
        $list = GiftList::factory()->create();
        $intruder = User::factory()->create();

        $this->actingAs($intruder)->get(route('lists.show', $list))->assertForbidden();
        $this->actingAs($intruder)->delete(route('lists.destroy', $list))->assertForbidden();
        $this->actingAs($intruder)->post(route('items.store', $list), ['title' => 'Sneaky'])->assertForbidden();
    }

    public function test_owners_can_add_update_reorder_and_remove_items(): void
    {
        $list = GiftList::factory()->registry()->create();
        $owner = $list->user;

        $this->actingAs($owner)->post(route('items.store', $list), [
            'title' => 'Stand mixer',
            'url' => 'https://www.amazon.com/dp/B00063ULMI',
            'quantity' => 2,
        ])->assertSessionHasNoErrors();
        $this->actingAs($owner)->post(route('items.store', $list), ['title' => 'Towels']);

        [$mixer, $towels] = $list->items()->get()->all();
        $this->assertSame('amazon', $mixer->store_key);
        $this->assertSame(2, $mixer->quantity);

        $this->actingAs($owner)->patch(route('items.update', [$list, $mixer]), ['most_wanted' => true, 'show_status' => true]);
        $this->assertTrue($mixer->fresh()->most_wanted);
        $this->assertTrue($mixer->fresh()->show_status);

        $this->actingAs($owner)->post(route('items.reorder', $list), ['order' => [$towels->id, $mixer->id]]);
        $this->assertSame([$towels->id, $mixer->id], $list->items()->pluck('id')->all());

        $this->actingAs($owner)->delete(route('items.destroy', [$list, $towels]));
        $this->assertSame(1, ListItem::count());
    }

    public function test_wishlist_items_are_always_quantity_one(): void
    {
        $list = GiftList::factory()->create();

        $this->actingAs($list->user)->post(route('items.store', $list), ['title' => 'Book', 'quantity' => 5]);

        $this->assertSame(1, $list->items()->first()->quantity);
    }

    public function test_items_from_another_list_cannot_be_edited_through_my_list(): void
    {
        $list = GiftList::factory()->create();
        $otherItem = ListItem::factory()->create();

        $this->actingAs($list->user)
            ->patch(route('items.update', [$list, $otherItem]), ['title' => 'Hacked'])
            ->assertNotFound();
    }

    public function test_regenerating_the_share_link_invalidates_the_old_one(): void
    {
        $list = GiftList::factory()->create();
        $old = $list->share_token;

        $this->actingAs($list->user)->post(route('lists.share-link', $list));

        $this->assertNotSame($old, $list->fresh()->share_token);
        $this->get('/l/'.$old)->assertNotFound();
    }
}
