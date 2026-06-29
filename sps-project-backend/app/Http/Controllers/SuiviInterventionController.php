<?php

namespace App\Http\Controllers;

use App\Models\SuiviIntervention;
use App\Models\Intervention;
use App\Models\Agent;
use App\Models\Equipement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SuiviInterventionController extends Controller
{
    public function index()
    {
        $suiviInterventions = SuiviIntervention::with(['intervention', 'prestataire', 'equipement'])->get();
        $equipements = Equipement::all();
        $agents = Agent::all();
        $interventions = Intervention::all();
        $count = SuiviIntervention::count();

        return response()->json([
            'message' => 'Liste des suivis d\'interventions récupérée avec succès',
            'suiviInterventions' => $suiviInterventions,
            'equipements' => $equipements,
            'agents' => $agents,
            'interventions' => $interventions,
            'count' => $count,
        ], 200);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'intervention' => 'required|exists:interventions,id',
            'prestataire' => 'required|exists:agents,id',
            'equipement' => 'required|exists:equipements,id',
        ]);

        $suiviIntervention = SuiviIntervention::create($validatedData);

        return response()->json([
            'message' => 'Suivi d\'intervention ajouté avec succès',
            'suiviIntervention' => $suiviIntervention,
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $suiviIntervention = SuiviIntervention::findOrFail($id);

        $validatedData = $request->validate([
            'intervention' => 'required|exists:interventions,id',
            'prestataire' => 'required|exists:agents,id',
            'equipement' => 'required|exists:equipements,id',
        ]);

        $suiviIntervention->update($validatedData);

        return response()->json([
            'message' => 'Suivi d\'intervention modifié avec succès',
            'suiviIntervention' => $suiviIntervention,
        ], 200);
    }

    public function destroy($id)
    {
        $suiviIntervention = SuiviIntervention::findOrFail($id);
        $suiviIntervention->delete();

        return response()->json([
            'message' => 'Suivi d\'intervention supprimé avec succès',
        ], 200);
    }
}
