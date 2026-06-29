<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;


class TarifRepasDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('tarif_repas_detail')->insert([
            [
                'type_repas' => 1,
                'montant' => 15,
                'tarif_repas' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_repas' => 2,
                'montant' => 25,
                'tarif_repas' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_repas' => 2,
                'montant' => 35,
                'tarif_repas' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
