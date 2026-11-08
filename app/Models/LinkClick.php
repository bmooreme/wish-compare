<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LinkClick extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['list_item_id', 'store_key'];
}
