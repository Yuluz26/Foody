<?php

namespace App\Http\Requests\Admin;

use App\Models\Customer;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user('web')?->hasAdminRole();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Customer|null $customer */
        $customer = $this->route('customer');

        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            // Nullable, like the column itself — a staff-added record can stay a phone-only
            // contact with no login, the same state a pre-account diner is already allowed to be in.
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('customers', 'email')->ignore($customer)],
            'phone' => ['required', 'string', 'max:20', function (string $attribute, mixed $value, Closure $fail) {
                $digits = Customer::normalizePhone((string) $value);

                if (strlen($digits) < 9 || strlen($digits) > 15 || preg_match('/[^\d\s()+-]/', (string) $value)) {
                    $fail('Nombor telefon tidak sah. Contoh: 012-345 6789.');
                }
            }],
            // Always optional, unlike staff: a customer account is meaningful without app login.
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Masukkan nama pelanggan.',
            'name.min' => 'Nama terlalu pendek.',
            'name.max' => 'Nama maksimum 100 aksara.',
            'email.email' => 'Format emel tidak sah.',
            'email.unique' => 'Emel ini sudah digunakan oleh akaun lain.',
            'phone.required' => 'Masukkan nombor telefon.',
            'password.confirmed' => 'Pengesahan kata laluan tidak sepadan.',
        ];
    }
}
