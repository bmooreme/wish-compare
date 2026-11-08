<?php

namespace App\Http\Controllers\Lists;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lists\SaveListRequest;
use App\Models\GiftList;
use App\Services\ListPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GiftListController extends Controller
{
    public function __construct(private ListPresenter $presenter) {}

    public function index(Request $request): Response
    {
        $lists = $request->user()->giftLists()
            ->withCount(['items', 'items as most_wanted_count' => fn ($q) => $q->where('most_wanted', true)])
            ->latest('updated_at')
            ->get();

        return Inertia::render('dashboard', [
            'lists' => $lists->map(fn (GiftList $list) => $this->presenter->summary($list))->values(),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('lists/create', [
            'type' => in_array($request->query('type'), GiftList::TYPES, true) ? $request->query('type') : 'wishlist',
            'themes' => GiftList::THEMES,
        ]);
    }

    public function store(SaveListRequest $request): RedirectResponse
    {
        $list = $request->user()->giftLists()->create($request->listAttributes());

        return to_route('lists.show', $list)->with('success', 'Your list is ready. Start adding items!');
    }

    public function show(GiftList $list): Response
    {
        Gate::authorize('manage', $list);

        $list->load(['items.purchases'])->loadCount('items');

        return Inertia::render('lists/show', [
            'list' => [
                ...$this->presenter->summary($list),
                'notify_on_purchase' => $list->notify_on_purchase,
                'shipping_enabled' => $list->shipping_enabled,
            ],
            'items' => $list->items->map(fn ($item) => $this->presenter->ownerItem($item))->values(),
        ]);
    }

    public function edit(GiftList $list): Response
    {
        Gate::authorize('manage', $list);

        return Inertia::render('lists/settings', [
            'list' => [
                ...$this->presenter->summary($list),
                'notify_on_purchase' => $list->notify_on_purchase,
                'shipping_enabled' => $list->shipping_enabled,
                'shipping_address' => $list->shipping_address ?? (object) [],
                'has_password' => filled($list->access_password),
            ],
            'themes' => GiftList::THEMES,
        ]);
    }

    public function update(SaveListRequest $request, GiftList $list): RedirectResponse
    {
        Gate::authorize('manage', $list);

        $list->update($request->listAttributes());

        return to_route('lists.show', $list)->with('success', 'List settings saved.');
    }

    public function destroy(GiftList $list): RedirectResponse
    {
        Gate::authorize('manage', $list);

        $list->delete();

        return to_route('dashboard')->with('success', 'List deleted.');
    }

    public function regenerateLink(GiftList $list): RedirectResponse
    {
        Gate::authorize('manage', $list);

        $list->forceFill(['share_token' => GiftList::newShareToken()])->save();

        return back()->with('success', 'A new share link was created. The old link no longer works.');
    }
}
