<?php

namespace Tests\Feature\Lists;

use App\Models\GiftList;
use App\Models\ListItem;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SharedListTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_with_the_link_can_view_without_an_account(): void
    {
        $item = ListItem::factory()->create(['title' => 'Cozy blanket']);

        $this->get('/l/'.$item->list->share_token)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('shared/show')
                ->where('items.0.title', 'Cozy blanket')
                ->has('items.0.shop'));
    }

    public function test_password_protected_lists_require_the_password(): void
    {
        $list = GiftList::factory()->passwordProtected('open-sesame')->create();
        ListItem::factory()->for($list, 'list')->create();

        $this->get('/l/'.$list->share_token)
            ->assertInertia(fn (Assert $page) => $page->component('shared/locked')->missing('items'));

        $this->post('/l/'.$list->share_token.'/unlock', ['password' => 'wrong'])
            ->assertSessionHasErrors('password');

        $this->post('/l/'.$list->share_token.'/unlock', ['password' => 'open-sesame'])
            ->assertRedirect('/l/'.$list->share_token);

        $this->get('/l/'.$list->share_token)
            ->assertInertia(fn (Assert $page) => $page->component('shared/show')->has('items', 1));
    }

    public function test_owners_can_always_view_their_own_protected_list(): void
    {
        $list = GiftList::factory()->passwordProtected()->create();

        $this->actingAs($list->user)->get('/l/'.$list->share_token)
            ->assertInertia(fn (Assert $page) => $page->component('shared/show'));
    }

    public function test_find_only_returns_public_lists(): void
    {
        $owner = User::factory()->create(['name' => 'Jordan Rivera']);
        GiftList::factory()->for($owner)->public()->create(['title' => 'Jordan wedding']);
        GiftList::factory()->for($owner)->create(['title' => 'Jordan secret', 'privacy' => 'unlisted']);

        $this->get('/find?q=Rivera')
            ->assertInertia(fn (Assert $page) => $page
                ->has('results', 1)
                ->where('results.0.title', 'Jordan wedding'));
    }

    public function test_guests_see_purchased_status_but_never_buyer_details(): void
    {
        $item = ListItem::factory()->create(['show_status' => false]);
        Purchase::factory()->for($item, 'item')->create(['buyer_name' => 'Aunt May', 'order_number' => 'ORDER-123']);

        $response = $this->get('/l/'.$item->list->share_token);

        $response->assertInertia(fn (Assert $page) => $page
            ->where('items.0.status.complete', true)
            ->missing('items.0.purchases'));
        $this->assertStringNotContainsString('Aunt May', $response->getContent());
        $this->assertStringNotContainsString('ORDER-123', $response->getContent());
    }

    public function test_owner_preview_hides_purchases_on_items_with_hidden_status(): void
    {
        $hidden = ListItem::factory()->create(['show_status' => false]);
        $shown = ListItem::factory()->for($hidden->list, 'list')->create(['show_status' => true, 'position' => 1]);
        Purchase::factory()->for($hidden, 'item')->create();
        Purchase::factory()->for($shown, 'item')->create();

        $this->actingAs($hidden->list->user)->get('/l/'.$hidden->list->share_token)
            ->assertInertia(fn (Assert $page) => $page
                ->where('isOwner', true)
                ->where('items.0.status.complete', false)
                ->where('items.1.status.complete', true));
    }

    public function test_owner_dashboard_reveals_details_only_when_status_is_shown(): void
    {
        $hidden = ListItem::factory()->create(['show_status' => false]);
        $shown = ListItem::factory()->for($hidden->list, 'list')->create(['show_status' => true, 'position' => 1]);
        Purchase::factory()->for($hidden, 'item')->create(['order_number' => 'HIDDEN-1']);
        Purchase::factory()->for($shown, 'item')->create(['order_number' => 'SHOWN-1']);

        $response = $this->actingAs($hidden->list->user)->get(route('lists.show', $hidden->list));

        $response->assertInertia(fn (Assert $page) => $page
            ->where('items.0.status', null)
            ->has('items.0.purchases', 0)
            ->where('items.1.purchases.0.order_number', 'SHOWN-1'));
        $this->assertStringNotContainsString('HIDDEN-1', $response->getContent());
    }

    public function test_shipping_address_is_only_revealed_on_request_when_enabled(): void
    {
        $list = GiftList::factory()->registry()->create([
            'shipping_enabled' => true,
            'shipping_address' => ['name' => 'Sam', 'line1' => '9 Elm St', 'city' => 'Boise', 'state' => 'ID', 'postal_code' => '83702'],
        ]);

        $page = $this->get('/l/'.$list->share_token);
        $this->assertStringNotContainsString('9 Elm St', $page->getContent());
        $page->assertInertia(fn (Assert $p) => $p->where('list.has_shipping_address', true));

        $this->post('/l/'.$list->share_token.'/address')
            ->assertOk()
            ->assertJsonPath('address.line1', '9 Elm St');

        $list->update(['shipping_enabled' => false]);
        $this->post('/l/'.$list->share_token.'/address')->assertNotFound();
    }

    public function test_outbound_links_redirect_to_the_store_and_record_the_click(): void
    {
        config(['stores.retailers.amazon.affiliate' => ['type' => 'param', 'param' => 'tag', 'value' => 'tappylist-20']]);
        $item = ListItem::factory()->create(['title' => 'Wool socks', 'url' => 'https://www.target.com/p/socks', 'store_key' => 'target']);

        $this->get(route('outbound', [$item, 'amazon']))
            ->assertRedirect('https://www.amazon.com/s?k=Wool+socks&tag=tappylist-20');

        $this->get(route('outbound', [$item, 'target']))
            ->assertRedirect('https://www.target.com/p/socks');

        $this->assertDatabaseCount('link_clicks', 2);
    }

    public function test_outbound_links_respect_password_protection(): void
    {
        $list = GiftList::factory()->passwordProtected()->create();
        $item = ListItem::factory()->for($list, 'list')->create();

        $this->get(route('outbound', [$item, 'amazon']))->assertForbidden();
    }
}
