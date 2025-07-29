<?php

namespace Database\Seeders;

use App\Models\Province;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProvinceSeeder extends Seeder
{
    public function run(): void
    {
        Province::query()->delete();
        $provinces = [
            'Azuay',
            'Bolívar',
            'Cañar',
            'Carchi',
            'Chimborazo',
            'Cotopaxi',
            'El Oro',
            'Esmeraldas',
            'Galápagos',
            'Guayas',
            'Imbabura',
            'Loja',
            'Los Ríos',
            'Manabí',
            'Morona Santiago',
            'Napo',
            'Orellana',
            'Pastaza',
            'Pichincha',
            'Santa Elena',
            'Santo Domingo de los Tsáchilas',
            'Sucumbíos',
            'Tungurahua',
            'Zamora Chinchipe'
        ];

        foreach ($provinces as $provinceName) {
            Province::create(['name' => $provinceName]);
        }
    }
}
