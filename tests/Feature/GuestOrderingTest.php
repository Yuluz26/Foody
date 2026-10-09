<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Mail\OrderCancelledStaffMail;
use App\Mail\OrderPlacedCustomerMail;
use App\Mail\OrderPlacedStaffMail;
use App\Mail\OrderStatusUpdatedMail;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Ordering without an account: logging in or registering is optional, never a step in the way. */
class GuestOrderingTest extends TestCase
{
    use RefreshDatabase;

    /** @param array<string, mixed> $overrides */
    private function payload(Product $product, array $overrides = []): array
    {
        return array_merge([
            'idempotency_key' => (string) Str::uuid(),
            'type' => OrderType::Takeaway->value,
            'customer_name' => 'Aisyah Rahman',
            'customer_phone' => '012-345 6789',
            'notes' => null,
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ], $overrides);
    }

    private function placeGuestOrder(): Order
    {
        $this->post('/pesanan', $this->payload(Product::factory()->create(['price' => 1000])));

        return Order::query()->sole();
    }

    public function test_a_guest_can_open_the_menu_and_checkout_without_an_account(): void
    {
        Product::factory()->create();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Customer/Menu')->where('customerAuth.user', null));

        $this->get('/pesan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Customer/Checkout'));
    }

    public function test_a_guest_can_place_an_order_with_just_a_name_and_phone(): void
    {
        $product = Product::factory()->create(['price' => 1000]);

        $response = $this->post('/pesanan', $this->payload($product));

        $order = Order::query()->sole();
        $response->assertRedirect(route('orders.show', $order))->assertSessionHasNoErrors();
        $this->assertNull($order->customer_id);
        $this->assertSame('Aisyah Rahman', $order->customer_name);
        $this->assertSame('0123456789', $order->customer_phone);
        $this->assertSame(OrderStatus::Pending, $order->status);
        $this->assertSame(2000, $order->total);
        $this->assertSame(0, Customer::query()->count());
    }

    public function test_a_guest_still_has_to_say_who_the_order_is_for(): void
    {
        $product = Product::factory()->create();

        $this->post('/pesanan', $this->payload($product, ['customer_name' => '', 'customer_phone' => '']))
            ->assertSessionHasErrors(['customer_name', 'customer_phone']);

        $this->assertSame(0, Order::query()->count());
    }

    public function test_a_guest_lands_on_their_order_and_can_come_back_with_the_link(): void
    {
        $order = $this->placeGuestOrder();

        $this->get("/pesanan/{$order->public_id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Customer/OrderStatus')
                ->where('order.number', $order->order_number)
                ->where('justPlaced', true));

        // A new visit with only the link — no session left from placing the order.
        $this->flushSession();

        $this->get("/pesanan/{$order->public_id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('order.number', $order->order_number)->where('justPlaced', false)->missing('order.customerPhone'));
    }

    public function test_a_guest_can_cancel_their_own_pending_order(): void
    {
        Mail::fake();
        $order = $this->placeGuestOrder();

        $this->patch("/pesanan/{$order->public_id}/batal")->assertSessionHas('success');

        $order->refresh();
        $this->assertSame(OrderStatus::Cancelled, $order->status);
        $this->assertTrue($order->cancelled_by_customer);
        Mail::assertQueued(OrderCancelledStaffMail::class, fn ($mail) => $mail->order->is($order));
    }

    public function test_a_guest_can_download_the_receipt(): void
    {
        $order = $this->placeGuestOrder();

        $response = $this->get("/pesanan/{$order->public_id}/resit");

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_a_guest_order_tells_the_shop_but_has_no_diner_email_to_write_to(): void
    {
        Mail::fake();
        $this->placeGuestOrder();

        Mail::assertQueued(OrderPlacedStaffMail::class);
        Mail::assertNotQueued(OrderPlacedCustomerMail::class);
    }

    public function test_diners_sharing_the_restaurant_wifi_do_not_use_up_each_others_order_limit(): void
    {
        $product = Product::factory()->create();

        // Twelve phones behind one Wi-Fi address — more orders than one phone's limit of ten.
        foreach (range(1, 12) as $phone) {
            $this->withCookie(config('session.cookie'), Str::random(40))
                ->post('/pesanan', $this->payload($product))
                ->assertSessionHasNoErrors();
        }

        $this->assertSame(12, Order::query()->count());
    }

    public function test_one_address_still_has_a_ceiling_so_a_script_cannot_flood_the_kitchen(): void
    {
        $product = Product::factory()->create();

        // A script that drops its cookie every time looks like a new phone on each request.
        foreach (range(1, 60) as $attempt) {
            $this->withCookie(config('session.cookie'), Str::random(40))->post('/pesanan', $this->payload($product));
        }

        $this->withCookie(config('session.cookie'), Str::random(40))
            ->withHeader('X-Inertia', 'true')
            ->post('/pesanan', $this->payload($product))
            ->assertSessionHasErrors('order');

        $this->assertSame(60, Order::query()->count());
    }

    public function test_staff_can_work_a_guest_order_like_any_other(): void
    {
        $order = $this->placeGuestOrder();
        $admin = User::factory()->admin()->create();
        Mail::fake();

        $this->actingAs($admin, 'web')
            ->get('/admin/orders')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('orders.data.0.customerName', 'Aisyah Rahman'));

        $this->patch("/admin/orders/{$order->id}/status", ['status' => OrderStatus::Confirmed->value])->assertSessionHasNoErrors();

        $this->assertSame(OrderStatus::Confirmed, $order->fresh()->status);
        Mail::assertNotQueued(OrderStatusUpdatedMail::class);
    }

    public function test_an_accounts_order_is_not_open_to_a_signed_out_visitor_holding_the_link(): void
    {
        $owner = Customer::factory()->create(['email' => 'aina@example.com', 'password' => 'rahsia-99']);
        $this->actingAs($owner, 'customer')->post('/pesanan', $this->payload(Product::factory()->create()));
        $order = Order::query()->sole();
        $this->assertSame($owner->id, $order->customer_id);

        auth('customer')->logout();
        $this->flushSession();

        $this->get("/pesanan/{$order->public_id}")->assertRedirect('/log-masuk');
        $this->get("/pesanan/{$order->public_id}/resit")->assertRedirect('/log-masuk');
        $this->patch("/pesanan/{$order->public_id}/batal")->assertRedirect('/log-masuk');
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);

        // Logging in from that redirect brings the owner straight back to their order.
        $this->get("/pesanan/{$order->public_id}");
        $this->post('/log-masuk', ['email' => 'aina@example.com', 'password' => 'rahsia-99'])
            ->assertRedirect(route('orders.show', $order));
    }
}
