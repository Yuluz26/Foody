<?php

namespace Database\Seeders;

use App\Models\RestaurantSetting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed a working demo: one admin account, restaurant settings and the menu.
     */
    public function run(): void
    {
        // Local demo credentials. Change the password in production.
        User::query()->firstOrNew(['email' => 'admin@foody.test'])
            ->forceFill([
                'name' => 'Pentadbir Foody',
                'password' => 'password',
                'is_admin' => true,
            ])
            ->save();

        RestaurantSetting::query()->updateOrCreate(['id' => 1], [
            'name' => 'Foody',
            'description' => 'Nasi lemak, satay dan teh tarik, dimasak segar setiap hari.',
            'opens_at' => '07:00:00',
            'closes_at' => '23:00:00',
            'currency' => 'MYR',
            'ordering_enabled' => true,
            'dine_in_enabled' => true,
            'takeaway_enabled' => true,
        ]);

        $this->call(MenuSeeder::class);
    }
}
