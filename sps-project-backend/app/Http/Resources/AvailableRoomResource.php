<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailableRoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'],
            'num_chambre' => $this['num_chambre'],
            'type_chambre_id' => $this['type_chambre_id'],
            'type_chambre' => $this['type_chambre'],
            'capacite_standard' => $this['capacite_standard'],
            'lits_supplementaires_max' => $this['lits_supplementaires_max'],
            'etage' => $this['etage'],
            'vue' => $this['vue'],
            'selected' => $this['selected'] ?? false,
        ];
    }
}
