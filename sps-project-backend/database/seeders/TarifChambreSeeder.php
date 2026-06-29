<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TarifChambreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Inserting data into tarifs_chambre table
        DB::table('tarifs_chambre')->insert([
            [
                'designation' => 'Chambre Standard',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'designation' => 'Chambre Luxe',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'designation' => 'Suite Présidentielle',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
