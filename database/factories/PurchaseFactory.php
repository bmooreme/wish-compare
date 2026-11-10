<?php

namespace Database\Factories;

use App\Models\ListItem;
use App\Models\Purchase;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Purchase> */
class PurchaseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'list_item_id' => ListItem::factory(),
            'buyer_name' => fake()->name(),
            'buyer_email' => fake()->safeEmail(),
            'order_number' => strtoupper(Str::random(10)),
            'store_key' => 'target',
            'quantity' => 1,
            'manage_token_hash' => hash('sha256', Str::random(48)),
        ];
    }
}
