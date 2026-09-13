<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Support\AdminPresenter;
use App\Support\ImageUpload;
use App\Support\Slug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'integer'],
            'availability' => ['nullable', Rule::in(['available', 'unavailable'])],
        ]);

        $products = Product::query()
            ->with(['category:id,name,sort_order', 'addOns'])
            ->when($filters['q'] ?? null, fn (Builder $query, string $term) => $query->where('name', 'like', "%{$term}%"))
            ->when($filters['category'] ?? null, fn (Builder $query, int $id) => $query->where('category_id', $id))
            ->when(($filters['availability'] ?? null) === 'available', fn (Builder $query) => $query->where('is_available', true))
            ->when(($filters['availability'] ?? null) === 'unavailable', fn (Builder $query) => $query->where('is_available', false))
            ->orderBy(Category::query()->select('sort_order')->whereColumn('categories.id', 'products.category_id'))
            ->ordered()
            ->paginate(24)
            ->withQueryString()
            ->through(AdminPresenter::product(...));

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => $this->categoryOptions(),
            'filters' => [
                'q' => $filters['q'] ?? '',
                'category' => (string) ($filters['category'] ?? ''),
                'availability' => $filters['availability'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Products/Form', [
            'product' => null,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $product = Product::query()->create([
            ...$this->attributes($request),
            'slug' => Slug::unique(Product::class, $request->validated('name')),
            'sort_order' => (int) Product::query()->where('category_id', $request->validated('category_id'))->max('sort_order') + 1,
            'image' => ImageUpload::replace($request->file('image'), null, false, 'products'),
        ]);

        $this->syncAddOns($product, $request->addOnsInSen());

        return to_route('admin.products.index')->with('success', "{$product->name} ditambah ke menu.");
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('Admin/Products/Form', [
            'product' => AdminPresenter::product($product->load(['category', 'addOns'])),
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $product->update([
            ...$this->attributes($request),
            'slug' => $product->name === $request->validated('name')
                ? $product->slug
                : Slug::unique(Product::class, $request->validated('name'), $product->id),
            'image' => ImageUpload::replace($request->file('image'), $product->image, $request->boolean('remove_image'), 'products'),
        ]);

        $this->syncAddOns($product, $request->addOnsInSen());

        return to_route('admin.products.index')->with('success', "{$product->name} dikemas kini.");
    }

    /**
     * Update existing rows in place (by id) so a cart line built from an unchanged add-on
     * keeps matching it; anything removed from the form is deleted, anything new is created.
     *
     * @param  list<array{id: int|null, name: string, price: int}>  $addOns
     */
    private function syncAddOns(Product $product, array $addOns): void
    {
        $existingIds = $product->addOns()->pluck('id');
        $keptIds = [];

        foreach ($addOns as $index => $addOn) {
            $attributes = ['name' => $addOn['name'], 'price' => $addOn['price'], 'sort_order' => $index];

            if ($addOn['id'] !== null && $existingIds->contains($addOn['id'])) {
                $product->addOns()->whereKey($addOn['id'])->update($attributes);
                $keptIds[] = $addOn['id'];
            } else {
                $keptIds[] = $product->addOns()->create($attributes)->id;
            }
        }

        $product->addOns()->whereNotIn('id', $keptIds)->delete();
    }

    public function destroy(Product $product): RedirectResponse
    {
        // Past orders keep their own copy of the name and price, so history is unaffected.
        ImageUpload::delete($product->image);
        $product->delete();

        return to_route('admin.products.index')->with('success', "{$product->name} dipadam dari menu.");
    }

    public function toggle(Product $product): RedirectResponse
    {
        $product->update(['is_available' => ! $product->is_available]);

        return back()->with('success', $product->is_available
            ? "{$product->name} kini ada dijual."
            : "{$product->name} ditanda habis.");
    }

    /** @return array<string, mixed> */
    private function attributes(ProductRequest $request): array
    {
        return [
            'category_id' => $request->validated('category_id'),
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'price' => $request->priceInSen(),
            'is_available' => $request->boolean('is_available'),
            'is_featured' => $request->boolean('is_featured'),
        ];
    }

    /** @return list<array{id: int, name: string}> */
    private function categoryOptions(): array
    {
        return Category::query()->ordered()->get(['id', 'name'])->map(fn (Category $category) => [
            'id' => $category->id,
            'name' => $category->name,
        ])->all();
    }
}
