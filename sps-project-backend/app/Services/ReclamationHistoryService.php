<?php

namespace App\Services;

use App\Models\Historique;
use App\Models\Reclamation;

class ReclamationHistoryService
{
    public function record(
        Reclamation $reclamation,
        string $type,
        string $description,
        ?int $userId,
        ?string $oldStatus = null,
        ?string $newStatus = null
    ): Historique {
        return $reclamation->historique()->create([
            'type_evenement' => $type,
            'ancien_statut' => $oldStatus,
            'nouveau_statut' => $newStatus,
            'description' => trim($description),
            'user_id' => $userId,
            'date' => now()->toDateString(),
        ]);
    }
}
