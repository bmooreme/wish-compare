<?php

namespace App\Models;

use Database\Factories\PurchaseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Purchase extends Model
{
    /** @use HasFactory<PurchaseFactory> */
    use HasFactory;

    protected $fillable = [
        'buyer_name',
        'buyer_email',
        'order_number',
        'store_key',
        'quantity',
    ];

    protected $hidden = [
        'manage_token_hash',
    ];

    protected function casts(): array
    {
        return [
            'order_number' => 'encrypted',
            'quantity' => 'integer',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(ListItem::class, 'list_item_id');
    }

    /**
     * Generate a fresh private management token. Only its hash is stored;
     * the plain token is returned so it can be emailed to the buyer.
     */
    public function issueManageToken(): string
    {
        $token = Str::random(48);
        $this->manage_token_hash = hash('sha256', $token);

        return $token;
    }

    public function manageTokenMatches(string $token): bool
    {
        return hash_equals($this->manage_token_hash, hash('sha256', $token));
    }

    public function manageUrl(string $token): string
    {
        return route('purchases.manage', ['purchase' => $this->id, 'token' => $token]);
    }
}
