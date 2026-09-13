<?php

namespace App\Http\Middleware;

use App\Models\Order;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => fn () => $request->user('web')?->only('id', 'name', 'email'),
            ],
            // Separate from `auth` above (the staff/admin guard) — a diner's identity never
            // rides on the same key, so a page can't accidentally read the wrong guard's user.
            'customerAuth' => [
                'user' => fn () => $request->user('customer')?->only('id', 'name', 'email'),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'restaurantName' => fn () => RestaurantSetting::current()->name,
            // latestOrderId lets the admin UI detect a genuinely new order (id increases) rather
            // than guessing from activeOrders, which also moves when staff change a status.
            // latestCustomerCancelledOrderId is the same trick for self-cancels: staff already know
            // when they cancel an order themselves, so only customer-initiated cancellations alert.
            'adminCounts' => fn () => $request->user('web')?->is_admin
                ? [
                    'activeOrders' => Order::query()->active()->count(),
                    'latestOrderId' => Order::query()->max('id'),
                    'latestCustomerCancelledOrderId' => Order::query()->where('cancelled_by_customer', true)->max('id'),
                ]
                : null,
        ];
    }
}
