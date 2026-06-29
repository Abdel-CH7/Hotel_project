<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HistoriqueSeeder extends Seeder
{
    public function run()
    {
        DB::table('reclamation_historique')->insert([
            'reclamation_id' => 1,  // Assuming the first reclamation has ID 1
            'date' => now(),
            'description' => 'Réclamation reçue et en cours d\'examen',
        ]);
    }
} 