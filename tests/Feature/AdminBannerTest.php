<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\BannerController;
use App\Models\Banner;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminBannerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        Storage::fake('public');
    }

    public function test_admin_can_upload_a_banner_and_it_is_cropped_to_the_slider_ratio(): void
    {
        $this->actingAs($this->admin)
            ->post('/admin/banners', ['image' => UploadedFile::fake()->image('promo.jpg', 2000, 800)])
            ->assertRedirect();

        $banner = Banner::query()->sole();
        $this->assertTrue($banner->is_active);
        $this->assertSame(1, $banner->sort_order);
        Storage::disk('public')->assertExists($banner->image);

        [$width, $height] = getimagesize(Storage::disk('public')->path($banner->image));
        $this->assertEqualsWithDelta(BannerController::RATIO, $width / $height, 0.01);
    }

    public function test_a_portrait_upload_is_also_cropped_to_the_same_ratio(): void
    {
        $this->actingAs($this->admin)->post('/admin/banners', ['image' => UploadedFile::fake()->image('portrait.jpg', 600, 900)]);

        $banner = Banner::query()->sole();
        [$width, $height] = getimagesize(Storage::disk('public')->path($banner->image));
        $this->assertEqualsWithDelta(BannerController::RATIO, $width / $height, 0.01);
    }

    public function test_non_image_uploads_are_rejected(): void
    {
        $this->actingAs($this->admin)
            ->post('/admin/banners', ['image' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')])
            ->assertSessionHasErrors('image');

        $this->assertSame(0, Banner::query()->count());
    }

    public function test_admin_can_toggle_reorder_and_delete_banners(): void
    {
        [$first, $second] = Banner::factory()->count(2)->sequence(['sort_order' => 1], ['sort_order' => 2])->create();

        $this->actingAs($this->admin)->patch("/admin/banners/{$first->id}/toggle");
        $this->assertFalse($first->fresh()->is_active);

        $this->actingAs($this->admin)->patch('/admin/banners/reorder', ['ids' => [$second->id, $first->id]]);
        $this->assertSame(1, $second->fresh()->sort_order);
        $this->assertSame(2, $first->fresh()->sort_order);

        $this->actingAs($this->admin)->delete("/admin/banners/{$second->id}")->assertRedirect();
        $this->assertModelMissing($second);
    }

    public function test_guests_cannot_manage_banners(): void
    {
        $this->get('/admin/banners')->assertRedirect('/admin/login');
        $this->post('/admin/banners', [])->assertRedirect('/admin/login');
    }

    public function test_only_active_banners_are_shown_to_customers_in_order(): void
    {
        Banner::factory()->create(['sort_order' => 2, 'is_active' => true]);
        Banner::factory()->create(['sort_order' => 1, 'is_active' => true]);
        Banner::factory()->create(['sort_order' => 3, 'is_active' => false]);

        $this->actingAs(Customer::factory()->create(), 'customer')
            ->get('/')
            ->assertInertia(fn ($page) => $page->has('banners', 2));
    }
}
