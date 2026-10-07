<?php

namespace App\Support;

use App\Models\Ingredient;
use App\Models\Product;

/**
 * Everything on the shelf that needs staff attention: dishes and ingredients that are low or gone.
 * The panel polls this, so the nav badges, the summary card and the pop-up notification all agree.
 */
class StockAlerts
{
    private const LIMIT = 30;

    /**
     * Each alert's key changes with its state (low, then out), so going from low to out alerts again,
     * and an item that is restocked and runs low a second time alerts again too.
     *
     * @return array{dishes: int, ingredients: int, items: list<array{key: string, kind: 'dish'|'ingredient', id: int, name: string, state: 'low'|'out', quantity: float|int, unit: string|null}>}
     */
    public static function forPanel(): array
    {
        $dishes = Product::query()
            ->lowOnStock()
            ->orderBy('stock_quantity')
            ->orderBy('name')
            ->get(['id', 'name', 'track_stock', 'stock_quantity', 'low_stock_threshold'])
            ->map(function (Product $product): array {
                $state = AdminPresenter::stockState($product);

                return [
                    'key' => "dish:{$product->id}:{$state}",
                    'kind' => 'dish',
                    'id' => $product->id,
                    'name' => $product->name,
                    'state' => $state,
                    'quantity' => $product->stock_quantity,
                    'unit' => null,
                ];
            });

        $ingredients = Ingredient::query()
            ->needsAttention()
            ->orderBy('quantity')
            ->orderBy('name')
            ->get()
            ->map(function (Ingredient $ingredient): array {
                $state = $ingredient->isOut() ? 'out' : 'low';

                return [
                    'key' => "ingredient:{$ingredient->id}:{$state}",
                    'kind' => 'ingredient',
                    'id' => $ingredient->id,
                    'name' => $ingredient->name,
                    'state' => $state,
                    'quantity' => $ingredient->quantity,
                    'unit' => $ingredient->unit,
                ];
            });

        return [
            'dishes' => $dishes->count(),
            'ingredients' => $ingredients->count(),
            'items' => $dishes->concat($ingredients)->sortBy(fn (array $item) => $item['state'] === 'out' ? 0 : 1)->take(self::LIMIT)->values()->all(),
        ];
    }
}
