<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use RuntimeException;

class RoomStateBackfill
{
    public function assertNoDuplicates(): void
    {
        $duplicates = DB::table('etat_chambre')
            ->select('num_chambre', DB::raw('COUNT(*) AS total'))
            ->groupBy('num_chambre')
            ->havingRaw('COUNT(*) > 1')
            ->orderBy('num_chambre')
            ->get();

        if ($duplicates->isEmpty()) {
            return;
        }

        $details = $duplicates
            ->map(fn ($duplicate) => "{$duplicate->num_chambre} ({$duplicate->total} états)")
            ->implode(', ');

        throw new RuntimeException(
            "Impossible de garantir un état unique par chambre. Doublons détectés : {$details}. "
            .'Corrigez ces données manuellement puis relancez la migration.'
        );
    }

    public function run(): int
    {
        $now = now();
        $missingRooms = DB::table('chambres')
            ->leftJoin('etat_chambre', 'chambres.num_chambre', '=', 'etat_chambre.num_chambre')
            ->whereNull('etat_chambre.id')
            ->orderBy('chambres.num_chambre')
            ->pluck('chambres.num_chambre');

        if ($missingRooms->isEmpty()) {
            return 0;
        }

        DB::table('etat_chambre')->insert(
            $missingRooms->map(fn ($roomNumber) => [
                'num_chambre' => $roomNumber,
                'status' => 'non nettoyée',
                'maintenance' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all()
        );

        return $missingRooms->count();
    }
}
