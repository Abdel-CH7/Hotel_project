<?php

namespace App\Services;

use App\Exceptions\EquipmentRoomImpactException;
use App\Models\Chambre;
use App\Models\Equipement;
use App\Models\EtatChambre;
use App\Models\Reservation;
use App\Support\ReservationClientData;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class EquipmentRoomImpactService
{
    public const IMPACT_NONE = 'aucun';
    public const IMPACT_DEGRADED = 'service_degrade';
    public const IMPACT_BLOCKING = 'chambre_indisponible';
    public const IMPACTS = [self::IMPACT_NONE, self::IMPACT_DEGRADED, self::IMPACT_BLOCKING];
    private const PROBLEM_STATUSES = ['en_maintenance', 'hors_service'];
    private const RESERVATION_STATUSES = ['en attente', 'confirmé'];

    public function persist(?Equipement $equipment, array $data): array
    {
        return DB::transaction(function () use ($equipment, $data): array {
            $isNew = ! $equipment?->exists;
            $lockedEquipment = $isNew
                ? new Equipement()
                : Equipement::query()->whereKey($equipment->id)->lockForUpdate()->firstOrFail();

            $oldImpact = $lockedEquipment->impact_chambre ?? self::IMPACT_NONE;
            $oldStatus = $lockedEquipment->statut;
            $oldRoomId = $lockedEquipment->chambre_id;
            $status = $data['statut'] ?? $lockedEquipment->statut;
            $roomId = array_key_exists('chambre_id', $data)
                ? ($data['chambre_id'] ?: null)
                : $lockedEquipment->chambre_id;
            $impactWasProvided = array_key_exists('impact_chambre', $data);
            $requestedImpact = $data['impact_chambre'] ?? ($isNew ? null : $oldImpact);
            $requiresExplicitImpact = in_array($status, self::PROBLEM_STATUSES, true)
                && (bool) $roomId
                && ($isNew
                    || ! in_array($oldStatus, self::PROBLEM_STATUSES, true)
                    || (string) $oldRoomId !== (string) $roomId);
            $impact = $this->validatedImpact(
                $status,
                $roomId,
                $requestedImpact,
                $impactWasProvided || ! $requiresExplicitImpact
            );
            $maintenanceWasSubmitted = array_key_exists('room_maintenance', $data);
            $maintenance = $data['room_maintenance'] ?? [];
            $confirmConflicts = filter_var(
                $data['confirm_reservation_conflicts'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            );

            unset($data['room_maintenance'], $data['confirm_reservation_conflicts']);
            $data['impact_chambre'] = $impact;

            $room = null;
            $roomState = null;
            $maintenanceAlreadyActive = false;

            if ($impact === self::IMPACT_BLOCKING) {
                $room = Chambre::query()->whereKey($roomId)->lockForUpdate()->firstOrFail();
                $roomState = EtatChambre::query()
                    ->where('num_chambre', $room->num_chambre)
                    ->lockForUpdate()
                    ->first();

                if (! $roomState) {
                    $roomState = EtatChambre::create([
                        'num_chambre' => $room->num_chambre,
                        'status' => 'non nettoyée',
                        'maintenance' => false,
                    ]);
                }

                $canReuseExistingMaintenance = ! $isNew
                    && $oldImpact === self::IMPACT_BLOCKING
                    && $impact === self::IMPACT_BLOCKING
                    && (string) $oldRoomId === (string) $roomId
                    && $roomState->maintenance
                    && ! $maintenanceWasSubmitted;

                if ($canReuseExistingMaintenance) {
                    $maintenanceAlreadyActive = true;
                } else {
                    $validatedMaintenance = $this->validateMaintenance($maintenance);
                }

                if ($roomState->maintenance && ! $canReuseExistingMaintenance) {
                    if (! $this->maintenanceCovers($roomState, $validatedMaintenance)) {
                        throw new EquipmentRoomImpactException(
                            'room_maintenance_period_conflict',
                            'La chambre possède déjà une maintenance qui ne couvre pas cette période.',
                            [
                                'room_id' => (int) $room->id,
                                'room_maintenance' => $this->roomMaintenancePayload($roomState),
                                'review_url' => '/etat-chambre?room_id='.$room->id,
                            ]
                        );
                    }

                    $maintenanceAlreadyActive = true;
                } elseif (! $roomState->maintenance) {
                    $conflicts = $this->reservationConflicts(
                        (int) $room->id,
                        $validatedMaintenance['date_debut_maintenance'],
                        $validatedMaintenance['date_fin_maintenance']
                    );

                    if ($conflicts !== [] && ! $confirmConflicts) {
                        throw new EquipmentRoomImpactException(
                            'existing_reservations_overlap',
                            'Cette maintenance chevauche des réservations existantes.',
                            ['conflicts' => $conflicts]
                        );
                    }
                }
            }

            $lockedEquipment->fill($data);
            $lockedEquipment->save();

            if ($impact === self::IMPACT_BLOCKING && ! $maintenanceAlreadyActive) {
                $roomState->update([
                    'maintenance' => true,
                    'maintenance_type_id' => $validatedMaintenance['maintenance_type_id'],
                    'date_debut_maintenance' => $validatedMaintenance['date_debut_maintenance'],
                    'date_fin_maintenance' => $validatedMaintenance['date_fin_maintenance'],
                    'commentaire' => $validatedMaintenance['commentaire']
                        ?: $this->defaultComment($lockedEquipment),
                ]);
            }

            $becameAvailable = ! $isNew
                && $oldStatus !== 'disponible'
                && $status === 'disponible';
            $oldImpactWasBlocking = ! $isNew
                && $oldImpact === self::IMPACT_BLOCKING
                && (bool) $oldRoomId;
            $originalRoomRequiresReview = $oldImpactWasBlocking
                && ($impact !== self::IMPACT_BLOCKING
                    || (string) $oldRoomId !== (string) $roomId
                    || $becameAvailable);
            $reviewRoomId = $originalRoomRequiresReview ? $oldRoomId : null;
            $reviewRequired = $originalRoomRequiresReview;

            return [
                'equipment' => $lockedEquipment,
                'room_maintenance_already_active' => $maintenanceAlreadyActive,
                'room_maintenance_review_required' => $reviewRequired,
                'room_id' => $reviewRequired ? (int) $reviewRoomId : null,
            ];
        });
    }

    private function validatedImpact(
        ?string $status,
        mixed $roomId,
        mixed $requestedImpact,
        bool $impactWasProvided
    ): string {
        if ($status === 'disponible') {
            return self::IMPACT_NONE;
        }

        if (! $roomId) {
            if ($requestedImpact && $requestedImpact !== self::IMPACT_NONE) {
                throw ValidationException::withMessages([
                    'impact_chambre' => 'Un équipement affecté à un emplacement interne ne peut pas avoir d’impact sur une chambre.',
                ]);
            }

            return self::IMPACT_NONE;
        }

        if (in_array($status, self::PROBLEM_STATUSES, true) && ! $impactWasProvided) {
            throw ValidationException::withMessages([
                'impact_chambre' => 'L’impact sur la chambre est obligatoire.',
            ]);
        }

        if (! in_array($requestedImpact, self::IMPACTS, true)) {
            throw ValidationException::withMessages([
                'impact_chambre' => 'L’impact sélectionné est invalide.',
            ]);
        }

        return $requestedImpact;
    }

    private function validateMaintenance(array $maintenance): array
    {
        return Validator::make(['room_maintenance' => $maintenance], [
            'room_maintenance.maintenance_type_id' => ['required', 'integer', 'exists:types_maintenance,id'],
            'room_maintenance.date_debut_maintenance' => ['required', 'date'],
            'room_maintenance.date_fin_maintenance' => [
                'required',
                'date',
                'after_or_equal:room_maintenance.date_debut_maintenance',
            ],
            'room_maintenance.commentaire' => ['nullable', 'string'],
        ], [
            'room_maintenance.maintenance_type_id.required' => 'Le type de maintenance est obligatoire.',
            'room_maintenance.maintenance_type_id.exists' => 'Le type de maintenance sélectionné est invalide.',
            'room_maintenance.date_debut_maintenance.required' => 'La date de début de maintenance est obligatoire.',
            'room_maintenance.date_fin_maintenance.required' => 'La date de fin de maintenance est obligatoire.',
            'room_maintenance.date_fin_maintenance.after_or_equal' => 'La date de fin doit être postérieure ou égale à la date de début.',
        ])->validate()['room_maintenance'];
    }

    private function maintenanceCovers(EtatChambre $state, array $maintenance): bool
    {
        $requestedStart = CarbonImmutable::parse($maintenance['date_debut_maintenance'])->startOfDay();
        $requestedEnd = CarbonImmutable::parse($maintenance['date_fin_maintenance'])->startOfDay();
        $currentStart = $state->date_debut_maintenance
            ? CarbonImmutable::parse($state->date_debut_maintenance)->startOfDay()
            : null;
        $currentEnd = $state->date_fin_maintenance
            ? CarbonImmutable::parse($state->date_fin_maintenance)->startOfDay()
            : null;

        return (! $currentStart || $currentStart->lessThanOrEqualTo($requestedStart))
            && (! $currentEnd || $currentEnd->greaterThanOrEqualTo($requestedEnd));
    }

    private function reservationConflicts(int $roomId, string $start, string $end): array
    {
        return Reservation::query()
            ->with('client')
            ->whereIn('status', self::RESERVATION_STATUSES)
            ->whereDate('date_debut', '<=', $end)
            ->whereDate('date_fin', '>', $start)
            ->whereHas('reservationRooms', fn ($query) => $query->where('chambre_id', $roomId))
            ->orderBy('date_debut')
            ->orderBy('id')
            ->get()
            ->map(function (Reservation $reservation): array {
                $client = ReservationClientData::reservationClient($reservation);

                return [
                    'id' => (int) $reservation->id,
                    'reservation_num' => $reservation->reservation_num,
                    'date_debut' => $reservation->date_debut?->format('Y-m-d'),
                    'date_fin' => $reservation->date_fin?->format('Y-m-d'),
                    'status' => $reservation->status,
                    'client' => $client['display_name'],
                ];
            })
            ->all();
    }

    private function defaultComment(Equipement $equipment): string
    {
        $status = $equipment->statut === 'hors_service' ? 'Hors service' : 'En maintenance';

        return $equipment->nom.' — '.$status;
    }

    private function roomMaintenancePayload(EtatChambre $state): array
    {
        return [
            'maintenance_type_id' => $state->maintenance_type_id,
            'date_debut_maintenance' => $state->date_debut_maintenance?->format('Y-m-d'),
            'date_fin_maintenance' => $state->date_fin_maintenance?->format('Y-m-d'),
            'commentaire' => $state->commentaire,
        ];
    }

}
