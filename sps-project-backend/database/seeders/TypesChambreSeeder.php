<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypesChambreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'id' => 1,
                'nom' => 'Standard',
                'description' => 'Chambre standard avec les commodités de base',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'nom' => 'Deluxe',
                'description' => 'Chambre luxueuse avec des équipements supplémentaires',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'nom' => 'Suite',
                'description' => 'Suite spacieuse avec salon séparé',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($types as $type) {
            try {
                DB::table('types_chambre')->insert($type);
            } catch (\Exception $e) {
                // Skip if duplicate entry
                continue;
            }
        }
    }
} 