<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Inserting data into tarifs_chambre table
        DB::table('vues')->insert([
            [
                'vue' => 'Vue 1',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vue' => 'Vue 2',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vue' => 'Vue 3',
                'photo' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
