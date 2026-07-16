<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class EquipmentLocationBackfill
{
    public function run(): void
    {
        $now = now();
        $roomsByNumber = DB::table('chambres')
            ->get(['id', 'num_chambre'])
            ->keyBy(fn ($room) => $this->normalize($room->num_chambre));

        $emplacementsByName = DB::table('emplacements')
            ->get(['id', 'nom'])
            ->keyBy(fn ($emplacement) => $this->normalize($emplacement->nom));

        DB::table('equipements')
            ->whereNull('chambre_id')
            ->whereNull('emplacement_id')
            ->whereNotNull('localisation')
            ->where('localisation', '<>', '')
            ->orderBy('id')
            ->get(['id', 'localisation'])
            ->each(function ($equipment) use ($roomsByNumber, $emplacementsByName, $now) {
                $location = $this->clean($equipment->localisation);

                if ($location === '') {
                    return;
                }

                if (preg_match('/^chambre\s+(.+)$/iu', $location, $matches)) {
                    $room = $roomsByNumber->get($this->normalize($matches[1]));

                    if ($room) {
                        DB::table('equipements')
                            ->where('id', $equipment->id)
                            ->update(['chambre_id' => $room->id]);

                        return;
                    }
                }

                $normalizedLocation = $this->normalize($location);
                $emplacement = $emplacementsByName->get($normalizedLocation);

                if (! $emplacement) {
                    $emplacementId = DB::table('emplacements')->insertGetId([
                        'nom' => $location,
                        'type' => null,
                        'description' => 'Importé depuis la localisation historique des équipements.',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                    $emplacement = (object) [
                        'id' => $emplacementId,
                        'nom' => $location,
                    ];
                    $emplacementsByName->put($normalizedLocation, $emplacement);
                }

                DB::table('equipements')
                    ->where('id', $equipment->id)
                    ->update(['emplacement_id' => $emplacement->id]);
            });
    }

    private function clean(mixed $value): string
    {
        return preg_replace('/\s+/u', ' ', trim((string) $value)) ?? '';
    }

    private function normalize(mixed $value): string
    {
        return mb_strtolower($this->clean($value), 'UTF-8');
    }
}
