<?php

namespace App\Services;

use App\Models\GiftList;
use Illuminate\Http\Request;

/** Decides whether the current visitor may view a shared list. */
class ListAccess
{
    private const SESSION_KEY = 'unlocked_lists';

    public function isOwner(Request $request, GiftList $list): bool
    {
        return $request->user()?->id === $list->user_id;
    }

    public function canView(Request $request, GiftList $list): bool
    {
        if (! $list->requiresPassword() || $this->isOwner($request, $list)) {
            return true;
        }

        return in_array($list->id, $request->session()->get(self::SESSION_KEY, []), true);
    }

    public function unlock(Request $request, GiftList $list): void
    {
        $unlocked = $request->session()->get(self::SESSION_KEY, []);
        $unlocked[] = $list->id;
        $request->session()->put(self::SESSION_KEY, array_values(array_unique($unlocked)));
    }

    public function authorize(Request $request, GiftList $list): void
    {
        abort_unless($this->canView($request, $list), 403, 'This list is password protected.');
    }
}
