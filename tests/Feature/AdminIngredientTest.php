<?php

namespace Tests\Feature;

use App\Actions\PlaceOrder;
use App\Enums\IngredientMovementType;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Ingredient;
use App\Models\IngredientMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\RecipeItem;
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

    /** @param  list<array{product_id: int, quantity: int}>  $items */
    private function place(array $items): Order
    {
        $this->actingAs(Customer::factory()->create(), 'customer');

        return app(PlaceOrder::class)->handle([
            'idempotency_key' => (string) Str::uuid(),
            'type' => 'takeaway',
            'customer_name' => 'Nurul',
            'customer_phone' => '0112233445',
            'payment_method' => 'cashier',
            'items' => $items,
        ]);
    }

    private function dishWithRecipe(float $rice = 0.15, float $chicken = 0.2): array
    {
        $dish = Product::factory()->create();
        $riceItem = Ingredient::factory()->create(['name' => 'Beras', 'quantity' => 10]);
        $chickenItem = Ingredient::factory()->create(['name' => 'Ayam', 'quantity' => 5]);
        RecipeItem::query()->create(['product_id' => $dish->id, 'ingredient_id' => $riceItem->id, 'quantity' => $rice]);
        RecipeItem::query()->create(['product_id' => $dish->id, 'ingredient_id' => $chickenItem->id, 'quantity' => $chicken]);

        return [$dish, $riceItem, $chickenItem];
    }

    public function test_selling_a_dish_takes_its_recipe_from_the_ingredients_and_logs_it_against_the_order(): void
    {
        [$dish, $rice, $chicken] = $this->dishWithRecipe();

        $order = $this->place([['product_id' => $dish->id, 'quantity' => 4]]);

        $this->assertSame(9.4, $rice->fresh()->quantity);
        $this->assertSame(4.2, $chicken->fresh()->quantity);
        $this->assertDatabaseHas('ingredient_movements', [
            'ingredient_id' => $rice->id,
            'order_id' => $order->id,
            'type' => IngredientMovementType::Sale->value,
            'delta' => -0.6,
        ]);
    }

    public function test_the_same_dish_on_two_lines_and_dishes_without_a_recipe_are_handled(): void
    {
        [$dish, $rice] = $this->dishWithRecipe();
        $plain = Product::factory()->create();

        $this->place([
            ['product_id' => $dish->id, 'quantity' => 1],
            ['product_id' => $dish->id, 'quantity' => 1, 'add_on_ids' => []],
            ['product_id' => $plain->id, 'quantity' => 5],
        ]);

        $this->assertSame(9.7, $rice->fresh()->quantity);
        $this->assertSame(2, IngredientMovement::query()->count());
    }

    public function test_an_order_is_never_blocked_by_ingredients_and_the_balance_shows_the_shortfall(): void
    {
        [$dish, $rice] = $this->dishWithRecipe(rice: 6);

        $this->place([['product_id' => $dish->id, 'quantity' => 2]]);

        $this->assertSame(-2.0, $rice->fresh()->quantity);
        $this->assertSame(0, $rice->fresh()->stockValue());
    }

    public function test_cancelling_gives_the_ingredients_back_exactly_once_even_after_a_shortfall(): void
    {
        [$dish, $rice, $chicken] = $this->dishWithRecipe(rice: 6);
        $order = $this->place([['product_id' => $dish->id, 'quantity' => 2]]);

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}/status", ['status' => OrderStatus::Cancelled->value])->assertSessionHasNoErrors();
        $this->assertSame(10.0, $rice->fresh()->quantity);
        $this->assertSame(5.0, $chicken->fresh()->quantity);

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}/status", ['status' => OrderStatus::Cancelled->value]);
        $this->assertSame(10.0, $rice->fresh()->quantity);
    }

    public function test_customer_cancel_and_unserved_delete_return_ingredients_but_a_served_delete_does_not(): void
    {
        [$dish, $rice] = $this->dishWithRecipe(rice: 1);
        $customerCancelled = $this->place([['product_id' => $dish->id, 'quantity' => 1]]);
        $deleted = $this->place([['product_id' => $dish->id, 'quantity' => 2]]);
        $served = $this->place([['product_id' => $dish->id, 'quantity' => 3]]);
        $this->assertSame(4.0, $rice->fresh()->quantity);

        $this->actingAs($customerCancelled->customer, 'customer')->patch("/pesanan/{$customerCancelled->public_id}/batal");
        $this->assertSame(5.0, $rice->fresh()->quantity);

        $this->actingAs($this->admin, 'web')->delete("/admin/orders/{$deleted->id}");
        $this->assertSame(7.0, $rice->fresh()->quantity);

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$served->id}/status", ['status' => OrderStatus::Completed->value]);
        $this->actingAs($this->admin, 'web')->delete("/admin/orders/{$served->id}");
        $this->assertSame(7.0, $rice->fresh()->quantity);
    }

    public function test_changing_item_quantities_changes_what_was_taken(): void
    {
        [$dish, $rice] = $this->dishWithRecipe(rice: 1);
        $order = $this->place([['product_id' => $dish->id, 'quantity' => 2]]);
        $item = $order->items()->first();

        $payload = fn (int $quantity) => [
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'type' => $order->type->value,
            'table_number' => $order->table_number,
            'notes' => $order->notes,
            'items' => [['id' => $item->id, 'quantity' => $quantity]],
        ];

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}", $payload(5))->assertSessionHasNoErrors();
        $this->assertSame(5.0, $rice->fresh()->quantity);

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}", $payload(1))->assertSessionHasNoErrors();
        $this->assertSame(9.0, $rice->fresh()->quantity);

        $this->actingAs($this->admin, 'web')->patch("/admin/orders/{$order->id}", $payload(1))->assertSessionHasNoErrors();
        $this->assertSame(9.0, $rice->fresh()->quantity, 'Saving without a change must not move stock.');
    }

    public function test_staff_cannot_record_sale_or_return_by_hand(): void
    {
        $ingredient = Ingredient::factory()->create();

        $this->adjust($this->staff, $ingredient, ['type' => 'sale', 'quantity' => '1'])->assertSessionHasErrors('type');
        $this->adjust($this->staff, $ingredient, ['type' => 'return', 'quantity' => '1'])->assertSessionHasErrors('type');
    }

    public function test_admin_saves_and_replaces_a_dishs_recipe_from_the_product_form(): void
    {
        $dish = Product::factory()->create();
        $rice = Ingredient::factory()->create(['unit_cost' => 500]);
        $oil = Ingredient::factory()->create(['unit_cost' => 800]);
        $form = fn (array $recipe) => [
            'category_id' => $dish->category_id,
            'name' => $dish->name,
            'price' => '9.00',
            'is_available' => true,
            'recipe' => $recipe,
        ];

        $this->actingAs($this->admin, 'web')->put("/admin/products/{$dish->id}", $form([
            ['ingredient_id' => $rice->id, 'quantity' => '0.15'],
            ['ingredient_id' => $oil->id, 'quantity' => '0.02'],
        ]))->assertSessionHasNoErrors();
        $this->assertSame(2, $dish->recipeItems()->count());

        $this->actingAs($this->admin, 'web')->put("/admin/products/{$dish->id}", $form([
            ['ingredient_id' => $rice->id, 'quantity' => '0.2'],
        ]))->assertSessionHasNoErrors();
        $this->assertSame([0.2], $dish->recipeItems()->pluck('quantity')->all());

        $this->actingAs($this->admin, 'web')->get("/admin/products/{$dish->id}/edit")
            ->assertInertia(fn (Assert $page) => $page
                ->where('product.recipe.0.ingredientId', $rice->id)
                ->where('product.recipe.0.quantity', 0.2)
                ->has('ingredients', 2));

        $this->actingAs($this->admin, 'web')->put("/admin/products/{$dish->id}", $form([]))->assertSessionHasNoErrors();
        $this->assertSame(0, $dish->recipeItems()->count());
    }

    public function test_recipe_input_is_validated(): void
    {
        $dish = Product::factory()->create();
        $rice = Ingredient::factory()->create();
        $put = fn (array $recipe) => $this->actingAs($this->admin, 'web')->put("/admin/products/{$dish->id}", [
            'category_id' => $dish->category_id,
            'name' => $dish->name,
            'price' => '9.00',
            'recipe' => $recipe,
        ]);

        $put([['ingredient_id' => $rice->id, 'quantity' => '0']])->assertSessionHasErrors('recipe.0.quantity');
        $put([['ingredient_id' => $rice->id, 'quantity' => 'abc']])->assertSessionHasErrors('recipe.0.quantity');
        $put([['ingredient_id' => 9999, 'quantity' => '1']])->assertSessionHasErrors('recipe.0.ingredient_id');
        $put([['ingredient_id' => $rice->id, 'quantity' => '1'], ['ingredient_id' => $rice->id, 'quantity' => '2']])->assertSessionHasErrors();
        $this->assertSame(0, $dish->recipeItems()->count());
    }

    public function test_deleting_an_ingredient_removes_it_from_recipes_and_shows_how_many_dishes_use_it(): void
    {
        [$dish, $rice] = $this->dishWithRecipe();

        $this->actingAs($this->admin, 'web')->get('/admin/ingredients')
            ->assertInertia(fn (Assert $page) => $page->where('ingredients.data.0.dishCount', 1));

        $this->actingAs($this->admin, 'web')->delete("/admin/ingredients/{$rice->id}");
        $this->assertSame(1, $dish->recipeItems()->count());
    }
}
