<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePanelAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        // Explicit 'web' guard — never the unguarded default, which a customer session can shift.
        $user = $request->user('web');

        abort_unless($user?->is_admin, 403, 'Akses kakitangan sahaja.');

        // Checked on every request, not only at login, so suspending an account takes effect immediately.
        if (! $user->isApproved()) {
            Auth::guard('web')->logout();

            return redirect()->route('admin.login')->withErrors(['email' => 'Akaun anda tidak aktif. Sila hubungi admin kedai.']);
        }

        return $next($request);
    }
}
