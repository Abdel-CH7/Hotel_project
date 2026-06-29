<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VilleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Inserting data into villes table
        DB::table('villes')->insert([
            [
                'ville' => 'Paris',
                'region_id' => '1', // Assuming region with ID 1 exists
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ville' => 'Marseille',
                'region_id' => '2', // Assuming region with ID 2 exists
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ville' => 'Lyon',
                'region_id' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ville' => 'Toulouse',
                'region_id' => '3', // Assuming region with ID 3 exists
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ville' => 'Nice',
                'region_id' => '2',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ville' => 'Nantes',
                'region_id' => '4', // Assuming region with ID 4 exists
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ville' => 'Strasbourg',
                'region_id' => '5', // Assuming region with ID 5 exists
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ville' => 'Montpellier',
                'region_id' => '3',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ville' => 'Bordeaux',
                'region_id' => '6', // Assuming region with ID 6 exists
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ville' => 'Lille',
                'region_id' => '7', // Assuming region with ID 7 exists
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
