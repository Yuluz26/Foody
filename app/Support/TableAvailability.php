<?php

namespace App\Support;

use App\Enums\OrderType;
use App\Models\Order;
use App\Models\RestaurantSetting;

/**
 * A table is free the moment its last active order is completed or cancelled, so the same
 * numbered table serves any number of parties across a day — just never two at once.
 */
class TableAvailability
{
    /** @return list<string> */
    public static function all(): array
    {
        $count = max(0, RestaurantSetting::current()->table_count);

        return $count === 0 ? [] : array_map(strval(...), range(1, $count));
    }

    /** @return list<string> */
    public static function occupied(): array
    {
        return Order::query()
            ->active()
            ->where('type', OrderType::DineIn)
            ->pluck('table_number')
            ->filter()
            ->all();
    }

    /** @return list<string> */
    public static function available(): array
    {
        $occupied = self::occupied();

        return array_values(array_diff(self::all(), $occupied));
    }
}
