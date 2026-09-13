<?php

namespace Tests\Feature;

use App\Actions\PlaceOrder;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductAddOn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminCatalogTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        Storage::fake('public');
    }

    public function test_admin_can_create_update_and_toggle_a_category(): void
    {
        $this->actingAs($this->admin, 'web')
            ->post('/admin/categories', ['name' => 'Mi & Kuey Teow', 'description' => 'Digoreng api besar', 'is_active' => '1'])
            ->assertRedirect('/admin/categories');

        $category = Category::query()->sole();
        $this->assertSame('mi-kuey-teow', $category->slug);

        $this->actingAs($this->admin, 'web')
            ->put("/admin/categories/{$category->id}", ['name' => 'Mi', 'is_active' => '1'])
            ->assertRedirect('/admin/categories');
        $this->assertSame('mi', $category->fresh()->slug);

        $this->actingAs($this->admin, 'web')->patch("/admin/categories/{$category->id}/toggle");
        $this->assertFalse($category->fresh()->is_active);
    }

    public function test_a_category_with_products_cannot_be_deleted(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->admin, 'web')
            ->delete("/admin/categories/{$product->category_id}")
            ->assertSessionHas('error');

        $this->assertModelExists($product->category);
    }

    public function test_categories_can_be_reordered(): void
    {
        [$first, $second] = Category::factory()->count(2)->sequence(['sort_order' => 1], ['sort_order' => 2])->create();

        $this->actingAs($this->admin, 'web')->patch('/admin/categories/reorder', ['ids' => [$second->id, $first->id]]);

        $this->assertSame(1, $second->fresh()->sort_order);
        $this->assertSame(2, $first->fresh()->sort_order);
    }

    public function test_admin_can_create_a_product_with_an_image(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->admin, 'web')->post('/admin/products', [
            'category_id' => $category->id,
            'name' => 'Nasi Kerabu',
            'description' => 'Nasi biru dengan ulam.',
            'price' => '12.50',
            'is_available' => '1',
            'is_featured' => '0',
            'image' => UploadedFile::fake()->image('kerabu.jpg', 800, 600),
        ])->assertRedirect('/admin/products');

        $product = Product::query()->sole();
        $this->assertSame(1250, $product->price);
        $this->assertTrue($product->is_available);
        Storage::disk('public')->assertExists($product->image);
    }

    public function test_invalid_prices_and_non_image_uploads_are_rejected(): void
    {
        $category = Category::factory()->create();
        $base = ['category_id' => $category->id, 'name' => 'Teh O', 'is_available' => '1'];

        $this->actingAs($this->admin, 'web')->post('/admin/products', [...$base, 'price' => '12.555'])->assertSessionHasErrors('price');
        $this->actingAs($this->admin, 'web')->post('/admin/products', [...$base, 'price' => '0'])->assertSessionHasErrors('price');
        $this->actingAs($this->admin, 'web')->post('/admin/products', [
            ...$base,
            'price' => '2.00',
            'image' => UploadedFile::fake()->create('logo.svg', 4, 'image/svg+xml'),
        ])->assertSessionHasErrors('image');

        $this->assertSame(0, Product::query()->count());
    }

    public function test_admin_can_create_a_product_with_add_ons(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->admin, 'web')->post('/admin/products', [
            'category_id' => $category->id,
            'name' => 'Nasi Lemak',
            'price' => '8.00',
            'is_available' => '1',
            'add_ons' => [
                ['name' => 'Telur', 'price' => '1.50'],
                ['name' => 'Ayam Goreng', 'price' => '4.00'],
            ],
        ])->assertRedirect('/admin/products');

        $product = Product::query()->sole();
        $this->assertCount(2, $product->addOns);
        $this->assertSame(150, $product->addOns->firstWhere('name', 'Telur')->price);
        $this->assertSame(400, $product->addOns->firstWhere('name', 'Ayam Goreng')->price);
    }

    public function test_a_product_with_no_add_ons_stays_that_way(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->admin, 'web')->post('/admin/products', [
            'category_id' => $category->id,
            'name' => 'Teh Tarik',
            'price' => '3.00',
            'is_available' => '1',
        ])->assertRedirect('/admin/products');

        $this->assertCount(0, Product::query()->sole()->addOns);
    }

    public function test_updating_a_products_add_ons_keeps_the_id_of_unchanged_rows_and_removes_dropped_ones(): void
    {
        $product = Product::factory()->create();
        $keep = ProductAddOn::factory()->for($product)->create(['name' => 'Telur', 'price' => 150, 'sort_order' => 0]);
        $drop = ProductAddOn::factory()->for($product)->create(['name' => 'Sambal', 'price' => 100, 'sort_order' => 1]);

        $this->actingAs($this->admin, 'web')->put("/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name' => $product->name,
            'price' => number_format($product->price / 100, 2, '.', ''),
            'is_available' => '1',
            'add_ons' => [
                ['id' => $keep->id, 'name' => 'Telur', 'price' => '2.00'],
                ['name' => 'Keju', 'price' => '3.00'],
            ],
        ])->assertRedirect('/admin/products');

        $product->refresh();
        $this->assertCount(2, $product->addOns);
        $updatedKeep = $product->addOns->firstWhere('name', 'Telur');
        $this->assertSame($keep->id, $updatedKeep->id);
        $this->assertSame(200, $updatedKeep->price);
        $this->assertModelMissing($drop);
    }

    public function test_an_add_on_id_belonging_to_another_product_is_ignored_not_hijacked(): void
    {
        $product = Product::factory()->create();
        $foreign = ProductAddOn::factory()->create();

        $this->actingAs($this->admin, 'web')->put("/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name' => $product->name,
            'price' => number_format($product->price / 100, 2, '.', ''),
            'is_available' => '1',
            'add_ons' => [
                ['id' => $foreign->id, 'name' => 'Renamed', 'price' => '1.00'],
            ],
        ])->assertRedirect('/admin/products');

        $this->assertSame($foreign->product_id, $foreign->fresh()->product_id);
        $this->assertNotSame('Renamed', $foreign->fresh()->name);
        $this->assertCount(1, $product->fresh()->addOns);
    }

    public function test_availability_can_be_toggled(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->admin, 'web')->patch("/admin/products/{$product->id}/toggle");

        $this->assertFalse($product->fresh()->is_available);
    }

    public function test_deleting_a_product_keeps_order_history(): void
    {
        $product = Product::factory()->create(['name' => 'Laksa Kari', 'price' => 1350]);
        $this->actingAs(Customer::factory()->create(), 'customer');
        $order = app(PlaceOrder::class)->handle([
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'customer_name' => 'Hafiz',
            'customer_phone' => '0198765432',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $this->actingAs($this->admin, 'web')->delete("/admin/products/{$product->id}")->assertRedirect('/admin/products');

        $item = $order->items()->sole();
        $this->assertNull($item->product_id);
        $this->assertSame('Laksa Kari', $item->product_name);
        $this->assertSame(1350, $item->line_total);
    }

    public function test_settings_require_an_order_type_when_ordering_is_on(): void
    {
        $this->actingAs($this->admin, 'web')->put('/admin/settings', [
            'name' => 'Foody',
            'currency' => 'MYR',
            'ordering_enabled' => '1',
            'dine_in_enabled' => '0',
            'takeaway_enabled' => '0',
        ])->assertSessionHasErrors('dine_in_enabled');
    }
}
