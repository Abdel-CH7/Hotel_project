<?php
namespace App\Http\Controllers;

use App\Models\TarifChambreDetail;
use App\Models\TarifChambre;
use App\Models\TypeChambre;
use Illuminate\Http\Request;

class TarifChambreDetailController extends Controller
{
    public function getAll()
    {
        $typesChambre = TypeChambre::all();
        $tarifsChambreDetail = TarifChambreDetail::with(['type_chambre', 'tarif_chambre'])->get();
        $tarifsChambre = TarifChambre::all();
        return response()->json([
            "tarifsChambreDetail" => $tarifsChambreDetail,
            "typesChambre" => $typesChambre,
            "tarifsChambre" => $tarifsChambre
        ]);
    }

    public function ajouterTarifChambreDetail(Request $request)
    {
        $validatedData = $request->validate([
            'code' => 'required|string|unique:tarif_chambre_detail,code|max:255',
            'tarif_chambre' => 'required|exists:tarifs_chambre,id|integer',
            'type_chambre' => 'required|exists:types_chambre,id|integer',
            'single' => 'required|numeric',
            'double' => 'required|numeric',
            'triple' => 'required|numeric',
            'lit_supp' => 'required|integer|min:0',
        ]);
        $tarifChambre = TarifChambreDetail::create($validatedData);
        return response()->json($tarifChambre, 201);
    }

    public function afficherTarifChambreDetail(string $tarif_chambre_code)
    {
        $tarifChambre = TarifChambreDetail::with('typeChambre')->findOrFail($tarif_chambre_code);
        return response()->json($tarifChambre);
    }

    public function updateTarifChambreDetail(Request $request, string $tarif_chambre_code)
    {
        $tarifChambre = TarifChambreDetail::findOrFail($tarif_chambre_code);
        $validatedData = $request->validate([
            'code' => 'required|string',
            'tarif_chambre' => 'required|exists:tarifs_chambre,id|integer',
            'type_chambre' => 'required|exists:types_chambre,id|integer',
            'single' => 'required|numeric',
            'double' => 'required|numeric',
            'triple' => 'required|numeric',
            'lit_supp' => 'required|integer|min:0',
        ]);
        $tarifChambre->update($validatedData);
        return response()->json($tarifChambre);

    }

    public function supprimerTarifChambreDetail(string $tarif_chambre_code)
    {
        $tarifChambre = TarifChambreDetail::findOrFail($tarif_chambre_code);
        $tarifChambre->delete();
        return response()->json(['message' => 'Tarif chambre deleted successfully']);
    }

}
