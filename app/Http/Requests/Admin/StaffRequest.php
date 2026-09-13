<?php

namespace App\Http\Requests\Admin;

use App\Enums\StaffRole;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user('web')?->hasAdminRole();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var User|null $staff */
        $staff = $this->route('staff');

        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($staff)],
            'role' => ['required', Rule::enum(StaffRole::class), function (string $attribute, mixed $value, Closure $fail) use ($staff) {
                if ($staff?->is($this->user('web')) && $value !== $staff->role->value) {
                    $fail('Anda tidak boleh menukar peranan akaun anda sendiri.');
                }
            }],
            'password' => [$staff ? 'nullable' : 'required', 'confirmed', Password::defaults()],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Masukkan nama kakitangan.',
            'name.max' => 'Nama maksimum 100 aksara.',
            'email.required' => 'Masukkan emel.',
            'email.email' => 'Format emel tidak sah.',
            'email.unique' => 'Emel ini sudah digunakan oleh akaun lain.',
            'role.required' => 'Pilih peranan.',
            'role.enum' => 'Peranan tidak sah.',
            'password.required' => 'Masukkan kata laluan.',
            'password.confirmed' => 'Pengesahan kata laluan tidak sepadan.',
        ];
    }
}
