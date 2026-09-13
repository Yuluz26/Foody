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
use Tests\TestCase;

class OrderEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_placing_an_order_emails_the_customer_and_the_staff_mailbox(): void
    {
        Mail::fake();

        $customer = Customer::factory()->create(['email' => 'diner@example.com']);
        $product = Product::factory()->create();

        $this->actingAs($customer, 'customer')->post('/pesanan', [
            'idempotency_key' => (string) Str::uuid(),
            'type' => OrderType::Takeaway->value,
            'customer_name' => 'Aisyah Rahman',
            'customer_phone' => '012-345 6789',
            'notes' => null,
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $order = Order::query()->sole();

        Mail::assertQueued(OrderPlacedCustomerMail::class, fn ($mail) => $mail->hasTo('diner@example.com') && $mail->order->is($order));
        Mail::assertQueued(OrderPlacedStaffMail::class, fn ($mail) => $mail->hasTo(config('mail.from.address')) && $mail->order->is($order));
    }

    public function test_changing_status_emails_the_customer(): void
    {
        Mail::fake();

        $admin = User::factory()->admin()->create();
        $customer = Customer::factory()->create(['email' => 'diner@example.com']);
        $product = Product::factory()->create();

        $this->actingAs($customer, 'customer')->post('/pesanan', [
            'idempotency_key' => (string) Str::uuid(),
            'type' => OrderType::Takeaway->value,
            'customer_name' => 'Aisyah Rahman',
            'customer_phone' => '012-345 6789',
            'notes' => null,
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);
        $order = Order::query()->sole();

        Mail::fake();

        $this->actingAs($admin, 'web')->patch("/admin/orders/{$order->id}/status", ['status' => OrderStatus::Confirmed->value]);

        Mail::assertQueued(OrderStatusUpdatedMail::class, fn ($mail) => $mail->hasTo('diner@example.com') && $mail->order->is($order));
    }

    public function test_bulk_approve_emails_every_transitioned_customer(): void
    {
        $admin = User::factory()->admin()->create();
        $customerA = Customer::factory()->create(['email' => 'a@example.com']);
        $customerB = Customer::factory()->create(['email' => 'b@example.com']);
        $product = Product::factory()->create();

        $orderA = $this->placeOrderAs($customerA, $product);
        $orderB = $this->placeOrderAs($customerB, $product);

        Mail::fake();

        $this->actingAs($admin, 'web')->post('/admin/orders/bulk', ['ids' => [$orderA->id, $orderB->id], 'action' => 'approve']);

        Mail::assertQueued(OrderStatusUpdatedMail::class, 2);
        Mail::assertQueued(OrderStatusUpdatedMail::class, fn ($mail) => $mail->hasTo('a@example.com'));
        Mail::assertQueued(OrderStatusUpdatedMail::class, fn ($mail) => $mail->hasTo('b@example.com'));
    }

    public function test_a_customer_cancelling_their_own_order_notifies_the_staff_mailbox(): void
    {
        $customer = Customer::factory()->create();
        $product = Product::factory()->create();
        $order = $this->placeOrderAs($customer, $product);

        Mail::fake();

        $this->actingAs($customer, 'customer')->patch("/pesanan/{$order->public_id}/batal");

        Mail::assertQueued(OrderCancelledStaffMail::class, fn ($mail) => $mail->hasTo(config('mail.from.address')) && $mail->order->is($order));
    }

    public function test_staff_cancelling_an_order_does_not_duplicate_the_staff_notification(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = Customer::factory()->create();
        $product = Product::factory()->create();
        $order = $this->placeOrderAs($customer, $product);

        Mail::fake();

        $this->actingAs($admin, 'web')->patch("/admin/orders/{$order->id}/status", ['status' => OrderStatus::Cancelled->value]);

        Mail::assertNotQueued(OrderCancelledStaffMail::class);
    }

    private function placeOrderAs(Customer $customer, Product $product): Order
    {
        $this->actingAs($customer, 'customer')->post('/pesanan', [
            'idempotency_key' => (string) Str::uuid(),
            'type' => OrderType::Takeaway->value,
            'customer_name' => $customer->name,
            'customer_phone' => '012-345 6789',
            'notes' => null,
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        return Order::query()->where('customer_id', $customer->id)->sole();
    }
}
