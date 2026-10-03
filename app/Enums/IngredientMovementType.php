<?php

namespace App\Enums;

enum IngredientMovementType: string
{
    case Restock = 'restock';
    case Usage = 'usage';
    case Waste = 'waste';
    case Adjustment = 'adjustment';

    public function label(): string
    {
        return match ($this) {
            self::Restock => 'Beli / masuk',
            self::Usage => 'Guna di dapur',
            self::Waste => 'Rosak / terbuang',
            self::Adjustment => 'Betulkan baki',
        };
    }

    /** Types that take from the shelf. */
    public function removes(): bool
    {
        return in_array($this, [self::Usage, self::Waste], true);
    }
}
