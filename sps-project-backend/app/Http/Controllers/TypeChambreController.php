<?php
namespace App\Http\Controllers;

use App\Models\TypeChambre;
use Illuminate\Http\Request;

class TypeChambreController extends Controller
{
    public function getAll()
    {
        $typesChambre = TypeChambre::all();
        return response()->json($typesChambre);
    }

    public function ajouterTypeChambre(Request $request)
    {
            $validatedData = $request->validate([
            'code' => 'required|string|unique:types_chambre,code',
            'type_chambre' => 'required|string',
            'nb_lit' => 'required|integer',
            'nb_salle' => 'required|integer',
            'commentaire' => 'nullable|string',
            ]);
            $typeChambre = TypeChambre::create($validatedData);
            return response()->json($typeChambre, 201);
    }

    public function afficherTypeChambre(string $type_chambre_code)
    {
        $typeChambre = TypeChambre::findOrFail($type_chambre_code);
        return response()->json($typeChambre);
    }

    public function updateTypeChambre(Request $request, string $type_chambre_code)
    {
        $typeChambre = TypeChambre::findOrFail($type_chambre_code);
        $validatedData = $request->validate([
            'code' => 'required|string',
            'type_chambre' => 'required|string',
            'nb_lit' => 'required|integer',
            'nb_salle' => 'required|integer',
            'commentaire' => 'nullable|string',
        ]);
        $typeChambre->update($validatedData);
        return response()->json($typeChambre);
    }

    public function supprimerClient(string $type_chambre_code)
    {
        $typeChambre = TypeChambre::findOrFail($type_chambre_code);
        $typeChambre->delete();

        return response()->json(['message' => 'Type de chambre deleted successfully']);
    }
}
