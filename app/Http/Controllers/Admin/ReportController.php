<?php

namespace App\Http\Controllers\Admin;

use App\Exports\PaymentsExport;
use App\Exports\SignaturesExport;
use App\Http\Controllers\Controller;
use App\Models\Certification;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function paymentReport(Request $request)
    {
        $query = Payment::query()
            ->with(['detailable', 'certification.period']);

        $query->when($request->input('search'), function ($q, $search) {
            $q->whereHas('certification', function ($subQuery) use ($search) {
                $subQuery->where('applicant_name', 'like', "%{$search}%")
                         ->orWhere('certification_number', 'like', "%{$search}%");
            });
        });

        $query->when($request->input('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        $query->when($request->input('date_from'), function ($q, $date_from) {
            $q->whereDate('payment_date', '>=', $date_from);
        });
        $query->when($request->input('date_to'), function ($q, $date_to) {
            $q->whereDate('payment_date', '<=', $date_to);
        });

        $payments = $query->latest('payment_date')->paginate(15)->withQueryString();

        return Inertia::render('admin/reports/PaymentReport', [
            'payments'      => $payments,
            'filters'       => $request->only(['search', 'status', 'date_from', 'date_to']),
            'statusOptions' => Payment::STATUS_OPTIONS,
        ]);
    }

    public function signatureReport(Request $request)
    {
        $query = Certification::query();
        $query->with(['period:display_name,period,cost']);

        // --- FILTROS ---

        // Filtro de búsqueda general (sin cambios)
        $query->when($request->input('search'), function ($q, $search) {
            $q->where(function($subq) use ($search) {
                $subq->where('certification_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('period', function ($signatureQuery) use ($search) {
                        $signatureQuery->where('display_name', 'like', "%{$search}%");
                    });
            });
        });

        // ✅ NUEVO: Filtro por estado
        $query->when($request->input('status'), function ($q, $status) {
            // Ignora el valor 'all' si se envía desde el frontend
            if ($status !== 'all') {
                return $q->where('status', $status);
            }
        });

        // ✅ NUEVO: Filtro por rango de fechas (usando 'updated_at')
        $query->when($request->input('date_from'), function ($q, $dateFrom) {
            return $q->where('updated_at', '>=', $dateFrom);
        });

        $query->when($request->input('date_to'), function ($q, $dateTo) {
            return $q->where('updated_at', '<=', $dateTo);
        });


        $query->latest('updated_at');
        
        $certifications = $query->select(
            'id', 'certification_number', 'status', 'updated_at', 'period'
        )->paginate(15)->withQueryString();
        
        return Inertia::render('admin/reports/SignatureReport', [
            'certifications' => $certifications,
            // ✅ ACTUALIZADO: Pasa todos los filtros de vuelta a la vista
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
            'statusOptions' => Certification::STATUS_OPTIONS,
        ]);
    }

    public function exportPayments(Request $request)
    {
        $filters = $request->only(['search', 'status', 'date_from', 'date_to']);
        $date = now()->format('Y-m-d');

        try {
            return Excel::download(new PaymentsExport($filters), "reporte_pagos_{$date}.xlsx");
        } catch (\Throwable $th) {
            Log::channel('debugging')->error('Error al exportar pagos: ' . $th->getMessage(), [
                'filters' => $filters,
                'file'    => $th->getFile(),
                'line'    => $th->getLine(),
            ]);
            return redirect()->back()->with('error', 'No se pudo exportar el reporte de pagos.');
        }
    }

    public function exportSignatures(Request $request)
    {
        $filters = $request->only(['search', 'status', 'date_from', 'date_to']);
        $date = now()->format('Y-m-d');

        try {
            return Excel::download(new SignaturesExport($filters), "reporte_firmas_{$date}.xlsx");
        } catch (\Throwable $th) {
            Log::channel('debugging')->error('Error al exportar reporte de firmas: ' . $th->getMessage());
            return redirect()->back()->with('error', 'No se pudo exportar el reporte de firmas.');
        }
    }
}
