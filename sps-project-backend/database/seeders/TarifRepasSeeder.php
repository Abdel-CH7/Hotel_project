<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TarifRepasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('tarifs_repas')->insert([
            [
                'designation' => 'Tarif Repas1',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'designation' => 'Tarif Repas2',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'designation' => 'Tarif Repas3',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
