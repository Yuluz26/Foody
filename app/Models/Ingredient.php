<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Something the kitchen buys and uses up. Entirely separate from dish stock:
 * nothing here changes when an order is placed.
 */
#[Fillable(['name', 'unit', 'quantity', 'unit_cost', 'low_stock_threshold', 'supplier'])]
class Ingredient extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'unit_cost' => 'integer',
            'low_stock_threshold' => 'float',
        ];
    }

    /** @return HasMany<IngredientMovement, $this> */
    public function movements(): HasMany
    {
        return $this->hasMany(IngredientMovement::class)->latest('id');
    }

    /** @return HasMany<RecipeItem, $this> */
    public function recipeItems(): HasMany
    {
        return $this->hasMany(RecipeItem::class);
    }

    public function isOut(): bool
    {
        return $this->quantity <= 0;
    }

    public function isLow(): bool
    {
        return $this->quantity > 0 && $this->quantity <= $this->low_stock_threshold;
    }

    /** What is on the shelf is worth, in sen. */
    public function stockValue(): int
    {
        return (int) round(max(0, $this->quantity) * $this->unit_cost);
    }

    /** @param Builder<Ingredient> $query */
    public function scopeNeedsAttention(Builder $query): void
    {
        $query->whereColumn('quantity', '<=', 'low_stock_threshold')->orWhere('quantity', '<=', 0);
    }
}
