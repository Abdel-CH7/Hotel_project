<?php

namespace App\Http\Controllers;

use App\Models\Enfant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EnfantController extends Controller
{


    public function store(Request $request)
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'type' => 'nullable',
            'name' => 'nullable|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'age' => 'nullable|numeric',
        ]);

        // If validation fails, return the errors
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            // Initialize an array to store created info clients
            $createdEnfant = [];

            // Loop through each info and create a new record
            foreach ($request->input('infos') as $enfant) {
                $createdEnfant = Enfant::create([
                    'idClient' => $enfant['idClient'],
                    'type' => $enfant['type'],
                    'name' => $enfant['name'],
                    'prenom' => $enfant['prenom']?? null,
                    'age' => $enfant['age']?? null,
                ]);

                // Add the created info to the array
                $createds[] = $createdEnfant;
            }

            // Return a success response with the created infos
            return response()->json([
                'message' => 'Info clients added successfully',
                'infos' => $createds
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request)
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'infos' => 'nullable|array',
            'id' => 'nullable|exists:info_clients,id',
            'type' => 'nullable',
            'name' => 'required|string|max:255',
            'prenom' => 'nullable|string',
            'age' => 'nullable|numeric',
        ]);

        // If validation fails, return the errors
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            // Initialize an array to store updated or created info clients
            $updatedEnfants = [];

            // Loop through each info and update or create the record
            foreach ($request->input('infos') as $enfant) {
                // Check if 'id' is set and not null
                if (isset($enfant['id'])) {
                    $updatedEnfant = Enfant::updateOrCreate(
                        ['id' => $enfant['id']], // Condition to find existing record
                        [
                            'idClient' => $enfant['idClient']?? null,
                            'type' => $enfant['type']?? null,
                            'name' => $enfant['name']?? null,
                            'prenom' => $enfant['prenom']?? null,
                            'age' => $enfant['age']?? null,
                        ]
                    );
                } else {
                    // Handle the case where 'id' is not set
                    $updatedEnfant = Enfant::create([
                        'idClient' => $enfant['idClient']?? null,
                        'type' => $enfant['type']?? null,
                        'name' => $enfant['name']?? null,
                        'prenom' => $enfant['prenom']?? null,
                        'age' => $enfant['age']?? null,
                    ]);
                }

                // Add the updated or created info to the array
                $updatedEnfants[] = $updatedEnfant;
            }

            // Return a success response with the updated or created infos
            return response()->json([
                'message' => 'Info clients updated or created successfully',
                'enfant' => $updatedEnfants
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    public function destroy($id)
    {
        try {
            $client = Enfant::findOrFail($id);
            $client->delete();

            return response()->json(['message' => 'Client supprimé avec succès'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        } catch (\Illuminate\Database\QueryException $e) {
            // Vérifier si l'erreur est liée à une contrainte d'intégrité
            if ($e->errorInfo[1] === 1451) {
                // Renvoyer le message d'erreur spécifique
                return response()->json(['error' => 'Impossible de supprimer ce client car il est associées a d\'autres platformes.'], 400);
            } else {
                // Renvoyer l'erreur par défaut
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }
}
}
