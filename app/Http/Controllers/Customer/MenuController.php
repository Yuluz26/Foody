<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Category;
use App\Models\RestaurantSetting;
use App\Support\MenuPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $categories = Category::query()
            ->active()
            ->ordered()
            ->with(['products' => fn ($query) => $query->ordered()->with('addOns')])
            ->get()
            ->filter(fn (Category $category) => $category->products->isNotEmpty())
            ->values();

        return Inertia::render('Customer/Menu', [
            'restaurant' => MenuPresenter::restaurant(RestaurantSetting::current()),
            'banners' => Banner::query()->active()->ordered()->get()->map(fn (Banner $banner) => ['id' => $banner->id, 'imageUrl' => $banner->image_url])->all(),
            'categories' => $categories->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'imageUrl' => $category->image_url,
                'products' => $category->products->map(MenuPresenter::product(...))->all(),
            ])->all(),
            // A QR code on the table links to /?meja=12 so the table number is prefilled at checkout.
            'table' => self::tableFromQuery($request),
        ]);
    }

    public static function tableFromQuery(Request $request): ?string
    {
        $table = trim((string) $request->query('meja', ''));

        return preg_match('/^[A-Za-z0-9-]{1,10}$/', $table) ? $table : null;
    }
}
