<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Models\Category;
use App\Support\AdminPresenter;
use App\Support\ImageUpload;
use App\Support\Slug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Categories/Index', [
            'categories' => Category::query()->withCount('products')->ordered()->get()->map(AdminPresenter::category(...)),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Categories/Form', ['category' => null]);
    }

    public function store(CategoryRequest $request): RedirectResponse
    {
        $category = Category::query()->create([
            'name' => $request->validated('name'),
            'slug' => Slug::unique(Category::class, $request->validated('name')),
            'description' => $request->validated('description'),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => (int) Category::query()->max('sort_order') + 1,
            'image' => ImageUpload::replace($request->file('image'), null, false, 'categories'),
        ]);

        return to_route('admin.categories.index')->with('success', "Kategori {$category->name} ditambah.");
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('Admin/Categories/Form', ['category' => AdminPresenter::category($category)]);
    }

    public function update(CategoryRequest $request, Category $category): RedirectResponse
    {
        $category->update([
            'name' => $request->validated('name'),
            'slug' => $category->name === $request->validated('name')
                ? $category->slug
                : Slug::unique(Category::class, $request->validated('name'), $category->id),
            'description' => $request->validated('description'),
            'is_active' => $request->boolean('is_active'),
            'image' => ImageUpload::replace($request->file('image'), $category->image, $request->boolean('remove_image'), 'categories'),
        ]);

        return to_route('admin.categories.index')->with('success', "Kategori {$category->name} dikemas kini.");
    }

    public function destroy(Category $category): RedirectResponse
    {
        $count = $category->products()->count();

        if ($count > 0) {
            return back()->with('error', "Kategori {$category->name} masih ada {$count} produk. Pindahkan atau padam produk dahulu.");
        }

        ImageUpload::delete($category->image);
        $category->delete();

        return to_route('admin.categories.index')->with('success', "Kategori {$category->name} dipadam.");
    }

    public function toggle(Category $category): RedirectResponse
    {
        $category->update(['is_active' => ! $category->is_active]);

        return back()->with('success', $category->is_active
            ? "Kategori {$category->name} dipaparkan kepada pelanggan."
            : "Kategori {$category->name} disembunyikan daripada pelanggan.");
    }

    public function reorder(Request $request): RedirectResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'distinct', 'exists:categories,id'],
        ])['ids'];

        DB::transaction(function () use ($ids) {
            foreach (array_values($ids) as $index => $id) {
                Category::query()->whereKey($id)->update(['sort_order' => $index + 1]);
            }
        });

        return back()->with('success', 'Susunan kategori disimpan.');
    }
}
