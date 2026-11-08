<x-mail::message>
# Thanks, {{ $purchase->buyer_name }}!

Your gift for **{{ $ownerName }}** has been marked as purchased on *{{ $list->title }}*, so nobody else will buy it twice.

<x-mail::panel>
**{{ $item->title }}**<br>
Quantity: {{ $purchase->quantity }}<br>
@if ($storeName)
Store: {{ $storeName }}<br>
@endif
Order number: {{ $purchase->order_number }}
</x-mail::panel>

Need to fix a typo, change the quantity, or returned the item? Use your private link below. Keep this email: anyone with the link can change this purchase.

<x-mail::button :url="$manageUrl">
Modify purchase
</x-mail::button>

Happy gifting,<br>
The {{ config('app.name') }} team
</x-mail::message>
