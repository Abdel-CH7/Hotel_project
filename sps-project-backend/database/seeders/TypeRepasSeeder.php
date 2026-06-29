<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypeRepasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Inserting data into types_chambre table
        DB::table('types_repas')->insert([
            [
                'code' => 'Code 2',
                'type_repas' => 'type 1',
            ],
            [
                'code' => 'Code 3',
                'type_repas' => 'type 2',
            ],
            [
                'code' => 'Code 4',
                'type_repas' => 'type 3',
            ],
        ]);
    }
}
