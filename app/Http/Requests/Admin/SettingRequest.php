<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class SettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user('web')?->hasAdminRole();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:300'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[\d\s()+-]+$/'],
            'address' => ['nullable', 'string', 'max:255'],
            'opens_at' => ['nullable', 'date_format:H:i', 'required_with:closes_at'],
            'closes_at' => ['nullable', 'date_format:H:i', 'required_with:opens_at'],
            'currency' => ['required', 'string', 'size:3', 'regex:/^[A-Z]{3}$/'],
            'ordering_enabled' => ['boolean'],
            'dine_in_enabled' => ['boolean'],
            'takeaway_enabled' => ['boolean'],
            'logo' => ['nullable', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(2 * 1024)],
            'remove_logo' => ['boolean'],
            'qr_code' => ['nullable', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(2 * 1024)],
            'remove_qr_code' => ['boolean'],
            'payment_instructions' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->boolean('ordering_enabled') && ! $this->boolean('dine_in_enabled') && ! $this->boolean('takeaway_enabled')) {
                    $validator->errors()->add('dine_in_enabled', 'Hidupkan sekurang-kurangnya Makan di sini atau Bungkus semasa pesanan dibuka.');
                }
            },
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Masukkan nama restoran.',
            'phone.regex' => 'Nombor telefon hanya boleh mengandungi nombor, ruang, +, - dan kurungan.',
            'opens_at.date_format' => 'Format masa mesti JJ:MM, contoh 07:00.',
            'closes_at.date_format' => 'Format masa mesti JJ:MM, contoh 23:00.',
            'opens_at.required_with' => 'Isi waktu buka dan waktu tutup bersama.',
            'closes_at.required_with' => 'Isi waktu buka dan waktu tutup bersama.',
            'currency.size' => 'Kod mata wang mesti 3 huruf, contoh MYR.',
            'currency.regex' => 'Kod mata wang mesti 3 huruf besar, contoh MYR.',
            'logo.image' => 'Logo mesti gambar JPG, PNG atau WebP.',
            'logo.max' => 'Saiz logo maksimum 2 MB.',
            'qr_code.image' => 'Kod QR mesti gambar JPG, PNG atau WebP.',
            'qr_code.max' => 'Saiz kod QR maksimum 2 MB.',
            'payment_instructions.max' => 'Arahan pembayaran maksimum 500 aksara.',
        ];
    }
}
