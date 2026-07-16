<?php

namespace App\Services;

use App\Exceptions\ReservationDomainException;
use App\Models\Chambre;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReservationAvailabilityService
{
    private const BLOCKING_STATUSES = ['en attente', 'confirmé'];

    public function __construct(
        private readonly ReservationTariffPeriodResolver $dateResolver
    ) {
    }

    public function availableRooms(
        string $dateDebut,
        string $dateFin,
        ?int $reservationId = null,
        array $selectedRoomIds = []
    ): array {
        [$start, $end] = $this->dateResolver->parseRange($dateDebut, $dateFin);
        $allRoomIds = Chambre::query()->pluck('id')->map(fn ($id): int => (int) $id)->all();
        $conflicts = $this->conflicts($allRoomIds, $start->toDateString(), $end->toDateString(), $reservationId);
        $blockedIds = collect($conflicts)->pluck('chambre_id')->unique()->all();
        $selected = array_map('intval', $selectedRoomIds);

        return Chambre::query()
            ->with(['typeChambre', 'etage', 'vue'])
            ->whereNotIn('id', $blockedIds)
            ->orderBy('num_chambre')
            ->get()
            ->map(fn (Chambre $room): array => $this->roomMetadata(
                $room,
                in_array($room->id, $selected, true)
            ))
            ->all();
    }

    public function assertRoomsAvailable(
        array $roomIds,
        string $dateDebut,
        string $dateFin,
        ?int $reservationId = null
    ): Collection {
        [$start, $end] = $this->dateResolver->parseRange($dateDebut, $dateFin);
        $normalizedIds = $this->normalizeRoomIds($roomIds);
        $rooms = Chambre::query()
            ->with(['typeChambre', 'etage', 'vue'])
            ->whereIn('id', $normalizedIds)
            ->get();

        $this->assertAllRoomsExist($normalizedIds, $rooms);
        $this->throwFirstConflict(
            $this->conflicts(
                $normalizedIds,
                $start->toDateString(),
                $end->toDateString(),
                $reservationId
            )
        );

        return $rooms->sortBy('id')->values();
    }

    /**
     * Call from inside the create/update transaction. Row locks are acquired
     * before reservation and maintenance conflicts are checked again.
     */
    public function lockAndAssertRoomsAvailable(
        array $roomIds,
        string $dateDebut,
        string $dateFin,
        ?int $reservationId = null
    ): Collection {
        [$start, $end] = $this->dateResolver->parseRange($dateDebut, $dateFin);
        $normalizedIds = $this->normalizeRoomIds($roomIds);
        $rooms = Chambre::query()
            ->whereIn('id', $normalizedIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        $this->assertAllRoomsExist($normalizedIds, $rooms);
        $this->throwFirstConflict(
            $this->conflicts(
                $normalizedIds,
                $start->toDateString(),
                $end->toDateString(),
                $reservationId
            )
        );

        return $rooms->load(['typeChambre', 'etage', 'vue']);
    }

    public function conflicts(
        array $roomIds,
        string $dateDebut,
        string $dateFin,
        ?int $reservationId = null
    ): array {
        if ($roomIds === []) {
            return [];
        }

        $reservationConflicts = DB::table('details_reservation as detail')
            ->join('reservations as reservation', 'reservation.id', '=', 'detail.reservation_id')
            ->join('chambres as room', 'room.id', '=', 'detail.chambre_id')
            ->whereIn('detail.chambre_id', $roomIds)
            ->whereIn('reservation.status', self::BLOCKING_STATUSES)
            ->whereDate('reservation.date_debut', '<', $dateFin)
            ->whereDate('reservation.date_fin', '>', $dateDebut)
            ->when($reservationId, fn ($query) => $query->where('reservation.id', '<>', $reservationId))
            ->get([
                'detail.chambre_id',
                'room.num_chambre',
                'reservation.id as reservation_id',
                'reservation.reservation_num',
            ])
            ->map(fn (object $row): array => [
                'code' => 'room_unavailable',
                'chambre_id' => (int) $row->chambre_id,
                'num_chambre' => $row->num_chambre,
                'reservation_id' => (int) $row->reservation_id,
                'reservation_num' => $row->reservation_num,
            ]);

        $maintenanceConflicts = DB::table('etat_chambre as state')
            ->join('chambres as room', 'room.num_chambre', '=', 'state.num_chambre')
            ->whereIn('room.id', $roomIds)
            ->where('state.maintenance', true)
            ->where(function ($query) use ($dateFin): void {
                $query->whereNull('state.date_debut_maintenance')
                    ->orWhereDate('state.date_debut_maintenance', '<', $dateFin);
            })
            ->where(function ($query) use ($dateDebut): void {
                $query->whereNull('state.date_fin_maintenance')
                    ->orWhereDate('state.date_fin_maintenance', '>=', $dateDebut);
            })
            ->get([
                'room.id as chambre_id',
                'room.num_chambre',
                'state.date_debut_maintenance',
                'state.date_fin_maintenance',
            ])
            ->map(fn (object $row): array => [
                'code' => 'maintenance_overlap',
                'chambre_id' => (int) $row->chambre_id,
                'num_chambre' => $row->num_chambre,
                'date_debut_maintenance' => $row->date_debut_maintenance,
                'date_fin_maintenance' => $row->date_fin_maintenance,
            ]);

        return $reservationConflicts->concat($maintenanceConflicts)->values()->all();
    }

    private function normalizeRoomIds(array $roomIds): array
    {
        $normalized = array_map(static fn ($id): int => (int) $id, $roomIds);
        if (count($normalized) !== count(array_unique($normalized))) {
            throw new ReservationDomainException(
                'duplicate_room',
                'Une chambre ne peut être sélectionnée qu’une seule fois.',
                'chambres'
            );
        }

        sort($normalized, SORT_NUMERIC);

        return $normalized;
    }

    private function assertAllRoomsExist(array $roomIds, Collection $rooms): void
    {
        $foundIds = $rooms->pluck('id')->map(fn ($id): int => (int) $id)->all();
        $missingIds = array_values(array_diff($roomIds, $foundIds));
        if ($missingIds !== []) {
            throw new ReservationDomainException(
                'room_not_found',
                'Une ou plusieurs chambres sélectionnées n’existent pas.',
                'chambres',
                422,
                ['chambre_ids' => $missingIds]
            );
        }
    }

    private function throwFirstConflict(array $conflicts): void
    {
        if ($conflicts === []) {
            return;
        }

        $conflict = $conflicts[0];
        $message = $conflict['code'] === 'maintenance_overlap'
            ? "La chambre {$conflict['num_chambre']} est indisponible pendant une maintenance."
            : "La chambre {$conflict['num_chambre']} est déjà réservée sur cette période.";

        throw new ReservationDomainException(
            $conflict['code'],
            $message,
            'chambres',
            409,
            $conflict
        );
    }

    private function roomMetadata(Chambre $room, bool $selected): array
    {
        return [
            'id' => $room->id,
            'num_chambre' => $room->num_chambre,
            'type_chambre_id' => $room->type_chambre_id,
            'type_chambre' => $room->typeChambre?->type_chambre,
            'capacite_standard' => $room->typeChambre?->capacite_standard,
            'lits_supplementaires_max' => $room->typeChambre?->lits_supplementaires_max,
            'etage' => $room->etage?->etage,
            'vue' => $room->vue?->vue,
            'selected' => $selected,
        ];
    }
}
