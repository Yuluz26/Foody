<?php

namespace Database\Factories;

use App\Models\Banner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Banner>
 */
class BannerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'image' => 'banners/'.fake()->uuid().'.jpg',
            'sort_order' => 0,
            'is_active' => true,
        ];
    }
}
