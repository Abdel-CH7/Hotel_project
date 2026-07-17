<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReclamationHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'type' => $this->type_evenement,
            'ancien_statut' => $this->ancien_statut,
            'nouveau_statut' => $this->nouveau_statut,
            'description' => $this->description,
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn (): ?array => $this->user ? [
                'id' => (int) $this->user->id,
                'name' => $this->user->name,
            ] : null),
        ];
    }
}
