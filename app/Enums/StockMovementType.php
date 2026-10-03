<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Restock = 'restock';
    case Adjustment = 'adjustment';
    case Waste = 'waste';
    case Sale = 'sale';
    case Return = 'return';

    public function label(): string
    {
        return match ($this) {
            self::Restock => 'Tambah stok',
            self::Adjustment => 'Betulkan baki',
            self::Waste => 'Rosak / terbuang',
            self::Sale => 'Jualan',
            self::Return => 'Pesanan dibatalkan',
        };
    }

    /** Types staff can record by hand. Sale and Return are written by the order flow only. */
    public function isManual(): bool
    {
        return in_array($this, [self::Restock, self::Adjustment, self::Waste], true);
    }

    /** @return list<self> */
    public static function manual(): array
    {
        return array_values(array_filter(self::cases(), fn (self $type) => $type->isManual()));
    }
}
