<x-mail::message>
@if ($revealDetails)
# {{ $purchase->buyer_name }} bought a gift!

Good news: an item on **{{ $list->title }}** was just purchased.

<x-mail::panel>
**{{ $item->title }}**<br>
Quantity: {{ $purchase->quantity }}<br>
@if ($storeName)
Store: {{ $storeName }}<br>
@endif
Order number: {{ $purchase->order_number }}
</x-mail::panel>
@else
# Someone bought you a gift 🎁

A guest just purchased something from **{{ $list->title }}**. We're keeping the details a surprise, because purchase status is hidden for that item.

You can choose which items show purchase details at any time from your list.
@endif

<x-mail::button :url="$listUrl">
View your list
</x-mail::button>

You're receiving this because purchase notifications are on for this list. You can turn them off in the list's settings.
</x-mail::message>
