<?php

namespace App\Http\Controllers;

use App\Models\Intervention;
use Illuminate\Http\Request;
use App\Models\MaintenanceRecord;


class MaintenanceRecordController extends Controller
{

public function index()
{
    $maintenanceRecords = MaintenanceRecord::with('intervention.equipement')->get();
    $count = MaintenanceRecord::count();
    $interventions = Intervention::all();
    return response()->json([
        'message' => 'Liste des enregistrements de maintenance récupérée avec succès',
        'maintenances' => $maintenanceRecords,
        'interventions' => $interventions,
        'count' => $count
    ], 200);
}


    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'intervention' => 'required|exists:interventions,id',
            'desc_intervention' => 'required|string',
            'nettoyage_outils' => 'required|boolean',
            'nettoyage_ligne' => 'required|boolean',
            'liberation_ligne' => 'required|boolean',
            'visa_responsables' => 'required|string',
        ]);

        $maintenanceRecord = MaintenanceRecord::create($validatedData);

        return response()->json([
            'message' => 'Enregistrement de maintenance ajouté avec succès',
            'maintenanceRecord' => $maintenanceRecord,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $maintenanceRecord = MaintenanceRecord::findOrFail($id);

        $validatedData = $request->validate([
            'intervention' => 'exists:interventions,id',
            'desc_intervention' => 'string',
            'nettoyage_outils' => 'boolean',
            'nettoyage_ligne' => 'boolean',
            'liberation_ligne' => 'boolean',
            'visa_responsables' => 'string',
        ]);

        $maintenanceRecord->update($validatedData);

        return response()->json([
            'message' => 'Enregistrement de maintenance mis à jour avec succès',
            'maintenanceRecord' => $maintenanceRecord,
        ], 200);
    }

    public function destroy($id)
    {
        $maintenanceRecord = MaintenanceRecord::findOrFail($id);
        $maintenanceRecord->delete();

        return response()->json([
            'message' => 'Enregistrement de maintenance supprimé avec succès'
        ], 200);
    }
}
