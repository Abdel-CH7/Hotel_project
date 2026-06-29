<?php
namespace App\Http\Controllers;

use App\Models\TypeReduction;
use Illuminate\Http\Request;

class TypeReductionController extends Controller
{
    public function getAll()
    {
        $typesReduction = TypeReduction::all();
        return response()->json(['typesReduction' => $typesReduction]);
    }

    public function ajouterTypeReduction(Request $request)
    {
            $validatedData = $request->validate([
            'code' => 'required|string|unique:types_reduction,code',
            'type_reduction' => 'required|string',
            ]);
            $typeReduction = TypeReduction::create($validatedData);
            return response()->json($typeReduction, 201);
    }

    public function afficherTypeReduction(string $type_reduction_code)
    {
        $typeReduction = TypeReduction::findOrFail($type_reduction_code);
        return response()->json($typeReduction);
    }

    public function updateTypeReduction(Request $request, string $type_reduction_code)
    {
        $typeReduction = TypeReduction::findOrFail($type_reduction_code);
        $validatedData = $request->validate([
            'code' => 'required|string',
            'type_reduction' => 'required|string',
        ]);
        $typeReduction->update($validatedData);
        return response()->json($typeReduction);
    }

    public function supprimerClient(string $type_reduction_code)
    {
        $typeReduction = TypeReduction::findOrFail($type_reduction_code);
        $typeReduction->delete();

        return response()->json(['message' => 'Type de Reduction deleted successfully']);
    }
}
