<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TypeReduction;
use App\Models\TarifReduction;
use App\Models\TarifReductionDetail;

class TarifReductionDetailController extends Controller
{
    public function getAll()
    {
        $tarifsReductionDetail = TarifReductionDetail::with(['type_reduction', 'tarif_reduction'])->get();
        $tarifsReduction = TarifReduction::all();
        $typesReduction = TypeReduction::all();
        return response()->json([
            "tarifsReductionDetail" => $tarifsReductionDetail,
            "tarifsReduction" => $tarifsReduction,
            "typesReduction" => $typesReduction,
        ]);
    }
    public function ajouterTarifReductionDetail(Request $request)
    {
        $validatedData = $request->validate([
            'tarif_reduction' => 'required|exists:tarifs_reduction,id|integer',
            'type_reduction' => 'required|exists:types_reduction,id|integer',
            'montant' => 'required|integer|min:0',
            'percentage' => 'required|integer|min:0|max:100',
        ]);
        $tarifReduction = TarifReductionDetail::create($validatedData);
        return response()->json($tarifReduction, 201);
    }

    public function afficherTarifReductionDetail(string $tarif_reduction_code)
    {
        $tarifReduction = TarifReductionDetail::findOrFail($tarif_reduction_code);
        return response()->json($tarifReduction);
    }

    public function updateTarifReductionDetail(Request $request, string $tarif_reduction_code)
    {
        $tarifReduction = TarifReductionDetail::findOrFail($tarif_reduction_code);
        $validatedData = $request->validate([
            'tarif_reduction' => 'required|exists:tarifs_reduction,id|integer',
            'type_reduction' => 'required|exists:types_reduction,id|integer',
            'montant' => 'required|integer|min:0',
            'percentage' => 'required|integer|min:0|max:100',
            ]);
        $tarifReduction->update($validatedData);
        return response()->json($tarifReduction);
    }
    public function supprimerTarifReductionDetail(string $tarif_reduction_code)
    {
        $tarifReduction = TarifReductionDetail::findOrFail($tarif_reduction_code);
        $tarifReduction->delete();
        return response()->json(['message' => 'Tarif reduction deleted successfully']);
    }

    public function supprimerTarifsReduction()
    {
        TarifReductionDetail::truncate();
        return response()->json(['message' => 'Tarifs Repas deleted successfully']);
    }
}
