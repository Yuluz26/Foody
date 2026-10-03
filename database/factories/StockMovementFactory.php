<?php

namespace Database\Factories;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockMovement>
 */
class StockMovementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory()->tracked(20),
            'order_id' => null,
            'user_id' => null,
            'type' => StockMovementType::Restock,
            'delta' => 10,
            'balance_after' => 30,
            'note' => null,
        ];
    }
}
