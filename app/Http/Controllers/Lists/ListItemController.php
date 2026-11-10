<?php

namespace App\Http\Controllers\Lists;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lists\SaveItemRequest;
use App\Models\GiftList;
use App\Models\ListItem;
use App\Services\ProductMetadata;
use App\Services\Retailers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ListItemController extends Controller
{
    public function __construct(private Retailers $retailers) {}

    public function store(SaveItemRequest $request, GiftList $list): RedirectResponse
    {
        Gate::authorize('manage', $list);

        $data = $this->normalize($request->validated(), $list);
        $data['position'] = (int) $list->items()->max('position') + 1;

        $list->items()->create($data);
        $list->touch();

        return back()->with('success', 'Item added.');
    }

    public function update(SaveItemRequest $request, GiftList $list, ListItem $item): RedirectResponse
    {
        Gate::authorize('manage', $list);

        $item->update($this->normalize($request->validated(), $list, $item));
        $list->touch();

        return back();
    }

    public function destroy(GiftList $list, ListItem $item): RedirectResponse
    {
        Gate::authorize('manage', $list);

        $item->delete();

        return back()->with('success', 'Item removed.');
    }

    public function reorder(Request $request, GiftList $list): RedirectResponse
    {
        Gate::authorize('manage', $list);

        $ids = $request->validate([
            'order' => ['required', 'array', 'max:1000'],
            'order.*' => ['integer'],
        ])['order'];

        DB::transaction(function () use ($list, $ids) {
            foreach (array_values($ids) as $position => $id) {
                $list->items()->whereKey($id)->update(['position' => $position]);
            }
        });

        return back();
    }

    public function preview(Request $request, ProductMetadata $metadata): JsonResponse
    {
        $url = $request->validate(['url' => ['required', 'url:http,https', 'max:2048']])['url'];

        return response()->json($metadata->lookup($url));
    }

    /** @param array<string, mixed> $data */
    private function normalize(array $data, GiftList $list, ?ListItem $item = null): array
    {
        if (array_key_exists('url', $data)) {
            $data['store_key'] = $this->retailers->detect($data['url']);
        }

        if (array_key_exists('identifier', $data) && $data['identifier']) {
            $data['identifier'] = strtoupper(preg_replace('/[^0-9X]/i', '', $data['identifier']));
        }

        if (! $list->isRegistry()) {
            $data['quantity'] = 1;
        } elseif (! $item) {
            $data['quantity'] ??= 1;
        }

        return $data;
    }
}
