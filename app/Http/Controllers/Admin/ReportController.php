<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Support\AdminPresenter;
use App\Support\OrderSearch;
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
            ...OrderSearch::rules(),
            'status' => ['nullable', Rule::in(['completed', 'all', ...array_column(OrderStatus::cases(), 'value')])],
            'period' => ['nullable', Rule::in(self::PERIODS)],
        ]);

        $status = $filters['status'] ?? 'completed';
        $period = $filters['period'] ?? 'day';

        $orders = OrderSearch::apply(Order::query()->withCount('items'), $filters)
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
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

    /**
     * One aggregate query per bucket rather than pulling every matching order into PHP — the
     * result stays a handful of rows regardless of how many years of order history accumulate.
     *
     * @return list<array{label: string, count: int, revenue: int}>
     */
    private static function completedTrend(string $period): array
    {
        return self::buckets($period)
            ->map(function (Carbon $bucketStart) use ($period) {
                $bucketEnd = self::bucketEnd($period, $bucketStart);

                $row = Order::query()
                    ->where('status', OrderStatus::Completed)
                    ->whereBetween('completed_at', [$bucketStart, $bucketEnd])
                    ->selectRaw('count(*) as count, coalesce(sum(total), 0) as revenue')
                    ->toBase()
                    ->first();

                return [
                    'label' => self::bucketLabel($period, $bucketStart),
                    'count' => (int) $row->count,
                    'revenue' => (int) $row->revenue,
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

    private static function bucketEnd(string $period, Carbon $start): Carbon
    {
        return match ($period) {
            'week' => $start->copy()->endOfWeek(),
            'month' => $start->copy()->endOfMonth(),
            'year' => $start->copy()->endOfYear(),
            default => $start->copy()->endOfDay(),
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
