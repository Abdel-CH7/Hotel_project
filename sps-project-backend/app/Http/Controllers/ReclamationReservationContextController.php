<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Support\ReservationClientData;
use Illuminate\Http\JsonResponse;

class ReclamationReservationContextController extends Controller
{
    public function __invoke(Reservation $reservation): JsonResponse
    {
        $reservation->load([
            'client',
            'reservationRooms.chambre.typeChambre:id,type_chambre',
            'reservationRooms.chambre.etage:id,etage',
            'reservationRooms.chambre.vue:id,vue',
        ]);

        return response()->json(['data' => [
            'id' => (int) $reservation->id,
            'numero' => $reservation->reservation_num,
            'client' => ReservationClientData::reservationClient($reservation),
            'chambres' => $reservation->reservationRooms
                ->filter(fn ($allocation): bool => (bool) $allocation->chambre)
                ->map(fn ($allocation): array => [
                    'chambre_id' => (int) $allocation->chambre_id,
                    'numero' => $allocation->chambre->num_chambre,
                    'type' => $allocation->chambre->typeChambre?->type_chambre,
                    'etage' => $allocation->chambre->etage?->etage,
                    'vue' => $allocation->chambre->vue?->vue,
                ])->unique('chambre_id')->values(),
        ]]);
    }
}
