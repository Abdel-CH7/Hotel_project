<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;


class TarifActuelSeeder extends Seeder
{
    public function run(): void
    {
        // Inserting data into tarifs_actuel table
        DB::table('tarifs_actuel')->insert([
            [
                'date_debut' => '2024-01-01 00:00:00',
                'date_fin' => '2024-12-31 23:59:59',
                'tarif_chambre' => 1,
                'tarif_repas' => 1,
                'tarif_reduction' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'date_debut' => '2024-02-01 00:00:00',
                'date_fin' => '2024-11-30 23:59:59',
                'tarif_chambre' => 1,
                'tarif_repas' => 2,
                'tarif_reduction' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'date_debut' => '2024-03-01 00:00:00',
                'date_fin' => '2024-10-31 23:59:59',
                'tarif_chambre' => 1,
                'tarif_repas' => 3,
                'tarif_reduction' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
