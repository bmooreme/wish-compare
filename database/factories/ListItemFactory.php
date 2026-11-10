<?php

namespace Database\Factories;

use App\Models\GiftList;
use App\Models\ListItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ListItem> */
class ListItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'gift_list_id' => GiftList::factory(),
            'title' => fake()->words(4, true),
            'url' => 'https://www.target.com/p/'.fake()->slug().'/-/A-'.fake()->numberBetween(10000000, 99999999),
            'store_key' => 'target',
            'quantity' => 1,
            'most_wanted' => false,
            'show_status' => false,
            'position' => 0,
        ];
    }
}
