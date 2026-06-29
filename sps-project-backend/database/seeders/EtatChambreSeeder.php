<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EtatChambreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = ['disponible', 'occupée', 'en_nettoyage', 'en_maintenance'];
        $nettoyeurs = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'];
        
        // Get all room numbers from chambres table
        $chambres = DB::table('chambres')->pluck('num_chambre')->toArray();
        
        foreach ($chambres as $numChambre) {
            $status = $statuses[array_rand($statuses)];
            $maintenance = rand(0, 10) < 2; // 20% chance of being in maintenance
            
            $data = [
                'num_chambre' => $numChambre,
                'status' => $status,
                'date_nettoyage' => Carbon::now()->subDays(rand(0, 7))->format('Y-m-d'),
                'nettoyée_par' => $nettoyeurs[array_rand($nettoyeurs)],
                'maintenance' => $maintenance,
                'commentaire' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            if ($maintenance) {
                $data['maintenance_type_id'] = rand(1, 3); // Assuming you have 3 maintenance types
                $startDate = Carbon::now()->subDays(rand(0, 5));
                $data['date_debut_maintenance'] = $startDate->format('Y-m-d');
                $data['date_fin_maintenance'] = $startDate->addDays(rand(1, 7))->format('Y-m-d');
                $data['commentaire'] = 'Maintenance préventive en cours';
            }
            
            try {
                DB::table('etat_chambre')->insert($data);
            } catch (\Exception $e) {
                // Skip if duplicate entry
                continue;
            }
        }
    }
} 