<?php

namespace App\Http\Controllers;

use App\Models\Chambre;
use App\Models\Client;
use App\Models\ClientParticulier;
use App\Models\Equipement;
use App\Models\EtatChambre;
use App\Models\Reclamation;
use App\Models\Reservation;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $today = CarbonImmutable::today(config('app.timezone'))->toDateString();

        return response()->json([
            'data' => [
                'total_clients' => Client::query()->count()
                    + ClientParticulier::query()->count(),
                'total_chambres' => Chambre::query()->count(),
                'reservations_confirmees' => Reservation::query()
                    ->where('status', 'confirmé')
                    ->count(),
                'arrivees_aujourdhui' => Reservation::query()
                    ->where('status', 'confirmé')
                    ->whereDate('date_debut', $today)
                    ->count(),
                'departs_aujourdhui' => Reservation::query()
                    ->where('status', 'confirmé')
                    ->whereDate('date_fin', $today)
                    ->count(),
                'chambres_non_nettoyees' => EtatChambre::query()
                    ->where('status', 'non nettoyée')
                    ->count(),
                'reclamations_ouvertes' => Reclamation::query()
                    ->whereNotIn('suivi', [
                        Reclamation::STATUS_RESOLVED,
                        Reclamation::STATUS_CANCELLED,
                    ])
                    ->count(),
                'equipements_en_maintenance' => Equipement::query()
                    ->where('statut', 'en_maintenance')
                    ->count(),
            ],
        ]);
    }
}
