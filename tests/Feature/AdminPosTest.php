<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductAddOn;
use App\Models\RecipeItem;
use App\Models\RestaurantSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPosTest extends TestCase
{
    use RefreshDatabase;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->staff = User::factory()->chef()->create();
        RestaurantSetting::current()->update(['table_count' => 5]);
    }

    /** @param  array<string, mixed>  $overrides */
    private function ring(array $overrides = [])
    {
        $product = Product::factory()->create(['price' => 850]);

        return $this->actingAs($this->staff, 'web')->post('/admin/pos', [
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'payment_method' => 'cashier',
            'paid' => true,
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            ...$overrides,
        ]);
    }

    public function test_staff_can_ring_up_a_walk_in_order_without_a_name_or_phone(): void
    {
        Mail::fake();

        $this->ring()->assertSessionHasNoErrors()->assertRedirect();

        $order = Order::query()->firstOrFail();
        $this->assertSame('pos', $order->source);
        $this->assertSame($this->staff->id, $order->created_by);
        $this->assertNull($order->customer_id);
        $this->assertSame('Pelanggan kaunter', $order->customer_name);
        $this->assertSame(1700, $order->total);
        $this->assertSame(OrderStatus::Confirmed, $order->status);
        $this->assertNotNull($order->confirmed_at);
        $this->assertSame(PaymentStatus::Paid, $order->payment_status);
        Mail::assertNothingSent();
    }

    public function test_an_unpaid_tab_stays_unpaid_and_a_name_is_kept(): void
    {
        $this->ring(['paid' => false, 'customer_name' => 'Pak Hamid', 'customer_phone' => '012-345 6789', 'notes' => 'Kurang manis']);

        $order = Order::query()->firstOrFail();
        $this->assertSame(PaymentStatus::Unpaid, $order->payment_status);
        $this->assertSame('Pak Hamid', $order->customer_name);
        $this->assertSame('0123456789', $order->customer_phone);
        $this->assertSame('Kurang manis', $order->notes);
    }

    public function test_prices_come_from_the_database_and_add_ons_are_charged_once(): void
    {
        $product = Product::factory()->create(['price' => 1000]);
        $addOn = ProductAddOn::factory()->create(['product_id' => $product->id, 'price' => 200]);

        $this->actingAs($this->staff, 'web')->post('/admin/pos', [
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 3, 'add_on_ids' => [$addOn->id], 'price' => 1]],
        ])->assertSessionHasNoErrors();

        $this->assertSame(3200, Order::query()->firstOrFail()->total);
    }

    public function test_the_same_submit_twice_makes_one_order(): void
    {
        $key = (string) Str::uuid();

        $this->ring(['idempotency_key' => $key]);
        $this->ring(['idempotency_key' => $key]);

        $this->assertSame(1, Order::query()->count());
    }

    public function test_dine_in_needs_a_free_table_and_blocks_a_taken_one(): void
    {
        $this->ring(['type' => 'dine_in'])->assertSessionHasErrors('table_number');
        $this->ring(['type' => 'dine_in', 'table_number' => '3'])->assertSessionHasNoErrors();
        $this->ring(['type' => 'dine_in', 'table_number' => '3'])->assertSessionHasErrors('table_number');
        $this->ring(['type' => 'dine_in', 'table_number' => '99'])->assertSessionHasErrors('table_number');
    }

    public function test_it_works_when_the_shop_is_closed_to_online_orders(): void
    {
        RestaurantSetting::current()->update(['dine_in_enabled' => false, 'takeaway_enabled' => false]);

        $this->ring()->assertSessionHasNoErrors();

        $this->assertSame(1, Order::query()->count());
    }

    public function test_stock_and_ingredients_follow_the_counter_order_and_come_back_on_cancel(): void
    {
        $dish = Product::factory()->tracked(10)->create();
        $rice = Ingredient::factory()->create(['quantity' => 5]);
        RecipeItem::query()->create(['product_id' => $dish->id, 'ingredient_id' => $rice->id, 'quantity' => 0.5]);

        $this->actingAs($this->staff, 'web')->post('/admin/pos', [
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $dish->id, 'quantity' => 4]],
        ])->assertSessionHasNoErrors();

        $this->assertSame(6, $dish->fresh()->stock_quantity);
        $this->assertSame(3.0, $rice->fresh()->quantity);

        $order = Order::query()->firstOrFail();
        $this->actingAs($this->staff, 'web')->patch("/admin/orders/{$order->id}/status", ['status' => 'cancelled'])->assertSessionHasNoErrors();

        $this->assertSame(10, $dish->fresh()->stock_quantity);
        $this->assertSame(5.0, $rice->fresh()->quantity);
    }

    public function test_a_sold_out_or_too_large_order_is_rejected_with_a_readable_message(): void
    {
        $dish = Product::factory()->tracked(2)->create();

        $this->actingAs($this->staff, 'web')->post('/admin/pos', [
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $dish->id, 'quantity' => 3]],
        ])->assertSessionHasErrors('order');

        $this->assertSame(0, Order::query()->count());
    }

    public function test_changing_status_on_a_counter_order_does_not_try_to_email_anyone(): void
    {
        Mail::fake();
        $this->ring();
        $order = Order::query()->firstOrFail();

        $this->actingAs($this->staff, 'web')->patch("/admin/orders/{$order->id}/status", ['status' => 'preparing'])->assertSessionHasNoErrors();

        Mail::assertNothingSent();
    }

    public function test_the_counter_does_not_ring_the_new_order_bell(): void
    {
        $this->ring();

        $this->actingAs($this->staff, 'web')->get('/admin')
            ->assertInertia(fn (Assert $page) => $page->where('adminCounts.latestOrderId', null));
    }

    public function test_the_page_lists_products_with_images_stock_and_tables(): void
    {
        $category = Category::factory()->create(['name' => 'Nasi']);
        Product::factory()->tracked(7)->create(['category_id' => $category->id, 'name' => 'Nasi Lemak']);
        $this->ring(['type' => 'dine_in', 'table_number' => '2']);

        $this->actingAs($this->staff, 'web')->get('/admin/pos')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Pos/Index')
                ->where('categories.0.name', 'Nasi')
                ->where('categories.0.products.0.stockQuantity', 7)
                ->where('tables.available', ['1', '3', '4', '5'])
                ->where('completed', null));
    }

    public function test_the_done_screen_only_shows_counter_orders_and_guests_cannot_reach_the_page(): void
    {
        $this->ring();
        $pos = Order::query()->firstOrFail();

        $this->actingAs($this->staff, 'web')->get("/admin/pos?selesai={$pos->id}")
            ->assertInertia(fn (Assert $page) => $page->where('completed.number', $pos->order_number)->has('completed.receiptUrl'));

        $this->app['auth']->forgetGuards();
        $this->get('/admin/pos')->assertRedirect();
    }
}
