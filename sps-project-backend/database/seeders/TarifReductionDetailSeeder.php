<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TarifReductionDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('tarif_reduction_detail')->insert([
            [
                'type_reduction' => 1,
                'montant' => 10,
                'percentage' => 5,
                'tarif_reduction' => 1, // Foreign key to tarif_reduction_detail
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_reduction' => 1,
                'montant' => 15,
                'percentage' => 10,
                'tarif_reduction' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_reduction' => 2,
                'montant' => 20,
                'percentage' => 15,
                'tarif_reduction' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
