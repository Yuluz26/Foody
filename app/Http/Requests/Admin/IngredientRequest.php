<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class IngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user('web')?->hasAdminRole();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'unit' => ['required', 'string', 'max:20'],
            // Opening balance, used on create only. Later changes go through the ledger.
            'quantity' => ['nullable', 'regex:/^\d{1,7}(\.\d{1,3})?$/'],
            // Ringgit per unit with up to two decimals, stored in sen.
            'unit_cost' => ['nullable', 'regex:/^\d{1,5}(\.\d{1,2})?$/'],
            'low_stock_threshold' => ['nullable', 'regex:/^\d{1,7}(\.\d{1,3})?$/'],
            'supplier' => ['nullable', 'string', 'max:80'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Masukkan nama bahan.',
            'name.max' => 'Nama bahan maksimum 80 aksara.',
            'unit.required' => 'Masukkan unit, contohnya kg atau biji.',
            'unit.max' => 'Unit maksimum 20 aksara.',
            'quantity.regex' => 'Baki mesti nombor seperti 12 atau 2.5.',
            'unit_cost.regex' => 'Harga mesti nombor seperti 8.50.',
            'low_stock_threshold.regex' => 'Had amaran mesti nombor seperti 2 atau 0.5.',
            'supplier.max' => 'Nama pembekal maksimum 80 aksara.',
        ];
    }

    public function unitCostInSen(): int
    {
        return (int) round(((float) ($this->validated('unit_cost') ?? 0)) * 100);
    }
}
