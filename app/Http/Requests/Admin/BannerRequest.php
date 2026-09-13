<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class BannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_admin;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'image' => ['required', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(6 * 1024)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'image.required' => 'Pilih gambar untuk slaid.',
            'image.image' => 'Fail mesti gambar JPG, PNG atau WebP.',
            'image.mimes' => 'Fail mesti gambar JPG, PNG atau WebP.',
            'image.max' => 'Saiz gambar maksimum 6 MB.',
        ];
    }
}
