<?php

namespace App\Models;

use App\Models\Concerns\HasImageUrl;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['category_id', 'name', 'slug', 'description', 'price', 'image', 'is_available', 'is_featured', 'track_stock', 'stock_quantity', 'low_stock_threshold', 'sort_order'])]
class Product extends Model
{
    use HasFactory, HasImageUrl;

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'sort_order' => 'integer',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'track_stock' => 'boolean',
            'stock_quantity' => 'integer',
            'low_stock_threshold' => 'integer',
        ];
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasMany<ProductAddOn, $this> */
    public function addOns(): HasMany
    {
        return $this->hasMany(ProductAddOn::class)->orderBy('sort_order');
    }

    /** @return HasMany<RecipeItem, $this> */
    public function recipeItems(): HasMany
    {
        return $this->hasMany(RecipeItem::class);
    }

    /** What one portion costs in ingredients, in sen, at today's ingredient prices. Needs recipeItems.ingredient loaded. */
    public function recipeCost(): int
    {
        return (int) round($this->recipeItems->sum(fn (RecipeItem $item) => $item->quantity * $item->ingredient->unit_cost));
    }

    /** @return HasMany<StockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class)->latest('id');
    }

    /** Untracked dishes are never "out of stock"; tracked ones sell until the count reaches zero. */
    public function isInStock(): bool
    {
        return ! $this->track_stock || $this->stock_quantity > 0;
    }

    public function isLowOnStock(): bool
    {
        return $this->track_stock && $this->stock_quantity > 0 && $this->stock_quantity <= $this->low_stock_threshold;
    }

    /** What the switch on the product means to a customer: switched on by staff and not sold out. */
    public function isSellable(): bool
    {
        return $this->is_available && $this->isInStock();
    }

    /** @param Builder<Product> $query */
    public function scopeTracked(Builder $query): void
    {
        $query->where('track_stock', true);
    }

    /** @param Builder<Product> $query */
    public function scopeLowOnStock(Builder $query): void
    {
        $query->where('track_stock', true)->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
    }

    /**
     * Products a customer can actually order: available, in stock and inside an active category.
     *
     * @param  Builder<Product>  $query
     */
    public function scopeOrderable(Builder $query): void
    {
        $query->where('is_available', true)
            ->where(fn (Builder $stock) => $stock->where('track_stock', false)->orWhere('stock_quantity', '>', 0))
            ->whereHas('category', fn (Builder $category) => $category->where('is_active', true));
    }

    /** @param Builder<Product> $query */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('name');
    }
}
