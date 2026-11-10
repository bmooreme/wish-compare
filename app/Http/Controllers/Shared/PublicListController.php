<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Models\GiftList;
use App\Services\ListAccess;
use App\Services\ListPresenter;
use App\Services\Turnstile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PublicListController extends Controller
{
    public function __construct(
        private ListAccess $access,
        private ListPresenter $presenter,
    ) {}

    public function show(Request $request, GiftList $list, Turnstile $turnstile): Response
    {
        $isOwner = $this->access->isOwner($request, $list);
        $owner = $list->user()->first(['id', 'name']);

        $listProps = [
            'title' => $list->title,
            'type' => $list->type,
            'theme' => $list->theme,
            'owner_name' => $owner?->name,
            'token' => $list->share_token,
        ];

        if (! $this->access->canView($request, $list)) {
            return Inertia::render('shared/locked', ['list' => $listProps]);
        }

        $list->load(['items' => fn ($q) => $q->withSum('purchases', 'quantity')]);

        return Inertia::render('shared/show', [
            'list' => [
                ...$listProps,
                'description' => $list->description,
                'event_date' => $list->event_date?->format('Y-m-d'),
                'share_url' => $list->shareUrl(),
                'has_shipping_address' => $list->hasShippingAddress(),
            ],
            'items' => $list->items->map(fn ($item) => $this->presenter->guestItem($item, $isOwner))->values(),
            'isOwner' => $isOwner,
            'stores' => $this->presenter->storeChoices(),
            'turnstileSiteKey' => $turnstile->enabled() ? config('services.turnstile.site_key') : null,
        ]);
    }

    public function unlock(Request $request, GiftList $list): RedirectResponse
    {
        $request->validate(['password' => ['required', 'string']]);

        if (! $list->requiresPassword() || ! Hash::check($request->input('password'), $list->access_password)) {
            return back()->withErrors(['password' => 'That password doesn’t match. Check with the list owner.']);
        }

        $this->access->unlock($request, $list);

        return to_route('lists.public', $list->share_token);
    }

    public function address(Request $request, GiftList $list): JsonResponse
    {
        $this->access->authorize($request, $list);

        abort_unless($list->hasShippingAddress(), 404);

        return response()->json(['address' => $list->shipping_address]);
    }

    public function find(Request $request): Response
    {
        $term = trim((string) $request->query('q', ''));
        $results = collect();

        if (mb_strlen($term) >= 2) {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $term).'%';

            $results = GiftList::publiclySearchable()
                ->with('user:id,name')
                ->withCount('items')
                ->where(fn ($q) => $q->where('title', 'like', $like)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $like)))
                ->orderByRaw('event_date is null, event_date asc')
                ->limit(30)
                ->get()
                ->map(fn (GiftList $list) => [
                    'title' => $list->title,
                    'type' => $list->type,
                    'theme' => $list->theme,
                    'owner_name' => $list->user?->name,
                    'event_date' => $list->event_date?->format('Y-m-d'),
                    'items_count' => $list->items_count,
                    'share_url' => $list->shareUrl(),
                ]);
        }

        return Inertia::render('shared/find', [
            'q' => $term,
            'results' => $results->values(),
        ]);
    }
}
