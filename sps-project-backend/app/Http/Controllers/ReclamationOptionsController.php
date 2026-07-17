<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientParticulier;
use App\Models\Departement;
use App\Models\Reclamation;
use App\Models\ReclamationCanal;
use App\Models\ReclamationType;
use App\Models\Reservation;
use App\Support\ReservationClientData;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ReclamationOptionsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $types = ReclamationType::query()
            ->where('actif', true)
            ->with('departementParDefaut:id,nom,actif')
            ->orderBy('nom')
            ->get()
            ->map(fn (ReclamationType $type): array => [
                'id' => (int) $type->id,
                'nom' => $type->nom,
                'departement_par_defaut_id' => $type->departementParDefaut?->actif
                    ? (int) $type->departementParDefaut->id
                    : null,
                'departement_par_defaut' => $type->departementParDefaut ? [
                    'id' => (int) $type->departementParDefaut->id,
                    'nom' => $type->departementParDefaut->nom,
                    'actif' => (bool) $type->departementParDefaut->actif,
                ] : null,
                'priorite_par_defaut' => $type->priorite_par_defaut,
                'configuration_warning' => $type->departementParDefaut && ! $type->departementParDefaut->actif
                    ? 'Le département suggéré est inactif.'
                    : null,
            ])->values();

        $channels = ReclamationCanal::query()
            ->where('actif', true)
            ->orderBy('nom')
            ->get(['id', 'nom', 'est_autre'])
            ->map(fn (ReclamationCanal $channel): array => [
                'id' => (int) $channel->id,
                'nom' => $channel->nom,
                'est_autre' => (bool) $channel->est_autre,
            ])->values();

        $departments = Departement::query()
            ->where('actif', true)
            ->orderBy('nom')
            ->get(['id', 'nom', 'photo'])
            ->map(fn (Departement $department): array => [
                'id' => (int) $department->id,
                'nom' => $department->nom,
                'photo' => $department->photo,
            ])->values();

        $reservations = Reservation::query()
            ->with('client')
            ->orderByDesc('reservation_date')
            ->orderByDesc('id')
            ->get(['id', 'reservation_num', 'client_type', 'client_id', 'client_name_snapshot', 'date_debut', 'date_fin'])
            ->map(function (Reservation $reservation): array {
                $client = ReservationClientData::reservationClient($reservation);

                return [
                    'id' => (int) $reservation->id,
                    'numero' => $reservation->reservation_num,
                    'client' => $client,
                    'date_debut' => $reservation->date_debut?->format('Y-m-d'),
                    'date_fin' => $reservation->date_fin?->format('Y-m-d'),
                    'select_label' => trim(implode(' — ', array_filter([
                        $reservation->reservation_num,
                        $client['display_name'] ?? null,
                        $reservation->date_debut?->format('d/m/Y'),
                    ]))),
                ];
            })->values();

        $companies = Client::query()
            ->select(['id', 'CodeClient', 'raison_sociale', 'ice', 'type_organisation', 'tele', 'email', 'secteur_id', 'mod_id', 'credit_autorise', 'delai_paiement_jours', 'plafond_credit'])
            ->with(['secteur:id,secteurClient', 'modeReglement:id,mode_paimants'])
            ->get()
            ->map(fn (Client $client): array => ReservationClientData::companyOption($client))
            ->sortBy(fn (array $row): string => Str::lower(Str::ascii($row['display_name'].'|'.$row['code'])))
            ->values();

        $individuals = ClientParticulier::query()
            ->select(['id', 'CodeClient', 'name', 'prenom', 'type_piece', 'cin', 'tele', 'nationalite', 'pays_code', 'region_nom', 'ville'])
            ->get()
            ->map(fn (ClientParticulier $client): array => ReservationClientData::individualOption($client))
            ->sortBy(fn (array $row): string => Str::lower(Str::ascii($row['display_name'].'|'.$row['code'])))
            ->values();

        return response()->json(['data' => [
            'types' => $types,
            'canaux' => $channels,
            'departements' => $departments,
            'priorites' => collect(Reclamation::PRIORITIES)->map(
                fn (string $label, string $value): array => compact('value', 'label')
            )->values(),
            'reservations' => $reservations,
            'clients' => ['societe' => $companies, 'particulier' => $individuals],
        ]]);
    }
}
