<?php

namespace App\Http\Controllers;

use App\Models\TypeRepas;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TypeRepasController extends Controller
{
    public function getAll()
    {
        return response()->json(['typesRepas' => TypeRepas::orderBy('type_repas')->get()]);
    }

    public function ajouterTypeRepas(Request $request)
    {
        return response()->json(TypeRepas::create($this->validatedData($request)), 201);
    }

    public function afficherTypeRepas(TypeRepas $typeRepas)
    {
        return response()->json($typeRepas);
    }

    public function updateTypeRepas(Request $request, TypeRepas $typeRepas)
    {
        $typeRepas->update($this->validatedData($request, $typeRepas));

        return response()->json($typeRepas->refresh());
    }

    public function supprimerTypeRepas(TypeRepas $typeRepas)
    {
        if ($typeRepas->tariffDetails()->exists()) {
            return response()->json([
                'message' => 'Ce type de repas ne peut pas être supprimé car il est utilisé par des tarifs.',
            ], 409);
        }

        $typeRepas->delete();

        return response()->json(['message' => 'Type de repas supprimé avec succès.']);
    }

    private function validatedData(Request $request, ?TypeRepas $typeRepas = null): array
    {
        $request->merge([
            'code' => trim((string) $request->input('code', '')),
            'type_repas' => trim((string) $request->input('type_repas', '')),
        ]);

        return $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('types_repas', 'code')->ignore($typeRepas?->id)],
            'type_repas' => ['required', 'string', 'max:100', Rule::unique('types_repas', 'type_repas')->ignore($typeRepas?->id)],
        ]);
    }
}
