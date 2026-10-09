<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Customer;
use App\Http\Controllers\ManifestController;
use Illuminate\Support\Facades\Route;

// The name/short_name/description follow the restaurant's own name, so this can't be a static
// public/ file — it must go through the router on every request.
Route::get('/manifest.webmanifest', ManifestController::class)->name('manifest');

/*
| Customer ordering panel — open to everyone: a diner can browse, order and follow an order
| without an account. An account is optional and only adds an order history, so
| /pesanan-saya is the one page that needs it.
*/
Route::middleware('guest:customer')->group(function () {
    Route::get('/log-masuk', [Customer\AuthController::class, 'create'])->name('customer.login');
    Route::post('/log-masuk', [Customer\AuthController::class, 'store'])->name('customer.login.store');
    Route::get('/daftar', [Customer\AuthController::class, 'createRegister'])->name('customer.register');
    Route::post('/daftar', [Customer\AuthController::class, 'storeRegister'])
        ->middleware('throttle:register')
        ->name('customer.register.store');
});

Route::get('/', Customer\MenuController::class)->name('menu');
Route::get('/pesan', [Customer\CheckoutController::class, 'create'])->name('checkout');
Route::post('/pesanan', [Customer\OrderController::class, 'store'])
    ->middleware('throttle:orders')
    ->name('orders.store');

// An order is reached by its unguessable public_id. One placed without an account is open to whoever
// holds that link; an account's order stays with that account (see OrderController::authorizeAccess()).
Route::get('/pesanan/{order:public_id}', [Customer\OrderController::class, 'show'])->name('orders.show');
Route::patch('/pesanan/{order:public_id}/batal', [Customer\OrderController::class, 'cancel'])->name('orders.cancel');
Route::get('/pesanan/{order:public_id}/resit', [Customer\OrderController::class, 'receipt'])->name('orders.receipt');

Route::middleware('auth:customer')->group(function () {
    Route::post('/log-keluar', [Customer\AuthController::class, 'destroy'])->name('customer.logout');
    Route::get('/pesanan-saya', [Customer\OrderController::class, 'myOrders'])->name('orders.index');
});

/*
| Admin panel
*/
Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('guest:web')->group(function () {
        Route::get('login', [Admin\AuthController::class, 'create'])->name('login');
        Route::post('login', [Admin\AuthController::class, 'store'])->name('login.store');
    });

    // Explicit :web guard — never rely on the app's "default" guard here, since a request
    // can carry a valid customer-guard session without any staff session at all.
    // auth.session signs out an account's other sessions once its password changes.
    Route::middleware(['auth:web', 'auth.session', 'panel'])->group(function () {
        Route::post('logout', [Admin\AuthController::class, 'destroy'])->name('logout');

        Route::get('/', Admin\DashboardController::class)->name('dashboard');

        // The counter: staff key in an order for someone standing in front of them.
        Route::get('pos', [Admin\PosController::class, 'index'])->name('pos');
        Route::post('pos', [Admin\PosController::class, 'store'])->name('pos.store');

        Route::get('orders', [Admin\OrderController::class, 'index'])->name('orders.index');
        Route::post('orders/bulk', [Admin\OrderController::class, 'bulk'])->name('orders.bulk');
        Route::get('orders/receipts', [Admin\OrderController::class, 'receipts'])->name('orders.receipts');
        Route::get('orders/{order}', [Admin\OrderController::class, 'show'])->name('orders.show');
        Route::get('orders/{order}/receipt', [Admin\OrderController::class, 'receipt'])->name('orders.receipt');
        Route::patch('orders/{order}/status', [Admin\OrderController::class, 'updateStatus'])->name('orders.status');
        Route::patch('orders/{order}/payment', [Admin\OrderController::class, 'confirmPayment'])->name('orders.payment');
        Route::patch('orders/{order}', [Admin\OrderController::class, 'update'])->name('orders.update');

        Route::get('reports', [Admin\ReportController::class, 'index'])->name('reports.index');

        // Counting the shelf is part of running the day, so staff can restock and record waste too.
        Route::get('stock', [Admin\StockController::class, 'index'])->name('stock.index');
        Route::post('stock/{product}', [Admin\StockController::class, 'store'])->name('stock.store');

        // Kitchen ingredients: their own list, prices and history. Nothing here touches dish stock.
        Route::get('ingredients', [Admin\IngredientController::class, 'index'])->name('ingredients.index');
        Route::post('ingredients', [Admin\IngredientController::class, 'store'])->name('ingredients.store');
        Route::put('ingredients/{ingredient}', [Admin\IngredientController::class, 'update'])->name('ingredients.update');
        Route::delete('ingredients/{ingredient}', [Admin\IngredientController::class, 'destroy'])->name('ingredients.destroy');
        Route::post('ingredients/{ingredient}/adjust', [Admin\IngredientController::class, 'adjust'])->name('ingredients.adjust');

        Route::get('profile', [Admin\ProfileController::class, 'edit'])->name('profile.edit');
        Route::put('profile', [Admin\ProfileController::class, 'update'])->name('profile.update');
        Route::put('profile/password', [Admin\ProfileController::class, 'updatePassword'])->name('profile.password');

        // Staff run the day's orders; the menu, customer list, accounts and shop settings stay with admins.
        Route::middleware('admin')->group(function () {
            Route::delete('orders/{order}', [Admin\OrderController::class, 'destroy'])->name('orders.destroy');

            Route::patch('categories/reorder', [Admin\CategoryController::class, 'reorder'])->name('categories.reorder');
            Route::patch('categories/{category}/toggle', [Admin\CategoryController::class, 'toggle'])->name('categories.toggle');
            Route::resource('categories', Admin\CategoryController::class)->except('show');

            Route::patch('products/{product}/toggle', [Admin\ProductController::class, 'toggle'])->name('products.toggle');
            Route::resource('products', Admin\ProductController::class)->except('show');

            Route::patch('banners/reorder', [Admin\BannerController::class, 'reorder'])->name('banners.reorder');
            Route::patch('banners/{banner}/toggle', [Admin\BannerController::class, 'toggle'])->name('banners.toggle');
            Route::get('banners', [Admin\BannerController::class, 'index'])->name('banners.index');
            Route::post('banners', [Admin\BannerController::class, 'store'])->name('banners.store');
            Route::delete('banners/{banner}', [Admin\BannerController::class, 'destroy'])->name('banners.destroy');

            Route::post('customers/bulk', [Admin\CustomerController::class, 'bulk'])->name('customers.bulk');
            Route::resource('customers', Admin\CustomerController::class)->except('show');

            Route::post('staff/bulk', [Admin\StaffController::class, 'bulk'])->name('staff.bulk');
            Route::patch('staff/{staff}/approve', [Admin\StaffController::class, 'approve'])->name('staff.approve');
            Route::patch('staff/{staff}/revoke', [Admin\StaffController::class, 'revoke'])->name('staff.revoke');
            Route::resource('staff', Admin\StaffController::class)->except('show');

            Route::get('settings', [Admin\SettingController::class, 'edit'])->name('settings.edit');
            Route::put('settings', [Admin\SettingController::class, 'update'])->name('settings.update');
        });
    });
});
