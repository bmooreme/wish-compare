<?php

namespace App\Mail;

use App\Models\Purchase;
use App\Services\Retailers;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Tells the list owner a gift was bought. When the item's status is hidden
 * (surprise protection), the email deliberately leaves out what and who.
 */
class GiftPurchased extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Purchase $purchase, public bool $revealDetails) {}

    public function envelope(): Envelope
    {
        $list = $this->purchase->item->list;

        return new Envelope(subject: $this->revealDetails
            ? $this->purchase->buyer_name.' bought a gift from '.$list->title
            : 'Someone bought a gift from '.$list->title.' 🎁');
    }

    public function content(): Content
    {
        $item = $this->purchase->item;

        return new Content(markdown: 'mail.gift-purchased', with: [
            'item' => $item,
            'list' => $item->list,
            'storeName' => app(Retailers::class)->name($this->purchase->store_key),
            'listUrl' => route('lists.show', $item->list),
        ]);
    }
}
