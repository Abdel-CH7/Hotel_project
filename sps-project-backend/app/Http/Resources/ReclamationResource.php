<?php

namespace App\Http\Resources;

use App\Support\ReclamationData;
use Illuminate\Http\Request;

class ReclamationResource extends ReclamationSummaryResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'client' => ReclamationData::clientContext($this->resource),
            'created_at' => $this->created_at?->toIso8601String(),
            'historique' => ReclamationHistoryResource::collection(
                $this->whenLoaded('historique')
            ),
        ]);
    }
}
