<?php

namespace App\Http\Requests;

use App\Models\Reclamation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReclamationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reservation_id' => ['nullable', 'integer', 'exists:reservations,id'],
            'client_type' => ['nullable', Rule::in(['societe', 'particulier']), 'required_with:client_id'],
            'client_id' => ['nullable', 'integer', 'required_with:client_type'],
            'chambre_id' => ['nullable', 'integer', 'exists:chambres,id'],
            'reclamation_type_id' => ['required', 'integer', 'exists:reclamation_types,id'],
            'description' => ['required', 'string', 'max:5000'],
            'reclamation_canal_id' => ['required', 'integer', 'exists:reclamation_canaux,id'],
            'canal_precision' => ['nullable', 'string', 'max:255'],
            'date_reclamation' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'departement_id' => ['required', 'integer', 'exists:departements,id'],
            'priorite' => ['required', Rule::in(array_keys(Reclamation::PRIORITIES))],
            'reclamation_num' => ['prohibited'],
            'suivi' => ['prohibited'],
            'reponse' => ['prohibited'],
            'created_by' => ['prohibited'],
            'updated_by' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'reclamation_type_id.required' => 'Le type de réclamation est obligatoire.',
            'description.required' => 'La description détaillée est obligatoire.',
            'description.max' => 'La description ne peut pas dépasser 5 000 caractères.',
            'reclamation_canal_id.required' => 'Le canal de réception est obligatoire.',
            'date_reclamation.required' => 'La date de réclamation est obligatoire.',
            'date_reclamation.before_or_equal' => 'La date de réclamation ne peut pas être future.',
            'departement_id.required' => 'Le département est obligatoire.',
            'priorite.required' => 'La priorité est obligatoire.',
            'priorite.in' => 'La priorité sélectionnée est invalide.',
            'suivi.prohibited' => 'Le statut initial est défini automatiquement.',
            'reponse.prohibited' => 'La réponse ne peut pas être enregistrée à la création.',
            'reclamation_num.prohibited' => 'Le numéro de réclamation est généré automatiquement.',
        ];
    }
}
