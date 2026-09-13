<?php

namespace Tests\Feature;

use App\Actions\PlaceOrder;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_counts_todays_orders_and_leaves_cancelled_ones_out_of_revenue(): void
    {
        $this->placeOrder(1500);
        $cancelled = $this->placeOrder(900);
        $cancelled->forceFill(['status' => OrderStatus::Cancelled, 'cancelled_at' => now()])->save();

        $this->actingAs(User::factory()->admin()->create(), 'web')
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Dashboard')
                ->where('stats.orders', 2)
                ->where('stats.revenue', 1500)
                ->where('stats.pending', 1)
                ->has('activeOrders', 1)
                ->has('recentOrders', 2));
    }

    private function placeOrder(int $price): Order
    {
        $this->actingAs(Customer::factory()->create(), 'customer');

        return app(PlaceOrder::class)->handle([
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'customer_name' => 'Hafiz',
            'customer_phone' => '0198765432',
            'payment_method' => 'cashier',
            'items' => [['product_id' => Product::factory()->create(['price' => $price])->id, 'quantity' => 1]],
        ]);
    }
}
