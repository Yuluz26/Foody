<?php

namespace Tests\Feature;

use App\Enums\OrderType;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductAddOn;
use App\Models\RestaurantSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerOrderingTest extends TestCase
{
    use RefreshDatabase;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = Customer::factory()->create();
        $this->actingAs($this->customer, 'customer');
    }

    /** @param array<string, mixed> $overrides */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'idempotency_key' => (string) Str::uuid(),
            'type' => OrderType::Takeaway->value,
            'customer_name' => 'Aisyah Rahman',
            'customer_phone' => '012-345 6789',
            'notes' => null,
            'payment_method' => 'cashier',
            'items' => [],
        ], $overrides);
    }

    public function test_menu_shows_active_categories_only(): void
    {
        Product::factory()->for(Category::factory()->state(['name' => 'Nasi']))->create();
        Product::factory()->for(Category::factory()->inactive()->state(['name' => 'Tersembunyi']))->create();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Customer/Menu')
                ->has('categories', 1)
                ->where('categories.0.name', 'Nasi'));
    }

    public function test_menu_prefills_a_valid_table_from_the_qr_link(): void
    {
        $this->get('/?meja=12')->assertInertia(fn (Assert $page) => $page->where('table', '12'));
        $this->get('/?meja=<script>')->assertInertia(fn (Assert $page) => $page->where('table', null));
    }

    public function test_totals_are_calculated_on_the_server_and_client_prices_are_ignored(): void
    {
        $nasi = Product::factory()->create(['price' => 1390]);
        $teh = Product::factory()->create(['price' => 350]);

        $response = $this->post('/pesanan', $this->payload([
            'items' => [
                ['product_id' => $nasi->id, 'quantity' => 2, 'price' => 1],
                ['product_id' => $teh->id, 'quantity' => 3],
                ['product_id' => $teh->id, 'quantity' => 1],
            ],
            'subtotal' => 5,
            'total' => 5,
        ]));

        $order = Order::query()->with('items')->sole();

        $response->assertRedirect(route('orders.show', $order));
        $this->assertSame(1390 * 2 + 350 * 4, $order->subtotal);
        $this->assertSame($order->subtotal, $order->total);
        $this->assertCount(2, $order->items);
        $this->assertSame(4, $order->items->firstWhere('product_id', $teh->id)->quantity);
        $this->assertSame(1390, $order->items->firstWhere('product_id', $nasi->id)->unit_price);
        $this->assertSame('FD'.str_pad((string) $order->id, 4, '0', STR_PAD_LEFT), $order->order_number);
        $this->assertSame($this->customer->id, $order->customer_id);
    }

    public function test_add_ons_are_priced_from_the_database_and_snapshotted(): void
    {
        $product = Product::factory()->create(['price' => 800]);
        $telur = ProductAddOn::factory()->for($product)->create(['name' => 'Telur', 'price' => 150]);
        $sambal = ProductAddOn::factory()->for($product)->create(['name' => 'Sambal Extra', 'price' => 100]);

        $this->post('/pesanan', $this->payload([
            'items' => [
                // The client-sent price is ignored, same as an item with no add-ons.
                ['product_id' => $product->id, 'quantity' => 2, 'add_on_ids' => [$telur->id, $sambal->id], 'price' => 1],
            ],
        ]));

        $order = Order::query()->with('items.addOns')->sole();
        $item = $order->items->sole();

        $this->assertSame(800, $item->unit_price);
        $this->assertSame(250, $item->add_ons_total);
        // Add-ons are a flat charge for the line, not per unit: (800 x 2) + 250, not (800 + 250) x 2.
        $this->assertSame(800 * 2 + 250, $item->line_total);
        $this->assertSame($item->line_total, $order->subtotal);
        $this->assertCount(2, $item->addOns);
        $this->assertSame('Telur', $item->addOns->firstWhere('price', 150)->name);
    }

    public function test_increasing_quantity_does_not_multiply_the_add_on_charge(): void
    {
        $product = Product::factory()->create(['price' => 1200]);
        $addOn = ProductAddOn::factory()->for($product)->create(['price' => 100]);

        $this->post('/pesanan', $this->payload([
            'items' => [['product_id' => $product->id, 'quantity' => 2, 'add_on_ids' => [$addOn->id]]],
        ]));

        $item = Order::query()->with('items')->sole()->items->sole();

        $this->assertSame(100, $item->add_ons_total);
        $this->assertSame(1200 * 2 + 100, $item->line_total);
    }

    public function test_the_same_product_with_different_add_ons_stays_on_separate_order_items(): void
    {
        $product = Product::factory()->create(['price' => 500]);
        $telur = ProductAddOn::factory()->for($product)->create(['price' => 100]);

        $this->post('/pesanan', $this->payload([
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'add_on_ids' => [$telur->id]],
                ['product_id' => $product->id, 'quantity' => 1],
                ['product_id' => $product->id, 'quantity' => 2, 'add_on_ids' => [$telur->id]],
            ],
        ]));

        $order = Order::query()->with('items')->sole();

        $this->assertCount(2, $order->items);
        $this->assertSame(3, $order->items->firstWhere('add_ons_total', 100)->quantity);
        $this->assertSame(1, $order->items->firstWhere('add_ons_total', 0)->quantity);
    }

    public function test_an_add_on_belonging_to_a_different_product_is_rejected(): void
    {
        $product = Product::factory()->create();
        $foreignAddOn = ProductAddOn::factory()->create();

        $this->post('/pesanan', $this->payload([
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'add_on_ids' => [$foreignAddOn->id]]],
        ]))->assertSessionHasErrors('order');

        $this->assertSame(0, Order::query()->count());
    }

    public function test_repeated_submit_with_the_same_key_creates_one_order(): void
    {
        $product = Product::factory()->create();
        $payload = $this->payload(['items' => [['product_id' => $product->id, 'quantity' => 1]]]);

        $first = $this->post('/pesanan', $payload);
        $second = $this->post('/pesanan', $payload);

        $this->assertSame(1, Order::query()->count());
        $this->assertSame($first->headers->get('Location'), $second->headers->get('Location'));
    }

    public function test_dine_in_requires_a_table_number(): void
    {
        $product = Product::factory()->create();

        $this->post('/pesanan', $this->payload([
            'type' => OrderType::DineIn->value,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]))->assertSessionHasErrors('table_number');

        $this->assertSame(0, Order::query()->count());
    }

    public function test_takeaway_ignores_a_table_number(): void
    {
        $product = Product::factory()->create();

        $this->post('/pesanan', $this->payload([
            'table_number' => '7',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]))->assertSessionHasNoErrors();

        $this->assertNull(Order::query()->sole()->table_number);
    }

    public function test_unavailable_products_cannot_be_ordered(): void
    {
        $soldOut = Product::factory()->unavailable()->create(['name' => 'Set Sarapan']);

        $this->post('/pesanan', $this->payload(['items' => [['product_id' => $soldOut->id, 'quantity' => 1]]]))
            ->assertSessionHasErrors('order');

        $this->assertSame(0, Order::query()->count());
    }

    public function test_products_in_hidden_categories_cannot_be_ordered(): void
    {
        $hidden = Product::factory()->for(Category::factory()->inactive())->create();

        $this->post('/pesanan', $this->payload(['items' => [['product_id' => $hidden->id, 'quantity' => 1]]]))
            ->assertSessionHasErrors('order');
    }

    public function test_orders_are_rejected_when_ordering_is_switched_off(): void
    {
        RestaurantSetting::current()->update(['ordering_enabled' => false]);
        $product = Product::factory()->create();

        $this->post('/pesanan', $this->payload(['items' => [['product_id' => $product->id, 'quantity' => 1]]]))
            ->assertSessionHasErrors('order');
    }

    public function test_a_disabled_order_type_is_rejected(): void
    {
        RestaurantSetting::current()->update(['dine_in_enabled' => false]);
        $product = Product::factory()->create();

        $this->post('/pesanan', $this->payload([
            'type' => OrderType::DineIn->value,
            'table_number' => '3',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]))->assertSessionHasErrors('order');
    }

    public function test_invalid_quantities_and_phone_are_rejected(): void
    {
        $product = Product::factory()->create();

        $this->post('/pesanan', $this->payload([
            'customer_phone' => '12ab',
            'items' => [['product_id' => $product->id, 'quantity' => 0]],
        ]))->assertSessionHasErrors(['customer_phone', 'items.0.quantity']);
    }

    public function test_placing_an_order_never_creates_or_matches_a_different_customer_by_phone(): void
    {
        $other = Customer::factory()->create(['phone' => Customer::normalizePhone('0123456789')]);
        $product = Product::factory()->create();

        // Signed in as $this->customer but typing $other's phone into the checkout form —
        // the order must still belong to the signed-in account, and $other's own row untouched.
        $this->post('/pesanan', $this->payload([
            'customer_phone' => '0123456789',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]));

        $order = Order::query()->sole();
        $this->assertSame($this->customer->id, $order->customer_id);
        $this->assertNotSame($other->id, $order->customer_id);
        $this->assertNull($other->fresh()->last_order_at);
        $this->assertNotNull($this->customer->fresh()->last_order_at);
    }

    public function test_status_page_is_reached_by_public_id_only(): void
    {
        $product = Product::factory()->create();
        $this->post('/pesanan', $this->payload(['items' => [['product_id' => $product->id, 'quantity' => 1]]]));
        $order = Order::query()->sole();

        $this->get("/pesanan/{$order->public_id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Customer/OrderStatus')
                ->where('order.number', $order->order_number)
                ->where('order.status', 'pending')
                ->missing('order.customerPhone'));

        $this->get("/pesanan/{$order->id}")->assertNotFound();
    }

    public function test_a_customer_cannot_view_or_cancel_another_customers_order(): void
    {
        $product = Product::factory()->create();
        $this->post('/pesanan', $this->payload(['items' => [['product_id' => $product->id, 'quantity' => 1]]]));
        $order = Order::query()->sole();

        $stranger = Customer::factory()->create();
        $this->actingAs($stranger, 'customer');

        $this->get("/pesanan/{$order->public_id}")->assertForbidden();
        $this->patch("/pesanan/{$order->public_id}/batal")->assertForbidden();
    }

    public function test_the_owner_can_download_a_pdf_receipt(): void
    {
        $product = Product::factory()->create();
        $this->post('/pesanan', $this->payload(['items' => [['product_id' => $product->id, 'quantity' => 1]]]));
        $order = Order::query()->sole();

        $response = $this->get("/pesanan/{$order->public_id}/resit");

        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_a_stranger_cannot_download_another_customers_receipt(): void
    {
        $product = Product::factory()->create();
        $this->post('/pesanan', $this->payload(['items' => [['product_id' => $product->id, 'quantity' => 1]]]));
        $order = Order::query()->sole();

        $this->actingAs(Customer::factory()->create(), 'customer')
            ->get("/pesanan/{$order->public_id}/resit")
            ->assertForbidden();
    }

    public function test_too_many_order_attempts_are_explained_on_the_page(): void
    {
        $product = Product::factory()->create();

        foreach (range(1, 10) as $attempt) {
            $this->post('/pesanan', $this->payload(['items' => [['product_id' => $product->id, 'quantity' => 1]]]));
        }

        $this->withHeader('X-Inertia', 'true')
            ->post('/pesanan', $this->payload(['items' => [['product_id' => $product->id, 'quantity' => 1]]]))
            ->assertRedirect()
            ->assertSessionHasErrors('order');

        $this->assertSame(10, Order::query()->count());
    }

    public function test_missing_pages_use_the_designed_error_page_in_production(): void
    {
        config(['app.debug' => false]);

        $this->get('/pesanan/tiada-pesanan-ini')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page->component('ErrorPage')->where('status', 404));
    }

    public function test_guests_are_sent_to_the_login_page(): void
    {
        auth('customer')->logout();
        session()->flush();

        $this->get('/')->assertRedirect('/log-masuk');
        $this->get('/pesan')->assertRedirect('/log-masuk');
        $this->get('/pesanan-saya')->assertRedirect('/log-masuk');
    }
}
