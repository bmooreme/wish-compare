<?php

namespace App\Models;

use Database\Factories\GiftListFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Str;

class GiftList extends Model
{
    /** @use HasFactory<GiftListFactory> */
    use HasFactory;

    public const TYPES = ['wishlist', 'registry'];

    public const PRIVACY = ['public', 'unlisted', 'password'];

    public const THEMES = ['blush', 'sage', 'dusk', 'ocean', 'sand', 'plum'];

    protected $fillable = [
        'type',
        'title',
        'description',
        'event_date',
        'theme',
        'privacy',
        'access_password',
        'notify_on_purchase',
        'shipping_enabled',
        'shipping_address',
    ];

    protected $hidden = [
        'access_password',
        'shipping_address',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date:Y-m-d',
            'notify_on_purchase' => 'boolean',
            'shipping_enabled' => 'boolean',
            'shipping_address' => 'encrypted:array',
            'access_password' => 'hashed',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (GiftList $list) {
            $list->share_token ??= static::newShareToken();
        });
    }

    public static function newShareToken(): string
    {
        do {
            $token = Str::lower(Str::random(12));
        } while (static::where('share_token', $token)->exists());

        return $token;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ListItem::class)->orderBy('position')->orderBy('id');
    }

    public function purchases(): HasManyThrough
    {
        return $this->hasManyThrough(Purchase::class, ListItem::class);
    }

    public function isRegistry(): bool
    {
        return $this->type === 'registry';
    }

    public function requiresPassword(): bool
    {
        return $this->privacy === 'password' && filled($this->access_password);
    }

    public function shareUrl(): string
    {
        return route('lists.public', $this->share_token);
    }

    public function hasShippingAddress(): bool
    {
        return $this->isRegistry()
            && $this->shipping_enabled
            && filled(data_get($this->shipping_address, 'line1'));
    }

    public function scopePubliclySearchable($query)
    {
        return $query->where('privacy', 'public');
    }
}
