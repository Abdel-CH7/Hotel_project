<?php
namespace App\Http\Controllers;

use App\Models\TypeRepas;
use Illuminate\Http\Request;

class TypeRepasController extends Controller
{
    public function getAll()
    {
        $typesRepas = TypeRepas::all();
        return response()->json(['typesRepas' => $typesRepas]);
    }

    public function ajouterTypeRepas(Request $request)
    {
            $validatedData = $request->validate([
            'code' => 'required|string|unique:types_repas,code',
            'type_repas' => 'required|string',
            ]);
            $typeRepas = TypeRepas::create($validatedData);
            return response()->json($typeRepas, 201);
    }

    public function afficherTypeRepas(string $types_repas_code)
    {
        $typeRepas = TypeRepas::findOrFail($types_repas_code);
        return response()->json($typeRepas);
    }

    public function updateTypeRepas(Request $request, string $types_repas_code)
    {
        $typeRepas = TypeRepas::findOrFail($types_repas_code);
        $validatedData = $request->validate([
            'code' => 'required|string',
            'type_repas' => 'required|string',
        ]);
        $typeRepas->update($validatedData);
        return response()->json($typeRepas);
    }

    public function supprimerClient(string $types_repas_code)
    {
        $typeRepas = TypeRepas::findOrFail($types_repas_code);
        $typeRepas->delete();

        return response()->json(['message' => 'Type de Repas deleted successfully']);
    }
}
