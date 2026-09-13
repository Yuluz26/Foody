<?php

namespace App\Models;

use App\Models\Concerns\HasImageUrl;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['category_id', 'name', 'slug', 'description', 'price', 'image', 'is_available', 'is_featured', 'sort_order'])]
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

    /**
     * Products a customer can actually order: available and inside an active category.
     *
     * @param  Builder<Product>  $query
     */
    public function scopeOrderable(Builder $query): void
    {
        $query->where('is_available', true)
            ->whereHas('category', fn (Builder $category) => $category->where('is_active', true));
    }

    /** @param Builder<Product> $query */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('name');
    }
}
