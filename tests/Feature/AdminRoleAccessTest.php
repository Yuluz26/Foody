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

class AdminRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->staff = User::factory()->staff()->create();
    }

    public function test_staff_can_run_the_order_screens(): void
    {
        $order = $this->placeOrder();

        $this->actingAs($this->staff, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('auth.user.role', 'staff'));
        $this->actingAs($this->staff, 'web')->get('/admin/orders')->assertOk();
        $this->actingAs($this->staff, 'web')->get("/admin/orders/{$order->id}")->assertOk();
        $this->actingAs($this->staff, 'web')
            ->patch("/admin/orders/{$order->id}/status", ['status' => OrderStatus::Confirmed->value])
            ->assertSessionHasNoErrors();

        $this->assertSame(OrderStatus::Confirmed, $order->fresh()->status);
    }

    public function test_staff_are_kept_out_of_the_menu_customers_accounts_and_settings(): void
    {
        foreach (['/admin/products', '/admin/categories', '/admin/banners', '/admin/customers', '/admin/staff', '/admin/settings'] as $url) {
            $this->actingAs($this->staff, 'web')->get($url)->assertForbidden();
        }

        $this->actingAs($this->staff, 'web')->put('/admin/settings', ['name' => 'Diubah'])->assertForbidden();
    }

    public function test_staff_cannot_delete_orders_one_by_one_or_in_bulk(): void
    {
        $order = $this->placeOrder();

        $this->actingAs($this->staff, 'web')->delete("/admin/orders/{$order->id}")->assertForbidden();
        $this->actingAs($this->staff, 'web')->post('/admin/orders/bulk', ['ids' => [$order->id], 'action' => 'delete'])->assertForbidden();
        $this->assertModelExists($order);

        $this->actingAs($this->staff, 'web')->post('/admin/orders/bulk', ['ids' => [$order->id], 'action' => 'approve'])->assertSessionHas('success');
    }

    public function test_a_password_change_signs_the_account_out_of_its_other_sessions(): void
    {
        $this->actingAs($this->staff, 'web')->get('/admin')->assertOk();

        $this->staff->password = 'kata-laluan-baharu-99';
        $this->staff->save();

        $this->actingAs($this->staff, 'web')->get('/admin')->assertRedirect('/admin/login');
    }

    private function placeOrder(): Order
    {
        $this->actingAs(Customer::factory()->create(), 'customer');

        return app(PlaceOrder::class)->handle([
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'customer_name' => 'Hafiz',
            'customer_phone' => '0198765432',
            'payment_method' => 'cashier',
            'items' => [['product_id' => Product::factory()->create()->id, 'quantity' => 1]],
        ]);
    }
}
