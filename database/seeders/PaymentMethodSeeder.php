<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentMethod;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // La lista de métodos de pago ahora vive aquí, que es su lugar lógico.
        $paymentMethods = [
            'cash'             => 'Efectivo',
            'transfer'         => 'Transferencia Bancaria',
            'deposit'          => 'Depósito Bancario',
            'debit_card'       => 'Tarjeta de Débito',
            'credit_card'      => 'Tarjeta de Crédito',
            'post_dated_check' => 'Cheque Post-Fechado',
            'current_check'    => 'Cheque al Día',
        ];

        // La lógica para crear o actualizar se mantiene, pero ahora usa el array local.
        foreach ($paymentMethods as $code => $displayName) {
            PaymentMethod::updateOrCreate(
                [
                    'name' => $code,
                ],
                [
                    'display_name' => $displayName,
                    'description'  => "Pago utilizando {$displayName}",
                    'is_active'    => true,
                ]
            );
        }
    }
}