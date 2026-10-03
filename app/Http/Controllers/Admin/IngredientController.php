<?php

namespace App\Http\Controllers\Admin;

use App\Actions\IngredientLedger;
use App\Enums\IngredientMovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IngredientAdjustmentRequest;
use App\Http\Requests\Admin\IngredientRequest;
use App\Models\Ingredient;
use App\Models\IngredientMovement;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class IngredientController extends Controller
{
    public function __construct(private readonly IngredientLedger $ledger) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', Rule::in(['low', 'out'])],
        ]);

        $ingredients = Ingredient::query()
            ->when($filters['q'] ?? null, fn (Builder $query, string $term) => $query->where('name', 'like', "%{$term}%"))
            ->when(($filters['state'] ?? null) === 'low', fn (Builder $query) => $query->where('quantity', '>', 0)->whereColumn('quantity', '<=', 'low_stock_threshold'))
            ->when(($filters['state'] ?? null) === 'out', fn (Builder $query) => $query->where('quantity', '<=', 0))
            ->orderByRaw('quantity <= low_stock_threshold desc')
            ->orderBy('name')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (Ingredient $ingredient) => $this->row($ingredient));

        $all = Ingredient::query()->get(['quantity', 'unit_cost', 'low_stock_threshold']);

        return Inertia::render('Admin/Ingredients/Index', [
            'ingredients' => $ingredients,
            'summary' => [
                'total' => $all->count(),
                'low' => $all->filter(fn (Ingredient $ingredient) => $ingredient->isLow())->count(),
                'out' => $all->filter(fn (Ingredient $ingredient) => $ingredient->isOut())->count(),
                'value' => $all->sum(fn (Ingredient $ingredient) => $ingredient->stockValue()),
            ],
            'movements' => IngredientMovement::query()
                ->with(['ingredient:id,name,unit', 'user:id,name'])
                ->latest('id')
                ->limit(10)
                ->get()
                ->map(fn (IngredientMovement $movement) => [
                    'id' => $movement->id,
                    'ingredientName' => $movement->ingredient->name,
                    'unit' => $movement->ingredient->unit,
                    'type' => $movement->type->value,
                    'typeLabel' => $movement->type->label(),
                    'delta' => $movement->delta,
                    'balanceAfter' => $movement->balance_after,
                    'unitCost' => $movement->unit_cost,
                    'note' => $movement->note,
                    'userName' => $movement->user?->name,
                    'createdAt' => $movement->created_at->toIso8601String(),
                ]),
            'filters' => [
                'q' => $filters['q'] ?? '',
                'state' => $filters['state'] ?? '',
            ],
            'types' => array_map(
                fn (IngredientMovementType $type) => ['value' => $type->value, 'label' => $type->label()],
                IngredientMovementType::cases(),
            ),
        ]);
    }

    public function store(IngredientRequest $request): RedirectResponse
    {
        $ingredient = Ingredient::query()->create([
            'name' => trim($request->validated('name')),
            'unit' => trim($request->validated('unit')),
            'unit_cost' => $request->unitCostInSen(),
            'low_stock_threshold' => (float) ($request->validated('low_stock_threshold') ?? 0),
            'supplier' => $request->validated('supplier'),
        ]);

        $opening = (float) ($request->validated('quantity') ?? 0);

        if ($opening > 0) {
            $this->ledger->record($ingredient, IngredientMovementType::Restock, $opening, $request->user(), 'Baki permulaan');
        }

        return back()->with('success', "{$ingredient->name} ditambah.");
    }

    public function update(IngredientRequest $request, Ingredient $ingredient): RedirectResponse
    {
        $ingredient->update([
            'name' => trim($request->validated('name')),
            'unit' => trim($request->validated('unit')),
            'unit_cost' => $request->unitCostInSen(),
            'low_stock_threshold' => (float) ($request->validated('low_stock_threshold') ?? 0),
            'supplier' => $request->validated('supplier'),
        ]);

        return back()->with('success', "{$ingredient->name} dikemas kini.");
    }

    public function destroy(Request $request, Ingredient $ingredient): RedirectResponse
    {
        abort_unless($request->user('web')->hasAdminRole(), 403, 'Hanya admin boleh memadam bahan.');

        $ingredient->delete();

        return back()->with('success', "{$ingredient->name} dipadam.");
    }

    public function adjust(IngredientAdjustmentRequest $request, Ingredient $ingredient): RedirectResponse
    {
        $this->ledger->record(
            $ingredient,
            $request->movementType(),
            (float) $request->validated('quantity'),
            $request->user(),
            $request->validated('note'),
            $request->unitCostInSen(),
        );

        return back()->with('success', "Baki {$ingredient->name} kini {$ingredient->quantity} {$ingredient->unit}.");
    }

    /** @return array<string, mixed> */
    private function row(Ingredient $ingredient): array
    {
        return [
            'id' => $ingredient->id,
            'name' => $ingredient->name,
            'unit' => $ingredient->unit,
            'quantity' => $ingredient->quantity,
            'unitCost' => $ingredient->unit_cost,
            'lowStockThreshold' => $ingredient->low_stock_threshold,
            'supplier' => $ingredient->supplier,
            'stockValue' => $ingredient->stockValue(),
            'stockState' => match (true) {
                $ingredient->isOut() => 'out',
                $ingredient->isLow() => 'low',
                default => 'ok',
            },
        ];
    }
}
