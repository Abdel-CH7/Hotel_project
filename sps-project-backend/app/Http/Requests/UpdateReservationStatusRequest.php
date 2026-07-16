<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReservationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['en attente', 'confirmé', 'annulé'])],
            'cancellation_reason' => ['nullable', 'string', 'max:2000', 'required_if:status,annulé'],
        ];
    }
}
