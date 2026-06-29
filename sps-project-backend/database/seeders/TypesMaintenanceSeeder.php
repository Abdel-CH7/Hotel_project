<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypesMaintenanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'id' => 1,
                'nom' => 'Maintenance Préventive',
                'description' => 'Maintenance régulière pour prévenir les problèmes',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'nom' => 'Réparation',
                'description' => 'Réparation d\'équipements ou installations défectueux',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'nom' => 'Rénovation',
                'description' => 'Travaux de rénovation et amélioration',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($types as $type) {
            try {
                DB::table('types_maintenance')->insert($type);
            } catch (\Exception $e) {
                // Skip if duplicate entry
                continue;
            }
        }
    }
} 