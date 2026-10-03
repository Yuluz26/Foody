<?php

namespace Tests\Feature;

use App\Actions\PlaceOrder;
use App\Enums\IngredientMovementType;
use App\Models\Customer;
use App\Models\Ingredient;
use App\Models\IngredientMovement;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminIngredientTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
    }

    private function adjust(User $user, Ingredient $ingredient, array $data)
    {
        return $this->actingAs($user, 'web')->post("/admin/ingredients/{$ingredient->id}/adjust", $data);
    }

    public function test_admin_adds_an_ingredient_with_an_opening_balance_that_is_logged(): void
    {
        $this->actingAs($this->admin, 'web')->post('/admin/ingredients', [
            'name' => 'Beras wangi',
            'unit' => 'kg',
            'quantity' => '25.5',
            'unit_cost' => '4.80',
            'low_stock_threshold' => '5',
            'supplier' => 'Kedai Runcit Pak Din',
        ])->assertSessionHasNoErrors();

        $ingredient = Ingredient::query()->firstOrFail();
        $this->assertSame(25.5, $ingredient->quantity);
        $this->assertSame(480, $ingredient->unit_cost);
        $this->assertSame(12240, $ingredient->stockValue());
        $this->assertDatabaseHas('ingredient_movements', ['ingredient_id' => $ingredient->id, 'delta' => 25.5, 'note' => 'Baki permulaan']);
    }

    public function test_only_admins_can_create_edit_or_delete_ingredients(): void
    {
        $ingredient = Ingredient::factory()->create();
        $payload = ['name' => 'Santan', 'unit' => 'liter'];

        $this->actingAs($this->staff, 'web')->post('/admin/ingredients', $payload)->assertForbidden();
        $this->actingAs($this->staff, 'web')->put("/admin/ingredients/{$ingredient->id}", $payload)->assertForbidden();
        $this->actingAs($this->staff, 'web')->delete("/admin/ingredients/{$ingredient->id}")->assertForbidden();

        $this->actingAs($this->admin, 'web')->put("/admin/ingredients/{$ingredient->id}", [...$payload, 'unit_cost' => '7.20'])->assertSessionHasNoErrors();
        $this->assertSame(720, $ingredient->fresh()->unit_cost);

        $this->actingAs($this->admin, 'web')->delete("/admin/ingredients/{$ingredient->id}")->assertSessionHasNoErrors();
        $this->assertModelMissing($ingredient);
    }

    public function test_staff_can_restock_use_waste_and_count_ingredients(): void
    {
        $ingredient = Ingredient::factory()->create(['quantity' => 10, 'unit_cost' => 500]);

        $this->adjust($this->staff, $ingredient, ['type' => 'restock', 'quantity' => '5', 'unit_cost' => '5.50', 'note' => 'Pasar borong'])->assertSessionHasNoErrors();
        $ingredient->refresh();
        $this->assertSame(15.0, $ingredient->quantity);
        $this->assertSame(550, $ingredient->unit_cost, 'A restock price becomes the current price.');

        $this->adjust($this->staff, $ingredient, ['type' => 'usage', 'quantity' => '2.5'])->assertSessionHasNoErrors();
        $this->adjust($this->staff, $ingredient, ['type' => 'waste', 'quantity' => '0.5'])->assertSessionHasNoErrors();
        $this->assertSame(12.0, $ingredient->fresh()->quantity);

        $this->adjust($this->staff, $ingredient, ['type' => 'adjustment', 'quantity' => '9'])->assertSessionHasNoErrors();
        $this->assertSame(9.0, $ingredient->fresh()->quantity);

        $last = IngredientMovement::query()->latest('id')->first();
        $this->assertSame(IngredientMovementType::Adjustment, $last->type);
        $this->assertSame(-3.0, $last->delta);
        $this->assertSame($this->staff->id, $last->user_id);
        $this->assertSame(550, $ingredient->fresh()->unit_cost, 'Only restocks change the price.');
    }

    public function test_adjustments_are_validated(): void
    {
        $ingredient = Ingredient::factory()->create(['quantity' => 3]);

        $this->adjust($this->admin, $ingredient, ['type' => 'usage', 'quantity' => '4'])->assertSessionHasErrors('quantity');
        $this->adjust($this->admin, $ingredient, ['type' => 'restock', 'quantity' => '0'])->assertSessionHasErrors('quantity');
        $this->adjust($this->admin, $ingredient, ['type' => 'restock', 'quantity' => 'abc'])->assertSessionHasErrors('quantity');
        $this->adjust($this->admin, $ingredient, ['type' => 'sale', 'quantity' => '1'])->assertSessionHasErrors('type');
        $this->assertSame(3.0, $ingredient->fresh()->quantity);
    }

    public function test_ingredient_stock_never_touches_dish_stock_or_orders(): void
    {
        $product = Product::factory()->tracked(10)->create();
        $ingredient = Ingredient::factory()->create(['quantity' => 20]);

        $this->actingAs(Customer::factory()->create(), 'customer');
        app(PlaceOrder::class)->handle([
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'customer_name' => 'Nurul',
            'customer_phone' => '0112233445',
            'payment_method' => 'cashier',
            'items' => [['product_id' => $product->id, 'quantity' => 3]],
        ]);

        $this->assertSame(7, $product->fresh()->stock_quantity);
        $this->assertSame(20.0, $ingredient->fresh()->quantity);

        $this->adjust($this->admin, $ingredient, ['type' => 'usage', 'quantity' => '5']);
        $this->assertSame(7, $product->fresh()->stock_quantity);
    }

    public function test_the_page_lists_ingredients_needing_attention_first_and_totals_the_value(): void
    {
        Ingredient::factory()->create(['name' => 'Penuh', 'quantity' => 50, 'unit_cost' => 100, 'low_stock_threshold' => 5]);
        Ingredient::factory()->create(['name' => 'Hampir', 'quantity' => 2, 'unit_cost' => 1000, 'low_stock_threshold' => 5]);
        Ingredient::factory()->create(['name' => 'Habis', 'quantity' => 0, 'unit_cost' => 300, 'low_stock_threshold' => 5]);

        $this->actingAs($this->staff, 'web')->get('/admin/ingredients')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Ingredients/Index')
                ->where('ingredients.data.0.name', 'Habis')
                ->where('ingredients.data.1.name', 'Hampir')
                ->where('ingredients.data.2.name', 'Penuh')
                ->where('summary', ['total' => 3, 'low' => 1, 'out' => 1, 'value' => 7000]));

        $this->actingAs($this->staff, 'web')->get('/admin/ingredients?state=low')
            ->assertInertia(fn (Assert $page) => $page->has('ingredients.data', 1)->where('ingredients.data.0.name', 'Hampir'));
    }

    public function test_guests_cannot_see_the_page(): void
    {
        $this->get('/admin/ingredients')->assertRedirect();
    }
}
