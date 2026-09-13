<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_sent_to_the_login_page(): void
    {
        foreach (['/admin', '/admin/orders', '/admin/products', '/admin/categories', '/admin/customers', '/admin/settings'] as $url) {
            $this->get($url)->assertRedirect('/admin/login');
        }

        $this->patch('/admin/orders/1/status', ['status' => 'ready'])->assertRedirect('/admin/login');
    }

    public function test_non_admin_accounts_are_forbidden(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/admin')
            ->assertForbidden();
    }

    public function test_admin_can_log_in_and_out(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'approved_at' => now(), 'password' => 'rahsia-kedai-99']);

        $this->post('/admin/login', ['email' => $admin->email, 'password' => 'rahsia-kedai-99'])
            ->assertRedirect('/admin');
        $this->assertAuthenticatedAs($admin);

        $this->get('/admin')->assertOk();

        $this->post('/admin/logout')->assertRedirect('/admin/login');
        $this->assertGuest();
    }

    public function test_wrong_password_is_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->post('/admin/login', ['email' => $admin->email, 'password' => 'salah'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_non_admin_accounts_cannot_log_in_to_the_panel(): void
    {
        $user = User::factory()->create(['password' => 'kata-laluan-99']);

        $this->post('/admin/login', ['email' => $user->email, 'password' => 'kata-laluan-99'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_login_is_rate_limited(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        foreach (range(1, 5) as $attempt) {
            $this->post('/admin/login', ['email' => $admin->email, 'password' => "salah-{$attempt}"]);
        }

        $this->post('/admin/login', ['email' => $admin->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();
    }
}
