<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gift_list_id')->constrained()->cascadeOnDelete();
            $table->string('title', 255);
            $table->text('url')->nullable();
            $table->string('store_key', 32)->nullable();
            $table->text('image_url')->nullable();
            $table->string('identifier', 32)->nullable(); // UPC / GTIN / ISBN when known
            $table->text('notes')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->boolean('most_wanted')->default(false);
            $table->boolean('show_status')->default(false);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['gift_list_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('list_items');
    }
};
