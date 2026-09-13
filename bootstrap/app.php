<?php

use App\Http\Middleware\EnsureAdminRole;
use App\Http\Middleware\EnsurePanelAccess;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'panel' => EnsurePanelAccess::class,
            'admin' => EnsureAdminRole::class,
        ]);

        // Two separate identities share this app: staff (the `web` guard, under /admin) and
        // diners (the `customer` guard, everywhere else). Branch by path since these closures
        // aren't told which guard triggered them.
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('admin', 'admin/*') ? route('admin.login') : route('customer.login'));
        $middleware->redirectUsersTo(fn (Request $request) => $request->is('admin', 'admin/*') ? route('admin.dashboard') : route('menu'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function (SymfonyResponse $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            // Inertia forms: explain an expired session or rate limit on the same page instead of an error modal.
            if ($request->header('X-Inertia') && in_array($status, [419, 429], true)) {
                $message = $status === 419
                    ? 'Sesi anda telah tamat. Sila cuba sekali lagi.'
                    : 'Terlalu banyak cubaan dalam masa singkat. Sila tunggu seminit dan cuba lagi.';

                return back()->with('error', $message)->withErrors(['order' => $message]);
            }

            // Designed error pages in production; the debug page stays available locally.
            if (! app()->hasDebugModeEnabled() && in_array($status, [403, 404, 500, 503], true)) {
                return Inertia::render('ErrorPage', ['status' => $status])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }

            return $response;
        });
    })->create();
