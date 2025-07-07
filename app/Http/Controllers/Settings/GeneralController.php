<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\GeneralSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GeneralController extends Controller
{
    public function edit()
    {
        // Toma el primer registro o crea uno en memoria con valores por defecto
        $settings = GeneralSetting::first()
            ?? new GeneralSetting([
                'app_name'  => config('app.name'),
                'logo_path' => null,
            ]);

        return Inertia::render('settings/general', [
            'initialData' => [
                'appName' => $settings->app_name,
                'logoUrl' => $settings->logo_path
                    ? asset($settings->logo_path)
                    : null,
            ],
            'flash' => session('success'),
        ]);
    }

    public function update(Request $request)
    {
        // Validamos solo appName y logo
        $data = $request->validate([
            'appName' => 'required|string|max:255',
            'logo'    => 'nullable|image|max:2048',
        ]);

        // Obtén o crea el registro
        $settings = GeneralSetting::first() ?: new GeneralSetting();

        // Actualiza el nombre
        $settings->app_name = $data['appName'];

        // Procesa logo si subieron uno
        if ($file = $request->file('logo')) {
            // 1. crea carpeta public/images si no existe
            $dir = public_path('images');
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }

            // 2. borra logo anterior
            if ($settings->logo_path && file_exists(public_path($settings->logo_path))) {
                unlink(public_path($settings->logo_path));
            }

            // 3. mueve el nuevo con nombre único
            $filename = Str::random(8).'_'.time().'.'.$file->getClientOriginalExtension();
            $file->move($dir, $filename);
            $settings->logo_path = 'images/'.$filename;
        }

        $settings->save();

        return back()->with('success', 'Ajustes generales guardados.');
    }
}
