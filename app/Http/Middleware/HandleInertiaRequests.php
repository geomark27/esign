<?php

namespace App\Http\Middleware;

use App\Models\GeneralSetting; // <-- 1. IMPORTA TU MODELO
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache; // <-- 2. IMPORTA LA CLASE CACHE
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {

        $settings = Cache::remember('general_settings', now()->addHour(), function () {
            return GeneralSetting::first();
        });

        if ($settings) {
            config(['app.name' => $settings->app_name]);
        }


        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');


        return [
            ...parent::share($request),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'email_verified_at' => $request->user()->email_verified_at,
                    'roles' => $request->user()->roles()->with('permissions')->get(),
                    'permissions' => $request->user()->getAllPermissions(),
                    'created_at' => $request->user()->created_at,
                    'updated_at' => $request->user()->updated_at,
                ] : null,
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'settings' => [
                'appName'   => $settings->app_name,
                'logoPath'  => $settings->logo_path ? asset($settings->logo_path) : '/favicon.svg',
            ],
        ];
    }
}