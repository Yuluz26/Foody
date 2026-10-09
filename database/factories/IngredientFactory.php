<?php

namespace Database\Factories;

use App\Models\Ingredient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ingredient>
 */
class IngredientFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'unit' => 'kg',
            'quantity' => 10,
            'unit_cost' => 500,
            'low_stock_threshold' => 2,
            'supplier' => null,
        ];
    }
}
