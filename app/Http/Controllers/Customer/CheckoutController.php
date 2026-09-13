<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Support\MenuPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Customer/Checkout', [
            'restaurant' => MenuPresenter::restaurant(RestaurantSetting::current()),
            // The cart lives in the browser; current prices and availability let it reconcile before submit.
            'products' => Product::query()
                ->with(['category:id,is_active', 'addOns'])
                ->get()
                ->map(fn (Product $product) => [
                    ...MenuPresenter::product($product),
                    'isAvailable' => $product->is_available && $product->category->is_active,
                ])
                ->keyBy('id')
                ->all(),
            'table' => MenuController::tableFromQuery($request),
        ]);
    }
}
