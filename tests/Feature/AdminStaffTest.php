<?php

namespace Tests\Feature;

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

        $this->admin = User::factory()->create(['is_admin' => true, 'approved_at' => now()]);
    }

    public function test_admin_can_see_the_staff_list(): void
    {
        User::factory()->create(['is_admin' => true, 'approved_at' => now(), 'name' => 'Aina']);

        $this->actingAs($this->admin)
            ->get('/admin/staff')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('staff', 2));
    }

    public function test_a_new_staff_account_starts_pending_and_cannot_log_in(): void
    {
        $this->actingAs($this->admin)
            ->post('/admin/staff', [
                'name' => 'Aina Kasih',
                'email' => 'aina@example.com',
                'password' => 'kata-laluan-99',
                'password_confirmation' => 'kata-laluan-99',
            ])
            ->assertRedirect('/admin/staff');

        $staff = User::query()->where('email', 'aina@example.com')->sole();
        $this->assertTrue($staff->is_admin);
        $this->assertFalse($staff->isApproved());

        $this->post('/admin/logout');

        $this->post('/admin/login', ['email' => $staff->email, 'password' => 'kata-laluan-99'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_admin_can_approve_a_pending_staff_account_individually(): void
    {
        $staff = User::factory()->create(['is_admin' => true, 'approved_at' => null, 'password' => 'kata-laluan-99']);

        $this->actingAs($this->admin)->patch("/admin/staff/{$staff->id}/approve")->assertRedirect();

        $this->assertTrue($staff->fresh()->isApproved());

        $this->post('/admin/logout');

        $this->post('/admin/login', ['email' => $staff->email, 'password' => 'kata-laluan-99'])
            ->assertRedirect('/admin');
        $this->assertAuthenticatedAs($staff->fresh());
    }

    public function test_admin_can_bulk_approve_pending_staff(): void
    {
        $pendingOne = User::factory()->create(['is_admin' => true, 'approved_at' => null]);
        $pendingTwo = User::factory()->create(['is_admin' => true, 'approved_at' => null]);

        $this->actingAs($this->admin)
            ->post('/admin/staff/bulk', ['ids' => [$pendingOne->id, $pendingTwo->id], 'action' => 'approve'])
            ->assertRedirect();

        $this->assertTrue($pendingOne->fresh()->isApproved());
        $this->assertTrue($pendingTwo->fresh()->isApproved());
    }

    public function test_admin_can_edit_another_staff_members_details(): void
    {
        $staff = User::factory()->create(['is_admin' => true, 'approved_at' => now(), 'name' => 'Old Name']);

        $this->actingAs($this->admin)
            ->put("/admin/staff/{$staff->id}", [
                'name' => 'New Name',
                'email' => $staff->email,
                'password' => '',
                'password_confirmation' => '',
            ])
            ->assertRedirect('/admin/staff');

        $this->assertSame('New Name', $staff->fresh()->name);
    }

    public function test_admin_can_delete_another_staff_member(): void
    {
        $staff = User::factory()->create(['is_admin' => true, 'approved_at' => now()]);

        $this->actingAs($this->admin)->delete("/admin/staff/{$staff->id}")->assertRedirect('/admin/staff');

        $this->assertModelMissing($staff);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $this->actingAs($this->admin)->delete("/admin/staff/{$this->admin->id}")->assertRedirect();

        $this->assertModelExists($this->admin);
    }

    public function test_the_last_approved_admin_cannot_be_deleted(): void
    {
        // Two approved admins exist here, so $actor deleting $this->admin is not deleting the
        // last one — that leaves $actor as the sole approved account to exercise the guard on.
        $actor = User::factory()->create(['is_admin' => true, 'approved_at' => now()]);

        $this->actingAs($actor)->delete("/admin/staff/{$this->admin->id}")->assertRedirect('/admin/staff');
        $this->assertModelMissing($this->admin);

        $pendingActor = User::factory()->create(['is_admin' => true, 'approved_at' => null]);
        $this->actingAs($pendingActor)->delete("/admin/staff/{$actor->id}")->assertRedirect();

        $this->assertModelExists($actor);
    }

    public function test_bulk_delete_respects_the_self_and_last_admin_guards(): void
    {
        $other = User::factory()->create(['is_admin' => true, 'approved_at' => now()]);

        $this->actingAs($this->admin)
            ->post('/admin/staff/bulk', ['ids' => [$this->admin->id, $other->id], 'action' => 'delete'])
            ->assertRedirect();

        $this->assertModelExists($this->admin);
        $this->assertModelMissing($other);
    }

    public function test_guests_and_non_admins_cannot_access_staff_routes(): void
    {
        $this->get('/admin/staff')->assertRedirect('/admin/login');

        $this->actingAs(User::factory()->create())
            ->get('/admin/staff')
            ->assertForbidden();
    }
}
