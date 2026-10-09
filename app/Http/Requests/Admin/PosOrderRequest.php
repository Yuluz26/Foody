<?php

namespace App\Http\Requests\Admin;

use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use App\Support\TableAvailability;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PosOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('web') !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'string', 'min:16', 'max:64'],
            'type' => ['required', Rule::enum(OrderType::class)],
            'table_number' => [
                'exclude_unless:type,'.OrderType::DineIn->value,
                'required', 'string', Rule::in(TableAvailability::available()),
            ],
            // A walk-in rarely gives a name or number, so both are optional at the counter.
            'customer_name' => ['nullable', 'string', 'max:100'],
            'customer_phone' => ['nullable', 'string', 'max:20', 'regex:/^[\d\s()+-]*$/'],
            'notes' => ['nullable', 'string', 'max:300'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'paid' => ['boolean'],
            'items' => ['required', 'array', 'min:1', 'max:60'],
            'items.*.product_id' => ['required', 'integer', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'items.*.add_on_ids' => ['array', 'max:20'],
            'items.*.add_on_ids.*' => ['integer', 'min:1'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'type.required' => 'Pilih Makan di sini atau Bungkus.',
            'table_number.required' => 'Pilih nombor meja.',
            'table_number.in' => 'Meja ini sedang digunakan. Pilih meja lain.',
            'customer_phone.regex' => 'Nombor telefon hanya boleh ada nombor, +, - dan ruang.',
            'payment_method.required' => 'Pilih cara bayaran.',
            'items.required' => 'Tambah sekurang-kurangnya satu hidangan.',
            'items.min' => 'Tambah sekurang-kurangnya satu hidangan.',
        ];
    }
}
