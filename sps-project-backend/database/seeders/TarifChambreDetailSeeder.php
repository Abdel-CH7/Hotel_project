<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;


class TarifChambreDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $timestamp = time();
        $tarifs = [
            [
                'code' => 'TC'.$timestamp.'001',
                'tarif_chambre' => 1,
                'type_chambre' => 1,
                'single' => 100.00,
                'double' => 150.00,
                'triple' => 200.00,
                'lit_supp' => 25,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'TC'.$timestamp.'002',
                'tarif_chambre' => 2,
                'type_chambre' => 2,
                'single' => 120.00,
                'double' => 170.00,
                'triple' => 220.00,
                'lit_supp' => 30,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'TC'.$timestamp.'003',
                'tarif_chambre' => 3,
                'type_chambre' => 3,
                'single' => 140.00,
                'double' => 190.00,
                'triple' => 240.00,
                'lit_supp' => 35,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($tarifs as $tarif) {
            try {
                DB::table('tarif_chambre_detail')->insert($tarif);
            } catch (\Exception $e) {
                // Skip if duplicate entry
                continue;
            }
        }
    }
}
