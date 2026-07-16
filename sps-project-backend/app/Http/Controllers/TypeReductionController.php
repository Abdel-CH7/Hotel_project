<?php

namespace App\Http\Controllers;

use App\Models\TypeReduction;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TypeReductionController extends Controller
{
    public function getAll()
    {
        return response()->json(['typesReduction' => TypeReduction::orderBy('type_reduction')->get()]);
    }

    public function ajouterTypeReduction(Request $request)
    {
        return response()->json(TypeReduction::create($this->validatedData($request)), 201);
    }

    public function afficherTypeReduction(TypeReduction $typeReduction)
    {
        return response()->json($typeReduction);
    }

    public function updateTypeReduction(Request $request, TypeReduction $typeReduction)
    {
        $typeReduction->update($this->validatedData($request, $typeReduction));

        return response()->json($typeReduction->refresh());
    }

    public function supprimerTypeReduction(TypeReduction $typeReduction)
    {
        if ($typeReduction->tariffDetails()->exists()) {
            return response()->json([
                'message' => 'Ce type de réduction ne peut pas être supprimé car il est utilisé par des tarifs.',
            ], 409);
        }

        $typeReduction->delete();

        return response()->json(['message' => 'Type de réduction supprimé avec succès.']);
    }

    private function validatedData(Request $request, ?TypeReduction $typeReduction = null): array
    {
        $request->merge([
            'code' => trim((string) $request->input('code', '')),
            'type_reduction' => trim((string) $request->input('type_reduction', '')),
        ]);

        return $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('types_reduction', 'code')->ignore($typeReduction?->id)],
            'type_reduction' => ['required', 'string', 'max:100', Rule::unique('types_reduction', 'type_reduction')->ignore($typeReduction?->id)],
        ]);
    }
}
