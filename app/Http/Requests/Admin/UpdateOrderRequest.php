<?php

namespace App\Http\Requests\Admin;

use App\Enums\OrderType;
use App\Models\Customer;
use App\Support\TableAvailability;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user('web')?->canAccessPanel();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var \App\Models\Order $order */
        $order = $this->route('order');

        return [
            'customer_name' => ['required', 'string', 'min:2', 'max:100'],
            'customer_phone' => ['required', 'string', 'max:20', function (string $attribute, mixed $value, Closure $fail) {
                $digits = Customer::normalizePhone((string) $value);

                if (strlen($digits) < 9 || strlen($digits) > 15 || preg_match('/[^\d\s()+-]/', (string) $value)) {
                    $fail('Nombor telefon tidak sah. Contoh: 012-345 6789.');
                }
            }],
            'table_number' => array_filter([
                $order->type === OrderType::DineIn ? 'required' : 'nullable',
                'string', 'max:10', 'regex:/^[A-Za-z0-9 -]+$/',
                // Any table free for a new order, plus whichever one this order already holds —
                // otherwise saving the order's own unchanged table would fail as "taken by itself".
                $order->type === OrderType::DineIn
                    ? Rule::in([...TableAvailability::available(), $order->table_number])
                    : null,
            ]),
            'notes' => ['nullable', 'string', 'max:300'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer', Rule::exists('order_items', 'id')->where('order_id', $order->id)],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'customer_name.required' => 'Masukkan nama pelanggan.',
            'customer_name.min' => 'Nama terlalu pendek.',
            'customer_name.max' => 'Nama terlalu panjang.',
            'customer_phone.required' => 'Masukkan nombor telefon.',
            'table_number.required' => 'Masukkan nombor meja.',
            'table_number.max' => 'Nombor meja terlalu panjang.',
            'table_number.regex' => 'Nombor meja hanya boleh mengandungi huruf dan nombor.',
            'table_number.in' => 'Meja ini sedang digunakan oleh pesanan lain. Sila pilih meja lain.',
            'notes.max' => 'Nota maksimum 300 aksara.',
            'items.*.quantity.min' => 'Kuantiti mesti sekurang-kurangnya 1.',
            'items.*.quantity.max' => 'Kuantiti maksimum 50 bagi setiap item.',
        ];
    }
}
