<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reference' => $this->filled('reference') ? trim((string) $this->input('reference')) : null,
            'commentaire' => $this->filled('commentaire') ? trim((string) $this->input('commentaire')) : null,
        ]);
    }

    public function rules(): array
    {
        $reservationDate = $this->route('reservation')?->reservation_date?->format('Y-m-d');

        return [
            'mode_paiement_id' => ['required', 'integer', 'exists:mode_paimants,id'],
            'montant' => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:9999999999.99'],
            'date_paiement' => array_values(array_filter([
                'required',
                'date_format:Y-m-d',
                'before_or_equal:today',
                $reservationDate ? 'after_or_equal:'.$reservationDate : null,
            ])),
            'reference' => ['nullable', 'string', 'max:120'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'mode_paiement_id.required' => 'Le mode de paiement est obligatoire.',
            'mode_paiement_id.exists' => 'Le mode de paiement sélectionné est introuvable.',
            'montant.required' => 'Le montant est obligatoire.',
            'montant.numeric' => 'Le montant doit être un nombre valide.',
            'montant.decimal' => 'Le montant ne peut pas contenir plus de deux décimales.',
            'montant.gt' => 'Le montant doit être supérieur à zéro.',
            'montant.max' => 'Le montant dépasse la limite autorisée.',
            'date_paiement.required' => 'La date du paiement est obligatoire.',
            'date_paiement.date_format' => 'La date du paiement doit respecter le format AAAA-MM-JJ.',
            'date_paiement.before_or_equal' => 'La date du paiement ne peut pas être future.',
            'date_paiement.after_or_equal' => 'La date du paiement ne peut pas précéder la date de la réservation.',
            'reference.max' => 'La référence ne peut pas dépasser 120 caractères.',
            'commentaire.max' => 'Le commentaire ne peut pas dépasser 1000 caractères.',
        ];
    }
}
