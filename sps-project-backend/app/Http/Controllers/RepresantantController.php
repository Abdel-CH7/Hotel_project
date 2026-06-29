<?php

namespace App\Http\Controllers;

use App\Models\Represantant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RepresantantController extends Controller
{
    /**
     * Store a new represantant.
     */
    public function store(Request $request)
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'represantants' => 'nullable|array',
            'represantants.*.id' => 'nullable',
            'represantants.*.type' => 'nullable',
            'represantants.*.id_agent' => 'required|exists:agents,id',
            'represantants.*.id_Client' => 'nullable',
            'represantants.*.id_SiteClient' => 'nullable',

            'represantants.*.date_debut' => 'nullable|date',
            'represantants.*.date_fin' => 'nullable|date',
        ]);

        // If validation fails, return the errors
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            // Initialize an array to store updated or created represantants
            $updatedRepresantants = [];

            // Loop through each represantant and update or create the record
            foreach ($request->input('represantants') as $represantant) {
                // Check if 'id' is set and not null (update existing record)
                if (isset($represantant['id'])) {
                    $updatedRepresantant = Represantant::updateOrCreate(
                        ['id' => $represantant['id']], // Condition to find existing record
                        [
                            'id_agent' => $represantant['id_agent'],
                            'type' => $represantant['type'],
                            'id_Client' => $represantant['id_Client']?? null,
                            'id_SiteClient' => $represantant['id_SiteClient']?? null,

                            'date_debut' => $represantant['date_debut']?? null,
                            'date_fin' => $represantant['date_fin']?? null,
                        ]
                    );
                } else {
                    // If 'id' is not set, create a new represantant
                    $updatedRepresantant = Represantant::create([
                        'id_agent' => $represantant['id_agent'],
                        'id_Client' => $represantant['id_Client']?? null,
                        'id_SiteClient' => $represantant['id_SiteClient']?? null,

                        'type' => $represantant['type'],
                        'date_debut' => $represantant['date_debut']?? null,
                        'date_fin' => $represantant['date_fin']?? null,
                    ]);
                }

                // Add the updated or created represantant to the array
                $updatedRepresantants[] = $updatedRepresantant;
            }

            // Return a success response with the updated or created represantants
            return response()->json([
                'message' => 'Represantants updated or created successfully',
                'represantants' => $updatedRepresantants
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }



    /**
     * Display a listing of the represantants.
     */
    public function index()
    {
        $represantants = Represantant::with('agent')->get(); // Eager load agents
        return response()->json($represantants, 200);
    }

    /**
     * Display the specified represantant.
     */
    public function show($id)
    {
        $represantant = Represantant::with('agent')->findOrFail($id);
        return response()->json($represantant, 200);
    }

    /**
     * Update the specified represantant.
     */
    public function update(Request $request, $id)
    {
        $represantant = Represantant::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'id_agent' => 'required|exists:agents,id',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        // Update the represantant
        $represantant->update($request->all());

        return response()->json(['message' => 'Represantant updated successfully', 'represantant' => $represantant], 200);
    }

    /**
     * Remove the specified represantant.
     */
    public function destroy($id)
    {
        $represantant = Represantant::findOrFail($id);
        $represantant->delete();

        return response()->json(['message' => 'Represantant deleted successfully'], 200);
    }
}
