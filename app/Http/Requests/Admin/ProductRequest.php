<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user('web')?->hasAdminRole();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            // Entered in ringgit with up to two decimals, stored in sen.
            'price' => ['required', 'regex:/^\d{1,4}(\.\d{1,2})?$/', 'not_regex:/^0+(\.0+)?$/'],
            'is_available' => ['boolean'],
            'is_featured' => ['boolean'],
            'track_stock' => ['boolean'],
            // Opening balance. Later changes go through the Stok page so they are logged.
            'stock_quantity' => ['nullable', 'integer', 'min:0', 'max:99999'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0', 'max:99999'],
            'image' => ['nullable', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(3 * 1024)],
            'remove_image' => ['boolean'],
            'add_ons' => ['array', 'max:20'],
            // Present only when editing an existing add-on; lets the update keep its id instead of being recreated.
            'add_ons.*.id' => ['nullable', 'integer'],
            'add_ons.*.name' => ['required', 'string', 'max:60'],
            // Entered in ringgit with up to two decimals, stored in sen. Unlike the product price, 0.00 is allowed (a free add-on).
            'add_ons.*.price' => ['required', 'regex:/^\d{1,4}(\.\d{1,2})?$/'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'category_id.required' => 'Pilih kategori.',
            'category_id.exists' => 'Kategori tidak wujud.',
            'name.required' => 'Masukkan nama produk.',
            'name.max' => 'Nama produk maksimum 120 aksara.',
            'description.max' => 'Penerangan maksimum 500 aksara.',
            'price.required' => 'Masukkan harga.',
            'price.regex' => 'Harga mesti nombor seperti 12.50.',
            'price.not_regex' => 'Harga mesti lebih daripada RM 0.00.',
            'stock_quantity.integer' => 'Baki stok mesti nombor bulat.',
            'stock_quantity.min' => 'Baki stok tidak boleh negatif.',
            'low_stock_threshold.integer' => 'Had amaran mesti nombor bulat.',
            'low_stock_threshold.min' => 'Had amaran tidak boleh negatif.',
            'image.image' => 'Fail mesti gambar JPG, PNG atau WebP.',
            'image.mimes' => 'Fail mesti gambar JPG, PNG atau WebP.',
            'image.max' => 'Saiz gambar maksimum 3 MB.',
            'add_ons.max' => 'Maksimum 20 add-on bagi setiap produk.',
            'add_ons.*.name.required' => 'Masukkan nama add-on.',
            'add_ons.*.name.max' => 'Nama add-on maksimum 60 aksara.',
            'add_ons.*.price.required' => 'Masukkan harga add-on.',
            'add_ons.*.price.regex' => 'Harga add-on mesti nombor seperti 2.00.',
        ];
    }

    public function priceInSen(): int
    {
        return (int) round(((float) $this->validated('price')) * 100);
    }

    /** @return list<array{id: int|null, name: string, price: int}> */
    public function addOnsInSen(): array
    {
        return array_map(fn (array $addOn) => [
            'id' => isset($addOn['id']) ? (int) $addOn['id'] : null,
            'name' => trim($addOn['name']),
            'price' => (int) round(((float) $addOn['price']) * 100),
        ], $this->validated('add_ons') ?? []);
    }
}
