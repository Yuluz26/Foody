<?php

namespace App\Actions;

use App\Enums\IngredientMovementType;
use App\Models\Ingredient;
use App\Models\IngredientMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** The only place an ingredient's balance changes, so every change is explained by a row. */
class IngredientLedger
{
    /**
     * @param  float  $quantity  How many units: added for a restock, taken for usage and waste,
     *                           or the counted balance for an adjustment.
     * @param  int|null  $unitCost  Price per unit paid, in sen. On a restock it becomes the ingredient's current price.
     */
    public function record(Ingredient $ingredient, IngredientMovementType $type, float $quantity, ?User $user = null, ?string $note = null, ?int $unitCost = null): IngredientMovement
    {
        return DB::transaction(function () use ($ingredient, $type, $quantity, $user, $note, $unitCost) {
            $locked = Ingredient::query()->lockForUpdate()->findOrFail($ingredient->id);

            $delta = match ($type) {
                IngredientMovementType::Restock => $quantity,
                IngredientMovementType::Adjustment => $quantity - $locked->quantity,
                default => -$quantity,
            };

            $balance = max(0.0, round($locked->quantity + $delta, 3));
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
                'type' => $type,
                'delta' => $applied,
                'balance_after' => $balance,
                'unit_cost' => $restockCost,
                'note' => filled($note) ? trim($note) : null,
            ]);
        });
    }
}
