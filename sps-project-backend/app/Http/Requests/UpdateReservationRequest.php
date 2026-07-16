<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_type' => ['required', Rule::in(['societe', 'particulier'])],
            'client_id' => ['required', 'integer'],
            'date_debut' => ['required', 'date_format:Y-m-d'],
            'date_fin' => ['required', 'date_format:Y-m-d', 'after:date_debut'],
            'chambres' => ['required', 'array', 'min:1'],
            'chambres.*.chambre_id' => ['required', 'integer', 'distinct'],
            'chambres.*.adultes' => ['required', 'integer', 'min:1'],
            'chambres.*.enfants' => ['required', 'integer', 'min:0'],
            'repas' => ['sometimes', 'array'],
            'repas.*.type_repas_id' => ['required', 'integer', 'distinct'],
            'repas.*.quantite_par_jour' => ['required', 'integer', 'min:1'],
            'type_reduction_id' => ['nullable', 'integer'],
            'reservation_num' => ['prohibited'],
            'reservation_date' => ['prohibited'],
            'status' => ['prohibited'],
            'montant_total' => ['prohibited'],
            'montant_reduction' => ['prohibited'],
            'montant_chambres' => ['prohibited'],
            'montant_repas' => ['prohibited'],
            'sous_total_avant_reduction' => ['prohibited'],
            'tarif_actuel_id' => ['prohibited'],
            'tarif_repas_id' => ['prohibited'],
            'pricing_version' => ['prohibited'],
            'legacy_pricing' => ['prohibited'],
            'chambres.*.lits_supplementaires' => ['prohibited'],
            'chambres.*.tarif_par_nuit' => ['prohibited'],
            'chambres.*.montant_total' => ['prohibited'],
            'chambres.*.segments' => ['prohibited'],
            'repas.*.prix_unitaire_snapshot' => ['prohibited'],
            'repas.*.montant_total' => ['prohibited'],
        ];
    }
}
