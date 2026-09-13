<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_active_admin(): void
    {
        $this->artisan('app:create-admin', ['--email' => 'pemilik@example.com'])
            ->expectsQuestion('Nama', 'Pemilik Kedai')
            ->expectsQuestion('Kata laluan', 'kata-laluan-99')
            ->expectsQuestion('Sahkan kata laluan', 'kata-laluan-99')
            ->assertSuccessful();

        $admin = User::query()->where('email', 'pemilik@example.com')->sole();
        $this->assertTrue($admin->canAccessPanel());
        $this->assertTrue($admin->hasAdminRole());
        $this->assertTrue(Hash::check('kata-laluan-99', $admin->password));
    }

    public function test_it_recovers_a_locked_out_account(): void
    {
        $user = User::factory()->chef()->inactive()->create(['email' => 'pemilik@example.com']);

        $this->artisan('app:create-admin', ['--email' => 'pemilik@example.com'])
            ->expectsConfirmation('Akaun pemilik@example.com sudah wujud. Tetapkan semula kata laluannya dan jadikan admin aktif?', 'yes')
            ->expectsQuestion('Kata laluan', 'kata-laluan-baharu-99')
            ->expectsQuestion('Sahkan kata laluan', 'kata-laluan-baharu-99')
            ->assertSuccessful();

        $user->refresh();
        $this->assertTrue($user->canAccessPanel());
        $this->assertSame(StaffRole::Admin, $user->role);
        $this->assertTrue(Hash::check('kata-laluan-baharu-99', $user->password));
    }

    public function test_it_rejects_a_mismatched_confirmation(): void
    {
        $this->artisan('app:create-admin', ['--email' => 'pemilik@example.com'])
            ->expectsQuestion('Nama', 'Pemilik Kedai')
            ->expectsQuestion('Kata laluan', 'kata-laluan-99')
            ->expectsQuestion('Sahkan kata laluan', 'lain-sekali-99')
            ->assertFailed();

        $this->assertDatabaseMissing('users', ['email' => 'pemilik@example.com']);
    }

    public function test_the_demo_seeder_refuses_to_run_in_production(): void
    {
        $this->app['env'] = 'production';

        $this->expectException(RuntimeException::class);

        $this->app->make(DatabaseSeeder::class)->run();
    }
}
