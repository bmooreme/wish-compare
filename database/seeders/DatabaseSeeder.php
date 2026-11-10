<?php

namespace Database\Seeders;

use App\Models\GiftList;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** Demo data for local development: `php artisan migrate:fresh --seed`. */
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Sam Carter',
            'email' => 'demo@tappywish.test',
        ]);

        $registry = GiftList::factory()->for($user)->registry()->public()->create([
            'title' => 'Sam & Alex’s Wedding',
            'description' => 'We’re so grateful you’re celebrating with us! Your presence is the best gift; if you’d like to give something more, here are a few things for our new home.',
            'theme' => 'blush',
            'event_date' => now()->addDays(216)->toDateString(),
            'shipping_enabled' => true,
            'shipping_address' => ['name' => 'Sam Carter', 'line1' => '214 Maple Avenue', 'line2' => 'Apt 3B', 'city' => 'Portland', 'state' => 'OR', 'postal_code' => '97205'],
        ]);

        $items = [
            ['title' => 'Le Creuset Signature Round Dutch Oven, 5.5 qt, Cerise', 'url' => 'https://www.williams-sonoma.com/products/le-creuset-signature-round-dutch-oven/', 'store_key' => 'williamssonoma', 'quantity' => 1, 'most_wanted' => true, 'notes' => 'Cerise (red) please!'],
            ['title' => 'Breville Barista Express Espresso Machine', 'url' => 'https://www.bestbuy.com/site/breville-the-barista-express/6401342.p', 'store_key' => 'bestbuy', 'quantity' => 1, 'most_wanted' => true],
            ['title' => 'Organic Cotton Bath Towels', 'url' => 'https://www.target.com/p/organic-bath-towel/-/A-81234567', 'store_key' => 'target', 'quantity' => 6, 'notes' => 'Color: Sage Green'],
            ['title' => 'Porcelain Dinner Plates, Set of 4', 'url' => 'https://www.crateandbarrel.com/aspen-dinner-plates/s123456', 'store_key' => 'crateandbarrel', 'quantity' => 3],
            ['title' => 'KitchenAid Artisan 5-Quart Stand Mixer', 'url' => 'https://www.amazon.com/dp/B00005UP2P', 'store_key' => 'amazon', 'quantity' => 1, 'show_status' => true],
            ['title' => 'Linen Duvet Cover Set, Queen', 'url' => 'https://www.wayfair.com/bedding/pdp/linen-duvet-cover-set.html', 'store_key' => 'wayfair', 'quantity' => 1],
        ];

        foreach ($items as $position => $data) {
            $registry->items()->create([...$data, 'position' => $position]);
        }

        $towels = $registry->items()->where('title', 'like', 'Organic%')->first();
        Purchase::factory()->for($towels, 'item')->create(['buyer_name' => 'Aunt Linda', 'quantity' => 2]);
        $mixer = $registry->items()->where('title', 'like', 'KitchenAid%')->first();
        Purchase::factory()->for($mixer, 'item')->create(['buyer_name' => 'The Nguyens', 'order_number' => '112-7788123-4455661', 'store_key' => 'amazon']);
        $duvet = $registry->items()->where('title', 'like', 'Linen%')->first();
        Purchase::factory()->for($duvet, 'item')->create(['buyer_name' => 'Jordan']);

        $wishlist = GiftList::factory()->for($user)->create([
            'title' => 'Birthday Wishes 2027',
            'description' => 'Turning 30! Books, coffee and anything for the garden.',
            'theme' => 'dusk',
            'privacy' => 'unlisted',
            'event_date' => now()->addDays(41)->toDateString(),
        ]);

        foreach ([
            ['title' => 'Project Hail Mary by Andy Weir (Hardcover)', 'url' => 'https://www.barnesandnoble.com/w/project-hail-mary-andy-weir/1137396814', 'store_key' => 'barnesandnoble', 'identifier' => '9780593135204', 'most_wanted' => true],
            ['title' => 'Hario V60 Pour-Over Coffee Kit', 'url' => 'https://www.amazon.com/dp/B00LGLOZ3C', 'store_key' => 'amazon'],
            ['title' => 'Raised Cedar Garden Bed, 4 x 8 ft', 'url' => 'https://www.homedepot.com/p/raised-garden-bed/312345678', 'store_key' => 'homedepot'],
            ['title' => 'Handmade Ceramic Mug, Speckled', 'url' => 'https://www.etsy.com/listing/123456789/ceramic-mug', 'store_key' => 'etsy', 'notes' => 'Any color but white'],
        ] as $position => $data) {
            $wishlist->items()->create([...$data, 'position' => $position]);
        }
    }
}
