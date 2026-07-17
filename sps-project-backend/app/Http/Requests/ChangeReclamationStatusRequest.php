<?php

namespace App\Http\Requests;

use App\Models\Reclamation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChangeReclamationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reponse' => $this->filled('reponse') ? trim((string) $this->input('reponse')) : null,
            'note' => $this->filled('note') ? trim((string) $this->input('note')) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'statut' => ['required', Rule::in(Reclamation::STATUSES)],
            'reponse' => ['nullable', 'string', 'max:5000'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
