<?php

namespace App\Http\Controllers;

use App\Models\SecteurClient; // Assurez-vous d'importer le modèle
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SecteurClientController extends Controller
{
    /**
     * Affiche la liste des secteurs clients.
     */
    public function index()
    {
        $secteursClients = SecteurClient::all(); // Récupère tous les secteurs clients
        return response()->json($secteursClients); // Retourne les données en format JSON
    }

    /**
     * Stocke un nouveau secteur client.
     */
    public function store(Request $request)
    {
        $request->validate([
            'secteurClient' => 'required|string|max:255', // Validation des données
            'logoP' => '|image|mimes:jpeg,png,jpg,gif|max:2048', // Category logo validation

        ]);
        $secteur = new SecteurClient();
        $secteur->secteurClient = $request->input('secteurClient');
        $photo = $request->file('logoP');
        // Deleting Old Photo and Inserting The New Photo
        if ($request->hasFile('logoP')) {
            // Storage::disk('public')->delete($vue->photo);
            $photoPath = $photo->storeAs('logoP', time() . '_' . $photo->getClientOriginalName(), 'public');
            $secteur['logoP'] = $photoPath;
        }
        $secteurClient= $secteur->save();

        return response()->json($secteurClient, 201); // Retourne le secteur créé avec un code 201
    }

    /**
     * Affiche un secteur client spécifique.
     */
    public function show($id)
    {
        $secteurClient = SecteurClient::findOrFail($id); // Trouve le secteur client ou renvoie une erreur 404
        return response()->json($secteurClient);
    }

    /**
     * Met à jour un secteur client existant.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'secteurClient' => 'required|string|max:255',
            'logoP' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Category logo validation
        ]);

        $secteurClient = SecteurClient::findOrFail($id);
        $secteurClient->secteurClient = $request->input('secteurClient');
        if ($request->hasFile('logoP')) {
            $photo = $request->logoP;
            $photoPath = $photo->storeAs('logoP', time() . '_' . $photo->getClientOriginalName(), 'public');
            $secteurClient->logoP = $photoPath;
        }
        $secteurClient->save(); // Save the updated model

        return response()->json($secteurClient);
    }

    /**
     * Supprime un secteur client.
     */
    public function destroy($id)
    {
        $secteurClient = SecteurClient::findOrFail($id);
        $secteurClient->delete(); // Supprime le secteur client

        return response()->json(null, 204); // Retourne un code 204 No Content
    }
}
