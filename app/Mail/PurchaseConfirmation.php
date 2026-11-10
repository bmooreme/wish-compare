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

class PurchaseConfirmation extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Purchase $purchase, public string $manageUrl) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your gift purchase is recorded: '.$this->purchase->item->title);
    }

    public function content(): Content
    {
        $item = $this->purchase->item;

        return new Content(markdown: 'mail.purchase-confirmation', with: [
            'item' => $item,
            'list' => $item->list,
            'ownerName' => $item->list->user->name,
            'storeName' => app(Retailers::class)->name($this->purchase->store_key),
        ]);
    }
}
