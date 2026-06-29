<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EtatChambreTableSeeder extends Seeder
{
    public function run()
    {
        DB::table('etat_chambre')->insert([
            'num_chambre' => '101',  // Note: using string if that's what your chambres.num_chambre is
            'status' => 'nettoyée',
            'date_nettoyage' => '2025-03-06',
            'nettoyée_par' => 'John Doe',
            'maintenance' => false,
            'maintenance_type_id' => null,  // use maintenance_type_id instead of type_maintenance; set a valid id if needed
            'date_debut_maintenance' => null, // or provide a valid date if needed
            'date_fin_maintenance' => null,   // or provide a valid date if needed
            'commentaire' => 'Room cleaned.',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}