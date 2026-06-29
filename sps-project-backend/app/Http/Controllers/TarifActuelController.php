<?php
namespace App\Http\Controllers;

use App\Models\TarifActuel;
use App\Models\TarifChambre;
use App\Models\TarifRepas;
use App\Models\TypeReduction;
use App\Models\TarifChambreDetail;
use App\Models\TarifRepasDetail;
use App\Models\TypeChambre;
use App\Models\TypeRepas;
use App\Models\TarifReduction;
use App\Models\TarifReductionDetail;
use Illuminate\Http\Request;

class TarifActuelController extends Controller
{
    public function getAll()
    {
        $tarifsActuel = TarifActuel::with([
            'tarif_chambre',
            'tarif_chambre.tarif_chambre.type_chambre',
            'tarif_repas',
            'tarif_reduction'
            ])->get();
        // tarifsChambreDetail => Detail de Chambre
        // tarifChambre => Designation, Photo de Chambre

        $tarifsChambre = TarifChambreDetail::with(['type_chambre', 'tarif_chambre'])->get();
        $tarifsRepas = TarifRepasDetail::with(['type_repas', 'tarif_repas'])->get();
        $tarifsReduction = TarifReductionDetail::with(['type_reduction', 'tarif_reduction'])->get();
        $tarifChambre = TarifChambre::all();
        $tarifRepas = TarifRepas::all();
        $tarifReduction = TarifReduction::all();
        $typesChambre = TypeChambre::all();
        $typesRepas = TypeRepas::all();
        $typesReduction = TypeReduction::all();
        return response()->json([
            'tarifsActuel' => $tarifsActuel,
            'tarifsChambreDetail' => $tarifsChambre,
            'tarifsRepasDetail' => $tarifsRepas,
            'tarifsReductionDetail' => $tarifsReduction,
            'tarifChambre' => $tarifChambre,
            'tarifRepas' => $tarifRepas,
            'tarifReduction' => $tarifReduction,
            'typesChambre' => $typesChambre,
            'typesRepas' => $typesRepas,
            'typesReduction' => $typesReduction

        ]);
    }
    public function ajouterTarifActuel(Request $request)
    {
        $validatedData = $request->validate([
            'date_debut' => 'required|date|before:date_fin',
            'date_fin' => 'required|date|after:date_debut',
            'tarif_chambre' => 'required|integer|exists:tarifs_chambre,id',
            'tarif_repas' => 'required|integer|exists:tarifs_repas,id',
            'tarif_reduction' => 'required|integer|exists:tarifs_reduction,id',
        ]);
        $tarifActuel = TarifActuel::create($validatedData);
        return response()->json($tarifActuel, 201);

    }

    public function afficherTarifActuel(string $tarif_actuel_code)
    {
        $tarifActuel = TarifActuel::findorFail($tarif_actuel_code);
        return response()->json($tarifActuel);
    }
    public function updateTarifActuel(Request $request, string $tarif_actuel_code)
    {
        $tarifActuel = TarifActuel::findOrFail($tarif_actuel_code);
        $validatedData = $request->validate([
            'date_debut' => 'required|date|before:date_fin',
            'date_fin' => 'required|date|after:date_debut',
            'tarif_chambre' => 'required|integer|exists:tarifs_chambre,id',
            'tarif_repas' => 'required|integer|exists:tarifs_repas,id',
            'tarif_reduction' => 'required|integer|exists:tarifs_reduction,id',
        ]);
        $tarifActuel->update($validatedData);
        return response()->json($tarifActuel);
    }
    public function supprimerTarifActuel(string $tarif_actuel_code)
    {
        $tarifActuel = TarifActuel::findOrFail($tarif_actuel_code);
        $tarifActuel->delete();
        return response()->json(['message' => 'Tarif actuel deleted successfully']);
    }

    public function supprimerTarifsActuel()
    {
        TarifActuel::truncate();
        return response()->json(['message' => 'Tarifs Actuel deleted successfully']);
    }
}
