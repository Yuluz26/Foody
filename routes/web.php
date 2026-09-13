<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Customer;
use Illuminate\Support\Facades\Route;

/*
| Customer ordering panel — every page needs a diner account, so a customer can
| track and cancel their own orders.
*/
Route::middleware('guest:customer')->group(function () {
    Route::get('/log-masuk', [Customer\AuthController::class, 'create'])->name('customer.login');
    Route::post('/log-masuk', [Customer\AuthController::class, 'store'])->name('customer.login.store');
    Route::get('/daftar', [Customer\AuthController::class, 'createRegister'])->name('customer.register');
    Route::post('/daftar', [Customer\AuthController::class, 'storeRegister'])
        ->middleware('throttle:register')
        ->name('customer.register.store');
});

Route::middleware('auth:customer')->group(function () {
    Route::post('/log-keluar', [Customer\AuthController::class, 'destroy'])->name('customer.logout');

    Route::get('/', Customer\MenuController::class)->name('menu');
    Route::get('/pesan', [Customer\CheckoutController::class, 'create'])->name('checkout');
    Route::post('/pesanan', [Customer\OrderController::class, 'store'])
        ->middleware('throttle:orders')
        ->name('orders.store');
    Route::get('/pesanan-saya', [Customer\OrderController::class, 'myOrders'])->name('orders.index');
    Route::get('/pesanan/{order:public_id}', [Customer\OrderController::class, 'show'])->name('orders.show');
    Route::patch('/pesanan/{order:public_id}/batal', [Customer\OrderController::class, 'cancel'])->name('orders.cancel');
    Route::get('/pesanan/{order:public_id}/resit', [Customer\OrderController::class, 'receipt'])->name('orders.receipt');
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

        Route::get('orders', [Admin\OrderController::class, 'index'])->name('orders.index');
        Route::post('orders/bulk', [Admin\OrderController::class, 'bulk'])->name('orders.bulk');
        Route::get('orders/{order}', [Admin\OrderController::class, 'show'])->name('orders.show');
        Route::patch('orders/{order}/status', [Admin\OrderController::class, 'updateStatus'])->name('orders.status');
        Route::patch('orders/{order}/payment', [Admin\OrderController::class, 'confirmPayment'])->name('orders.payment');
        Route::patch('orders/{order}', [Admin\OrderController::class, 'update'])->name('orders.update');

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

            Route::get('customers', Admin\CustomerController::class)->name('customers.index');

            Route::post('staff/bulk', [Admin\StaffController::class, 'bulk'])->name('staff.bulk');
            Route::patch('staff/{staff}/approve', [Admin\StaffController::class, 'approve'])->name('staff.approve');
            Route::patch('staff/{staff}/revoke', [Admin\StaffController::class, 'revoke'])->name('staff.revoke');
            Route::resource('staff', Admin\StaffController::class)->except('show');

            Route::get('settings', [Admin\SettingController::class, 'edit'])->name('settings.edit');
            Route::put('settings', [Admin\SettingController::class, 'update'])->name('settings.update');
        });
    });
});
