<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Region;

class RegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions = [
            ['region' => 'Tanger-Tétouan-Al Hoceima'],
            ['region' => 'L’Oriental'],
            ['region' => 'Fès-Meknès'],
            ['region' => 'Rabat-Salé-Kénitra'],
            ['region' => 'Beni Mellal-Khénifra'],
            ['region' => 'Casablanca-Settat'],
            ['region' => 'Marrakech-Safi'],
            ['region' => 'Drâa-Tafilalet'],
            ['region' => 'Souss-Massa'],
            ['region' => 'Guelmim-Oued Noun'],
            ['region' => 'Laâyoune-Sakia El Hamra'],
            ['region' => 'Dakhla-Oued Ed-Dahab'],
        ];

        foreach ($regions as $region) {
            Region::create($region);
        }
    }
}
