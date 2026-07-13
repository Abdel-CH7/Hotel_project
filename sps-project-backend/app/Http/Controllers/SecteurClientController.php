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
    $validatedData = $request->validate([
        'secteurClient' => 'required|string|max:255',
        'logoP' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
    ]);

    $secteur = new SecteurClient();
    $secteur->secteurClient = $validatedData['secteurClient'];

    if ($request->hasFile('logoP')) {
        $file = $request->file('logoP');
        $fileName = time() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());

        $secteur->logoP = $file->storeAs(
            'secteurs',
            $fileName,
            'public'
        );
    }

    $secteur->save();

    return response()->json($secteur, 201);
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
    $validatedData = $request->validate([
        'secteurClient' => 'required|string|max:255',
        'logoP' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
    ]);

    $secteurClient = SecteurClient::findOrFail($id);
    $secteurClient->secteurClient = $validatedData['secteurClient'];

    if ($request->hasFile('logoP')) {
        if ($secteurClient->logoP && Storage::disk('public')->exists($secteurClient->logoP)) {
            Storage::disk('public')->delete($secteurClient->logoP);
        }

        $file = $request->file('logoP');
        $fileName = time() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());

        $secteurClient->logoP = $file->storeAs(
            'secteurs',
            $fileName,
            'public'
        );
    }

    $secteurClient->save();

    return response()->json($secteurClient, 200);
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
