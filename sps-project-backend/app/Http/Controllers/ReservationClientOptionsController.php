<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientParticulier;
use App\Support\ReservationClientData;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ReservationClientOptionsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $companies = Client::query()
            ->select([
                'id', 'CodeClient', 'raison_sociale', 'ice', 'type_organisation',
                'tele', 'email', 'secteur_id', 'mod_id', 'credit_autorise',
                'delai_paiement_jours', 'plafond_credit',
            ])
            ->with(['secteur:id,secteurClient', 'modeReglement:id,mode_paimants'])
            ->get()
            ->map(fn (Client $client): array => ReservationClientData::companyOption($client))
            ->sortBy(self::sortKey(...))
            ->values();

        $individuals = ClientParticulier::query()
            ->select([
                'id', 'CodeClient', 'name', 'prenom', 'type_piece', 'cin', 'tele',
                'nationalite', 'pays_code', 'region_nom', 'ville',
            ])
            ->with(['info_clients' => function ($query): void {
                $query
                    ->select(['id', 'idClient', 'name', 'prenom', 'age'])
                    ->orderBy('prenom')
                    ->orderBy('name')
                    ->orderBy('id');
            }])
            ->get()
            ->map(fn (ClientParticulier $client): array => ReservationClientData::individualOption($client))
            ->sortBy(self::sortKey(...))
            ->values();

        return response()->json(['data' => [
            'societe' => $companies,
            'particulier' => $individuals,
        ]]);
    }

    private static function sortKey(array $option): string
    {
        return Str::lower(Str::ascii($option['display_name'].'|'.$option['code']));
    }
}
