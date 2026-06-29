<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypeChambreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Inserting data into types_chambre table
        DB::table('types_chambre')->insert([
            [
                'code' => 'Code 2',
                'type_chambre' => 'type 1', // Type of room
                'nb_lit' => 1, // Number of beds
                'nb_salle' => 1, // Number of bathrooms
                'commentaire' => 'Chambre simple avec un lit.', // Comment
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'Code 3',
                'type_chambre' => 'type 2', // Type of room
                'nb_lit' => 2,
                'nb_salle' => 1,
                'commentaire' => 'Chambre double avec deux lits.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'Code 4',
                'type_chambre' => 'type 3', // Type of room
                'nb_lit' => 3,
                'nb_salle' => 1,
                'commentaire' => 'Chambre triple avec trois lits.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
