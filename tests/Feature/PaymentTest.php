<?php

namespace Tests\Feature;

use App\Enums\OrderType;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private Customer $customer;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->customer = Customer::factory()->create();
        $this->admin = User::factory()->create(['is_admin' => true]);
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
            'items' => [],
        ], $overrides);
    }

    public function test_cashier_orders_need_no_proof_and_start_unpaid(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->customer, 'customer')
            ->post('/pesanan', $this->payload([
                'payment_method' => 'cashier',
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ]))
            ->assertSessionHasNoErrors();

        $order = Order::query()->sole();
        $this->assertSame('cashier', $order->payment_method->value);
        $this->assertSame('unpaid', $order->payment_status->value);
        $this->assertNull($order->payment_proof);
    }

    public function test_qr_orders_without_proof_fail_validation(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->customer, 'customer')
            ->post('/pesanan', $this->payload([
                'payment_method' => 'qr',
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ]))
            ->assertSessionHasErrors('payment_proof');

        $this->assertSame(0, Order::query()->count());
    }

    public function test_qr_orders_with_proof_store_the_file_and_await_verification(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->customer, 'customer')
            ->post('/pesanan', $this->payload([
                'payment_method' => 'qr',
                'payment_proof' => UploadedFile::fake()->image('bukti.jpg'),
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ]))
            ->assertSessionHasNoErrors();

        $order = Order::query()->sole();
        $this->assertSame('qr', $order->payment_method->value);
        $this->assertSame('pending_verification', $order->payment_status->value);
        $this->assertNotNull($order->payment_proof);
        Storage::disk('public')->assertExists($order->payment_proof);
    }

    public function test_admin_can_confirm_payment(): void
    {
        $product = Product::factory()->create();
        $this->actingAs($this->customer, 'customer')->post('/pesanan', $this->payload([
            'payment_method' => 'qr',
            'payment_proof' => UploadedFile::fake()->image('bukti.jpg'),
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]));
        $order = Order::query()->sole();

        $this->actingAs($this->admin, 'web')
            ->patch("/admin/orders/{$order->id}/payment")
            ->assertRedirect();

        $this->assertSame('paid', $order->fresh()->payment_status->value);
    }

    public function test_confirming_an_already_paid_order_is_rejected(): void
    {
        $product = Product::factory()->create();
        $this->actingAs($this->customer, 'customer')->post('/pesanan', $this->payload([
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]));
        $order = Order::query()->sole();

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}/payment")->assertRedirect();
        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}/payment")->assertStatus(422);
    }

    public function test_admin_can_upload_a_payment_qr_code_and_instructions(): void
    {
        $this->actingAs($this->admin, 'web')->put('/admin/settings', [
            'name' => 'Foody',
            'currency' => 'MYR',
            'ordering_enabled' => '1',
            'dine_in_enabled' => '1',
            'takeaway_enabled' => '1',
            'qr_code' => UploadedFile::fake()->image('qr.jpg'),
            'payment_instructions' => 'Sila sertakan nombor pesanan sebagai rujukan.',
        ])->assertSessionHasNoErrors();

        $settings = RestaurantSetting::current();
        $this->assertNotNull($settings->qr_code);
        Storage::disk('public')->assertExists($settings->qr_code);
        $this->assertSame('Sila sertakan nombor pesanan sebagai rujukan.', $settings->payment_instructions);

        $checkout = $this->actingAs($this->customer, 'customer')->get('/pesan');
        $checkout->assertInertia(fn ($page) => $page->where('restaurant.qrCodeUrl', $settings->qr_code_url));
    }

    public function test_admin_can_remove_the_payment_qr_code(): void
    {
        RestaurantSetting::current()->update(['qr_code' => 'branding/existing-qr.png']);
        Storage::disk('public')->put('branding/existing-qr.png', 'fake');

        $this->actingAs($this->admin, 'web')->put('/admin/settings', [
            'name' => 'Foody',
            'currency' => 'MYR',
            'ordering_enabled' => '1',
            'dine_in_enabled' => '1',
            'takeaway_enabled' => '1',
            'remove_qr_code' => '1',
        ])->assertSessionHasNoErrors();

        $this->assertNull(RestaurantSetting::current()->qr_code);
        Storage::disk('public')->assertMissing('branding/existing-qr.png');
    }
}
