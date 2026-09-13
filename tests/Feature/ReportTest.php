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
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
    }

    /** @return Order */
    private function placeOrder(int $price = 1000)
    {
        $product = Product::factory()->create(['price' => $price]);
        $this->actingAs(Customer::factory()->create(), 'customer');

        return app(PlaceOrder::class)->handle([
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'customer_name' => 'Nurul',
            'customer_phone' => '0112233445',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);
    }

    private function complete(Order $order, \DateTimeInterface $at): Order
    {
        // status/completed_at aren't mass-assignable (timestamp columns are set directly
        // elsewhere in the app too, e.g. Admin\OrderController::updateStatus).
        $order->status = OrderStatus::Completed;
        $order->completed_at = $at;
        $order->save();

        return $order->fresh();
    }

    public function test_reports_table_defaults_to_completed_orders_only(): void
    {
        $completed = $this->complete($this->placeOrder(), now());
        $pending = $this->placeOrder();

        $this->actingAs($this->admin, 'web')->get('/admin/reports')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->where('filters.status', 'completed')
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $completed->id));

        $this->assertNotNull($pending);
    }

    public function test_reports_table_can_be_switched_to_show_every_status(): void
    {
        $this->complete($this->placeOrder(), now());
        $this->placeOrder();

        $this->actingAs($this->admin, 'web')->get('/admin/reports?status=all')
            ->assertInertia(fn (Assert $page) => $page->has('orders.data', 2));
    }

    public function test_reports_table_can_be_filtered_by_a_date_range(): void
    {
        $inRange = $this->placeOrder();
        $inRange->forceFill(['created_at' => '2026-06-15 10:00:00'])->save();

        $before = $this->placeOrder();
        $before->forceFill(['created_at' => '2026-06-01 10:00:00'])->save();

        $after = $this->placeOrder();
        $after->forceFill(['created_at' => '2026-06-30 10:00:00'])->save();

        $this->actingAs($this->admin, 'web')
            ->get('/admin/reports?status=all&date_from=2026-06-10&date_to=2026-06-20')
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $inRange->id)
                ->where('filters.date_from', '2026-06-10')
                ->where('filters.date_to', '2026-06-20'));
    }

    public function test_trend_groups_a_completed_order_by_its_completion_date_not_its_creation_date(): void
    {
        $order = $this->placeOrder(1500);
        $order->forceFill(['created_at' => now()->subDays(30)])->save();
        $this->complete($order, now());

        $this->actingAs($this->admin, 'web')->get('/admin/reports')
            ->assertInertia(fn (Assert $page) => $page
                ->where('trend.13.count', 1)
                ->where('trend.13.revenue', 1500));
    }

    public function test_trend_excludes_orders_completed_before_the_selected_window(): void
    {
        $order = $this->placeOrder();
        $this->complete($order, now()->subDays(20));

        $this->actingAs($this->admin, 'web')->get('/admin/reports')
            ->assertInertia(fn (Assert $page) => $page
                ->where('trend', fn ($trend) => collect($trend)->sum('count') === 0));
    }

    public function test_trend_default_period_has_fourteen_daily_buckets(): void
    {
        $this->actingAs($this->admin, 'web')->get('/admin/reports')
            ->assertInertia(fn (Assert $page) => $page->has('trend', 14));
    }

    public function test_trend_period_can_switch_to_monthly_buckets(): void
    {
        $this->actingAs($this->admin, 'web')->get('/admin/reports?period=month')
            ->assertInertia(fn (Assert $page) => $page->has('trend', 12)->where('filters.period', 'month'));
    }

    public function test_staff_can_print_a_single_orders_receipt(): void
    {
        $staff = User::factory()->staff()->create();
        $order = $this->placeOrder();

        $response = $this->actingAs($staff, 'web')->get("/admin/orders/{$order->id}/receipt");

        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_staff_can_print_a_combined_receipt_for_several_orders(): void
    {
        $staff = User::factory()->staff()->create();
        $first = $this->placeOrder();
        $second = $this->placeOrder();

        $response = $this->actingAs($staff, 'web')->get("/admin/orders/receipts?ids[]={$first->id}&ids[]={$second->id}");

        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_bulk_receipts_404s_when_no_selected_order_exists(): void
    {
        $this->actingAs($this->admin, 'web')->get('/admin/orders/receipts?ids[]=999999')->assertNotFound();
    }
}
