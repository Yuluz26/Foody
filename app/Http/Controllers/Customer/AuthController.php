<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\RegisterCustomerRequest;
use App\Models\Customer;
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
        return Inertia::render('Customer/Login');
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

        if (! Auth::guard('customer')->attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey);
            Log::warning('Customer login failed', ['email' => $credentials['email'], 'ip' => $request->ip()]);

            throw ValidationException::withMessages([
                'email' => 'Emel atau kata laluan tidak betul.',
            ]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        return $this->redirectAfterSignIn($request);
    }

    public function createRegister(): Response
    {
        return Inertia::render('Customer/Register');
    }

    public function storeRegister(RegisterCustomerRequest $request): RedirectResponse
    {
        $customer = Customer::query()->create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'phone' => Customer::normalizePhone($request->validated('phone')),
            'password' => $request->validated('password'),
        ]);

        Auth::guard('customer')->login($customer);
        $request->session()->regenerate();

        return $this->redirectAfterSignIn($request);
    }

    // Staff and diners share one session, so a leftover "return here" from the admin panel must not send a diner there.
    private function redirectAfterSignIn(Request $request): RedirectResponse
    {
        $intended = (string) $request->session()->pull('url.intended', '');
        $path = '/'.trim((string) parse_url($intended, PHP_URL_PATH), '/');
        $isPanel = $path === '/admin' || str_starts_with($path, '/admin/');

        return redirect()->to($intended !== '' && ! $isPanel ? $intended : route('menu'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('customer.login');
    }
}
