<?php

namespace Database\Seeders;

use App\Models\Signature;
use Illuminate\Database\Seeder;

class SignatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reestructuramos el array para que cada elemento sea un plan completo.
        $signature = [
            [
                'period'       => 'ONE_WEEK',
                'display_name' => '1 SEMANA',
                'cost'         => 7.25,  // Reemplaza con tu valor real
                'price'        => 7.25, // Reemplaza con tu valor real
            ],
            [
                'period'       => 'ONE_MONTH',
                'display_name' => '1 MES',
                'cost'         => 9.20, // Reemplaza con tu valor real
                'price'        => 18.00, // Reemplaza con tu valor real
            ],
            [
                'period'       => 'ONE_YEAR',
                'display_name' => '1 AÑO',
                'cost'         => 14.35, // Reemplaza con tu valor real
                'price'        => 25.00, // Reemplaza con tu valor real
            ],
            [
                'period'       => 'TWO_YEARS',
                'display_name' => '2 AÑOS',
                'cost'         => 22.50, // Reemplaza con tu valor real
                'price'        => 38.00, // Reemplaza con tu valor real
            ],
            [
                'period'       => 'THREE_YEARS',
                'display_name' => '3 AÑOS',
                'cost'         => 30.50, // Reemplaza con tu valor real
                'price'        => 50.00, // Reemplaza con tu valor real
            ],
            [
                'period'       => 'FOUR_YEARS',
                'display_name' => '4 AÑOS',
                'cost'         => 33.50, // Reemplaza con tu valor real
                'price'        => 65.00, // Reemplaza con tu valor real
            ],
            [
                'period'       => 'FIVE_YEARS',
                'display_name' => '5 AÑOS',
                'cost'         => 38.50, // Reemplaza con tu valor real
                'price'        => 75.00, // Reemplaza con tu valor real
            ],
        ];

        // El loop ahora itera sobre cada array de datos del plan.
        foreach ($signature as $planData) {
            Signature::create([
                'period'        => $planData['period'],
                'display_name'  => $planData['display_name'],
                'cost'          => $planData['cost'],
                'price'         => $planData['price'],
                'description'   => "Signature de duración: {$planData['display_name']}.",
                'is_active'     => true,
            ]);
        }
    }
}