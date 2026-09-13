<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class CategoryRequest extends FormRequest
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
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'image' => ['nullable', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(3 * 1024)],
            'remove_image' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Masukkan nama kategori.',
            'name.max' => 'Nama kategori maksimum 100 aksara.',
            'description.max' => 'Penerangan maksimum 500 aksara.',
            'image.image' => 'Fail mesti gambar JPG, PNG atau WebP.',
            'image.mimes' => 'Fail mesti gambar JPG, PNG atau WebP.',
            'image.max' => 'Saiz gambar maksimum 3 MB.',
        ];
    }
}
