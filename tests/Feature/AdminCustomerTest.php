<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminCustomerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
    }

    public function test_admin_can_see_the_customer_list_with_order_counts(): void
    {
        $customer = Customer::factory()->create(['name' => 'Aina']);
        $this->createOrderFor($customer);
        $this->createOrderFor($customer);

        $this->actingAs($this->admin, 'web')
            ->get('/admin/customers')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('customers.data', 1)->where('customers.data.0.name', 'Aina')->where('customers.data.0.ordersCount', 2));
    }

    public function test_a_customer_can_be_added_without_login_credentials(): void
    {
        $this->actingAs($this->admin, 'web')
            ->post('/admin/customers', [
                'name' => 'Aina Kasih',
                'phone' => '012-345 6789',
                'email' => '',
                'password' => '',
                'password_confirmation' => '',
            ])
            ->assertRedirect('/admin/customers')
            ->assertSessionHasNoErrors();

        $customer = Customer::query()->where('name', 'Aina Kasih')->sole();
        $this->assertSame('0123456789', $customer->phone);
        $this->assertNull($customer->email);
        $this->assertNull($customer->password);
    }

    public function test_a_customer_added_with_credentials_can_then_log_in(): void
    {
        $this->actingAs($this->admin, 'web')
            ->post('/admin/customers', [
                'name' => 'Aina Kasih',
                'phone' => '012-345 6789',
                'email' => 'aina@example.com',
                'password' => 'kata-laluan-99',
                'password_confirmation' => 'kata-laluan-99',
            ])
            ->assertSessionHasNoErrors();

        $this->post('/log-masuk', ['email' => 'aina@example.com', 'password' => 'kata-laluan-99'])->assertRedirect('/');
        $this->assertAuthenticated('customer');
    }

    public function test_email_must_be_unique_among_customers(): void
    {
        Customer::factory()->create(['email' => 'taken@example.com']);

        $this->actingAs($this->admin, 'web')
            ->post('/admin/customers', [
                'name' => 'Aina',
                'phone' => '012-345 6789',
                'email' => 'taken@example.com',
            ])
            ->assertSessionHasErrors('email');

        $this->assertSame(1, Customer::query()->where('email', 'taken@example.com')->count());
    }

    public function test_admin_can_edit_a_customers_details(): void
    {
        $customer = Customer::factory()->create(['name' => 'Nama Lama']);

        $this->actingAs($this->admin, 'web')
            ->put("/admin/customers/{$customer->id}", [
                'name' => 'Nama Baharu',
                'phone' => '019-887 6655',
                'email' => $customer->email,
            ])
            ->assertRedirect('/admin/customers');

        $customer->refresh();
        $this->assertSame('Nama Baharu', $customer->name);
        $this->assertSame('0198876655', $customer->phone);
    }

    public function test_editing_a_customer_keeps_the_existing_password_when_left_blank(): void
    {
        $customer = Customer::factory()->create(['email' => 'aina@example.com', 'password' => 'kata-laluan-lama']);

        $this->actingAs($this->admin, 'web')
            ->put("/admin/customers/{$customer->id}", [
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'password' => '',
                'password_confirmation' => '',
            ])
            ->assertSessionHasNoErrors();

        $this->post('/log-masuk', ['email' => 'aina@example.com', 'password' => 'kata-laluan-lama'])->assertRedirect('/');
        $this->assertAuthenticated('customer');
    }

    public function test_admin_can_delete_a_customer_and_their_order_history_survives(): void
    {
        $customer = Customer::factory()->create();
        $order = $this->createOrderFor($customer);

        $this->actingAs($this->admin, 'web')->delete("/admin/customers/{$customer->id}")->assertRedirect('/admin/customers');

        $this->assertModelMissing($customer);
        $this->assertModelExists($order);
        $this->assertNull($order->fresh()->customer_id);
        $this->assertSame($order->customer_name, $order->fresh()->customer_name);
    }

    public function test_admin_can_bulk_delete_customers(): void
    {
        $one = Customer::factory()->create();
        $two = Customer::factory()->create();
        $three = Customer::factory()->create();

        $this->actingAs($this->admin, 'web')
            ->post('/admin/customers/bulk', ['ids' => [$one->id, $two->id], 'action' => 'delete'])
            ->assertSessionHas('success');

        $this->assertModelMissing($one);
        $this->assertModelMissing($two);
        $this->assertModelExists($three);
    }

    public function test_chef_role_and_guests_cannot_manage_customers(): void
    {
        $chef = User::factory()->chef()->create();
        $customer = Customer::factory()->create();

        $this->get('/admin/customers')->assertRedirect('/admin/login');

        $this->actingAs($chef, 'web')->get('/admin/customers')->assertForbidden();
        $this->actingAs($chef, 'web')->get('/admin/customers/create')->assertForbidden();
        $this->actingAs($chef, 'web')->post('/admin/customers', ['name' => 'X', 'phone' => '0123456789'])->assertForbidden();
        $this->actingAs($chef, 'web')->delete("/admin/customers/{$customer->id}")->assertForbidden();
        $this->actingAs($chef, 'web')->post('/admin/customers/bulk', ['ids' => [$customer->id], 'action' => 'delete'])->assertForbidden();

        $this->assertModelExists($customer);
    }

    /** A minimal valid order, direct via Eloquent — these tests only care about the customer link, not checkout. */
    private function createOrderFor(Customer $customer): Order
    {
        return Order::query()->create([
            'order_number' => 'FD'.Str::random(8),
            'idempotency_key' => (string) Str::uuid(),
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone,
            'type' => 'takeaway',
            'status' => 'completed',
            'subtotal' => 1000,
            'total' => 1000,
            'payment_method' => 'cashier',
            'payment_status' => 'paid',
        ]);
    }
}
