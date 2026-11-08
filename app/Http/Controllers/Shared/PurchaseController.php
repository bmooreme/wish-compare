<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Mail\GiftPurchased;
use App\Mail\PurchaseConfirmation;
use App\Models\GiftList;
use App\Models\ListItem;
use App\Models\Purchase;
use App\Services\ListAccess;
use App\Services\ListPresenter;
use App\Services\Retailers;
use App\Services\Turnstile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function __construct(
        private Retailers $retailers,
        private ListPresenter $presenter,
    ) {}

    public function store(Request $request, GiftList $list, ListItem $item, ListAccess $access, Turnstile $turnstile): RedirectResponse
    {
        abort_unless($item->gift_list_id === $list->id, 404);
        $access->authorize($request, $list);

        if ($access->isOwner($request, $list)) {
            throw ValidationException::withMessages(['buyer_name' => 'You can’t mark items on your own list as purchased.']);
        }

        // Honeypot: real people never see or fill this field.
        if (filled($request->input('website'))) {
            return back()->with('success', 'Thanks! Your purchase has been recorded.');
        }

        $data = $this->validatePurchase($request, $item->remainingQuantity());

        if (! $turnstile->verify($request->input('turnstile_token'), $request->ip())) {
            throw ValidationException::withMessages(['turnstile_token' => 'Please complete the verification and try again.']);
        }

        [$purchase, $token] = DB::transaction(function () use ($item, $data) {
            // Re-check remaining quantity inside the transaction to avoid double-buys.
            $locked = ListItem::whereKey($item->id)->lockForUpdate()->first();

            if ($data['quantity'] > $locked->remainingQuantity()) {
                throw ValidationException::withMessages(['quantity' => 'Someone just purchased this. Please refresh the list.']);
            }

            $purchase = $locked->purchases()->make($data);
            $token = $purchase->issueManageToken();
            $purchase->save();

            return [$purchase, $token];
        });

        Mail::to($purchase->buyer_email)->queue(new PurchaseConfirmation($purchase, $purchase->manageUrl($token)));

        if ($list->notify_on_purchase) {
            Mail::to($list->user)->queue(new GiftPurchased($purchase, revealDetails: $item->show_status));
        }

        return back()->with('success', 'Thank you! We emailed you a confirmation with a link to make changes.');
    }

    public function manage(Request $request, Purchase $purchase): Response
    {
        $token = $this->authorizeToken($request, $purchase);
        $item = $purchase->item()->with('list.user:id,name')->first();

        return Inertia::render('shared/manage-purchase', [
            'purchase' => [
                'id' => $purchase->id,
                'buyer_name' => $purchase->buyer_name,
                'buyer_email' => $purchase->buyer_email,
                'order_number' => $purchase->order_number,
                'store_key' => $purchase->store_key,
                'quantity' => $purchase->quantity,
                'purchased_at' => $purchase->created_at?->toIso8601String(),
            ],
            'item' => [
                'title' => $item->title,
                'image_url' => $item->image_url,
                'max_quantity' => $item->remainingQuantity() + $purchase->quantity,
                'is_registry' => $item->list->isRegistry(),
            ],
            'list' => [
                'title' => $item->list->title,
                'owner_name' => $item->list->user?->name,
                'share_url' => $item->list->shareUrl(),
                'theme' => $item->list->theme,
            ],
            'token' => $token,
            'stores' => $this->presenter->storeChoices(),
        ]);
    }

    public function update(Request $request, Purchase $purchase): RedirectResponse
    {
        $token = $this->authorizeToken($request, $purchase);
        $item = $purchase->item;

        $data = $this->validatePurchase($request, $item->remainingQuantity() + $purchase->quantity);
        $purchase->update($data);

        return to_route('purchases.manage', ['purchase' => $purchase, 'token' => $token])
            ->with('success', 'Your purchase details were updated.');
    }

    public function destroy(Request $request, Purchase $purchase): RedirectResponse
    {
        $this->authorizeToken($request, $purchase);
        $shareUrl = $purchase->item->list->shareUrl();

        $purchase->delete();

        return redirect()->to($shareUrl)->with('success', 'Your purchase was removed. The item is available again.');
    }

    /** @return array<string, mixed> */
    private function validatePurchase(Request $request, int $maxQuantity): array
    {
        if ($maxQuantity < 1) {
            throw ValidationException::withMessages(['quantity' => 'This item has already been fully purchased.']);
        }

        $data = $request->validate([
            'buyer_name' => ['required', 'string', 'max:120'],
            'buyer_email' => ['required', 'email', 'max:255'],
            'order_number' => ['required', 'string', 'max:100'],
            'store_key' => ['nullable', 'string', Rule::in([...array_keys($this->retailers->all()), 'other'])],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:'.$maxQuantity],
        ], [
            'buyer_email.required' => 'Enter the email address you used for this order.',
            'order_number.required' => 'Enter your order number so it can be used for returns.',
            'quantity.max' => 'Only :max still needed.',
        ]);

        $data['quantity'] ??= 1;

        return $data;
    }

    private function authorizeToken(Request $request, Purchase $purchase): string
    {
        $token = (string) $request->input('token', $request->query('token', ''));

        abort_unless($token !== '' && $purchase->manageTokenMatches($token), 403, 'This link is invalid or has expired.');

        return $token;
    }
}
