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
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OrderStatusTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
    }

    /** The 'customer' guard is independent of the 'web' guard the admin tests act as, so acting
     * here as the order's owner never disturbs $this->admin's own session. */
    private function placeOrder(int $price = 1000, ?Customer $customer = null): Order
    {
        $product = Product::factory()->create(['price' => $price]);
        $this->actingAs($customer ?? Customer::factory()->create(), 'customer');

        return app(PlaceOrder::class)->handle([
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'customer_name' => 'Nurul',
            'customer_phone' => '0112233445',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);
    }

    private function moveTo(Order $order, OrderStatus $status)
    {
        return $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}/status", ['status' => $status->value]);
    }

    public function test_staff_can_move_an_order_forward_and_the_time_is_recorded(): void
    {
        $order = $this->placeOrder();

        $this->moveTo($order, OrderStatus::Confirmed)->assertSessionHasNoErrors();
        $order->refresh();

        $this->assertSame(OrderStatus::Confirmed, $order->status);
        $this->assertNotNull($order->confirmed_at);

        // Skipping ahead is allowed for a busy counter.
        $this->moveTo($order, OrderStatus::Ready)->assertSessionHasNoErrors();
        $this->assertSame(OrderStatus::Ready, $order->fresh()->status);
    }

    public function test_orders_cannot_move_backwards_or_reopen(): void
    {
        $order = $this->placeOrder();

        $this->moveTo($order, OrderStatus::Preparing);
        $this->moveTo($order, OrderStatus::Confirmed)->assertSessionHasErrors('status');
        $this->assertSame(OrderStatus::Preparing, $order->fresh()->status);

        $this->moveTo($order, OrderStatus::Completed);
        $this->moveTo($order, OrderStatus::Cancelled)->assertSessionHasErrors('status');
        $this->assertSame(OrderStatus::Completed, $order->fresh()->status);
    }

    public function test_an_active_order_can_be_cancelled(): void
    {
        $order = $this->placeOrder();

        $this->moveTo($order, OrderStatus::Cancelled)->assertSessionHasNoErrors();

        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertNotNull($order->fresh()->cancelled_at);
        $this->assertFalse($order->fresh()->cancelled_by_customer);
    }

    public function test_customer_can_self_cancel_while_pending_or_confirmed(): void
    {
        $order = $this->placeOrder();

        $this->patch("/pesanan/{$order->public_id}/batal")->assertSessionHasNoErrors();

        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertNotNull($order->fresh()->cancelled_at);
        $this->assertTrue($order->fresh()->cancelled_by_customer);
    }

    public function test_only_a_customer_initiated_cancellation_raises_the_staff_alert_signal(): void
    {
        $staffCancelled = $this->placeOrder();
        $this->moveTo($staffCancelled, OrderStatus::Cancelled);

        $this->actingAs($this->admin, 'web')
            ->get('/admin/orders')
            ->assertInertia(fn (Assert $page) => $page->where('adminCounts.latestCustomerCancelledOrderId', null));

        $customerCancelled = $this->placeOrder();
        $this->patch("/pesanan/{$customerCancelled->public_id}/batal");

        $this->actingAs($this->admin, 'web')
            ->get('/admin/orders')
            ->assertInertia(fn (Assert $page) => $page->where('adminCounts.latestCustomerCancelledOrderId', $customerCancelled->id));
    }

    public function test_customer_cannot_self_cancel_once_the_kitchen_has_started(): void
    {
        $order = $this->placeOrder();
        $this->moveTo($order, OrderStatus::Preparing);

        $this->patch("/pesanan/{$order->public_id}/batal")->assertStatus(422);

        $this->assertSame(OrderStatus::Preparing, $order->fresh()->status);
    }

    public function test_customer_status_page_reflects_the_new_status(): void
    {
        $order = $this->placeOrder();
        $this->moveTo($order, OrderStatus::Preparing);

        $this->get("/pesanan/{$order->public_id}")
            ->assertInertia(fn (Assert $page) => $page->where('order.status', 'preparing'));
    }

    public function test_dashboard_counts_today_and_leaves_cancelled_orders_out_of_revenue(): void
    {
        $kept = $this->placeOrder(1500);
        $cancelled = $this->placeOrder(900);
        $this->moveTo($cancelled, OrderStatus::Cancelled);

        $this->actingAs($this->admin, 'web')
            ->get('/admin')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('stats.orders', 2)
                ->where('stats.revenue', $kept->total)
                ->where('stats.pending', 1)
                ->has('activeOrders', 1));
    }

    public function test_dashboard_hourly_chart_sums_to_todays_order_count(): void
    {
        $this->placeOrder();
        $this->placeOrder();
        $this->placeOrder(900);

        $this->actingAs($this->admin, 'web')
            ->get('/admin')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('hourly', function ($hourly) {
                    $this->assertSame(3, $hourly->sum('count'));
                    $this->assertTrue($hourly->pluck('hour')->contains(now()->hour));

                    return true;
                })
                ->etc());
    }

    public function test_status_transition_rules(): void
    {
        $this->assertTrue(OrderStatus::Pending->canTransitionTo(OrderStatus::Preparing));
        $this->assertTrue(OrderStatus::Ready->canTransitionTo(OrderStatus::Cancelled));
        $this->assertFalse(OrderStatus::Ready->canTransitionTo(OrderStatus::Pending));
        $this->assertFalse(OrderStatus::Cancelled->canTransitionTo(OrderStatus::Completed));
        $this->assertFalse(OrderStatus::Pending->canTransitionTo(OrderStatus::Pending));
    }

    public function test_staff_can_edit_customer_and_logistics_details(): void
    {
        $order = $this->placeOrder();

        $this->actingAs($this->admin, 'web')
            ->patch("/admin/orders/{$order->id}", [
                'customer_name' => 'Aina Batrisyia',
                'customer_phone' => '019-887 6655',
                'table_number' => '',
                'notes' => 'Tak pedas please',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $order->refresh();
        $this->assertSame('Aina Batrisyia', $order->customer_name);
        $this->assertSame('019-887 6655', $order->customer_phone);
        $this->assertSame('Tak pedas please', $order->notes);
    }

    public function test_editing_an_order_without_items_leaves_items_and_total_unchanged(): void
    {
        $order = $this->placeOrder(1000);
        $originalTotal = $order->total;

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}", [
            'customer_name' => 'Aina',
            'customer_phone' => '0198876655',
            'notes' => null,
        ]);

        $order->refresh();
        $this->assertSame($originalTotal, $order->total);
        $this->assertCount(1, $order->items);
    }

    public function test_staff_can_edit_an_item_quantity_and_the_order_total_recalculates(): void
    {
        $order = $this->placeOrder(1000);
        $item = $order->items()->sole();

        $this->actingAs($this->admin, 'web')
            ->patch("/admin/orders/{$order->id}", [
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
                'notes' => null,
                'items' => [['id' => $item->id, 'quantity' => 3]],
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $item->refresh();
        $order->refresh();
        $this->assertSame(3, $item->quantity);
        $this->assertSame(3000, $item->line_total);
        $this->assertSame(3000, $order->subtotal);
        $this->assertSame(3000, $order->total);
        // Unit price is never client-controlled — only quantity moves.
        $this->assertSame(1000, $item->unit_price);
    }

    public function test_editing_an_item_quantity_below_one_is_rejected(): void
    {
        $order = $this->placeOrder(1000);
        $item = $order->items()->sole();

        $this->actingAs($this->admin, 'web')
            ->patch("/admin/orders/{$order->id}", [
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
                'notes' => null,
                'items' => [['id' => $item->id, 'quantity' => 0]],
            ])
            ->assertSessionHasErrors('items.0.quantity');

        $this->assertSame(1, $item->fresh()->quantity);
    }

    public function test_editing_an_order_rejects_an_item_id_belonging_to_another_order(): void
    {
        $order = $this->placeOrder(1000);
        $otherOrder = $this->placeOrder(1500);
        $otherItem = $otherOrder->items()->sole();

        $this->actingAs($this->admin, 'web')
            ->patch("/admin/orders/{$order->id}", [
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
                'notes' => null,
                'items' => [['id' => $otherItem->id, 'quantity' => 5]],
            ])
            ->assertSessionHasErrors('items.0.id');

        $this->assertSame(1, $otherItem->fresh()->quantity);
    }

    public function test_staff_can_delete_an_order_and_its_items_go_with_it(): void
    {
        $order = $this->placeOrder();
        $itemId = $order->items()->first()->id;

        $this->actingAs($this->admin, 'web')
            ->delete("/admin/orders/{$order->id}")
            ->assertRedirect('/admin/orders');

        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
        $this->assertDatabaseMissing('order_items', ['id' => $itemId]);
    }

    public function test_bulk_approve_only_moves_pending_orders_and_skips_the_rest(): void
    {
        $pending = $this->placeOrder();
        $preparing = $this->placeOrder();
        $this->moveTo($preparing, OrderStatus::Preparing);

        $this->actingAs($this->admin, 'web')
            ->post('/admin/orders/bulk', ['ids' => [$pending->id, $preparing->id], 'action' => 'approve'])
            ->assertSessionHasNoErrors();

        $this->assertSame(OrderStatus::Confirmed, $pending->fresh()->status);
        $this->assertSame(OrderStatus::Preparing, $preparing->fresh()->status);
    }

    public function test_bulk_reject_cancels_every_active_order_selected(): void
    {
        $a = $this->placeOrder();
        $b = $this->placeOrder();
        $this->moveTo($b, OrderStatus::Confirmed);

        $this->actingAs($this->admin, 'web')
            ->post('/admin/orders/bulk', ['ids' => [$a->id, $b->id], 'action' => 'reject']);

        $this->assertSame(OrderStatus::Cancelled, $a->fresh()->status);
        $this->assertSame(OrderStatus::Cancelled, $b->fresh()->status);
        $this->assertFalse($a->fresh()->cancelled_by_customer);
        $this->assertFalse($b->fresh()->cancelled_by_customer);
    }

    public function test_bulk_delete_removes_every_selected_order(): void
    {
        $a = $this->placeOrder();
        $b = $this->placeOrder();

        $this->actingAs($this->admin, 'web')
            ->post('/admin/orders/bulk', ['ids' => [$a->id, $b->id], 'action' => 'delete']);

        $this->assertDatabaseMissing('orders', ['id' => $a->id]);
        $this->assertDatabaseMissing('orders', ['id' => $b->id]);
    }

    public function test_opening_hours_handle_closing_after_midnight(): void
    {
        $settings = new RestaurantSetting(['opens_at' => '18:00:00', 'closes_at' => '02:00:00']);

        Carbon::setTestNow('2026-09-11 23:30:00');
        $this->assertTrue($settings->isOpenNow());

        Carbon::setTestNow('2026-09-12 01:59:00');
        $this->assertTrue($settings->isOpenNow());

        Carbon::setTestNow('2026-09-12 10:00:00');
        $this->assertFalse($settings->isOpenNow());

        Carbon::setTestNow();
    }
}
