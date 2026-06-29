<?php

namespace App\Http\Controllers;

use App\Models\Reclamation;
use App\Models\Historique;
use App\Models\Departement;
use Illuminate\Http\Request;

class ReclamationController extends Controller
{
    // Créer une réclamation
    public function create(Request $request)
    {
        $data = $request->validate([
            'type_reclamation' => 'required|string|max:255',
            'reclamer_a_travers' => 'required|string|max:255',
            'departement_id' => 'required|exists:departements,id',
            'suivi' => 'required|string|in:En cours,En attente,Traité,Résolu',
            'date' => 'required|date',
        ]);

        $reclamation = Reclamation::create($data);

        // Ajouter une entrée dans l'historique
        $reclamation->historique()->create([
            'date' => now(),
            'description' => 'Réclamation reçue et en cours d\'examen',
        ]);

        return response()->json($reclamation, 201);
    }

    // Récupérer toutes les réclamations
    public function index()
    {
        $reclamations = Reclamation::with(['historique', 'departement'])->get();
        return response()->json($reclamations);
    }

    // Mettre à jour une réclamation
    public function update(Request $request, $id)
    {
        $reclamation = Reclamation::findOrFail($id);
        $data = $request->validate([
            'type_reclamation' => 'nullable|string|max:255',
            'reclamer_a_travers' => 'nullable|string|max:255',
            'departement_id' => 'nullable|exists:departements,id',
            'suivi' => 'nullable|string',
            'reponse' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $reclamation->update($data);

        // Ajouter à l'historique
        $reclamation->historique()->create([
            'date' => now(),
            'description' => 'Réclamation mise à jour',
        ]);

        return response()->json($reclamation);
    }

    // Supprimer une réclamation
    public function destroy($id)
    {
        $reclamation = Reclamation::findOrFail($id);
        $reclamation->delete();
        return response()->json(null, 204);
    }

    // Récupérer tous les départements
    public function getDepartments()
    {
        return response()->json(Departement::all());
    }

    // Ajouter un département
    public function addDepartment(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|unique:departements,nom|max:255',
        ]);

        $departement = Departement::create(['nom' => $request->nom]);
        return response()->json($departement, 201);
    }

    // Mettre à jour un département
    public function updateDepartment(Request $request, $id)
    {
        $request->validate([
            'nom' => 'required|string|unique:departements,nom|max:255',
        ]);

        $departement = Departement::findOrFail($id);
        $departement->update(['nom' => $request->nom]);

        return response()->json($departement);
    }

    // Supprimer un département
    public function deleteDepartment($id)
    {
        $departement = Departement::findOrFail($id);
        $departement->delete();

        return response()->json(null, 204);
    }
} 