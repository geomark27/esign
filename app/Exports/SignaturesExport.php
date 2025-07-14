<?php

namespace App\Exports;

use App\Models\Certification;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class SignaturesExport implements FromArray, ShouldAutoSize, WithHeadings
{
    protected array $filters;

    public function __construct(array $filters)
    {
        $this->filters = $filters;
    }

    public function headings(): array
    {
        return [
            'N° Certificado',
            'Estado',
            'Firma',
            'Costo Firma',
            'Última Actualización',
        ];
    }

    public function array(): array
    {
        // ✅ SOLUCIÓN: Cambiamos la consulta para usar un JOIN.
        // Esto garantiza que solo obtengamos certificaciones que tienen una firma válida existente.
        $query = Certification::query()
            ->join('signatures', 'certifications.period', '=', 'signatures.period');

        // Seleccionamos explícitamente las columnas para evitar ambigüedades.
        $query->select(
            'certifications.certification_number',
            'certifications.status',
            'certifications.updated_at',
            'signatures.display_name as signature_name', // Usamos un alias
            'signatures.cost as signature_cost'          // Usamos un alias
        );

        // 2. APLICAMOS LOS FILTROS A LA CONSULTA UNIFICADA
        $query->when($this->filters['search'] ?? null, function ($q, $search) {
            $q->where(function($subq) use ($search) {
                // Ahora los 'where' aplican a las columnas de la tabla unificada
                $subq->where('certifications.certification_number', 'like', "%{$search}%")
                     ->orWhere('certifications.status', 'like', "%{$search}%")
                     ->orWhere('signatures.display_name', 'like', "%{$search}%"); // El orWhereHas se convierte en un orWhere simple
            });
        });

        $query->when($this->filters['status'] ?? null, function ($q, $status) {
            if ($status !== 'all') {
                return $q->where('certifications.status', $status);
            }
        });

        $query->when($this->filters['date_from'] ?? null, function ($q, $dateFrom) {
            return $q->whereDate('certifications.updated_at', '>=', $dateFrom);
        });

        $query->when($this->filters['date_to'] ?? null, function ($q, $dateTo) {
            return $q->whereDate('certifications.updated_at', '<=', $dateTo);
        });

        $certifications = $query->latest('certifications.updated_at')->get();

        // --- Bucle Foreach ---
        $data = [];

        foreach ($certifications as $cert) {
            // Ahora $cert es un objeto plano con las columnas seleccionadas, no un modelo con relaciones.
            $data[] = [
                'certification_number' => $cert->certification_number ?? 'N/A',
                'status'               => Certification::STATUS_OPTIONS[$cert->status] ?? $cert->status,
                'signature_name'       => $cert->signature_name, // Usamos el alias
                'signature_cost'       => number_format($cert->signature_cost, 2, ',', '.'), // Usamos el alias
                'updated_at'           => $cert->updated_at->format('d/m/Y H:i A'),
            ];
        }

        return $data;
    }
}