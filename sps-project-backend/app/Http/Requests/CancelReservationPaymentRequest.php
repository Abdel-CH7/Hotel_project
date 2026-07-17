<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelReservationPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'motif_annulation' => trim((string) $this->input('motif_annulation')),
        ]);
    }

    public function rules(): array
    {
        return [
            'motif_annulation' => ['required', 'string', 'min:3', 'max:1000'],
            'annule_par_id' => ['prohibited'],
            'cancelled_by' => ['prohibited'],
            'cancelled_by_id' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'motif_annulation.required' => 'Le motif d’annulation est obligatoire.',
            'motif_annulation.min' => 'Le motif d’annulation doit contenir au moins 3 caractères.',
            'motif_annulation.max' => 'Le motif d’annulation ne peut pas dépasser 1000 caractères.',
            'annule_par_id.prohibited' => 'L’utilisateur d’annulation est déterminé automatiquement.',
            'cancelled_by.prohibited' => 'L’utilisateur d’annulation est déterminé automatiquement.',
            'cancelled_by_id.prohibited' => 'L’utilisateur d’annulation est déterminé automatiquement.',
        ];
    }
}
