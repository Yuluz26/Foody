<?php

namespace App\Http\Requests\Customer;

use App\Models\Customer;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:customers,email'],
            'phone' => ['required', 'string', 'max:20', function (string $attribute, mixed $value, Closure $fail) {
                $digits = Customer::normalizePhone((string) $value);

                if (strlen($digits) < 9 || strlen($digits) > 15 || preg_match('/[^\d\s()+-]/', (string) $value)) {
                    $fail('Nombor telefon tidak sah. Contoh: 012-345 6789.');
                }
            }],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Masukkan nama anda.',
            'name.min' => 'Nama terlalu pendek.',
            'email.required' => 'Masukkan emel anda.',
            'email.email' => 'Format emel tidak sah.',
            'email.unique' => 'Emel ini sudah didaftarkan. Sila log masuk.',
            'phone.required' => 'Masukkan nombor telefon anda.',
            'password.required' => 'Masukkan kata laluan.',
            'password.confirmed' => 'Pengesahan kata laluan tidak sepadan.',
        ];
    }
}
