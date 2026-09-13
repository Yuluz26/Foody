<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create(['password' => 'kata-laluan-lama']);
    }

    public function test_admin_can_view_their_own_profile(): void
    {
        $this->actingAs($this->admin, 'web')
            ->get('/admin/profile')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('profile.email', $this->admin->email));
    }

    public function test_admin_can_update_their_own_name_and_email(): void
    {
        $this->actingAs($this->admin, 'web')
            ->put('/admin/profile', ['name' => 'Nama Baharu', 'email' => 'baharu@example.com'])
            ->assertRedirect();

        $fresh = $this->admin->fresh();
        $this->assertSame('Nama Baharu', $fresh->name);
        $this->assertSame('baharu@example.com', $fresh->email);
    }

    public function test_email_uniqueness_ignores_the_current_user(): void
    {
        $this->actingAs($this->admin, 'web')
            ->put('/admin/profile', ['name' => $this->admin->name, 'email' => $this->admin->email])
            ->assertSessionDoesntHaveErrors('email');
    }

    public function test_email_must_be_unique_against_other_staff(): void
    {
        $other = User::factory()->admin()->create();

        $this->actingAs($this->admin, 'web')
            ->put('/admin/profile', ['name' => $this->admin->name, 'email' => $other->email])
            ->assertSessionHasErrors('email');
    }

    public function test_admin_can_change_their_own_password_and_stays_signed_in(): void
    {
        $this->actingAs($this->admin, 'web')
            ->put('/admin/profile/password', [
                'current_password' => 'kata-laluan-lama',
                'password' => 'kata-laluan-baharu-99',
                'password_confirmation' => 'kata-laluan-baharu-99',
            ])
            ->assertSessionHasNoErrors();

        $this->get('/admin/profile')->assertOk();

        $this->post('/admin/logout');

        $this->post('/admin/login', ['email' => $this->admin->email, 'password' => 'kata-laluan-baharu-99'])
            ->assertRedirect('/admin');
        $this->assertAuthenticatedAs($this->admin->fresh(), 'web');
    }

    public function test_wrong_current_password_is_rejected(): void
    {
        $this->actingAs($this->admin, 'web')
            ->put('/admin/profile/password', [
                'current_password' => 'salah',
                'password' => 'kata-laluan-baharu-99',
                'password_confirmation' => 'kata-laluan-baharu-99',
            ])
            ->assertSessionHasErrors('current_password');
    }

    public function test_staff_role_can_manage_their_own_profile(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff, 'web')->get('/admin/profile')->assertOk();
        $this->actingAs($staff, 'web')
            ->put('/admin/profile', ['name' => 'Staf Baharu', 'email' => $staff->email])
            ->assertSessionHasNoErrors();

        $this->assertSame('Staf Baharu', $staff->fresh()->name);
    }

    public function test_guests_cannot_access_the_profile_routes(): void
    {
        $this->get('/admin/profile')->assertRedirect('/admin/login');
    }
}
