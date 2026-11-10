<?php

namespace App\Policies;

use App\Models\GiftList;
use App\Models\User;

class GiftListPolicy
{
    public function manage(User $user, GiftList $list): bool
    {
        return $list->user_id === $user->id;
    }
}
