<?php

namespace App\Http\Resources;

use App\Models\Reclamation;
use App\Support\ReclamationData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReclamationSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'numero' => $this->reclamation_num,
            'date' => $this->date_reclamation?->format('Y-m-d'),
            'objet' => $this->type ? [
                'id' => (int) $this->type->id,
                'nom' => $this->type->nom,
                'actif' => (bool) $this->type->actif,
            ] : null,
            'description' => $this->description,
            'client' => ReclamationData::client($this->resource),
            'reservation' => $this->reservation ? [
                'id' => (int) $this->reservation->id,
                'numero' => $this->reservation->reservation_num,
            ] : null,
            'chambre' => ReclamationData::room($this->resource),
            'canal' => $this->canal ? [
                'id' => (int) $this->canal->id,
                'nom' => $this->canal->nom,
                'precision' => $this->canal_precision,
                'actif' => (bool) $this->canal->actif,
            ] : null,
            'departement' => $this->departement ? [
                'id' => (int) $this->departement->id,
                'nom' => $this->departement->nom,
                'actif' => (bool) $this->departement->actif,
            ] : null,
            'priorite' => $this->priorite,
            'priorite_label' => Reclamation::PRIORITIES[$this->priorite] ?? $this->priorite,
            'statut' => $this->suivi,
            'reponse' => $this->reponse,
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'cancellation' => [
                'cancelled_at' => $this->cancelled_at?->toIso8601String(),
                'reason' => $this->cancellation_reason,
            ],
            'derniere_mise_a_jour' => $this->updated_at?->toIso8601String(),
            'historique_count' => (int) ($this->historique_count ?? 0),
            'transitions' => ReclamationData::transitions($this->resource),
            'read_only' => $this->isReadOnly(),
        ];
    }
}
