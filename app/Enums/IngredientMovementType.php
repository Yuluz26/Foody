<?php

namespace App\Enums;

enum IngredientMovementType: string
{
    case Restock = 'restock';
    case Usage = 'usage';
    case Waste = 'waste';
    case Adjustment = 'adjustment';
    case Sale = 'sale';
    case Return = 'return';

    public function label(): string
    {
        return match ($this) {
            self::Restock => 'Beli / masuk',
            self::Usage => 'Guna di dapur',
            self::Waste => 'Rosak / terbuang',
            self::Adjustment => 'Betulkan baki',
            self::Sale => 'Dijual (ikut resipi)',
            self::Return => 'Pesanan dibatalkan',
        };
    }

    /** Types that take from the shelf. */
    public function removes(): bool
    {
        return in_array($this, [self::Usage, self::Waste], true);
    }

    /** Types staff record by hand. Sale and Return come from orders and recipes only. */
    public function isManual(): bool
    {
        return ! in_array($this, [self::Sale, self::Return], true);
    }

    /** @return list<self> */
    public static function manual(): array
    {
        return array_values(array_filter(self::cases(), fn (self $type) => $type->isManual()));
    }
}
