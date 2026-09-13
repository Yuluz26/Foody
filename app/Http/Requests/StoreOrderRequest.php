<?php

namespace App\Http\Requests;

use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use App\Models\Customer;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'string', 'min:16', 'max:64'],
            'type' => ['required', Rule::enum(OrderType::class)],
            'table_number' => [
                'exclude_unless:type,'.OrderType::DineIn->value,
                'required', 'string', 'max:10', 'regex:/^[A-Za-z0-9 -]+$/',
            ],
            'customer_name' => ['required', 'string', 'min:2', 'max:100'],
            'customer_phone' => ['required', 'string', 'max:20', function (string $attribute, mixed $value, Closure $fail) {
                $digits = Customer::normalizePhone((string) $value);

                if (strlen($digits) < 9 || strlen($digits) > 15 || preg_match('/[^\d\s()+-]/', (string) $value)) {
                    $fail('Nombor telefon tidak sah. Contoh: 012-345 6789.');
                }
            }],
            'notes' => ['nullable', 'string', 'max:300'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'payment_proof' => [
                'exclude_unless:payment_method,'.PaymentMethod::Qr->value,
                'required', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(6 * 1024),
            ],
            'items' => ['required', 'array', 'min:1', 'max:30'],
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
            'type.enum' => 'Jenis pesanan tidak sah.',
            'table_number.required' => 'Masukkan nombor meja anda.',
            'table_number.max' => 'Nombor meja terlalu panjang.',
            'table_number.regex' => 'Nombor meja hanya boleh mengandungi huruf dan nombor.',
            'customer_name.required' => 'Masukkan nama anda.',
            'customer_name.min' => 'Nama terlalu pendek.',
            'customer_name.max' => 'Nama terlalu panjang.',
            'customer_phone.required' => 'Masukkan nombor telefon anda.',
            'notes.max' => 'Nota maksimum 300 aksara.',
            'payment_method.required' => 'Pilih kaedah pembayaran.',
            'payment_proof.required' => 'Muat naik bukti bayaran.',
            'payment_proof.image' => 'Fail mesti gambar JPG, PNG atau WebP.',
            'payment_proof.mimes' => 'Fail mesti gambar JPG, PNG atau WebP.',
            'payment_proof.max' => 'Saiz gambar maksimum 6 MB.',
            'items.required' => 'Troli anda kosong.',
            'items.min' => 'Troli anda kosong.',
            'items.max' => 'Terlalu banyak item dalam satu pesanan.',
            'items.*.quantity.min' => 'Kuantiti mesti sekurang-kurangnya 1.',
            'items.*.quantity.max' => 'Kuantiti maksimum 50 bagi setiap item.',
            '*' => 'Maklumat pesanan tidak sah. Sila semak semula.',
        ];
    }
}
