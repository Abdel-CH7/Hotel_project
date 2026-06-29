<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TarifReductionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('tarifs_reduction')->insert([
            [
                'designation' => 'Chambre Économique',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'designation' => 'Chambre Confort',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'designation' => 'Chambre Familiale',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
