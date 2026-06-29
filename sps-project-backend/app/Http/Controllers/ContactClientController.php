<?php

namespace App\Http\Controllers;

use App\Models\ContactClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactClientController extends Controller
{


    public function store(Request $request)
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'contacts' => 'nullable|array',
            'contacts.*.type' => 'nullable',
            'contacts.*.name' => 'nullable|string|max:255',
            'contacts.*.prenom' => 'nullable|string|max:255',
            'contacts.*.telephone' => 'nullable|numeric',
            'contacts.*.email' => 'nullable|email|max:255',
        ]);

        // If validation fails, return the errors
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            // Initialize an array to store created contact clients
            $createdContacts = [];

            // Loop through each contact and create a new record
            foreach ($request->input('contacts') as $contact) {
                $createdContact = ContactClient::create([
                    'idClient' => $contact['idClient'],
                    'type' => $contact['type'],
                    'name' => $contact['name'],
                    'prenom' => $contact['prenom']?? null,
                    'telephone' => $contact['telephone']?? null,
                    'email' => $contact['email']?? null,
                ]);

                // Add the created contact to the array
                $createdContacts[] = $createdContact;
            }

            // Return a success response with the created contacts
            return response()->json([
                'message' => 'Contact clients added successfully',
                'contacts' => $createdContacts
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request)
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'contacts' => 'nullable|array',
            'contacts.*.id' => 'nullable|exists:contact_clients,id',
            'contacts.*.type' => 'nullable',
            'contacts.*.name' => 'required|string|max:255',
            'contacts.*.prenom' => 'nullable|string',
            'contacts.*.telephone' => 'nullable|numeric',
            'contacts.*.email' => 'nullable|email|max:255',
        ]);

        // If validation fails, return the errors
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            // Initialize an array to store updated or created contact clients
            $updatedContacts = [];

            // Loop through each contact and update or create the record
            foreach ($request->input('contacts') as $contact) {
                // Check if 'id' is set and not null
                if (isset($contact['id'])) {
                    $updatedContact = ContactClient::updateOrCreate(
                        ['id' => $contact['id']], // Condition to find existing record
                        [
                            'idClient' => $contact['idClient']?? null,
                            'type' => $contact['type']?? null,
                            'name' => $contact['name']?? null,
                            'prenom' => $contact['prenom']?? null,
                            'telephone' => $contact['telephone']?? null,
                            'email' => $contact['email']?? null,
                        ]
                    );
                } else {
                    // Handle the case where 'id' is not set
                    $updatedContact = ContactClient::create([
                        'idClient' => $contact['idClient']?? null,
                        'type' => $contact['type']?? null,
                        'name' => $contact['name']?? null,
                        'prenom' => $contact['prenom']?? null,
                        'telephone' => $contact['telephone']?? null,
                        'email' => $contact['email']?? null,
                    ]);
                }

                // Add the updated or created contact to the array
                $updatedContacts[] = $updatedContact;
            }

            // Return a success response with the updated or created contacts
            return response()->json([
                'message' => 'Contact clients updated or created successfully',
                'contacts' => $updatedContacts
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }





public function destroy($id)
{

        try {
            $client = ContactClient::findOrFail($id);
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
