<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SignatureController;
use App\Http\Controllers\Admin\RoleController;  // ← Agregar esta línea
use App\Http\Controllers\Payment\PaymentController;
use App\Http\Controllers\Settings\GeneralController;
use App\Http\Controllers\User\DashboardController as UserDashboardController;
use App\Http\Controllers\User\CertificationController;
use App\Http\Controllers\User\SectorController;
use App\Models\Payment;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

// Auth routes (login, register, etc.)
require __DIR__.'/auth.php';
require __DIR__.'/settings.php';

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Dashboard general - redirige según el rol
    Route::get('dashboard', function () {
        $user = auth()->user();
        
        if ($user->hasRole('admin')) {
            return redirect()->route('admin.dashboard');
        }
        
        if ($user->hasRole('user')) {
            return redirect()->route('user.dashboard');
        }
        
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Rutas para ADMIN
    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        // Dashboard de admin
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        
        // Gestión de usuarios (CRUD completo)
        Route::resource('users', AdminController::class)->except(['show']);
        
        // Gestión de roles (Index, Edit, Permisos) ← AGREGAR ESTAS LÍNEAS
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
        Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        
        // Gestión de permisos de roles
        Route::get('roles/{role}/permissions', [RoleController::class, 'permissions'])->name('roles.permissions');
        Route::put('roles/{role}/permissions', [RoleController::class, 'updatePermissions'])->name('roles.permissions.update');
        
        // Estadísticas de rol (opcional - para futuro)
        Route::get('roles/{role}/stats', [RoleController::class, 'stats'])->name('roles.stats');

        Route::get('signatures', [SignatureController::class, 'index'])->name('signatures.index');
        Route::post('signatures', [SignatureController::class, 'store'])->name('signatures.store');
        Route::get('signatures/{plan}/edit', [SignatureController::class, 'edit'])->name('signatures.edit');
        Route::put('signatures/{plan}', [SignatureController::class, 'update'])->name('signatures.update');
        Route::put('signatures/change/status/{plan}', [SignatureController::class, 'changeStatus'])->name('signatures.change.status');


        Route::get('reports/payments', [ReportController::class, 'paymentReport'])->name('reports.payments'); 
        Route::get('reports/signatures', [ReportController::class, 'signatureReport'])->name('reports.signatures'); 

        Route::get('reports/export/payments', [ReportController::class, 'exportPayments'])->name('reports.export.payments'); 
        Route::get('reports/signatures/export', [ReportController::class, 'exportSignatures'])->name('reports.signatures.export');
        
    });

    // Rutas para USER
    Route::middleware(['role:user'])->prefix('user')->name('user.')->group(function () {
        Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');

        // Certificaciones
        Route::get('certifications', [CertificationController::class, 'index'])->name('certifications.index');
        Route::get('certifications/create', [CertificationController::class, 'create'])->name('certifications.create');
        Route::post('certifications', [CertificationController::class, 'store'])->name('certifications.store');
        Route::get('certifications/{certification}', [CertificationController::class, 'show'])->name('certifications.show');
        Route::get('certifications/{certification}/edit', [CertificationController::class, 'edit'])->name('certifications.edit');
        Route::put('certifications/{certification}', [CertificationController::class, 'update'])->name('certifications.update');
        Route::post('certifications/{certification}/submit', [CertificationController::class, 'submit'])->name('certifications.submit');
        Route::delete('certifications/{certification}', [CertificationController::class, 'destroy'])->name('certifications.destroy');
        
        // Descarga segura de archivos
        Route::get('download', [CertificationController::class, 'downloadFile'])->name('download');
        
        // API para obtener ciudades por provincia
        Route::get('api/cities-by-province/{province}', [CertificationController::class, 'getCitiesByProvince'])->name('api.cities-by-province');

        // Certificaciones - rutas adicionales para FirmaSegura
        Route::post('certifications/{certification}/submit', [CertificationController::class, 'submit'])->name('certifications.submit');
        Route::post('certifications/{certification}/refresh-status', [CertificationController::class, 'refreshStatus'])->name('certifications.refresh-status');
        Route::delete('certifications/{certification}', [CertificationController::class, 'destroy'])->name('certifications.destroy');

        Route::post('certifications/payments/store', [PaymentController::class, 'store'])->name('certifications.payments.store');
        Route::delete('certifications/payments/{certification_id}/destroy', [PaymentController::class, 'destroy'])->name('certifications.payments.destroy');

        // Sectores (Ciudades)
        Route::get('sectors', [SectorController::class, 'index'])->name('sectors.index');
        Route::get('sectors/create', [SectorController::class, 'create'])->name('sectors.create');
        Route::post('sectors', [SectorController::class, 'store'])->name('sectors.store');
        Route::get('sectors/{sector}/edit', [SectorController::class, 'edit'])->name('sectors.edit');
        Route::put('sectors/{sector}', [SectorController::class, 'update'])->name('sectors.update');
        Route::delete('sectors/{sector}', [SectorController::class, 'destroy'])->name('sectors.destroy');
    });

    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('general', [GeneralController::class, 'edit'])->name('general');
        Route::post('general', [GeneralController::class, 'update'])->name('general.update');
    });


});