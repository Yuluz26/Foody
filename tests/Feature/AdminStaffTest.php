<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminStaffTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create(['name' => 'Zaid Pentadbir']);
    }

    public function test_admin_can_see_the_staff_list(): void
    {
        User::factory()->chef()->create(['name' => 'Aina']);

        $this->actingAs($this->admin, 'web')
            ->get('/admin/staff')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('staff', 2)->where('staff.0.name', 'Aina')->where('staff.0.role', 'chef'));
    }

    public function test_a_new_account_gets_the_chosen_role_and_stays_inactive_until_approved(): void
    {
        $this->actingAs($this->admin, 'web')
            ->post('/admin/staff', [
                'name' => 'Aina Kasih',
                'email' => 'aina@example.com',
                'role' => 'chef',
                'password' => 'kata-laluan-99',
                'password_confirmation' => 'kata-laluan-99',
            ])
            ->assertRedirect('/admin/staff');

        $staff = User::query()->where('email', 'aina@example.com')->sole();
        $this->assertTrue($staff->is_admin);
        $this->assertSame(StaffRole::Chef, $staff->role);
        $this->assertFalse($staff->isApproved());

        $this->post('/admin/logout');

        $this->post('/admin/login', ['email' => 'aina@example.com', 'password' => 'kata-laluan-99'])
            ->assertSessionHasErrors('email');
        $this->assertGuest('web');
    }

    public function test_approving_an_account_lets_it_log_in(): void
    {
        $staff = User::factory()->chef()->inactive()->create(['password' => 'kata-laluan-99']);

        $this->actingAs($this->admin, 'web')->patch("/admin/staff/{$staff->id}/approve")->assertSessionHas('success');
        $this->assertTrue($staff->fresh()->isApproved());

        $this->post('/admin/logout');

        $this->post('/admin/login', ['email' => $staff->email, 'password' => 'kata-laluan-99'])->assertRedirect('/admin');
        $this->assertAuthenticatedAs($staff->fresh(), 'web');
    }

    public function test_admin_can_bulk_approve_inactive_accounts(): void
    {
        $one = User::factory()->chef()->inactive()->create();
        $two = User::factory()->chef()->inactive()->create();

        $this->actingAs($this->admin, 'web')
            ->post('/admin/staff/bulk', ['ids' => [$one->id, $two->id], 'action' => 'approve'])
            ->assertSessionHas('success');

        $this->assertTrue($one->fresh()->isApproved());
        $this->assertTrue($two->fresh()->isApproved());
    }

    public function test_admin_can_edit_another_accounts_details_and_role(): void
    {
        $staff = User::factory()->chef()->create(['name' => 'Nama Lama']);

        $this->actingAs($this->admin, 'web')
            ->put("/admin/staff/{$staff->id}", [
                'name' => 'Nama Baharu',
                'email' => $staff->email,
                'role' => 'admin',
                'password' => '',
                'password_confirmation' => '',
            ])
            ->assertRedirect('/admin/staff');

        $staff->refresh();
        $this->assertSame('Nama Baharu', $staff->name);
        $this->assertSame(StaffRole::Admin, $staff->role);
    }

    public function test_admin_cannot_change_their_own_role(): void
    {
        $this->actingAs($this->admin, 'web')
            ->put("/admin/staff/{$this->admin->id}", [
                'name' => $this->admin->name,
                'email' => $this->admin->email,
                'role' => 'chef',
            ])
            ->assertSessionHasErrors('role');

        $this->assertSame(StaffRole::Admin, $this->admin->fresh()->role);
    }

    public function test_changing_your_own_password_from_the_staff_form_keeps_you_signed_in(): void
    {
        $admin = User::factory()->admin()->create(['password' => 'kata-laluan-lama']);
        $this->post('/admin/login', ['email' => $admin->email, 'password' => 'kata-laluan-lama']);

        $this->put("/admin/staff/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'admin',
            'password' => 'kata-laluan-baharu-99',
            'password_confirmation' => 'kata-laluan-baharu-99',
        ])->assertRedirect('/admin/staff');

        // Reload the user from the database, as a real next request would.
        $this->app['auth']->guard('web')->forgetUser();

        $this->get('/admin/staff')->assertOk();
    }

    public function test_admin_can_delete_another_account(): void
    {
        $staff = User::factory()->chef()->create();

        $this->actingAs($this->admin, 'web')->delete("/admin/staff/{$staff->id}")->assertRedirect('/admin/staff');

        $this->assertModelMissing($staff);
    }

    public function test_admin_cannot_delete_or_suspend_their_own_account(): void
    {
        $this->actingAs($this->admin, 'web')->delete("/admin/staff/{$this->admin->id}")->assertSessionHas('error');
        $this->actingAs($this->admin, 'web')->patch("/admin/staff/{$this->admin->id}/revoke")->assertSessionHas('error');

        $this->assertModelExists($this->admin);
        $this->assertTrue($this->admin->fresh()->isApproved());
    }

    public function test_suspending_an_account_ends_its_access_immediately(): void
    {
        $staff = User::factory()->chef()->create(['remember_token' => 'token-lama']);

        $this->actingAs($this->admin, 'web')->patch("/admin/staff/{$staff->id}/revoke")->assertSessionHas('success');

        $staff->refresh();
        $this->assertFalse($staff->isApproved());
        $this->assertNotSame('token-lama', $staff->getRememberToken());

        $this->actingAs($staff, 'web')->get('/admin')
            ->assertRedirect('/admin/login')
            ->assertSessionHasErrors(['email' => 'Akaun anda tidak aktif. Sila hubungi admin kedai.']);
        $this->assertGuest('web');
    }

    public function test_bulk_suspend_and_delete_skip_the_acting_admin(): void
    {
        $other = User::factory()->chef()->create();
        $another = User::factory()->chef()->create();

        $this->actingAs($this->admin, 'web')->post('/admin/staff/bulk', ['ids' => [$this->admin->id, $other->id], 'action' => 'revoke']);
        $this->assertTrue($this->admin->fresh()->isApproved());
        $this->assertFalse($other->fresh()->isApproved());

        $this->actingAs($this->admin, 'web')->post('/admin/staff/bulk', ['ids' => [$this->admin->id, $another->id], 'action' => 'delete']);
        $this->assertModelExists($this->admin);
        $this->assertModelMissing($another);
    }

    public function test_the_last_active_admin_survives_even_if_the_acting_admin_was_demoted_mid_request(): void
    {
        $lastAdmin = User::factory()->admin()->create();
        User::query()->whereKey($this->admin->id)->update(['role' => 'chef']);

        $this->actingAs($this->admin, 'web')->delete("/admin/staff/{$lastAdmin->id}")->assertSessionHas('error');
        $this->actingAs($this->admin, 'web')->patch("/admin/staff/{$lastAdmin->id}/revoke")->assertSessionHas('error');
        $this->actingAs($this->admin, 'web')->post('/admin/staff/bulk', ['ids' => [$lastAdmin->id], 'action' => 'delete'])->assertSessionHas('error');

        $this->assertModelExists($lastAdmin);
        $this->assertTrue($lastAdmin->fresh()->isApproved());
    }

    public function test_chef_role_and_guests_cannot_manage_accounts(): void
    {
        $this->get('/admin/staff')->assertRedirect('/admin/login');

        $staff = User::factory()->chef()->create();
        $this->actingAs($staff, 'web')->get('/admin/staff')->assertForbidden();
        $this->actingAs($staff, 'web')->post('/admin/staff/bulk', ['ids' => [$this->admin->id], 'action' => 'delete'])->assertForbidden();

        $this->assertModelExists($this->admin);
    }
}
