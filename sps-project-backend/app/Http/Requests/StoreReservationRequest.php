<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Reservation;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['status' => $this->input('status', 'en attente')]);
    }

    public function rules(): array
    {
        return array_merge($this->pricingRules(), [
            'client_type' => ['required', Rule::in(['societe', 'particulier'])],
            'client_id' => ['required', 'integer'],
            'status' => ['required', Rule::in(['en attente', 'confirmé'])],
            'politique_paiement' => ['required', Rule::in(Reservation::paymentPolicyCodes())],
            'montant_acompte_requis' => ['nullable', 'numeric', 'decimal:0,2', 'max:9999999999.99'],
            'date_limite_paiement' => ['nullable', 'date_format:Y-m-d'],
            'reservation_num' => ['prohibited'],
            'reservation_date' => ['prohibited'],
        ], $this->prohibitedPricingRules());
    }

    public function messages(): array
    {
        return [
            'politique_paiement.required' => 'La politique de paiement est obligatoire.',
            'politique_paiement.in' => 'La politique de paiement sélectionnée est invalide.',
            'montant_acompte_requis.numeric' => 'Le montant de l’acompte doit être un nombre valide.',
            'montant_acompte_requis.decimal' => 'Le montant de l’acompte ne peut pas contenir plus de deux décimales.',
            'date_limite_paiement.date_format' => 'La date limite de paiement doit respecter le format AAAA-MM-JJ.',
        ];
    }

    private function pricingRules(): array
    {
        return [
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
        ];
    }

    private function prohibitedPricingRules(): array
    {
        return [
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
