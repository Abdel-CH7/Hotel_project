<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SecteurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('secteurs')->insert([
            [
                'secteur' => 'Technologie',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteur' => 'Finance',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteur' => 'Santé',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteur' => 'Éducation',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteur' => 'Tourisme',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteur' => 'Agriculture',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteur' => 'Énergie',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteur' => 'Transport',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteur' => 'Immobilier',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteur' => 'Industrie',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
