<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChambreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $timestamp = time();
        $chambres = [
            [
                'num_chambre' => 'R'.$timestamp.'101',
                'type_chambre' => 1,
                'nb_lit' => 1,
                'nb_salle' => 1,
                'climat' => 'oui',
                'wifi' => 1,
                'vue_id' => 1,
                'etage_id' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'num_chambre' => 'R'.$timestamp.'102',
                'type_chambre' => 2,
                'nb_lit' => 2,
                'nb_salle' => 1,
                'climat' => 'non',
                'wifi' => 1,
                'vue_id' => 2,
                'etage_id' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'num_chambre' => 'R'.$timestamp.'103',
                'type_chambre' => 3,
                'nb_lit' => 3,
                'nb_salle' => 2,
                'climat' => 'oui',
                'wifi' => 0,
                'vue_id' => 3,
                'etage_id' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($chambres as $chambre) {
            try {
                DB::table('chambres')->insert($chambre);
            } catch (\Exception $e) {
                // Skip if duplicate entry
                continue;
            }
        }
    }
}
