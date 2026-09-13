<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RestaurantSetting;
use App\Support\AdminPresenter;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = Order::query()->today()
            ->selectRaw("count(*) as orders_count")
            ->selectRaw("coalesce(sum(case when status <> 'cancelled' then total else 0 end), 0) as revenue")
            ->selectRaw("sum(case when status <> 'cancelled' then 1 else 0 end) as billable_count")
            ->selectRaw("sum(case when status = 'pending' then 1 else 0 end) as pending_count")
            ->selectRaw("sum(case when status in ('confirmed', 'preparing') then 1 else 0 end) as preparing_count")
            ->selectRaw("sum(case when status = 'ready' then 1 else 0 end) as ready_count")
            ->selectRaw("sum(case when status = 'completed' then 1 else 0 end) as completed_count")
            ->toBase()
            ->first();

        $billable = (int) $today->billable_count;

        return Inertia::render('Admin/Dashboard', [
            'hourly' => self::hourlyOrders(),
            'stats' => [
                'orders' => (int) $today->orders_count,
                'revenue' => (int) $today->revenue,
                'pending' => (int) $today->pending_count,
                'preparing' => (int) $today->preparing_count,
                'ready' => (int) $today->ready_count,
                'completed' => (int) $today->completed_count,
                // Only shown once there are enough orders for the number to mean something.
                'averageOrder' => $billable >= 3 ? intdiv((int) $today->revenue, $billable) : null,
            ],
            'activeOrders' => Order::query()
                ->active()
                ->withCount('items')
                ->oldest()
                ->limit(12)
                ->get()
                ->map(AdminPresenter::orderRow(...)),
            'recentOrders' => Order::query()
                ->withCount('items')
                ->latest()
                ->limit(8)
                ->get()
                ->map(AdminPresenter::orderRow(...)),
        ]);
    }

    /**
     * Today's order count per hour, spanning the shop's own operating hours (falling back to
     * the full day when hours aren't set or cross midnight, rather than guessing a window).
     *
     * @return list<array{hour: int, count: int}>
     */
    private static function hourlyOrders(): array
    {
        $settings = RestaurantSetting::current();
        $opensHour = $settings->opens_at ? (int) substr($settings->opens_at, 0, 2) : 0;
        $closesHour = $settings->closes_at ? (int) substr($settings->closes_at, 0, 2) : 23;

        if ($opensHour >= $closesHour) {
            $opensHour = 0;
            $closesHour = 23;
        }

        // Grouped in PHP rather than a raw SQL HOUR()/strftime() call so this works the same on
        // every database driver (the test suite runs on SQLite, production on MySQL).
        $counts = Order::query()->today()->pluck('created_at')
            ->countBy(fn ($createdAt) => $createdAt->hour);

        return collect(range($opensHour, $closesHour))
            ->map(fn (int $hour) => ['hour' => $hour, 'count' => (int) ($counts[$hour] ?? 0)])
            ->all();
    }
}
