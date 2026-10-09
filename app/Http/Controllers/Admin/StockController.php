<?php

namespace App\Http\Controllers\Admin;

use App\Actions\StockLedger;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StockAdjustmentRequest;
use App\Models\Product;
use App\Models\StockMovement;
use App\Support\AdminPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', Rule::in(['low', 'out'])],
        ]);

        $products = Product::query()
            ->tracked()
            ->with('category:id,name')
            ->when($filters['q'] ?? null, fn (Builder $query, string $term) => $query->where('name', 'like', "%{$term}%"))
            ->when(($filters['state'] ?? null) === 'low', fn (Builder $query) => $query->lowOnStock()->where('stock_quantity', '>', 0))
            ->when(($filters['state'] ?? null) === 'out', fn (Builder $query) => $query->where('stock_quantity', 0))
            // Emptiest shelves first: that is what needs attention.
            ->orderByRaw('stock_quantity <= low_stock_threshold desc')
            ->orderBy('stock_quantity')
            ->orderBy('name')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'categoryName' => $product->category?->name,
                'imageUrl' => $product->image_url,
                'stockQuantity' => $product->stock_quantity,
                'lowStockThreshold' => $product->low_stock_threshold,
                'stockState' => AdminPresenter::stockState($product),
            ]);

        return Inertia::render('Admin/Stock/Index', [
            'products' => $products,
            'summary' => [
                'tracked' => Product::query()->tracked()->count(),
                'low' => Product::query()->lowOnStock()->where('stock_quantity', '>', 0)->count(),
                'out' => Product::query()->tracked()->where('stock_quantity', 0)->count(),
                'untracked' => Product::query()->where('track_stock', false)->count(),
            ],
            'movements' => StockMovement::query()
                ->with(['product:id,name', 'user:id,name', 'order:id,order_number'])
                ->latest('id')
                ->limit(10)
                ->get()
                ->map(fn (StockMovement $movement) => [
                    'id' => $movement->id,
                    'productName' => $movement->product->name,
                    'type' => $movement->type->value,
                    'typeLabel' => $movement->type->label(),
                    'delta' => $movement->delta,
                    'balanceAfter' => $movement->balance_after,
                    'note' => $movement->note,
                    'orderNumber' => $movement->order?->order_number,
                    'userName' => $movement->user?->name,
                    'createdAt' => $movement->created_at->toIso8601String(),
                ]),
            'filters' => [
                'q' => $filters['q'] ?? '',
                'state' => $filters['state'] ?? '',
            ],
            'types' => array_map(
                fn (StockMovementType $type) => ['value' => $type->value, 'label' => $type->label()],
                StockMovementType::manual(),
            ),
        ]);
    }

    public function store(StockAdjustmentRequest $request, Product $product, StockLedger $stock): RedirectResponse
    {
        abort_unless($product->track_stock, 422, 'Stok produk ini tidak dijejak. Hidupkan penjejakan di borang produk.');

        $type = $request->movementType();
        $quantity = (int) $request->validated('quantity');
        $note = $request->validated('note');

        match ($type) {
            StockMovementType::Restock => $stock->record($product, $type, $quantity, $request->user(), $note),
            StockMovementType::Waste => $stock->record($product, $type, -$quantity, $request->user(), $note),
            default => $stock->setBalance($product, $quantity, $request->user(), $note),
        };

        return back()->with('success', "Baki {$product->name} kini {$product->stock_quantity}.");
    }
}
