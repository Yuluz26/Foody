<?php

namespace Tests\Feature;

use App\Models\RestaurantSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManifestTest extends TestCase
{
    use RefreshDatabase;

    public function test_manifest_reflects_the_current_restaurant_name(): void
    {
        RestaurantSetting::current()->update(['name' => 'Kedai Makan Baharu']);

        $response = $this->get('/manifest.webmanifest');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/manifest+json');
        $response->assertJsonPath('name', 'Kedai Makan Baharu');
        $response->assertJsonPath('short_name', 'Kedai Makan Baharu');
        $response->assertJsonPath('description', 'Lihat menu dan buat pesanan di Kedai Makan Baharu.');
    }

    public function test_manifest_is_publicly_accessible_without_logging_in(): void
    {
        $this->get('/manifest.webmanifest')->assertOk();
    }

    public function test_the_apple_home_screen_title_reflects_the_current_restaurant_name(): void
    {
        RestaurantSetting::current()->update(['name' => 'Kedai Makan Baharu']);

        $this->get('/admin/login')
            ->assertOk()
            ->assertSee('<meta name="apple-mobile-web-app-title" content="Kedai Makan Baharu">', false);
    }
}
