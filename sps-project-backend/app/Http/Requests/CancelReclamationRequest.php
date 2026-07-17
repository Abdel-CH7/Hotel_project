<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelReclamationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['motif' => trim((string) $this->input('motif'))]);
    }

    public function rules(): array
    {
        return ['motif' => ['required', 'string', 'min:3', 'max:1000']];
    }

    public function messages(): array
    {
        return [
            'motif.required' => 'Le motif d’annulation est obligatoire.',
            'motif.min' => 'Le motif d’annulation doit contenir au moins 3 caractères.',
            'motif.max' => 'Le motif d’annulation ne peut pas dépasser 1 000 caractères.',
        ];
    }
}
