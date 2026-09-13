<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductAddOn;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductAddOn>
 */
class ProductAddOnFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => fake()->unique()->words(2, true),
            'price' => fake()->numberBetween(100, 500),
            'sort_order' => 0,
        ];
    }
}
