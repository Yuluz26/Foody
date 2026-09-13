<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo menu for a modern Malay eatery.
 *
 * Images are open-license Pexels photos loaded by URL (https://www.pexels.com/license/).
 * They are placeholders: replace them with the restaurant's own photography in the admin panel.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->menu() as $categoryIndex => $category) {
            $model = Category::query()->updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'image' => self::pexels($category['image']),
                    'sort_order' => $categoryIndex + 1,
                    'is_active' => true,
                ],
            );

            foreach ($category['products'] as $productIndex => $product) {
                Product::query()->updateOrCreate(
                    ['slug' => Str::slug($product['name'])],
                    [
                        'category_id' => $model->id,
                        'name' => $product['name'],
                        'description' => $product['description'],
                        'price' => $product['price'],
                        'image' => $product['image'] ? self::pexels($product['image']) : null,
                        'is_available' => $product['available'] ?? true,
                        'is_featured' => $product['featured'] ?? false,
                        'sort_order' => $productIndex + 1,
                    ],
                );
            }
        }
    }

    public static function pexels(int $id): string
    {
        return "https://images.pexels.com/photos/{$id}/pexels-photo-{$id}.jpeg";
    }

    /** Prices are in sen. */
    private function menu(): array
    {
        return [
            [
                'name' => 'Nasi',
                'description' => 'Nasi lemak dan nasi goreng, dimasak setiap pagi.',
                'image' => 11912788,
                'products' => [
                    ['name' => 'Nasi Lemak Ayam Berempah', 'price' => 1390, 'image' => 5963873, 'featured' => true,
                        'description' => 'Nasi santan wangi, ayam goreng berempah, sambal tumis, telur rebus, kacang dan ikan bilis.'],
                    ['name' => 'Nasi Lemak Biasa', 'price' => 650, 'image' => 36868140,
                        'description' => 'Nasi santan, sambal tumis, telur rebus, kacang dan ikan bilis goreng.'],
                    ['name' => 'Nasi Lemak Bungkus', 'price' => 350, 'image' => 27155601,
                        'description' => 'Dibungkus daun pisang dengan sambal pedas manis. Mudah dibawa.'],
                    ['name' => 'Nasi Goreng Kampung', 'price' => 1190, 'image' => 37171028,
                        'description' => 'Nasi goreng ikan bilis dan cili padi, bersama ayam goreng dan telur mata.'],
                    ['name' => 'Nasi Goreng Satay', 'price' => 1450, 'image' => 30604609,
                        'description' => 'Nasi goreng dihidang dengan tiga cucuk satay ayam dan kuah kacang.'],
                ],
            ],
            [
                'name' => 'Mi & Kuey Teow',
                'description' => 'Digoreng api besar, terus dari kuali.',
                'image' => 38467981,
                'products' => [
                    ['name' => 'Mee Goreng Mamak', 'price' => 1050, 'image' => 8395783, 'featured' => true,
                        'description' => 'Mi kuning digoreng dengan kentang, tauhu dan sayur, telur mata di atas.'],
                    ['name' => 'Char Kuey Teow', 'price' => 1200, 'image' => 38467981,
                        'description' => 'Kuey teow digoreng dengan udang, taugeh, kucai dan telur.'],
                    ['name' => 'Laksa Kari', 'price' => 1350, 'image' => 9772441,
                        'description' => 'Mi dalam kuah kari santan pedas dengan udang, tauhu pok dan telur.'],
                    ['name' => 'Kari Mee Ayam', 'price' => 1250, 'image' => 9772442,
                        'description' => 'Mi kuning dan bihun dalam kuah kari, ayam, tauhu dan telur rebus.'],
                    ['name' => 'Bihun Goreng Kampung', 'price' => 950, 'image' => 27023340,
                        'description' => 'Bihun goreng bersama sayur, dihidang dengan sambal belacan dan ulam.'],
                ],
            ],
            [
                'name' => 'Roti & Sarapan',
                'description' => 'Pilihan pagi hingga petang.',
                'image' => 38954055,
                'products' => [
                    ['name' => 'Roti Canai Kari Dhal', 'price' => 450, 'image' => 38954055, 'featured' => true,
                        'description' => 'Dua keping roti canai rangup dengan kuah dhal dan kari ayam.'],
                    ['name' => 'Roti Bakar & Kopi O', 'price' => 750, 'image' => 10066809,
                        'description' => 'Roti bakar kaya mentega bersama secawan kopi O panas.'],
                    ['name' => 'Set Sarapan Kampung', 'price' => 1690, 'image' => 18048549, 'available' => false,
                        'description' => 'Nasi lemak bungkus, kuih pilihan dan teh tarik panas.'],
                ],
            ],
            [
                'name' => 'Satay',
                'description' => 'Dibakar atas arang, dihidang dengan kuah kacang.',
                'image' => 37265042,
                'products' => [
                    ['name' => 'Satay Ayam 10 Cucuk', 'price' => 1500, 'image' => 36088082, 'featured' => true,
                        'description' => 'Satay ayam bakar arang dengan kuah kacang, bawang dan timun.'],
                    ['name' => 'Set Satay Nasi Impit', 'price' => 1850, 'image' => 36998500,
                        'description' => 'Sepuluh cucuk satay ayam, nasi impit dan kuah kacang pekat.'],
                ],
            ],
            [
                'name' => 'Pencuci Mulut',
                'description' => 'Manis dan sejuk untuk penutup.',
                'image' => 8306187,
                'products' => [
                    ['name' => 'Cendol Gula Melaka', 'price' => 650, 'image' => 8306187,
                        'description' => 'Cendol pandan, santan segar dan gula Melaka cair di atas ais.'],
                    ['name' => 'Cendol Gelas', 'price' => 750, 'image' => 37106997,
                        'description' => 'Gelas tinggi dengan jeli pandan, santan dan sirap gula Melaka.'],
                    ['name' => 'Onde-Onde Pelangi', 'price' => 500, 'image' => 7851244,
                        'description' => 'Kuih pulut lembut berinti gula Melaka. Sepinggan kecil.'],
                ],
            ],
            [
                'name' => 'Minuman',
                'description' => 'Panas atau sejuk.',
                'image' => 8980388,
                'products' => [
                    ['name' => 'Teh Tarik', 'price' => 350, 'image' => 37186989,
                        'description' => 'Teh susu ditarik hingga berbuih. Panas.'],
                    ['name' => 'Teh Ais', 'price' => 380, 'image' => 8980388,
                        'description' => 'Teh susu pekat dengan ais.'],
                    ['name' => 'Kopi Ais', 'price' => 380, 'image' => 38430657,
                        'description' => 'Kopi tempatan pekat dengan susu dan ais.'],
                    ['name' => 'Air Kosong', 'price' => 50, 'image' => null,
                        'description' => 'Suam atau sejuk.'],
                ],
            ],
        ];
    }
}
