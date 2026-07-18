<?php

namespace App\Support;

use App\Models\Chambre;
use App\Models\Emplacement;
use App\Models\Equipement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EquipmentLegacyLocationRepair
{
    public function run(bool $apply = false): array
    {
        if (! $apply) {
            return $this->inspect(false);
        }

        return DB::transaction(fn () => $this->inspect(true));
    }

    private function inspect(bool $apply): array
    {
        $equipmentQuery = Equipement::withTrashed()
            ->with('emplacement:id,nom')
            ->whereNull('chambre_id')
            ->whereNotNull('emplacement_id')
            ->orderBy('id');

        if ($apply) {
            $equipmentQuery->lockForUpdate();
        }

        $equipments = $equipmentQuery->get();
        $roomsByNumber = $this->roomsByExactNumber($apply);
        $exactMatches = [];
        $unresolved = [];
        $ignoredInternal = 0;
        $migrated = 0;

        foreach ($equipments as $equipment) {
            $emplacement = $equipment->emplacement;

            if (! $emplacement) {
                continue;
            }

            $roomNumber = EquipmentLocationName::extractRoomNumber($emplacement->nom);

            if ($roomNumber === null) {
                if (EquipmentLocationName::hasNumericRoomReference($emplacement->nom)) {
                    $this->appendUnresolved(
                        $unresolved,
                        $emplacement,
                        $equipment,
                        'format historique non pris en charge'
                    );
                } else {
                    $ignoredInternal++;
                }

                continue;
            }

            $matchingRooms = $roomsByNumber->get($roomNumber, collect());

            if ($matchingRooms->isEmpty()) {
                if (! EquipmentLocationName::hasNumericRoomReference($emplacement->nom)) {
                    $ignoredInternal++;
                    continue;
                }

                $this->appendUnresolved(
                    $unresolved,
                    $emplacement,
                    $equipment,
                    'chambre réelle introuvable'
                );
                continue;
            }

            if ($matchingRooms->count() !== 1) {
                $this->appendUnresolved(
                    $unresolved,
                    $emplacement,
                    $equipment,
                    'numéro de chambre ambigu'
                );
                continue;
            }

            $room = $matchingRooms->first();
            $exactMatches[] = [
                'equipment_id' => $equipment->id,
                'equipment_name' => $equipment->nom,
                'emplacement_id' => $emplacement->id,
                'emplacement_name' => $emplacement->nom,
                'room_id' => $room->id,
                'room_number' => $room->num_chambre,
                'soft_deleted' => $equipment->trashed(),
            ];

            if ($apply) {
                $equipment->forceFill([
                    'chambre_id' => $room->id,
                    'emplacement_id' => null,
                    'localisation' => null,
                ])->save();
                $migrated++;
            }
        }

        $removedEmplacements = $apply
            ? $this->removeUnusedPseudoRoomEmplacements($roomsByNumber)
            : 0;

        return [
            'mode' => $apply ? 'apply' : 'dry-run',
            'scanned' => $equipments->count(),
            'exact_matches' => $exactMatches,
            'migrated' => $migrated,
            'unresolved' => array_values($unresolved),
            'unresolved_equipment' => collect($unresolved)->sum(
                fn (array $item) => count($item['equipment'])
            ),
            'ignored_internal' => $ignoredInternal,
            'removed_emplacements' => $removedEmplacements,
        ];
    }

    private function roomsByExactNumber(bool $lock): Collection
    {
        $query = Chambre::query()->orderBy('id');

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query
            ->get(['id', 'num_chambre'])
            ->groupBy(fn (Chambre $room) => trim((string) $room->num_chambre));
    }

    private function appendUnresolved(
        array &$unresolved,
        Emplacement $emplacement,
        Equipement $equipment,
        string $reason
    ): void {
        $key = $emplacement->id.'|'.$reason;

        if (! isset($unresolved[$key])) {
            $unresolved[$key] = [
                'emplacement_id' => $emplacement->id,
                'emplacement_name' => $emplacement->nom,
                'equipment' => [],
                'reason' => $reason,
            ];
        }

        $unresolved[$key]['equipment'][] = [
            'id' => $equipment->id,
            'name' => $equipment->nom,
            'soft_deleted' => $equipment->trashed(),
        ];
    }

    private function removeUnusedPseudoRoomEmplacements(Collection $roomsByNumber): int
    {
        $removed = 0;

        Emplacement::query()->orderBy('id')->lockForUpdate()->get()->each(
            function (Emplacement $emplacement) use ($roomsByNumber, &$removed) {
                $roomNumber = EquipmentLocationName::extractRoomNumber($emplacement->nom);

                if ($roomNumber === null || $roomsByNumber->get($roomNumber, collect())->count() !== 1) {
                    return;
                }

                if (Equipement::withTrashed()->where('emplacement_id', $emplacement->id)->exists()) {
                    return;
                }

                $emplacement->delete();
                $removed++;
            }
        );

        return $removed;
    }
}
