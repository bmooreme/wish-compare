<?php

use App\Http\Controllers\Lists\AmazonImportController;
use App\Http\Controllers\Lists\GiftListController;
use App\Http\Controllers\Lists\ListItemController;
use App\Http\Controllers\Shared\OutboundController;
use App\Http\Controllers\Shared\PublicListController;
use App\Http\Controllers\Shared\PurchaseController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('welcome'))->name('home');

// Web app manifest (dynamic so the app name follows APP_NAME)
Route::get('manifest.webmanifest', function () {
    return response()->json([
        'name' => config('app.name'),
        'short_name' => config('app.name'),
        'description' => 'Wish lists and gift registries that work with every store.',
        'start_url' => '/dashboard?source=pwa',
        'scope' => '/',
        'display' => 'standalone',
        'background_color' => '#fbf9f6',
        'theme_color' => '#4c2fa0',
        'categories' => ['shopping', 'lifestyle'],
        'icons' => [
            ['src' => '/icons/icon-192.png', 'sizes' => '192x192', 'type' => 'image/png'],
            ['src' => '/icons/icon-512.png', 'sizes' => '512x512', 'type' => 'image/png'],
            ['src' => '/icons/icon-maskable-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable'],
        ],
        'shortcuts' => [
            ['name' => 'My lists', 'url' => '/dashboard?source=pwa'],
            ['name' => 'Find a list', 'url' => '/find?source=pwa'],
        ],
    ], 200, ['Content-Type' => 'application/manifest+json']);
})->name('manifest');

// Legal & info pages
Route::get('privacy', fn () => Inertia::render('legal/privacy'))->name('legal.privacy');
Route::get('terms', fn () => Inertia::render('legal/terms'))->name('legal.terms');
Route::get('affiliate-disclosure', fn () => Inertia::render('legal/affiliate-disclosure'))->name('legal.affiliate');

// Owner area
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [GiftListController::class, 'index'])->name('dashboard');

    Route::get('lists/create', [GiftListController::class, 'create'])->name('lists.create');
    Route::post('lists', [GiftListController::class, 'store'])->name('lists.store');
    Route::get('lists/{list}', [GiftListController::class, 'show'])->name('lists.show');
    Route::get('lists/{list}/settings', [GiftListController::class, 'edit'])->name('lists.edit');
    Route::put('lists/{list}', [GiftListController::class, 'update'])->name('lists.update');
    Route::delete('lists/{list}', [GiftListController::class, 'destroy'])->name('lists.destroy');
    Route::post('lists/{list}/share-link', [GiftListController::class, 'regenerateLink'])->name('lists.share-link');

    Route::scopeBindings()->group(function () {
        Route::post('lists/{list}/items', [ListItemController::class, 'store'])->name('items.store');
        Route::match(['put', 'patch'], 'lists/{list}/items/{item}', [ListItemController::class, 'update'])->name('items.update');
        Route::delete('lists/{list}/items/{item}', [ListItemController::class, 'destroy'])->name('items.destroy');
    });
    Route::post('lists/{list}/items/reorder', [ListItemController::class, 'reorder'])->name('items.reorder');

    Route::get('import/amazon', [AmazonImportController::class, 'create'])->name('import.amazon');
    Route::post('import/amazon/parse', [AmazonImportController::class, 'parse'])
        ->middleware('throttle:30,1')
        ->name('import.amazon.parse');
    Route::post('import/amazon', [AmazonImportController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('import.amazon.store');

    Route::post('item-preview', [ListItemController::class, 'preview'])
        ->middleware('throttle:30,1')
        ->name('items.preview');
});

// Shared lists: no account needed
Route::get('find', [PublicListController::class, 'find'])->name('lists.find');
Route::get('l/{list:share_token}', [PublicListController::class, 'show'])->name('lists.public');
Route::post('l/{list:share_token}/unlock', [PublicListController::class, 'unlock'])
    ->middleware('throttle:10,1')
    ->name('lists.unlock');
Route::post('l/{list:share_token}/address', [PublicListController::class, 'address'])
    ->middleware('throttle:20,1')
    ->name('lists.address');
Route::post('l/{list:share_token}/items/{item}/purchases', [PurchaseController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('purchases.store');

Route::get('go/{item}/{store}', OutboundController::class)
    ->where('store', '[a-z]+')
    ->middleware('throttle:120,1')
    ->name('outbound');

// Buyer's private "modify purchase" link (token in the query string)
Route::middleware('throttle:30,1')->group(function () {
    Route::get('purchases/{purchase}', [PurchaseController::class, 'manage'])->name('purchases.manage');
    Route::put('purchases/{purchase}', [PurchaseController::class, 'update'])->name('purchases.update');
    Route::delete('purchases/{purchase}', [PurchaseController::class, 'destroy'])->name('purchases.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
