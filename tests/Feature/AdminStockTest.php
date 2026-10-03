<?php

namespace Tests\Feature;

use App\Actions\PlaceOrder;
use App\Enums\OrderStatus;
use App\Enums\StockMovementType;
use App\Exceptions\OrderRejected;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminStockTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->customer = Customer::factory()->create();
    }

    /** @param  list<array{product_id: int, quantity: int}>  $items */
    private function place(array $items): Order
    {
        $this->actingAs($this->customer, 'customer');

        return app(PlaceOrder::class)->handle([
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'customer_name' => 'Nurul',
            'customer_phone' => '0112233445',
            'payment_method' => 'cashier',
            'items' => $items,
        ]);
    }

    private function moveTo(Order $order, OrderStatus $status)
    {
        return $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}/status", ['status' => $status->value]);
    }

    public function test_placing_an_order_takes_stock_and_logs_the_sale(): void
    {
        $product = Product::factory()->tracked(10)->create();

        $order = $this->place([['product_id' => $product->id, 'quantity' => 3]]);

        $this->assertSame(7, $product->fresh()->stock_quantity);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'order_id' => $order->id,
            'type' => StockMovementType::Sale->value,
            'delta' => -3,
            'balance_after' => 7,
        ]);
    }

    public function test_untracked_products_are_left_alone(): void
    {
        $product = Product::factory()->create();

        $this->place([['product_id' => $product->id, 'quantity' => 4]]);

        $this->assertSame(0, StockMovement::query()->count());
        $this->assertSame(0, $product->fresh()->stock_quantity);
    }

    public function test_an_order_asking_for_more_than_is_left_is_rejected_without_touching_stock(): void
    {
        $product = Product::factory()->tracked(2)->create();

        try {
            $this->place([
                ['product_id' => $product->id, 'quantity' => 2],
                ['product_id' => $product->id, 'quantity' => 1],
            ]);
            $this->fail('Expected the order to be rejected.');
        } catch (OrderRejected $exception) {
            $this->assertStringContainsString('tinggal 2', $exception->getMessage());
        }

        $this->assertSame(2, $product->fresh()->stock_quantity);
        $this->assertSame(0, Order::query()->count());
    }

    public function test_a_sold_out_dish_cannot_be_ordered_and_shows_as_unavailable(): void
    {
        $product = Product::factory()->tracked(0)->create();

        $this->expectException(OrderRejected::class);

        try {
            $this->place([['product_id' => $product->id, 'quantity' => 1]]);
        } finally {
            $this->assertTrue($product->fresh()->is_available);
            $this->assertFalse($product->fresh()->isSellable());
        }
    }

    public function test_the_menu_marks_sold_out_and_nearly_gone_dishes(): void
    {
        $gone = Product::factory()->tracked(0)->create();
        $few = Product::factory()->tracked(3, 5)->create();
        $plenty = Product::factory()->tracked(40, 5)->create();

        $this->actingAs($this->customer, 'customer')->get('/')
            ->assertOk()
            ->assertInertia(function (Assert $page) use ($gone, $few, $plenty) {
                $products = collect($page->toArray()['props']['categories'])->pluck('products')->flatten(1)->keyBy('id');

                $this->assertFalse($products[$gone->id]['isAvailable']);
                $this->assertTrue($products[$few->id]['isAvailable']);
                $this->assertSame(3, $products[$few->id]['stockLeft']);
                $this->assertNull($products[$plenty->id]['stockLeft']);
            });
    }

    public function test_cancelling_returns_stock_once(): void
    {
        $product = Product::factory()->tracked(10)->create();
        $order = $this->place([['product_id' => $product->id, 'quantity' => 4]]);

        $this->moveTo($order, OrderStatus::Cancelled)->assertSessionHasNoErrors();
        $this->assertSame(10, $product->fresh()->stock_quantity);

        // A second cancel is refused by the status rules and must not return stock again.
        $this->moveTo($order, OrderStatus::Cancelled);
        $this->assertSame(10, $product->fresh()->stock_quantity);
        $this->assertSame(1, StockMovement::query()->where('type', StockMovementType::Return)->count());
    }

    public function test_customer_cancel_returns_stock(): void
    {
        $product = Product::factory()->tracked(10)->create();
        $order = $this->place([['product_id' => $product->id, 'quantity' => 2]]);

        $this->actingAs($this->customer, 'customer')->patch("/pesanan/{$order->public_id}/batal");

        $this->assertSame(10, $product->fresh()->stock_quantity);
    }

    public function test_bulk_reject_and_delete_return_stock_but_deleting_a_served_order_does_not(): void
    {
        $product = Product::factory()->tracked(20)->create();
        $rejected = $this->place([['product_id' => $product->id, 'quantity' => 2]]);
        $deleted = $this->place([['product_id' => $product->id, 'quantity' => 3]]);
        $served = $this->place([['product_id' => $product->id, 'quantity' => 5]]);
        $this->moveTo($served, OrderStatus::Completed);

        $this->actingAs($this->admin, 'web')->post('/admin/orders/bulk', ['ids' => [$rejected->id], 'action' => 'reject']);
        $this->assertSame(12, $product->fresh()->stock_quantity);

        $this->actingAs($this->admin, 'web')->post('/admin/orders/bulk', ['ids' => [$deleted->id], 'action' => 'delete']);
        $this->assertSame(15, $product->fresh()->stock_quantity);

        $this->actingAs($this->admin, 'web')->delete("/admin/orders/{$served->id}");
        $this->assertSame(15, $product->fresh()->stock_quantity);
    }

    public function test_editing_item_quantities_adjusts_stock_by_the_difference(): void
    {
        $product = Product::factory()->tracked(10)->create();
        $order = $this->place([['product_id' => $product->id, 'quantity' => 3]]);
        $item = $order->items()->first();

        $payload = fn (int $quantity) => [
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'type' => $order->type->value,
            'table_number' => $order->table_number,
            'notes' => $order->notes,
            'items' => [['id' => $item->id, 'quantity' => $quantity]],
        ];

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}", $payload(5))->assertSessionHasNoErrors();
        $this->assertSame(5, $product->fresh()->stock_quantity);

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}", $payload(1))->assertSessionHasNoErrors();
        $this->assertSame(9, $product->fresh()->stock_quantity);
    }

    public function test_staff_can_restock_record_waste_and_count_the_shelf(): void
    {
        $staff = User::factory()->staff()->create();
        $product = Product::factory()->tracked(5)->create();

        $this->actingAs($staff, 'web')->post("/admin/stock/{$product->id}", ['type' => 'restock', 'quantity' => 10, 'note' => 'Pasar pagi'])
            ->assertSessionHasNoErrors();
        $this->assertSame(15, $product->fresh()->stock_quantity);

        $this->actingAs($staff, 'web')->post("/admin/stock/{$product->id}", ['type' => 'waste', 'quantity' => 2])
            ->assertSessionHasNoErrors();
        $this->assertSame(13, $product->fresh()->stock_quantity);

        $this->actingAs($staff, 'web')->post("/admin/stock/{$product->id}", ['type' => 'adjustment', 'quantity' => 8, 'note' => 'Kira stok malam'])
            ->assertSessionHasNoErrors();
        $this->assertSame(8, $product->fresh()->stock_quantity);

        $last = StockMovement::query()->latest('id')->first();
        $this->assertSame(StockMovementType::Adjustment, $last->type);
        $this->assertSame(-5, $last->delta);
        $this->assertSame($staff->id, $last->user_id);
    }

    public function test_stock_input_is_validated(): void
    {
        $product = Product::factory()->tracked(3)->create();
        $post = fn (array $data) => $this->actingAs($this->admin, 'web')->post("/admin/stock/{$product->id}", $data);

        $post(['type' => 'sale', 'quantity' => 1])->assertSessionHasErrors('type');
        $post(['type' => 'restock', 'quantity' => 0])->assertSessionHasErrors('quantity');
        $post(['type' => 'waste', 'quantity' => 4])->assertSessionHasErrors('quantity');
        $post(['type' => 'restock', 'quantity' => -1])->assertSessionHasErrors('quantity');
        $this->assertSame(3, $product->fresh()->stock_quantity);
    }

    public function test_untracked_products_reject_stock_changes(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->admin, 'web')->post("/admin/stock/{$product->id}", ['type' => 'restock', 'quantity' => 5])->assertStatus(422);
    }

    public function test_the_stock_page_lists_tracked_dishes_emptiest_first(): void
    {
        Product::factory()->tracked(30)->create(['name' => 'Penuh']);
        Product::factory()->tracked(2)->create(['name' => 'Hampir Habis']);
        Product::factory()->tracked(0)->create(['name' => 'Habis']);
        Product::factory()->create(['name' => 'Tak Jejak']);

        $this->actingAs($this->admin, 'web')->get('/admin/stock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Stock/Index')
                ->where('products.data.0.name', 'Habis')
                ->where('products.data.1.name', 'Hampir Habis')
                ->where('products.data.2.name', 'Penuh')
                ->where('summary', ['tracked' => 3, 'low' => 1, 'out' => 1, 'untracked' => 1]));

        $this->actingAs($this->admin, 'web')->get('/admin/stock?state=out')
            ->assertInertia(fn (Assert $page) => $page->has('products.data', 1));
    }

    public function test_the_stock_page_needs_a_signed_in_staff_member(): void
    {
        $this->get('/admin/stock')->assertRedirect();
    }

    public function test_turning_tracking_on_in_the_product_form_logs_the_opening_balance(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->admin, 'web')->put("/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name' => $product->name,
            'price' => '8.50',
            'is_available' => true,
            'track_stock' => true,
            'stock_quantity' => 25,
            'low_stock_threshold' => 6,
        ])->assertSessionHasNoErrors();

        $product->refresh();
        $this->assertTrue($product->track_stock);
        $this->assertSame(25, $product->stock_quantity);
        $this->assertSame(6, $product->low_stock_threshold);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $product->id, 'delta' => 25, 'note' => 'Stok permulaan']);
    }
}
