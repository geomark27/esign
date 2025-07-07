<?php

namespace App\Providers;

use App\Models\GeneralSetting;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

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
        Inertia::share([
            'settings' => function () {
                $s = GeneralSetting::first();
                return [
                    'appName' => $s?->app_name ?? config('app.name'),
                    'logoUrl' => $s && $s->logo_path
                        ? asset($s->logo_path)
                        : null,
                ];
            },
        ]);
    }
}
