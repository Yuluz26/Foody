<?php

namespace App\Actions;

use App\Enums\IngredientMovementType;
use App\Models\Ingredient;
use App\Models\IngredientMovement;
use App\Models\Order;
use App\Models\RecipeItem;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/** The only place an ingredient's balance changes, so every change is explained by a row. */
class IngredientLedger
{
    /**
     * @param  float  $quantity  How many units: added for a restock, taken for usage and waste,
     *                           or the counted balance for an adjustment.
     * @param  int|null  $unitCost  Price per unit paid, in sen. On a restock it becomes the ingredient's current price.
     */
    public function record(Ingredient $ingredient, IngredientMovementType $type, float $quantity, ?User $user = null, ?string $note = null, ?int $unitCost = null, ?Order $order = null): IngredientMovement
    {
        return DB::transaction(function () use ($ingredient, $type, $quantity, $user, $note, $unitCost, $order) {
            $locked = Ingredient::query()->lockForUpdate()->findOrFail($ingredient->id);

            $delta = match ($type) {
                IngredientMovementType::Restock, IngredientMovementType::Return => $quantity,
                IngredientMovementType::Adjustment => $quantity - $locked->quantity,
                default => -$quantity,
            };

            // Staff counts can't go below an empty shelf. Sales can: the dish was sold, so the balance
            // honestly shows how far behind the purchase log is, and a cancel gives back exactly what was taken.
            $balance = round($locked->quantity + $delta, 3);

            if ($type !== IngredientMovementType::Sale && $type !== IngredientMovementType::Return) {
                $balance = max(0.0, $balance);
            }

            $applied = round($balance - $locked->quantity, 3);
            $restockCost = $type === IngredientMovementType::Restock ? $unitCost : null;

            $locked->quantity = $balance;

            if ($restockCost !== null) {
                $locked->unit_cost = $restockCost;
            }

            $locked->save();
            $ingredient->setRawAttributes($locked->getAttributes(), true);

            return $locked->movements()->create([
                'user_id' => $user?->id,
                'order_id' => $order?->id,
                'type' => $type,
                'delta' => $applied,
                'balance_after' => $balance,
                'unit_cost' => $restockCost,
                'note' => filled($note) ? trim($note) : null,
            ]);
        });
    }

    /**
     * Take what a freshly placed order's recipes call for. Dishes without a recipe cost nothing here.
     *
     * @param  list<array{product_id: int, quantity: int}>  $lines
     */
    public function sell(Order $order, array $lines): void
    {
        $portions = collect($lines)->groupBy('product_id')->map(fn ($rows) => (int) $rows->sum('quantity'));

        foreach ($this->needs($portions) as $ingredientId => $quantity) {
            $this->record(Ingredient::query()->findOrFail($ingredientId), IngredientMovementType::Sale, $quantity, null, null, null, $order);
        }
    }

    /**
     * Bring an order's ingredient use in line with what it holds now: nothing once cancelled,
     * its recipes' total while active. Repeating it changes nothing.
     */
    public function syncOrder(Order $order, ?User $user = null): void
    {
        DB::transaction(function () use ($order, $user) {
            $taken = IngredientMovement::query()
                ->where('order_id', $order->id)
                ->whereIn('type', [IngredientMovementType::Sale, IngredientMovementType::Return])
                ->get()
                ->groupBy('ingredient_id')
                ->map(fn ($rows) => -round($rows->sum('delta'), 3));

            if ($taken->isEmpty()) {
                return;
            }

            $needed = $order->status->value === 'cancelled'
                ? collect()
                : $this->needs($order->items()->whereNotNull('product_id')->get()->groupBy('product_id')->map(fn ($rows) => (int) $rows->sum('quantity')));

            foreach (Ingredient::query()->whereKey($taken->keys())->get() as $ingredient) {
                $difference = round((float) ($needed[$ingredient->id] ?? 0) - $taken[$ingredient->id], 3);

                if ($difference === 0.0) {
                    continue;
                }

                $type = $difference < 0 ? IngredientMovementType::Return : IngredientMovementType::Sale;
                $this->record($ingredient, $type, abs($difference), $user, null, null, $order);
            }
        });
    }

    /**
     * Total ingredient needed for a set of portions.
     *
     * @param  Collection<int, int>  $portions  Portions keyed by product id.
     * @return Collection<int, float> Quantity keyed by ingredient id.
     */
    private function needs(Collection $portions): Collection
    {
        return RecipeItem::query()
            ->whereIn('product_id', $portions->keys())
            ->get()
            ->groupBy('ingredient_id')
            ->map(fn ($items) => round($items->sum(fn (RecipeItem $item) => $item->quantity * $portions[$item->product_id]), 3));
    }
}
