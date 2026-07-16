<?php

namespace App\Http\Controllers;

use App\Models\TypeChambre;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TypeChambreController extends Controller
{
    public function getAll()
    {
        return response()->json(TypeChambre::orderBy('type_chambre')->get());
    }

    public function ajouterTypeChambre(Request $request)
    {
        $typeChambre = TypeChambre::create($this->validatedData($request));

        return response()->json($typeChambre, 201);
    }

    public function afficherTypeChambre(TypeChambre $typeChambre)
    {
        return response()->json($typeChambre);
    }

    public function updateTypeChambre(Request $request, TypeChambre $typeChambre)
    {
        $typeChambre->update($this->validatedData($request, $typeChambre));

        return response()->json($typeChambre->refresh());
    }

    public function supprimerTypeChambre(TypeChambre $typeChambre)
    {
        if ($typeChambre->chambres()->exists()) {
            return response()->json([
                'message' => 'Ce type ne peut pas être supprimé car il est utilisé par des chambres.',
            ], 409);
        }

        if ($typeChambre->tarifChambreDetails()->exists()) {
            return response()->json([
                'message' => 'Ce type ne peut pas être supprimé car il est utilisé par des tarifs.',
            ], 409);
        }

        $typeChambre->delete();

        return response()->json([
            'message' => 'Type de chambre supprime avec succes.',
        ]);
    }

    private function validatedData(Request $request, ?TypeChambre $typeChambre = null): array
    {
        $request->merge([
            'code' => trim((string) $request->input('code', '')),
            'type_chambre' => trim((string) $request->input('type_chambre', '')),
            'commentaire' => $request->filled('commentaire')
                ? trim((string) $request->input('commentaire'))
                : null,
        ]);

        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('types_chambre', 'code')->ignore($typeChambre?->id),
            ],
            'type_chambre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('types_chambre', 'type_chambre')->ignore($typeChambre?->id),
            ],
            'nb_lit' => ['required', 'integer', 'min:1'],
            'nb_salle' => ['required', 'integer', 'min:1'],
            'capacite_standard' => ['nullable', 'integer', 'min:1', 'max:3'],
            'lits_supplementaires_max' => ['nullable', 'integer', 'min:0'],
            'commentaire' => ['nullable', 'string'],
        ]);
    }
}
