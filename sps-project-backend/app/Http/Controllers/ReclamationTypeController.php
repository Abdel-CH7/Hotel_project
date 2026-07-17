<?php

namespace App\Http\Controllers;

use App\Models\Reclamation;
use App\Models\ReclamationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReclamationTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => ReclamationType::query()
            ->with('departementParDefaut:id,nom,actif')
            ->orderBy('nom')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $type = ReclamationType::create($this->validated($request));

        return response()->json(['data' => $type->load('departementParDefaut:id,nom,actif')], 201);
    }

    public function update(Request $request, ReclamationType $type): JsonResponse
    {
        $type->update($this->validated($request, $type));

        return response()->json(['data' => $type->fresh()->load('departementParDefaut:id,nom,actif')]);
    }

    public function active(Request $request, ReclamationType $type): JsonResponse
    {
        $data = $request->validate(['actif' => ['required', 'boolean']]);
        $type->update($data);

        return response()->json(['data' => $type->fresh()->load('departementParDefaut:id,nom,actif')]);
    }

    private function validated(Request $request, ?ReclamationType $type = null): array
    {
        return $request->validate([
            'nom' => ['required', 'string', 'max:255', Rule::unique('reclamation_types', 'nom')->ignore($type?->id)],
            'departement_par_defaut_id' => ['nullable', 'integer', 'exists:departements,id'],
            'priorite_par_defaut' => ['nullable', Rule::in(array_keys(Reclamation::PRIORITIES))],
            'actif' => ['sometimes', 'boolean'],
        ], [
            'nom.required' => 'Le nom du type est obligatoire.',
            'nom.unique' => 'Ce type de réclamation existe déjà.',
        ]);
    }
}
