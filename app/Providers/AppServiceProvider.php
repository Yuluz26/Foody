<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
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

        RateLimiter::for('orders', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
    }
}
