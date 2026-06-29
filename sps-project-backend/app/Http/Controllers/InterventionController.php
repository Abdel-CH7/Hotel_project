<?php

namespace App\Http\Controllers;

use App\Models\Intervenant;
use App\Models\Equipement;
use App\Models\Intervention;
use App\Models\Agent;


use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class InterventionController extends Controller
{
    public function index()
    {
        // if (Gate::allows('view_all_interventions')) {
            $interventions = Intervention::with(['intervenant', 'equipement', 'prestataire'])->get();


            $intervenants = Intervenant::all();
            $equipements = Equipement::all();
            $prestataires = Agent::where('type', 'Fonction Maintenance')->get();  // Prestataires récupérés

            $count = Intervention::count();

            return response()->json([
                'message' => 'Liste des interventions récupérée avec succès',
                'interventions' => $interventions,
                'intervenants' => $intervenants,
                'equipements' => $equipements,
                'prestataires' => $prestataires, // Ajoutez cette ligne pour envoyer les prestataires
                'count' => $count
            ], 200);
        // } else {
        //     abort(403, 'Vous n\'avez pas l\'autorisation de voir la liste des interventions.');
        // }
    }
        public function store(Request $request)
    {
        $dateIntervention = $request->input('date_intervention');

        // if (Gate::allows('create_interventions')) {
            $validatedData = $request->validate([
                    'type_intervention' => 'required|string',
                    'duree_intervention' => 'required|string',
                    'intervenant_id' => 'required|exists:intervenants,id',
                    'equipement_id' => 'required|exists:equipements,id',
                    'cout_prestation' => 'required|numeric',
                    'frequence' => 'nullable',
                    'prestataire_id' => 'required|exists:agents,id',//
                    'commentaire' => 'nullable|string',
                    'status' => 'required|string',
                    'date_interventions' => 'required|date_format:Y-m-d', // Validation du format de la date
                    // 'date_interventions' => 'nullable|date',

                ]);




                $intervention = Intervention::create($validatedData);


                return response()->json([
                    'message' => 'Intervention ajoutée avec succès',
                    'intervention' => $intervention,
                ], 200);

        // } else {
        //     abort(403, 'Vous n\'avez pas l\'autorisation d\'ajouter des interventions.');
        // }
    }

    public function update(Request $request, $id)
    {
        // if (Gate::allows('update_interventions')) {
                $intervention = Intervention::findOrFail($id);
                $validatedData = $request->validate([
                    'type_intervention' => 'required|string',
                    'duree_intervention' => 'required|string',
                    // 'intervenant_id' => 'required|exists:agents,id',
                    'intervenant_id' => 'required|exists:intervenants,id',
                    'equipement_id' => 'required|exists:equipements,id',
                    'cout_prestation' => 'required|numeric',
                    'frequence' => 'nullable',
                    'prestation' => 'nullable|string',
                    'prestataire_id' => 'nullable|exists:agents,id',//
                    'commentaire' => 'nullable|string',
                    'status' => 'required|string',
                    'date_interventions' => 'required|date_format:Y-m-d', // Validation du format de la date
                ]);
                $intervention->update($validatedData);
                return response()->json(['message' => 'Intervention modifiée avec succès', 'intervention' => $intervention], 200);

        // } else {
        //     abort(403, 'Vous n\'avez pas l\'autorisation de modifier cette intervention.');
        // }
    }

    public function destroy($id)
    {
        // if (Gate::allows('delete_interventions')) {
                $intervention = Intervention::findOrFail($id);
                $intervention->delete();
                return response()->json(['message' => 'Intervention supprimée avec succès'], 200);
        // } else {
        //     abort(403, 'Vous n\'avez pas l\'autorisation de supprimer cette intervention.');
        // }
    }
}
