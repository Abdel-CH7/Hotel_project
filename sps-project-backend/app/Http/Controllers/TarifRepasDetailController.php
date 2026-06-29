<?php

namespace App\Http\Controllers;

use App\Models\TarifRepas;
use Illuminate\Http\Request;
use App\Models\TarifRepasDetail;
use App\Models\TypeRepas;

class TarifRepasDetailController extends Controller
{
    public function getAll()
    {
        $tarifRepas = TarifRepasDetail::with(['type_repas', 'tarif_repas'])->get();
        $tarifsRepas = TarifRepas::all();
        $typesRepas = TypeRepas::all();
        return response()->json([
            "tarifRepas" => $tarifRepas,
            "tarifsRepas" => $tarifsRepas,
            "typesRepas" => $typesRepas
        ]);
    }

    public function ajouterTarifRepasDetail(Request $request)
    {
        $validatedData = $request->validate([
        'type_repas' => 'required|integer|max:255',
        'montant' => 'required|integer|min:0',
        'tarif_repas' => 'required|exists:tarifs_repas,id|integer',
        ]);

        $tarifRepas = TarifRepasDetail::create($validatedData);

        return response()->json($tarifRepas, 201);
    }

    public function afficherTarifRepasDetail(string $tarif_repas_code)
    {
        $tarifRepas = TarifRepasDetail::findOrFail($tarif_repas_code);
        return response()->json($tarifRepas);
    }

    public function updateTarifRepasDetail(Request $request, string $tarif_repas_code)
    {
        $tarifRepas = TarifRepasDetail::findOrFail($tarif_repas_code);
        $validatedData = $request->validate([
        'type_repas' => 'required|integer|max:255',
        'montant' => 'required|integer|min:0',
        'tarif_repas' => 'required|exists:tarifs_repas,id|integer',
        ]);
        $tarifRepas->update($validatedData);
        return response()->json($tarifRepas);

    }

    public function supprimerTarifRepasDetail(string $tarif_repas_code)
    {
        $tarifRepas = TarifRepasDetail::findOrFail($tarif_repas_code);
        $tarifRepas->delete();
        return response()->json(['message' => 'Tarif repas deleted successfully']);
    }

    public function supprimerTarifsRepas()
    {
        TarifRepasDetail::truncate();
        return response()->json(['message' => 'Tarifs Repas deleted successfully']);
    }

}

