<?php

namespace App\Models;

use App\Enums\IngredientMovementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['ingredient_id', 'user_id', 'type', 'delta', 'balance_after', 'unit_cost', 'note'])]
class IngredientMovement extends Model
{
    protected function casts(): array
    {
        return [
            'type' => IngredientMovementType::class,
            'delta' => 'float',
            'balance_after' => 'float',
            'unit_cost' => 'integer',
        ];
    }

    /** @return BelongsTo<Ingredient, $this> */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
