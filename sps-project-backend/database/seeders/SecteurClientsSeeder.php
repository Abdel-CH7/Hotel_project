<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SecteurClientsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('secteur_clients')->insert([
            [
                'secteurClient' => 'Technologie',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteurClient' => 'Finance',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'secteurClient' => 'Santé',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
