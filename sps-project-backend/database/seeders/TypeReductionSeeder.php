<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypeReductionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Inserting data into types_chambre table
        DB::table('types_reduction')->insert([
            [
                'code' => 'Code 2',
                'type_reduction' => 'type 1',
            ],
            [
                'code' => 'Code 3',
                'type_reduction' => 'type 2',
            ],
            [
                'code' => 'Code 4',
                'type_reduction' => 'type 3',
            ],
        ]);
    }
}
