<?php

namespace App\Http\Requests\Admin;

use App\Enums\StockMovementType;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('web') !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(StockMovementType::class)->only(StockMovementType::manual())],
            // Restock and waste: how many. Adjustment: the counted balance, so zero is allowed.
            'quantity' => ['required', 'integer', 'min:0', 'max:99999'],
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
            'quantity.integer' => 'Kuantiti mesti nombor bulat.',
            'quantity.min' => 'Kuantiti tidak boleh negatif.',
            'quantity.max' => 'Kuantiti terlalu besar.',
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
            $quantity = (int) $this->input('quantity');

            if ($type !== StockMovementType::Adjustment && $quantity < 1) {
                $validator->errors()->add('quantity', 'Kuantiti mesti sekurang-kurangnya 1.');
            }

            /** @var Product $product */
            $product = $this->route('product');

            if ($type === StockMovementType::Waste && $quantity > $product->stock_quantity) {
                $validator->errors()->add('quantity', "Baki hanya {$product->stock_quantity}. Tidak boleh buang lebih daripada itu.");
            }
        }];
    }

    public function movementType(): StockMovementType
    {
        return StockMovementType::from($this->input('type'));
    }
}
