<?php

namespace App\Http\Requests;

class UpdateReclamationRequest extends StoreReclamationRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'suivi' => ['prohibited'],
            'reponse' => ['prohibited'],
        ]);
    }
}
