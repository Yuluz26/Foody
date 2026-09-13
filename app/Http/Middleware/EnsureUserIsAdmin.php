<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Explicit 'web' guard — never the unguarded default, which a customer session can shift.
        abort_unless($request->user('web')?->is_admin, 403, 'Akses admin sahaja.');

        return $next($request);
    }
}
