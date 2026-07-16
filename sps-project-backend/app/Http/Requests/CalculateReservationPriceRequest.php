<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CalculateReservationPriceRequest extends FormRequest
{
    private bool $legacyOccupancyMissing = false;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->legacyOccupancyMissing = $this->has('chambre_ids') && !$this->has('chambres');

        if ($this->filled('reduction_type') && !$this->has('type_reduction_id')) {
            $this->merge(['type_reduction_id' => $this->input('reduction_type')]);
        }
    }

    public function rules(): array
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

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->legacyOccupancyMissing) {
                $validator->errors()->add(
                    'chambres',
                    'Le nombre d’adultes et d’enfants doit être renseigné pour chaque chambre.'
                );
            }
        }];
    }
}
