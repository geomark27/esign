<?php

namespace App\Exports;

use App\Models\BankPaymentDetail; // Importante para acceder a las constantes
use App\Models\Payment;
use App\Models\Signature;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class PaymentsExport implements FromArray, ShouldAutoSize
{
    protected $filters;

    public function __construct(array $filters)
    {
        $this->filters = $filters;
    }

    /**
    * Construye y retorna un array con todos los datos para el Excel.
    */
    public function array(): array
    {
        // 1. La consulta para obtener los datos se mantiene igual.
        $query = Payment::query()->with(['detailable', 'certification']);
        
        // ... (toda tu lógica de filtrado no cambia) ...
        $query->when($this->filters['search'] ?? null, function ($q, $search) {
            $q->whereHas('certification', function ($subQuery) use ($search) {
                $subQuery->where('applicantName', 'like', "%{$search}%")
                    ->orWhere('certification_number', 'like', "%{$search}%");
            });
        });

        $query->when($this->filters['status'] ?? null, function ($q, $status) {
            $q->where('status', $status);
        });

        $query->when($this->filters['date_from'] ?? null, function ($q, $date_from) {
            $q->whereDate('payment_date', '>=', $date_from);
        });
        
        $query->when($this->filters['date_to'] ?? null, function ($q, $date_to) {
            $q->whereDate('payment_date', '<=', $date_to);
        });

        $payments = $query->latest('payment_date')->get();
        $data = [];

        // 2. Encabezados (no cambian).
        $data[] = [
            'N° Certificado',
            'Cédula/RUC',
            'Cliente',
            'Firma',
            'Monto Pagado',
            'Detalle del Pago',
            'Fecha de Pago',
        ];

        // 3. El mapeo de datos se mantiene igual, ya que toda la lógica está en el helper.
        foreach ($payments as $payment) {
            $clientFullName = trim(
                ($payment->certification->applicantName ?? '') . ' ' .
                ($payment->certification->applicantLastName ?? '') . ' ' .
                ($payment->certification->applicantSecondLastName ?? '')
            );

            $signature = $this->getSignature($payment);
            $data[] = [
                'certification_number'  => $payment->certification->certification_number ?? 'N/A',
                'identificationNumber'  => $payment->certification->identificationNumber ?? 'N/A',
                'client'                => $clientFullName,
                'signature'             => $signature['display_name'], // Llama a la función de firma
                'amount'                => number_format($payment->amount, 2, ',', '.'),
                'payment_details'       => $this->getPaymentDetails($payment), // Llama a la nueva función mejorada
                'payment_date'          => $payment->created_at->format('d/m/Y H:i A'),
            ];
        }
        //dd($data);
        return $data;
    }

    /**
     * CAMBIO: Función de ayuda mejorada para formatear los detalles de todos los tipos de pago.
     */

    private function getSignature($payment)
    {
        if (!$payment->certification) {
            return 'N/A';
        }

        $period = $payment->certification->period;
        if (!$period) {
            return 'Sin firma';
        }

        if (!Signature::where('period', $period)->exists()) {
            return 'Tipo de firma no encontrada';
        }

        $plan = Signature::where('period', $period)->first();
        return [
            'cost'          => $plan->cost,
            'display_name'  => $plan->display_name,
        ];
    }

    private function getPaymentDetails($payment): string
    {
        if (!$payment->detailable) {
            return 'N/A';
        }

        $detailableType = $payment->detailable_type;

        if (str_contains($detailableType, 'CardPaymentDetail')) {
            $details = [
                "Marca: " . ucfirst($payment->detailable->card_brand),
                "Terminación: ****" . $payment->detailable->last_four_digits,
                "Transacción: " . ($payment->detailable->transaction_code ?? 'N/A'),
                "Autorización: " . ($payment->detailable->authorization_code ?? 'N/A'),
            ];
            return implode(' | ', $details);
        }

        if (str_contains($detailableType, 'BankPaymentDetail')) {
            // Obtenemos la clave del banco (ej: 'guayaquil')
            $bankKey = $payment->detailable->origin_bank;
            // Buscamos el nombre completo en el array de constantes del modelo y ponemos un fallback
            $bankName = BankPaymentDetail::AVAILABLE_BANKS[$bankKey] ?? ucfirst($bankKey);

            $details = [
                "Tipo: " . ucfirst($payment->detailable->type),
                "Banco Origen: " . $bankName,
                "Ref: " . $payment->detailable->reference_number,
            ];
            return implode(' | ', $details);
        }

        if (str_contains($detailableType, 'CashPaymentDetail')) {
            return "Pago en Efectivo - Recibido: $" . number_format($payment->detailable->received_amount, 2, ',', '.');
        }
        
        return 'N/A';
    }
}