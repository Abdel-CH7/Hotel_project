<?php

namespace App\Http\Controllers;

use App\Models\SiteClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class SiteClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $siteclient = SiteClient::with('client', 'zone', 'user','region','contactSiteClients','secteur','agent','represantant','lastRepresantant', 'contact_site_clients')->get();
        $count = SiteClient::count();
        return response()->json([
            'message' => 'Liste des SiteClient récupérée avec succès', 'siteclient' =>  $siteclient,
            'count' => $count
        ], 200);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'CodeSiteclient' => 'required|unique:site_clients,CodeSiteclient',
                'raison_sociale' => 'required',
                'adresse' => 'required',
                'tele' => 'nullable',
                'ville' => 'nullable',
                'abreviation' => 'nullable',
                'seince' => 'nullable',
                'mod_id' => 'nullable',
                'secteur_id' => 'nullable',
                'ice' => 'nullable',
                'montant_plafond' => 'nullable',
                'categorie' => 'nullable',
                'code_postal' => 'nullable',
                'zone_id' => 'nullable',
                'region_id' => 'nullable',
                'logoSC' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'client_id' => 'nullable',
            ]);

            // Storing Photo
            $photo = $request->file('logoSC');
            // Deleting Old Photo and Inserting The New Photo
            if ($request->hasFile('logoSC')) {
                // Storage::disk('public')->delete($tarifRepas->photo);
                $photoPath = $photo->storeAs('logoSC-societe', time() . '_' . $photo->getClientOriginalName(), 'public');
                $validatedData['logoSC'] = $photoPath;
            }
            $client = SiteClient::create($validatedData);
            return response()->json(['message' => 'SieClient ajouté avec succès', 'siteclient' => $client], 200);
    }
    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $siteclient = SiteClient::findOrFail($id);
        return response()->json(['siteclient' => $siteclient]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $siteclient = SiteClient::findOrFail($id);
        $validatedData = $request->validate([
                'CodeSiteclient' => 'required|unique:site_clients,CodeSiteclient,' .$id,
                'raison_sociale' => 'required',
                'adresse' => 'required',
                'tele' => 'nullable',
                'ville' => 'nullable',
                'abreviation' => 'nullable',
                'seince' => 'nullable',
                'mod_id' => 'nullable',
                'secteur_id' => 'nullable',
                'ice' => 'nullable',
                'code_postal' => 'nullable',
                'zone_id' => 'nullable',
                'categorie' => 'nullable',
                'montant_plafond' => 'nullable',
                'region_id' => 'nullable',
                'logoSC' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'client_id' => 'nullable',
        ]);
        $photo = $request->file('logoSC');
                // Deleting Old Photo and Inserting The New Photo
                if ($request->hasFile('logoSC')) {
                    // Storage::disk('public')->delete($validatedData['logoSC']);
                    $photoPath = $photo->storeAs('logoSC-societe', time() . '_' . $photo->getClientOriginalName(), 'public');
                    $validatedData['logoSC'] = $photoPath;
                }
        $siteclient->update($validatedData);
        return response()->json(['message' => 'SiteClient modifié avec succès', 'siteclient' => $siteclient], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $siteclient = SiteClient::findOrFail($id);
        $siteclient->delete();
        return response()->json(['message' => 'SiteClient supprimée avec succès'], 200);
    }
}
