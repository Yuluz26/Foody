<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProfileRequest;
use App\Http\Requests\Admin\UpdatePasswordRequest;
use App\Support\AdminPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Admin/Profile', [
            'profile' => AdminPresenter::staff($request->user('web')),
        ]);
    }

    public function update(ProfileRequest $request): RedirectResponse
    {
        $user = $request->user('web');
        $user->name = $request->validated('name');
        $user->email = $request->validated('email');
        $changed = array_keys($user->getDirty());
        $user->save();

        if ($changed !== []) {
            Log::info('Staff profile updated', ['user_id' => $user->id, 'changed' => $changed]);
        }

        return back()->with('success', 'Profil anda dikemas kini.');
    }

    public function updatePassword(UpdatePasswordRequest $request): RedirectResponse
    {
        $user = $request->user('web');
        $user->password = $request->validated('password');
        $user->save();

        Log::info('Staff password changed', ['user_id' => $user->id]);

        return back()->with('success', 'Kata laluan anda dikemas kini. Sesi di peranti lain telah dilog keluar.');
    }
}
