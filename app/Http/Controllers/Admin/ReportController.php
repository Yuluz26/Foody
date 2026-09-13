<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Support\AdminPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    private const PERIODS = ['day', 'week', 'month', 'year'];

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['completed', 'all', ...array_column(OrderStatus::cases(), 'value')])],
            'type' => ['nullable', Rule::enum(OrderType::class)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
            'period' => ['nullable', Rule::in(self::PERIODS)],
        ]);

        $status = $filters['status'] ?? 'completed';
        $period = $filters['period'] ?? 'day';

        $orders = Order::query()
            ->withCount('items')
            ->when($filters['q'] ?? null, function (Builder $query, string $term) {
                $digits = preg_replace('/\D+/', '', $term);

                $query->where(function (Builder $query) use ($term, $digits) {
                    $query->where('order_number', 'like', "%{$term}%")
                        ->orWhere('customer_name', 'like', "%{$term}%");

                    if ($digits !== '') {
                        $query->orWhere('customer_phone', 'like', "%{$digits}%");
                    }
                });
            })
            ->when($status !== 'all', fn (Builder $query) => $query->where('status', $status))
            ->when($filters['type'] ?? null, fn (Builder $query, string $type) => $query->where('type', $type))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(AdminPresenter::orderRow(...));

        return Inertia::render('Admin/Reports/Index', [
            'orders' => $orders,
            'filters' => [
                'q' => $filters['q'] ?? '',
                'status' => $status,
                'type' => $filters['type'] ?? '',
                'date_from' => $filters['date_from'] ?? '',
                'date_to' => $filters['date_to'] ?? '',
                'period' => $period,
            ],
            'statusOptions' => AdminPresenter::statusOptions(OrderStatus::cases()),
            'trend' => self::completedTrend($period),
        ]);
    }

    /** @return list<array{label: string, count: int, revenue: int}> */
    private static function completedTrend(string $period): array
    {
        $buckets = self::buckets($period);
        $from = $buckets->first();

        // Grouped in PHP (not a raw SQL date/week function) so this behaves the same on every
        // database driver — the test suite runs on SQLite, production on MySQL.
        $rows = Order::query()
            ->where('status', OrderStatus::Completed)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $from)
            ->get(['completed_at', 'total']);

        $grouped = $rows->groupBy(fn (Order $order) => self::bucketKey($period, $order->completed_at));

        return $buckets
            ->map(function (Carbon $bucketStart) use ($period, $grouped) {
                $matching = $grouped->get(self::bucketKey($period, $bucketStart), collect());

                return [
                    'label' => self::bucketLabel($period, $bucketStart),
                    'count' => $matching->count(),
                    'revenue' => (int) $matching->sum('total'),
                ];
            })
            ->values()
            ->all();
    }

    /** @return Collection<int, Carbon> oldest to newest, one entry per bucket */
    private static function buckets(string $period): Collection
    {
        $now = Carbon::now();

        return match ($period) {
            'week' => collect(range(11, 0))->map(fn (int $i) => $now->copy()->subWeeks($i)->startOfWeek()),
            'month' => collect(range(11, 0))->map(fn (int $i) => $now->copy()->subMonths($i)->startOfMonth()),
            'year' => collect(range(4, 0))->map(fn (int $i) => $now->copy()->subYears($i)->startOfYear()),
            default => collect(range(13, 0))->map(fn (int $i) => $now->copy()->subDays($i)->startOfDay()),
        };
    }

    private static function bucketKey(string $period, Carbon $date): string
    {
        return match ($period) {
            'week' => $date->copy()->startOfWeek()->format('Y-m-d'),
            'month' => $date->format('Y-m'),
            'year' => $date->format('Y'),
            default => $date->format('Y-m-d'),
        };
    }

    private static function bucketLabel(string $period, Carbon $date): string
    {
        return match ($period) {
            'week' => $date->translatedFormat('d M'),
            'month' => $date->translatedFormat('M Y'),
            'year' => $date->format('Y'),
            default => $date->translatedFormat('d M'),
        };
    }
}
