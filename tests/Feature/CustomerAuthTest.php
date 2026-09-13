<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_guest_can_register_and_is_logged_in(): void
    {
        $this->post('/daftar', [
            'name' => 'Aina Batrisyia',
            'email' => 'aina@example.com',
            'phone' => '012-345 6789',
            'password' => 'kata-laluan-99',
            'password_confirmation' => 'kata-laluan-99',
        ])->assertRedirect('/');

        $customer = Customer::query()->where('email', 'aina@example.com')->sole();
        $this->assertSame('Aina Batrisyia', $customer->name);
        $this->assertSame('0123456789', $customer->phone);
        $this->assertTrue(Hash::check('kata-laluan-99', $customer->password));
        $this->assertAuthenticatedAs($customer, 'customer');
    }

    public function test_registration_rejects_a_duplicate_email(): void
    {
        Customer::factory()->create(['email' => 'aina@example.com']);

        $this->post('/daftar', [
            'name' => 'Aina Lagi',
            'email' => 'aina@example.com',
            'phone' => '012-345 6789',
            'password' => 'kata-laluan-99',
            'password_confirmation' => 'kata-laluan-99',
        ])->assertSessionHasErrors('email');

        $this->assertSame(1, Customer::query()->where('email', 'aina@example.com')->count());
    }

    public function test_a_customer_can_log_in_and_out(): void
    {
        $customer = Customer::factory()->create(['email' => 'aina@example.com', 'password' => 'rahsia-99']);

        $this->post('/log-masuk', ['email' => 'aina@example.com', 'password' => 'rahsia-99'])
            ->assertRedirect('/');
        $this->assertAuthenticatedAs($customer, 'customer');

        $this->post('/log-keluar')->assertRedirect('/log-masuk');
        $this->assertGuest('customer');
    }

    public function test_wrong_password_is_rejected(): void
    {
        Customer::factory()->create(['email' => 'aina@example.com', 'password' => 'rahsia-99']);

        $this->post('/log-masuk', ['email' => 'aina@example.com', 'password' => 'salah'])
            ->assertSessionHasErrors('email');
        $this->assertGuest('customer');
    }

    public function test_login_is_rate_limited(): void
    {
        Customer::factory()->create(['email' => 'aina@example.com', 'password' => 'rahsia-99']);

        foreach (range(1, 5) as $attempt) {
            $this->post('/log-masuk', ['email' => 'aina@example.com', 'password' => "salah-{$attempt}"]);
        }

        $this->post('/log-masuk', ['email' => 'aina@example.com', 'password' => 'rahsia-99'])
            ->assertSessionHasErrors('email');
        $this->assertGuest('customer');
    }

    public function test_guests_are_sent_to_the_login_page(): void
    {
        $this->get('/')->assertRedirect('/log-masuk');
        $this->get('/pesan')->assertRedirect('/log-masuk');
        $this->get('/pesanan-saya')->assertRedirect('/log-masuk');
    }

    public function test_an_admin_session_alone_is_still_a_guest_on_the_customer_guard(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->get('/')->assertRedirect('/log-masuk');
    }

    public function test_a_customer_session_alone_is_still_a_guest_on_the_admin_guard(): void
    {
        $customer = Customer::factory()->create();

        $this->actingAs($customer, 'customer')->get('/admin')->assertRedirect('/admin/login');
    }
}
