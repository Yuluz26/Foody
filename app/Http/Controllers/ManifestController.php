<?php

namespace App\Http\Controllers;

use App\Models\RestaurantSetting;
use Illuminate\Http\JsonResponse;

/** The PWA manifest's name/short_name/description follow the restaurant's own name, so it can't be a static public/ file. */
class ManifestController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $name = RestaurantSetting::current()->name;

        return response()->json([
            'name' => $name,
            'short_name' => $name,
            'description' => "Lihat menu dan buat pesanan di {$name}.",
            'start_url' => '/',
            'scope' => '/',
            'display' => 'standalone',
            'background_color' => '#fbf6ec',
            'theme_color' => '#fbf6ec',
            'lang' => 'ms',
            'dir' => 'ltr',
            'orientation' => 'portrait-primary',
            'icons' => [
                ['src' => '/icons/icon.svg', 'sizes' => 'any', 'type' => 'image/svg+xml', 'purpose' => 'any'],
                ['src' => '/icons/icon-192.png', 'sizes' => '192x192', 'type' => 'image/png', 'purpose' => 'any'],
                ['src' => '/icons/icon-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any'],
                ['src' => '/icons/icon-maskable-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable'],
            ],
        ])->header('Content-Type', 'application/manifest+json');
    }
}
