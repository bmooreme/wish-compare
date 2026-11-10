<?php

namespace App\Services;

use App\Models\GiftList;
use App\Models\ListItem;
use App\Models\Purchase;

/**
 * Shapes lists and items for the front end. This is where surprise
 * protection lives: purchase details for an item only reach the owner
 * when they have chosen to show that item's status.
 */
class ListPresenter
{
    public function __construct(private Retailers $retailers) {}

    /** @return array<string, mixed> */
    public function summary(GiftList $list): array
    {
        return [
            'id' => $list->id,
            'type' => $list->type,
            'title' => $list->title,
            'description' => $list->description,
            'event_date' => $list->event_date?->format('Y-m-d'),
            'theme' => $list->theme,
            'privacy' => $list->privacy,
            'share_url' => $list->shareUrl(),
            'items_count' => $list->items_count ?? $list->items()->count(),
            'most_wanted_count' => $list->most_wanted_count ?? null,
            'updated_at' => $list->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public function ownerItem(ListItem $item): array
    {
        $visible = $item->show_status;
        $purchases = $visible ? $item->purchases : collect();

        return [
            ...$this->baseItem($item),
            'show_status' => $item->show_status,
            'status' => $visible ? $this->status($item) : null,
            'purchases' => $purchases->map(fn (Purchase $p) => [
                'id' => $p->id,
                'buyer_name' => $p->buyer_name,
                'buyer_email' => $p->buyer_email,
                'order_number' => $p->order_number,
                'store' => $this->retailers->name($p->store_key) ?? $p->store_key,
                'quantity' => $p->quantity,
                'purchased_at' => $p->created_at?->toIso8601String(),
            ])->values(),
        ];
    }

    /**
     * Guests always see what's been bought (so gifts aren't duplicated), but
     * never who bought it. When the owner previews their own list, items with
     * hidden status appear unpurchased so the surprise is kept.
     *
     * @return array<string, mixed>
     */
    public function guestItem(ListItem $item, bool $viewerIsOwner): array
    {
        $status = ($viewerIsOwner && ! $item->show_status)
            ? ['purchased' => 0, 'remaining' => $item->quantity, 'complete' => false]
            : $this->status($item);

        return [
            ...$this->baseItem($item),
            'status' => $status,
            'shop' => collect($this->retailers->shopOptions($item))->map(fn ($option) => [
                ...$option,
                'href' => route('outbound', ['item' => $item->id, 'store' => $option['key']]),
            ])->values(),
        ];
    }

    /** @return array<string, mixed> */
    private function baseItem(ListItem $item): array
    {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'url' => $item->url,
            'store_key' => $item->store_key,
            'store_name' => $this->retailers->labelFor($item->url, $item->store_key),
            'image_url' => $item->image_url,
            'identifier' => $item->identifier,
            'notes' => $item->notes,
            'quantity' => $item->quantity,
            'most_wanted' => $item->most_wanted,
            'position' => $item->position,
        ];
    }

    /** @return array{purchased: int, remaining: int, complete: bool} */
    private function status(ListItem $item): array
    {
        $purchased = $item->purchasedQuantity();

        return [
            'purchased' => $purchased,
            'remaining' => max(0, $item->quantity - $purchased),
            'complete' => $purchased >= $item->quantity,
        ];
    }

    /** @return list<array{key: string, name: string}> */
    public function storeChoices(): array
    {
        return collect($this->retailers->all())
            ->map(fn ($store, $key) => ['key' => $key, 'name' => $store['name']])
            ->values()
            ->push(['key' => 'other', 'name' => 'Another store'])
            ->all();
    }
}
