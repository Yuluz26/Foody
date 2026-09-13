<?php

namespace App\Support;

use App\Enums\OrderType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;

/** Search/type/date-range filtering shared by the admin Orders and Reports pages. */
class OrderSearch
{
    /** @return array<string, array<int, mixed>> */
    public static function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::enum(OrderType::class)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    /**
     * @param  Builder<\App\Models\Order>  $query
     * @param  array{q?: string|null, type?: string|null, date_from?: string|null, date_to?: string|null}  $filters
     * @return Builder<\App\Models\Order>
     */
    public static function apply(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['q'] ?? null, function (Builder $query, string $term) {
                // % and _ are LIKE wildcards — escape them so a term containing either matches
                // literally instead of matching far more (or less) than the staff member typed.
                $escaped = addcslashes($term, '\\%_');
                $digits = preg_replace('/\D+/', '', $term);

                $query->where(function (Builder $query) use ($escaped, $digits) {
                    $query->whereRaw('order_number like ? escape ?', ["%{$escaped}%", '\\'])
                        ->orWhereRaw('customer_name like ? escape ?', ["%{$escaped}%", '\\']);

                    if ($digits !== '') {
                        $query->orWhereRaw('customer_phone like ? escape ?', ["%{$digits}%", '\\']);
                    }
                });
            })
            ->when($filters['type'] ?? null, fn (Builder $query, string $type) => $query->where('type', $type))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '<=', $date));
    }
}
