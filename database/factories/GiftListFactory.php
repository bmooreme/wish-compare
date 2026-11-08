<?php

namespace Database\Factories;

use App\Models\GiftList;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<GiftList> */
class GiftListFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => 'wishlist',
            'title' => fake()->randomElement(['Birthday wishes', 'Holiday list', 'Things I love']),
            'description' => fake()->sentence(),
            'theme' => fake()->randomElement(GiftList::THEMES),
            'privacy' => 'unlisted',
            'notify_on_purchase' => true,
        ];
    }

    public function registry(): static
    {
        return $this->state(fn () => [
            'type' => 'registry',
            'title' => 'Our wedding registry',
            'event_date' => now()->addMonths(3)->toDateString(),
        ]);
    }

    public function public(): static
    {
        return $this->state(fn () => ['privacy' => 'public']);
    }

    public function passwordProtected(string $password = 'secret-pass'): static
    {
        return $this->state(fn () => ['privacy' => 'password', 'access_password' => $password]);
    }
}
