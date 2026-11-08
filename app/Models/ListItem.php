<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ListItem extends Model
{
    /** @use HasFactory<\Database\Factories\ListItemFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'url',
        'store_key',
        'image_url',
        'identifier',
        'notes',
        'quantity',
        'most_wanted',
        'show_status',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'most_wanted' => 'boolean',
            'show_status' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function list(): BelongsTo
    {
        return $this->belongsTo(GiftList::class, 'gift_list_id');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function purchasedQuantity(): int
    {
        return (int) ($this->purchases_sum_quantity ?? $this->purchases()->sum('quantity'));
    }

    public function remainingQuantity(): int
    {
        return max(0, $this->quantity - $this->purchasedQuantity());
    }

    public function isFullyPurchased(): bool
    {
        return $this->remainingQuantity() === 0;
    }
}
