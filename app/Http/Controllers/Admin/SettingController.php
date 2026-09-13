<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SettingRequest;
use App\Models\RestaurantSetting;
use App\Support\ImageUpload;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(): Response
    {
        $settings = RestaurantSetting::current();

        return Inertia::render('Admin/Settings', [
            'settings' => [
                'name' => $settings->name,
                'description' => $settings->description ?? '',
                'phone' => $settings->phone ?? '',
                'address' => $settings->address ?? '',
                'opensAt' => $settings->opens_at ? substr($settings->opens_at, 0, 5) : '',
                'closesAt' => $settings->closes_at ? substr($settings->closes_at, 0, 5) : '',
                'currency' => $settings->currency,
                'orderingEnabled' => $settings->ordering_enabled,
                'dineInEnabled' => $settings->dine_in_enabled,
                'takeawayEnabled' => $settings->takeaway_enabled,
                'logoUrl' => $settings->logo_url,
                'qrCodeUrl' => $settings->qr_code_url,
                'paymentInstructions' => $settings->payment_instructions ?? '',
                'isOpenNow' => $settings->isOpenNow(),
            ],
        ]);
    }

    public function update(SettingRequest $request): RedirectResponse
    {
        $settings = RestaurantSetting::current();

        $settings->update([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'phone' => $request->validated('phone'),
            'address' => $request->validated('address'),
            'opens_at' => $request->validated('opens_at'),
            'closes_at' => $request->validated('closes_at'),
            'currency' => $request->validated('currency'),
            'ordering_enabled' => $request->boolean('ordering_enabled'),
            'dine_in_enabled' => $request->boolean('dine_in_enabled'),
            'takeaway_enabled' => $request->boolean('takeaway_enabled'),
            'logo' => ImageUpload::replace($request->file('logo'), $settings->logo, $request->boolean('remove_logo'), 'branding'),
            'qr_code' => ImageUpload::replace($request->file('qr_code'), $settings->qr_code, $request->boolean('remove_qr_code'), 'branding'),
            'payment_instructions' => $request->validated('payment_instructions'),
        ]);

        return back()->with('success', 'Tetapan restoran disimpan.');
    }
}
