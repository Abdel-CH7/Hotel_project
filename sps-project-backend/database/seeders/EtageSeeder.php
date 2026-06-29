<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EtageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Inserting data into tarifs_chambre table
        DB::table('etages')->insert([
            [
                'etage' => 'Etage 1',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'etage' => 'Etage 2',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'etage' => 'Etage 3',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
