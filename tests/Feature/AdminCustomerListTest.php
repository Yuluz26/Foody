<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCustomerListTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_search_customers_by_name_or_phone_digits(): void
    {
        $admin = User::factory()->admin()->create();
        Customer::factory()->create(['name' => 'Aisyah Rahman', 'phone' => '0123456789']);
        Customer::factory()->create(['name' => 'Hafiz Nordin', 'phone' => '0198765432']);

        $this->actingAs($admin, 'web')
            ->get('/admin/customers?q=aisyah')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Customers/Index')
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Aisyah Rahman'));

        $this->actingAs($admin, 'web')
            ->get('/admin/customers?q=019-876')
            ->assertInertia(fn ($page) => $page
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Hafiz Nordin'));
    }
}
