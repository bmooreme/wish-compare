<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Models\LinkClick;
use App\Models\ListItem;
use App\Services\ListAccess;
use App\Services\Retailers;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/** Every "Buy at…" button goes through here, so links can be re-tagged centrally. */
class OutboundController extends Controller
{
    public function __invoke(Request $request, ListItem $item, string $store, Retailers $retailers, ListAccess $access): RedirectResponse
    {
        $access->authorize($request, $item->list);

        $url = $retailers->outboundUrl($item, $store);

        abort_unless($url, 404);

        LinkClick::create(['list_item_id' => $item->id, 'store_key' => $store]);

        return redirect()->away($url)->withHeaders([
            'X-Robots-Tag' => 'noindex, nofollow',
            'Referrer-Policy' => 'no-referrer-when-downgrade',
        ]);
    }
}
