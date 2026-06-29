<?php

namespace App\Http\Controllers;

use App\Http\Requests\AgentRequest;
use App\Models\Intervenant;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class IntervenantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $agents = Intervenant::all();
        $count = Intervenant::count();

                return response()->json([
                    'message' => 'Liste des Agents récupérée avec succès',
                    'agents' => $agents,
                    'count' => $count
                ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
            // Define validation rules
            $validatedData = $request->validate([
                'NomAgent' => 'required|string|max:255', // Required, string, max length 255
                'PrenomAgent' => 'required|string|max:255', // Optional, string, max length 255
                'SexeAgent' => 'nullable|in:Masculin,Feminin', // Optional, must be either 'Masculin' or 'Feminin'
                'EmailAgent' => 'nullable|email|unique:intervenants,EmailAgent|max:100', // Optional, must be unique and a valid email format
                'TelAgent' => 'nullable|string|max:15', // Optional, max length 15
                'AdresseAgent' => 'nullable|string|max:255', // Optional, max length 255
                'VilleAgent' => 'nullable|string|max:100', // Optional, max length 100
                'CodePostalAgent' => 'nullable|string|max:10', // Optional, max length 10
            ]);

            $agent = Intervenant::create($validatedData);

            return response()->json(['agent' => $agent], 201);
    }



    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
            $agent = Intervenant::with('agenceLocation')->findOrFail($id);
            $agent_agencelocation = [
                'id'=>$agent->id,
                'NomAgent' => $agent->NomAgent,
                'PrenomAgent' => $agent->PrenomAgent,
                'SexeAgent' => $agent->SexeAgent,
                'EmailAgent' => $agent->EmailAgent,
                'TelAgent' => $agent->TelAgent,
                'AdresseAgent' => $agent->AdresseAgent,
                'VilleAgent' => $agent->VilleAgent,
                'CodePostalAgent' => $agent->CodePostalAgent,
                'NomAgence' => $agent->agenceLocation->NomAgence,
            ];

            return response()->json($agent_agencelocation, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(AgentRequest $request, string $id)
    {
            $agent = Intervenant::findOrFail($id);
            $validatedData = $request->validate($request->rules());
            $agent->update($validatedData);
            return response()->json(['agent' => $agent], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $agent = Intervenant::findOrFail($id);
        $agent->delete();
        return response()->json(['message' => 'Agency deleted successfully'], 200);
    }
}

