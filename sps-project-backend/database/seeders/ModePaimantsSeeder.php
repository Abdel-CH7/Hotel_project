<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ModePaimantsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('mode_paimants')->insert([
            ['mode_paimants' => 'Virement bancaire', 'created_at' => now(), 'updated_at' => now()],
            ['mode_paimants' => 'Chèque', 'created_at' => now(), 'updated_at' => now()],
            ['mode_paimants' => 'Espèces', 'created_at' => now(), 'updated_at' => now()],
            ['mode_paimants' => 'Carte de crédit', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
