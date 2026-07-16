<?php

namespace App\Services;

use App\Exceptions\ReservationDomainException;
use App\Models\Reservation;
use App\Models\ReservationMeal;
use App\Models\ReservationReduction;
use App\Models\ReservationRoom;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservationApplicationService
{
    public function __construct(
        private readonly ReservationClientResolver $clientResolver,
        private readonly ReservationAvailabilityService $availabilityService,
        private readonly ReservationPricingService $pricingService
    ) {
    }

    public function create(array $data): Reservation
    {
        return DB::transaction(function () use ($data): Reservation {
            $client = $this->clientResolver->resolve($data['client_type'], (int) $data['client_id']);
            $roomIds = $this->sortedRoomIds($data['chambres']);
            $this->availabilityService->lockAndAssertRoomsAvailable(
                $roomIds,
                $data['date_debut'],
                $data['date_fin']
            );
            $pricing = $this->pricingService->calculate($data);

            $reservation = Reservation::create([
                'reservation_num' => $this->generateReservationNumber(),
                'client_type' => $client['client_type'],
                'client_id' => $client['client_id'],
                'client_name_snapshot' => $client['display_name'],
                'reservation_date' => CarbonImmutable::today()->toDateString(),
                'date_debut' => $data['date_debut'],
                'date_fin' => $data['date_fin'],
                'status' => $data['status'] ?? 'en attente',
                'pricing_version' => 2,
                'legacy_pricing' => false,
                'montant_chambres' => $pricing['montant_chambres'],
                'montant_repas' => $pricing['montant_repas'],
                'sous_total_avant_reduction' => $pricing['sous_total_avant_reduction'],
                'montant_reduction' => $pricing['montant_reduction'],
                'montant_total' => $pricing['montant_total'],
                'tarif_actuel_id' => $pricing['tariff_period_segments'][0]['tarif_actuel_id'],
                'tarif_repas_id' => null,
            ]);

            $this->persistPricingSnapshots($reservation, $pricing);

            return $this->loadComplete($reservation);
        }, 3);
    }

    public function update(Reservation $reservation, array $data): Reservation
    {
        return DB::transaction(function () use ($reservation, $data): Reservation {
            $locked = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);
            $this->assertStructurallyEditable($locked);
            $client = $this->clientResolver->resolve($data['client_type'], (int) $data['client_id']);
            $roomIds = $this->sortedRoomIds($data['chambres']);
            $this->availabilityService->lockAndAssertRoomsAvailable(
                $roomIds,
                $data['date_debut'],
                $data['date_fin'],
                $locked->id
            );
            $pricing = $this->pricingService->calculate($data);

            $locked->reservationRooms()->delete();
            $locked->meals()->delete();
            $locked->reduction()->delete();

            $locked->update([
                'client_type' => $client['client_type'],
                'client_id' => $client['client_id'],
                'client_name_snapshot' => $client['display_name'],
                'date_debut' => $data['date_debut'],
                'date_fin' => $data['date_fin'],
                'pricing_version' => 2,
                'legacy_pricing' => false,
                'montant_chambres' => $pricing['montant_chambres'],
                'montant_repas' => $pricing['montant_repas'],
                'sous_total_avant_reduction' => $pricing['sous_total_avant_reduction'],
                'montant_reduction' => $pricing['montant_reduction'],
                'montant_total' => $pricing['montant_total'],
                'tarif_actuel_id' => $pricing['tariff_period_segments'][0]['tarif_actuel_id'],
                'tarif_repas_id' => null,
            ]);

            $this->persistPricingSnapshots($locked, $pricing);

            return $this->loadComplete($locked);
        }, 3);
    }

    public function changeStatus(
        Reservation $reservation,
        string $status,
        ?string $cancellationReason = null
    ): Reservation {
        return DB::transaction(function () use ($reservation, $status, $cancellationReason): Reservation {
            $locked = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);
            $this->assertNotPast($locked);

            if ($status === $locked->status) {
                return $this->loadComplete($locked);
            }

            $allowed = match ($locked->status) {
                'en attente' => ['confirmé', 'annulé'],
                'confirmé' => ['annulé'],
                default => [],
            };
            if (!in_array($status, $allowed, true)) {
                throw new ReservationDomainException(
                    ReservationDomainException::INVALID_LIFECYCLE,
                    'Cette transition de statut n’est pas autorisée pour la réservation.',
                    'status',
                    409,
                    ['from' => $locked->status, 'to' => $status]
                );
            }

            if ($status === 'annulé' && trim((string) $cancellationReason) === '') {
                throw new ReservationDomainException(
                    ReservationDomainException::INVALID_LIFECYCLE,
                    'Le motif d’annulation est obligatoire.',
                    'cancellation_reason',
                    422
                );
            }

            $locked->update([
                'status' => $status,
                'cancelled_at' => $status === 'annulé' ? now() : null,
                'cancellation_reason' => $status === 'annulé'
                    ? trim((string) $cancellationReason)
                    : null,
            ]);

            return $this->loadComplete($locked);
        }, 3);
    }

    public function cancelFromLegacyDelete(Reservation $reservation): Reservation
    {
        if ($reservation->status === 'annulé') {
            throw new ReservationDomainException(
                ReservationDomainException::INVALID_LIFECYCLE,
                'La réservation est déjà annulée et ne peut plus être modifiée.',
                'status',
                409
            );
        }

        return $this->changeStatus(
            $reservation,
            'annulé',
            'Annulation effectuée depuis l’ancienne interface.'
        );
    }

    public function loadComplete(Reservation $reservation): Reservation
    {
        return $reservation->fresh()->load([
            'reservationRooms.chambre',
            'reservationRooms.priceSegments',
            'meals',
            'reduction',
        ]);
    }

    private function persistPricingSnapshots(Reservation $reservation, array $pricing): void
    {
        foreach ($pricing['chambres'] as $roomPricing) {
            $nightlyPrices = array_values(array_unique(array_column(
                $roomPricing['segments'],
                'prix_par_nuit_snapshot'
            )));
            $allocation = ReservationRoom::create([
                'reservation_id' => $reservation->id,
                'chambre_id' => $roomPricing['chambre_id'],
                'adultes' => $roomPricing['adultes'],
                'enfants' => $roomPricing['enfants'],
                'lits_supplementaires' => $roomPricing['lits_supplementaires'],
                'type_chambre_id' => $roomPricing['type_chambre_id'],
                'type_chambre_nom_snapshot' => $roomPricing['type_chambre'],
                'capacite_standard_snapshot' => $roomPricing['capacite_standard'],
                'lits_supplementaires_max_snapshot' => $roomPricing['lits_supplementaires_max'],
                'tarif_par_nuit' => count($nightlyPrices) === 1 ? $nightlyPrices[0] : null,
                'montant_total' => $roomPricing['montant_total'],
            ]);

            foreach ($roomPricing['segments'] as $segment) {
                $allocation->priceSegments()->create($segment);
            }
        }

        foreach ($pricing['repas'] as $mealPricing) {
            foreach ($mealPricing['segments'] as $segment) {
                ReservationMeal::create(array_merge($segment, [
                    'reservation_id' => $reservation->id,
                ]));
            }
        }

        if ($pricing['reduction']) {
            ReservationReduction::create(array_merge($pricing['reduction'], [
                'reservation_id' => $reservation->id,
            ]));
        }
    }

    private function sortedRoomIds(array $roomInputs): array
    {
        $roomIds = array_map(static fn (array $room): int => (int) $room['chambre_id'], $roomInputs);
        if (count($roomIds) !== count(array_unique($roomIds))) {
            throw new ReservationDomainException(
                'duplicate_room',
                'Une chambre ne peut être sélectionnée qu’une seule fois.',
                'chambres'
            );
        }

        sort($roomIds, SORT_NUMERIC);

        return $roomIds;
    }

    private function generateReservationNumber(): string
    {
        for ($attempt = 0; $attempt < 20; $attempt++) {
            $number = 'R'.strtoupper(Str::random(10));
            if (!Reservation::query()->where('reservation_num', $number)->exists()) {
                return $number;
            }
        }

        throw new \RuntimeException('Unable to generate a unique reservation number.');
    }

    private function assertStructurallyEditable(Reservation $reservation): void
    {
        $this->assertNotPast($reservation);
        if ($reservation->status === 'annulé') {
            throw new ReservationDomainException(
                ReservationDomainException::INVALID_LIFECYCLE,
                'Une réservation annulée est en lecture seule.',
                'status',
                409
            );
        }
    }

    private function assertNotPast(Reservation $reservation): void
    {
        if ($reservation->date_fin?->lte(CarbonImmutable::today())) {
            throw new ReservationDomainException(
                ReservationDomainException::INVALID_LIFECYCLE,
                'Une réservation passée est en lecture seule.',
                'date_fin',
                409
            );
        }
    }
}
