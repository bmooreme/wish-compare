<?php

namespace Tests\Feature\Lists;

use App\Mail\GiftPurchased;
use App\Mail\PurchaseConfirmation;
use App\Models\GiftList;
use App\Models\ListItem;
use App\Models\Purchase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PurchaseTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return [
            'buyer_name' => 'Casey',
            'buyer_email' => 'casey@example.com',
            'order_number' => '112-5550101',
            'store_key' => 'amazon',
            ...$overrides,
        ];
    }

    private function purchaseUrl(ListItem $item): string
    {
        return route('purchases.store', [$item->list->share_token, $item]);
    }

    public function test_a_guest_can_mark_an_item_purchased_and_gets_a_confirmation(): void
    {
        Mail::fake();
        $item = ListItem::factory()->create();

        $this->post($this->purchaseUrl($item), $this->payload())->assertSessionHasNoErrors();

        $purchase = Purchase::first();
        $this->assertSame('112-5550101', $purchase->order_number);
        $this->assertNotSame('112-5550101', $purchase->getRawOriginal('order_number'));

        Mail::assertQueued(PurchaseConfirmation::class, fn ($mail) => $mail->hasTo('casey@example.com')
            && str_contains($mail->manageUrl, '/purchases/'.$purchase->id.'?token='));
    }

    public function test_order_number_and_email_are_required(): void
    {
        $item = ListItem::factory()->create();

        $this->post($this->purchaseUrl($item), $this->payload(['order_number' => '', 'buyer_email' => 'nope']))
            ->assertSessionHasErrors(['order_number', 'buyer_email']);
    }

    public function test_fully_purchased_items_cannot_be_bought_again(): void
    {
        Mail::fake();
        $item = ListItem::factory()->create();

        $this->post($this->purchaseUrl($item), $this->payload());
        $this->post($this->purchaseUrl($item), $this->payload(['buyer_name' => 'Second']))
            ->assertSessionHasErrors('quantity');

        $this->assertSame(1, Purchase::count());
    }

    public function test_registry_quantities_are_tracked_across_buyers(): void
    {
        Mail::fake();
        $list = GiftList::factory()->registry()->create();
        $item = ListItem::factory()->for($list, 'list')->create(['quantity' => 8]);

        $this->post($this->purchaseUrl($item), $this->payload(['quantity' => 5]))->assertSessionHasNoErrors();
        $this->post($this->purchaseUrl($item), $this->payload(['quantity' => 4]))->assertSessionHasErrors('quantity');
        $this->post($this->purchaseUrl($item), $this->payload(['quantity' => 3]))->assertSessionHasNoErrors();

        $this->assertSame(0, $item->fresh()->remainingQuantity());
    }

    public function test_owner_notification_hides_details_when_status_is_hidden(): void
    {
        Mail::fake();
        $item = ListItem::factory()->create(['show_status' => false]);

        $this->post($this->purchaseUrl($item), $this->payload());

        Mail::assertQueued(GiftPurchased::class, fn ($mail) => $mail->hasTo($item->list->user->email) && ! $mail->revealDetails);
    }

    public function test_owner_notification_includes_details_when_status_is_shown(): void
    {
        Mail::fake();
        $item = ListItem::factory()->create(['show_status' => true]);

        $this->post($this->purchaseUrl($item), $this->payload());

        Mail::assertQueued(GiftPurchased::class, fn ($mail) => $mail->revealDetails);
    }

    public function test_owners_who_opted_out_get_no_notification(): void
    {
        Mail::fake();
        $list = GiftList::factory()->create(['notify_on_purchase' => false]);
        $item = ListItem::factory()->for($list, 'list')->create();

        $this->post($this->purchaseUrl($item), $this->payload());

        Mail::assertNotQueued(GiftPurchased::class);
        Mail::assertQueued(PurchaseConfirmation::class);
    }

    public function test_the_honeypot_silently_discards_bots(): void
    {
        Mail::fake();
        $item = ListItem::factory()->create();

        $this->post($this->purchaseUrl($item), $this->payload(['website' => 'http://spam']));

        $this->assertSame(0, Purchase::count());
        Mail::assertNothingQueued();
    }

    public function test_owners_cannot_mark_their_own_items_purchased(): void
    {
        $item = ListItem::factory()->create();

        $this->actingAs($item->list->user)->post($this->purchaseUrl($item), $this->payload())
            ->assertSessionHasErrors('buyer_name');
    }

    public function test_the_buyer_can_modify_or_remove_a_purchase_with_the_private_link(): void
    {
        $item = ListItem::factory()->create();
        $purchase = Purchase::factory()->for($item, 'item')->make();
        $token = $purchase->issueManageToken();
        $purchase->save();

        $this->get(route('purchases.manage', ['purchase' => $purchase, 'token' => $token]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('shared/manage-purchase'));

        $this->put(route('purchases.update', $purchase), $this->payload(['token' => $token, 'order_number' => 'NEW-42']))
            ->assertSessionHasNoErrors();
        $this->assertSame('NEW-42', $purchase->fresh()->order_number);

        $this->delete(route('purchases.destroy', $purchase), ['token' => $token])
            ->assertRedirect($item->list->shareUrl());
        $this->assertSame(0, Purchase::count());
    }

    public function test_a_wrong_token_cannot_touch_a_purchase(): void
    {
        $purchase = Purchase::factory()->create();

        $this->get(route('purchases.manage', ['purchase' => $purchase, 'token' => 'guess']))->assertForbidden();
        $this->delete(route('purchases.destroy', $purchase), ['token' => 'guess'])->assertForbidden();
        $this->assertSame(1, Purchase::count());
    }

    public function test_emails_render(): void
    {
        $item = ListItem::factory()->create(['show_status' => false]);
        $purchase = Purchase::factory()->for($item, 'item')->create(['order_number' => 'ZX-9']);

        $confirmation = (new PurchaseConfirmation($purchase, 'https://example.com/manage'))->render();
        $this->assertStringContainsString('ZX-9', $confirmation);
        $this->assertStringContainsString('Modify purchase', $confirmation);

        $hidden = (new GiftPurchased($purchase, revealDetails: false))->render();
        $this->assertStringNotContainsString('ZX-9', $hidden);
        $this->assertStringNotContainsString($item->title, $hidden);
    }
}
