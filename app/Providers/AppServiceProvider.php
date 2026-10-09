<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Surface N+1 queries during development.
        Model::preventLazyLoading(! $this->app->isProduction());

        // Behind a load balancer or Cloudflare every request arrives from the proxy's address, so anything
        // keyed by IP would lump every diner together. Set TRUSTED_PROXIES to the proxies (or "*").
        if (filled($proxies = config('app.trusted_proxies'))) {
            TrustProxies::at($proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)));
        }

        // A restaurant's diners often share one Wi-Fi address. One phone (its session) gets the tight
        // limit; the address only gets a roomy ceiling that still stops a script from flooding the kitchen.
        RateLimiter::for('orders', fn (Request $request) => [
            Limit::perMinute(10)->by('session:'.$request->session()->getId()),
            Limit::perMinute(60)->by('ip:'.$request->ip()),
        ]);
        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
    }
}
