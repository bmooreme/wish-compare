<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('list_item_id')->constrained()->cascadeOnDelete();
            $table->string('buyer_name', 120);
            $table->string('buyer_email');
            $table->text('order_number'); // encrypted at rest
            $table->string('store_key', 32)->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->string('manage_token_hash', 64)->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
