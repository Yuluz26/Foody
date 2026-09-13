<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminRole
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user('web')?->hasAdminRole(), 403, 'Akses admin sahaja.');

        return $next($request);
    }
}
