<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BannerRequest;
use App\Models\Banner;
use App\Support\ImageCrop;
use App\Support\ImageUpload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BannerController extends Controller
{
    /** Every slide is cropped to this shape so the slider never wobbles between sizes. */
    public const RATIO = 16 / 7;

    public function index(): Response
    {
        return Inertia::render('Admin/Banners/Index', [
            'banners' => Banner::query()->ordered()->get()->map(fn (Banner $banner) => [
                'id' => $banner->id,
                'imageUrl' => $banner->image_url,
                'isActive' => $banner->is_active,
                'sortOrder' => $banner->sort_order,
            ]),
        ]);
    }

    public function store(BannerRequest $request): RedirectResponse
    {
        Banner::query()->create([
            'image' => ImageCrop::centerCropToRatio($request->file('image'), self::RATIO, 'banners'),
            'sort_order' => (int) Banner::query()->max('sort_order') + 1,
            'is_active' => true,
        ]);

        return back()->with('success', 'Slaid ditambah.');
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        ImageUpload::delete($banner->image);
        $banner->delete();

        return back()->with('success', 'Slaid dipadam.');
    }

    public function toggle(Banner $banner): RedirectResponse
    {
        $banner->update(['is_active' => ! $banner->is_active]);

        return back()->with('success', $banner->is_active ? 'Slaid dipaparkan.' : 'Slaid disembunyikan.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'distinct', 'exists:banners,id'],
        ])['ids'];

        DB::transaction(function () use ($ids) {
            foreach (array_values($ids) as $index => $id) {
                Banner::query()->whereKey($id)->update(['sort_order' => $index + 1]);
            }
        });

        return back()->with('success', 'Susunan slaid disimpan.');
    }
}
