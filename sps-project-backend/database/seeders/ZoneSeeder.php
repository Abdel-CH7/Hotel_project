<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Zone;

class ZoneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $zones = [
            ['zone' => 'Zone 1'],
            ['zone' => 'Zone 2'],
            ['zone' => 'Zone 3'],
            ['zone' => 'Zone 4'],
            ['zone' => 'Zone 5'],
            ['zone' => 'Zone 6'],
            ['zone' => 'Zone 7'],
            ['zone' => 'Zone 8'],
            ['zone' => 'Zone 9'],
            ['zone' => 'Zone 10'],
        ];

        foreach ($zones as $zone) {
            Zone::create($zone);
        }
    }
}
