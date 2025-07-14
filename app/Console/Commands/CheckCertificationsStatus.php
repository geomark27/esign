<?php

namespace App\Console\Commands;

use App\Models\Certification;
use App\Services\FirmaSeguraService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckCertificationsStatus extends Command
{
    protected $signature    = 'check:certification-status';
    protected $description  = 'Consulta en FirmaSegura el estado de las certificaciones pendientes o en revisión';

    protected FirmaSeguraService $firmaSegura;

    public function __construct(FirmaSeguraService $firmaSegura)
    {
        parent::__construct();
        $this->firmaSegura = $firmaSegura;
    }

    public function handle()
    {
        // Recuperar sólo los que están en 'pending' o 'in_review'
        $certs = Certification::pending()->get();
        $total = $certs->count();

        Log::channel('debugging')->info('Iniciando consulta de estado de certificaciones', [
            'total_pending' => $total,
        ]);

        if ($total === 0) {
            $this->info('No hay certificaciones en estado pending/in_review.');
            Log::channel('debugging')->info('Terminada consulta: no hay certificaciones para procesar');
            return 0;
        }

        $this->info("Iniciando consulta de estado para {$total} certificaciones...");

        foreach ($certs as $cert) {
            $this->line("→ [#{$cert->id}] ref: {$cert->referenceTransaction}");

            Log::channel('debugging')->info('Consultando certificación en FirmaSegura', [
                'certification_id'      => $cert->id,
                'reference_transaction' => $cert->referenceTransaction,
                'current_status'        => $cert->validationStatus,
            ]);

            $result = $this->firmaSegura->checkCertificationStatus($cert);

            if (!empty($result['success']) && $result['success'] === true) {
                $this->info("   ✔ OK");
                Log::channel('debugging')->info('Consulta exitosa de estado de certificación', [
                    'certification_id' => $cert->id,
                ]);
            } else {
                $message = $result['message'] ?? 'desconocido';
                $this->error("   ✖ Error: {$message}");
                Log::channel('debugging')->error('Error al consultar estado de certificación', [
                    'certification_id' => $cert->id,
                    'error_message'    => $message,
                ]);
            }
        }

        $this->info('Consulta finalizada.');
        Log::channel('debugging')->info('Finalizada consulta de estado de certificaciones', [
            'processed' => $total,
        ]);

        return 0;
    }
}
