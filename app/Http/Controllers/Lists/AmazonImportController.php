<?php

namespace App\Http\Controllers\Lists;

use App\Http\Controllers\Controller;
use App\Models\GiftList;
use App\Services\AmazonListParser;
use App\Services\Retailers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** Moves a user's existing Amazon wish list into TappyWish from a copy-and-paste. */
class AmazonImportController extends Controller
{
    public function create(Request $request): Response
    {
        $lists = $request->user()->giftLists()->latest('updated_at')->get(['id', 'title', 'type']);
        $selected = $lists->firstWhere('id', (int) $request->query('list'))?->id;

        return Inertia::render('lists/import-amazon', [
            'lists' => $lists,
            'selectedListId' => $selected,
        ]);
    }

    public function parse(Request $request, AmazonListParser $parser): JsonResponse
    {
        $data = $request->validate([
            'html' => ['nullable', 'string', 'max:6000000'],
            'text' => ['nullable', 'string', 'max:300000'],
            'list_id' => ['nullable', 'integer'],
        ]);

        $items = $parser->parse($data['html'] ?? null, $data['text'] ?? null);

        $existing = [];
        if (! empty($data['list_id'])) {
            $list = $request->user()->giftLists()->find($data['list_id']);
            $existing = $list ? $this->existingAsins($list) : [];
        }

        return response()->json([
            'items' => array_map(fn ($item) => [...$item, 'duplicate' => in_array($item['asin'], $existing, true)], $items),
        ]);
    }

    public function store(Request $request, Retailers $retailers): RedirectResponse
    {
        $data = $request->validate([
            'list_id' => ['nullable', 'integer', 'required_without:new_title'],
            'new_title' => ['nullable', 'string', 'max:120', 'required_without:list_id'],
            'new_type' => ['nullable', Rule::in(GiftList::TYPES)],
            'items' => ['required', 'array', 'min:1', 'max:'.AmazonListParser::MAX_ITEMS],
            'items.*.title' => ['required', 'string', 'max:255'],
            'items.*.url' => ['required', 'url:https', 'max:2048', 'regex:~^https://(www\.)?amazon\.com/~i'],
            'items.*.image_url' => ['nullable', 'url:https', 'max:2048'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
            'items.*.most_wanted' => ['boolean'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'items.required' => 'Select at least one item to import.',
            'new_title.required_without' => 'Name your new list or choose an existing one.',
            'items.*.url.regex' => 'Only Amazon product links can be imported here.',
        ]);

        $list = ! empty($data['list_id'])
            ? GiftList::findOrFail($data['list_id'])
            : null;

        if ($list) {
            Gate::authorize('manage', $list);
        }

        $imported = DB::transaction(function () use (&$list, $data, $request, $retailers) {
            $list ??= $request->user()->giftLists()->create([
                'type' => $data['new_type'] ?? 'wishlist',
                'title' => $data['new_title'],
                'theme' => 'dusk',
                'privacy' => 'unlisted',
                'notify_on_purchase' => true,
            ]);

            $existing = $this->existingAsins($list);
            $position = (int) $list->items()->max('position');
            $count = 0;

            foreach ($data['items'] as $item) {
                $asin = $this->asinFromUrl($item['url']);

                if ($asin && in_array($asin, $existing, true)) {
                    continue;
                }

                $list->items()->create([
                    'title' => $item['title'],
                    'url' => $item['url'],
                    'store_key' => $retailers->detect($item['url']),
                    'image_url' => $item['image_url'] ?? null,
                    'notes' => $item['notes'] ?? null,
                    'quantity' => $list->isRegistry() ? ($item['quantity'] ?? 1) : 1,
                    'most_wanted' => (bool) ($item['most_wanted'] ?? false),
                    'position' => ++$position,
                ]);

                $existing[] = $asin;
                $count++;
            }

            $list->touch();

            return $count;
        });

        $message = $imported === 0
            ? 'Those items are already on your list.'
            : "Imported {$imported} ".str('item')->plural($imported).' from Amazon.';

        return to_route('lists.show', $list)->with('success', $message);
    }

    /** @return list<string> */
    private function existingAsins(GiftList $list): array
    {
        return $list->items()->whereNotNull('url')->pluck('url')
            ->map(fn ($url) => $this->asinFromUrl($url))
            ->filter()
            ->values()
            ->all();
    }

    private function asinFromUrl(string $url): ?string
    {
        return preg_match('~amazon\.com/(?:.*/)?(?:dp|gp/product)/([A-Z0-9]{10})~i', $url, $m) ? strtoupper($m[1]) : null;
    }
}
