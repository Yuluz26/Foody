<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    public function create(): Response
    {
        return Inertia::render('Admin/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Masukkan emel anda.',
            'email.email' => 'Format emel tidak sah.',
            'password.required' => 'Masukkan kata laluan anda.',
        ]);

        $throttleKey = Str::transliterate(Str::lower($credentials['email']).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_ATTEMPTS)) {
            event(new Lockout($request));

            throw ValidationException::withMessages([
                'email' => 'Terlalu banyak cubaan. Cuba lagi dalam '.RateLimiter::availableIn($throttleKey).' saat.',
            ]);
        }

        $authenticated = Auth::guard('web')->attempt($credentials, $request->boolean('remember'));

        // Only staff accounts may use the admin panel.
        if ($authenticated && ! $request->user('web')->is_admin) {
            Auth::guard('web')->logout();
            $authenticated = false;
        }

        if ($authenticated && ! $request->user('web')->isApproved()) {
            Auth::guard('web')->logout();
            RateLimiter::hit($throttleKey);
            Log::warning('Admin login blocked: account inactive', ['email' => $credentials['email'], 'ip' => $request->ip()]);

            throw ValidationException::withMessages([
                'email' => 'Akaun anda tidak aktif. Sila hubungi admin kedai.',
            ]);
        }

        if (! $authenticated) {
            RateLimiter::hit($throttleKey);
            Log::warning('Admin login failed', ['email' => $credentials['email'], 'ip' => $request->ip()]);

            throw ValidationException::withMessages([
                'email' => 'Emel atau kata laluan tidak betul.',
            ]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        return $this->redirectAfterSignIn($request);
    }

    // Staff and diners share one session, so a leftover "return here" from the menu must not pull staff out of the panel.
    private function redirectAfterSignIn(Request $request): RedirectResponse
    {
        $intended = (string) $request->session()->pull('url.intended', '');
        $path = '/'.trim((string) parse_url($intended, PHP_URL_PATH), '/');
        $isPanel = $path === '/admin' || str_starts_with($path, '/admin/');

        return redirect()->to($isPanel ? $intended : route('admin.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
