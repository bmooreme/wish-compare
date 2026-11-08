<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gift_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16)->default('wishlist'); // wishlist | registry
            $table->string('title', 120);
            $table->text('description')->nullable();
            $table->date('event_date')->nullable();
            $table->string('theme', 24)->default('blush');
            $table->string('share_token', 32)->unique();
            $table->string('privacy', 16)->default('unlisted'); // public | unlisted | password
            $table->string('access_password')->nullable();
            $table->boolean('notify_on_purchase')->default(true);
            $table->boolean('shipping_enabled')->default(false);
            $table->text('shipping_address')->nullable(); // encrypted JSON
            $table->timestamps();

            $table->index(['privacy', 'title']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gift_lists');
    }
};
