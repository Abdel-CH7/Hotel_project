<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use Illuminate\Http\Request;
use App\Http\Requests\AgentRequest;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Validator;

class AgentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $agents = Agent::orderBy('id', 'desc')->get();
            return response()->json(['agents' => $agents], 200); // Assurez-vous de renvoyer la clé correcte
        } catch (\Exception $e) {
            return response()->json(['message' => 'An error occurred while fetching agents', 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Define validation rules
            $validator = Validator::make($request->all(), [
                'NomAgent' => 'required|string|max:255', 
                'PrenomAgent' => 'required|string|max:255', 
                'SexeAgent' => 'nullable|in:Masculin,Feminin', 
                'EmailAgent' => 'nullable|email|unique:agents,EmailAgent|max:100', 
                'TelAgent' => 'nullable|string|max:15', 
                'AdresseAgent' => 'nullable|string|max:255', 
                'VilleAgent' => 'nullable',
                'CodePostalAgent' => 'nullable', 
                'type' => 'nullable', 

            ]);
    
            // Check for validation failure
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
    
            // Create the agent
            $agent = Agent::create($request->all());
    
            return response()->json(['agent' => $agent], 201);
        } catch (QueryException $e) {
            return response()->json(['message' => 'Error creating agent', 'error' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            return response()->json(['message' => 'An unexpected error occurred', 'error' => $e->getMessage()], 500);
        }
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $agent = Agent::with('agenceLocation')->findOrFail($id);
            
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
        } catch (\Exception $e) {
            return response()->json(['message' => 'Agent not found', 'error' => $e->getMessage()], 404);
        }
    }        

    /**
     * Update the specified resource in storage.
     */
    public function update(AgentRequest $request, string $id)
    {
        try {
            $agent = Agent::findOrFail($id);
            $validatedData = $request->validate($request->rules());
            $agent->update($validatedData);
            return response()->json(['agent' => $agent], 200);
        } catch (QueryException $e) {
            return response()->json(['message' => 'Error updating agent', 'error' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Validation error', 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $agent = Agent::findOrFail($id);
            $agent->delete();
            return response()->json(['message' => 'Agency deleted successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'An error occurred while deleting the agency', 'error' => $e->getMessage()], 500);
        }
    }
}