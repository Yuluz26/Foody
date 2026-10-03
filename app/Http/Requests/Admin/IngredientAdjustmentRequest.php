<?php

namespace App\Http\Requests\Admin;

use App\Enums\IngredientMovementType;
use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class IngredientAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('web') !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(IngredientMovementType::class)],
            'quantity' => ['required', 'regex:/^\d{1,7}(\.\d{1,3})?$/'],
            // Price paid per unit; only meaningful on a restock.
            'unit_cost' => ['nullable', 'regex:/^\d{1,5}(\.\d{1,2})?$/'],
            'note' => ['nullable', 'string', 'max:160'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'type.required' => 'Pilih jenis perubahan.',
            'type.enum' => 'Jenis perubahan tidak sah.',
            'quantity.required' => 'Masukkan kuantiti.',
            'quantity.regex' => 'Kuantiti mesti nombor seperti 5 atau 1.5.',
            'unit_cost.regex' => 'Harga mesti nombor seperti 8.50.',
            'note.max' => 'Catatan maksimum 160 aksara.',
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $type = $this->movementType();
            $quantity = (float) $this->input('quantity');

            if ($type !== IngredientMovementType::Adjustment && $quantity <= 0) {
                $validator->errors()->add('quantity', 'Kuantiti mesti lebih daripada 0.');
            }

            /** @var Ingredient $ingredient */
            $ingredient = $this->route('ingredient');

            if ($type->removes() && $quantity > $ingredient->quantity) {
                $validator->errors()->add('quantity', "Baki hanya {$ingredient->quantity} {$ingredient->unit}. Tidak boleh ambil lebih daripada itu.");
            }
        }];
    }

    public function movementType(): IngredientMovementType
    {
        return IngredientMovementType::from($this->input('type'));
    }

    public function unitCostInSen(): ?int
    {
        return filled($this->validated('unit_cost')) ? (int) round(((float) $this->validated('unit_cost')) * 100) : null;
    }
}
