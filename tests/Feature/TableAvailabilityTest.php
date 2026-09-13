<?php

namespace Tests\Feature;

use App\Actions\PlaceOrder;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TableAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    /** Places a dine-in order directly through the action, bypassing HTTP-layer table validation so tests can set up an "occupied" table freely. */
    private function occupyTable(string $table, ?Customer $customer = null): Order
    {
        $product = Product::factory()->create();
        $this->actingAs($customer ?? Customer::factory()->create(), 'customer');

        return app(PlaceOrder::class)->handle([
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'dine_in',
            'table_number' => $table,
            'customer_name' => 'Nurul',
            'customer_phone' => '0112233445',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);
    }

    public function test_checkout_lists_every_table_when_none_are_occupied(): void
    {
        RestaurantSetting::current()->update(['table_count' => 5]);
        $this->actingAs(Customer::factory()->create(), 'customer');

        $this->get('/pesan')->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Checkout')
            ->where('availableTables', ['1', '2', '3', '4', '5']));
    }

    public function test_checkout_excludes_a_table_with_an_active_dine_in_order(): void
    {
        RestaurantSetting::current()->update(['table_count' => 5]);
        $this->occupyTable('3');
        $this->actingAs(Customer::factory()->create(), 'customer');

        $this->get('/pesan')->assertInertia(fn (Assert $page) => $page
            ->where('availableTables', ['1', '2', '4', '5']));
    }

    public function test_a_table_frees_up_again_once_its_order_is_completed(): void
    {
        RestaurantSetting::current()->update(['table_count' => 3]);
        $order = $this->occupyTable('2');
        $order->update(['status' => OrderStatus::Completed, 'completed_at' => now()]);

        $this->actingAs(Customer::factory()->create(), 'customer');

        $this->get('/pesan')->assertInertia(fn (Assert $page) => $page
            ->where('availableTables', ['1', '2', '3']));
    }

    public function test_a_table_frees_up_again_once_its_order_is_cancelled(): void
    {
        RestaurantSetting::current()->update(['table_count' => 3]);
        $order = $this->occupyTable('2');
        $order->update(['status' => OrderStatus::Cancelled, 'cancelled_at' => now()]);

        $this->actingAs(Customer::factory()->create(), 'customer');

        $this->get('/pesan')->assertInertia(fn (Assert $page) => $page
            ->where('availableTables', ['1', '2', '3']));
    }

    public function test_placing_an_order_for_an_occupied_table_is_rejected(): void
    {
        RestaurantSetting::current()->update(['table_count' => 5]);
        $this->occupyTable('3');

        $product = Product::factory()->create();
        $this->actingAs(Customer::factory()->create(), 'customer');

        $this->post('/pesanan', [
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'dine_in',
            'table_number' => '3',
            'customer_name' => 'Aina',
            'customer_phone' => '0198876655',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('table_number');

        $this->assertSame(1, Order::query()->where('table_number', '3')->count());
    }

    public function test_placing_an_order_for_a_table_outside_the_configured_range_is_rejected(): void
    {
        RestaurantSetting::current()->update(['table_count' => 5]);

        $product = Product::factory()->create();
        $this->actingAs(Customer::factory()->create(), 'customer');

        $this->post('/pesanan', [
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'dine_in',
            'table_number' => '99',
            'customer_name' => 'Aina',
            'customer_phone' => '0198876655',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('table_number');
    }

    public function test_admin_can_configure_the_number_of_tables(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'web')
            ->put('/admin/settings', [
                'name' => 'Foody',
                'currency' => 'MYR',
                'ordering_enabled' => true,
                'dine_in_enabled' => true,
                'takeaway_enabled' => true,
                'table_count' => 7,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(7, RestaurantSetting::current()->fresh()->table_count);
    }
}
