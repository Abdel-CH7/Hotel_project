<?php

namespace App\Http\Controllers;

use App\Models\EtatChambre;
use App\Models\MaintenanceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class EtatChambreController extends Controller
{
    public function index()
    {
        $etatChambres = EtatChambre::with(['chambre', 'maintenanceType'])->get();
        return response()->json($etatChambres);
    }

    public function show($num_chambre)
    {
        $etatChambre = EtatChambre::with(['chambre', 'maintenanceType'])
            ->where('num_chambre', $num_chambre)
            ->first();

        if (!$etatChambre) {
            return response()->json(['message' => 'État chambre non trouvé'], 404);
        }

        return response()->json($etatChambre);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'num_chambre' => 'required|exists:chambres,num_chambre',
            'status' => 'required|string',
            'date_nettoyage' => 'nullable|date',
            'nettoyée_par' => 'nullable|string',
            'maintenance' => 'required|boolean',
            'maintenance_type_id' => 'required_if:maintenance,true|exists:types_maintenance,id',
            'date_debut_maintenance' => 'required_if:maintenance,true|date',
            'date_fin_maintenance' => 'required_if:maintenance,true|date|after_or_equal:date_debut_maintenance',
            'commentaire' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $etatChambre = EtatChambre::create($request->all());
        return response()->json($etatChambre, 201);
    }

    public function update(Request $request, $num_chambre)
    {
        $etatChambre = EtatChambre::where('num_chambre', $num_chambre)->first();

        if (!$etatChambre) {
            return response()->json(['message' => 'État chambre non trouvé'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|required|string',
            'date_nettoyage' => 'nullable|date',
            'nettoyée_par' => 'nullable|string',
            'maintenance' => 'sometimes|required|boolean',
            'maintenance_type_id' => 'required_if:maintenance,true|exists:types_maintenance,id',
            'date_debut_maintenance' => 'required_if:maintenance,true|date',
            'date_fin_maintenance' => 'required_if:maintenance,true|date|after_or_equal:date_debut_maintenance',
            'commentaire' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $etatChambre->update($request->all());
        return response()->json($etatChambre);
    }

    public function destroy($num_chambre)
    {
        $etatChambre = EtatChambre::where('num_chambre', $num_chambre)->first();

        if (!$etatChambre) {
            return response()->json(['message' => 'État chambre non trouvé'], 404);
        }

        $etatChambre->delete();
        return response()->json(['message' => 'État chambre supprimé avec succès']);
    }

    public function getMaintenanceTypes()
    {
        $types = MaintenanceType::all();
        return response()->json($types);
    }

    public function getChambresWithEtat()
    {
        $etatChambres = EtatChambre::with(['chambre', 'maintenanceType'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($etatChambres);
    }
}