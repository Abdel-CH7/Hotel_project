<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Departement;

class DepartementSeeder extends Seeder
{
    public function run()
    {
        $departements = [
            'Réception',
            'Service de ménage',
            'Maintenance',
            'Restauration',
            'Sécurité',
            'Conciergerie',
            'Gestion des réservations'
        ];

        foreach ($departements as $nom) {
            Departement::create(['nom' => $nom]);
        }
    }
} 