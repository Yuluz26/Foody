<?php

namespace Database\Seeders;

use App\Enums\StaffRole;
use App\Models\RestaurantSetting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed a working demo: one admin account, restaurant settings and the menu.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('The demo seeder creates admin@foody.test with the password "password" and must not run in production. Create the first admin with: php artisan app:create-admin');
        }

        $admin = User::query()->firstOrNew(['email' => 'admin@foody.test']);
        $admin->forceFill([
            'name' => 'Pentadbir Foody',
            'password' => 'password',
            'is_admin' => true,
            'role' => StaffRole::Admin,
            'approved_at' => $admin->approved_at ?? now(),
        ])->save();

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
