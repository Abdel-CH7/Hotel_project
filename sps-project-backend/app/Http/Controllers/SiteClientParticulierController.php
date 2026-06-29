<?php

namespace App\Http\Controllers;

use App\Models\SiteClientParticulier;
use App\Models\Enfant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class SiteClientParticulierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $SiteClientParticulier = SiteClientParticulier::with('client', 'zone', 'user','region','infoSiteClientParticuliers','secteur','agent','represantant','lastRepresantant','info_site_clients')->get();
        $count = SiteClientParticulier::count();
        return response()->json([
            'message' => 'Liste des Site Client Particulier récupérée avec succès', 'SiteClientParticulier' =>  $SiteClientParticulier,
            'count' => $count
        ], 200);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function store(Request $request)
    {
            $validatedData = $request->validate([
                'codeSiteClient' => 'required|string|unique:site_clients_particulier,codeSiteClient',
                'name' => 'required|string',
                'prenom' => 'required|string',
                'cin' => 'required|string|unique:site_clients_particulier,cin',
                'civilite' => 'required|string',
                'nationalite' => 'required|string',
                'adresse' => 'required',
                'categorie' => 'nullable',
                'tele' => 'nullable',
                'ville' => 'nullable',
                'abreviation' => 'nullable',
                'code_postal' => 'nullable',
                'zone_id' => 'nullable',
                'mod_id' => 'nullable',
                'secteur_id' => 'nullable',
                'seince' => 'nullable',
                'montant_plafond' => 'nullable',
                'region_id' => 'nullable',
                'logoSC' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'client_id' => 'nullable',
            ]);
            // Storing Photo
            $photo = $request->file('logoSC');
            // Deleting Old Photo and Inserting The New Photo
            if ($request->hasFile('logoSC')) {
                // Storage::disk('public')->delete($tarifRepas->photo);
                $photoPath = $photo->storeAs('logoSC-particulier', time() . '_' . $photo->getClientOriginalName(), 'public');
                $validatedData['logoSC'] = $photoPath;
            }
            $client = SiteClientParticulier::create($validatedData);
            $validatedDataEnfant = $request->validate([
                'enfantPrenom' => 'nullable|string',
                'enfantAge' => 'integer|nullable'
            ]);
            if ($validatedDataEnfant["enfantPrenom"] || $validatedDataEnfant["enfantAge"])
                Enfant::create([
                    'idClient' => $client->id,
                    'name' => $client->name,
                    'prenom' => $validatedDataEnfant["enfantPrenom"],
                    'age' => $validatedDataEnfant["enfantAge"],
                ]);
            return response()->json(['message' => 'SieClient ajouté avec succès', 'SiteClientParticulier' => $client], 200);
    }
    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $SiteClientParticulier = SiteClientParticulier::findOrFail($id);
        return response()->json(['SiteClientParticulier' => $SiteClientParticulier]);
    }

    /**
     * Show the form for editing the specified resource.
     */

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $SiteClientParticulier = SiteClientParticulier::findOrFail($id);
        $validatedData = $request->validate([
                'codeSiteClient' => 'required',
                'name' => 'required|string',
                'prenom' => 'required|string',
                'cin' => 'required|string',
                'civilite' => 'required|string',
                'nationalite' => 'required|string',
                'adresse' => 'required',
                'categorie' => 'nullable',
                'tele' => 'nullable',
                'ville' => 'nullable',
                'abreviation' => 'nullable',
                'code_postal' => 'nullable',
                'zone_id' => 'nullable',
                'mod_id' => 'nullable',
                'secteur_id' => 'nullable',
                'seince' => 'nullable',
                'montant_plafond' => 'nullable',
                'region_id' => 'nullable',
                'logoSC' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'client_id' => 'nullable',
        ]);
        $photo = $request->file('logoSC');
                // Deleting Old Photo and Inserting The New Photo
                if ($request->hasFile('logoSC')) {
                    // Storage::disk('public')->delete($validatedData['logoSC']);
                    $photoPath = $photo->storeAs('logoSC-particulier', time() . '_' . $photo->getClientOriginalName(), 'public');
                    $validatedData['logoSC'] = $photoPath;
                }
        $SiteClientParticulier->update($validatedData);
        $validatedDataEnfant = $request->validate([
            'enfantPrenom' => 'nullable|string',
            'enfantAge' => 'integer|nullable'
        ]);
        if ($validatedDataEnfant["enfantPrenom"] || $validatedDataEnfant["enfantAge"])
                Enfant::create([
                    'idClient' => $SiteClientParticulier->id,
                    'name' => $SiteClientParticulier->name,
                    'prenom' => $validatedDataEnfant["enfantPrenom"],
                    'age' => $validatedDataEnfant["enfantAge"],
                ]);
        return response()->json(['message' => 'SiteClientParticulier modifié avec succès', 'SiteClientParticulier' => $SiteClientParticulier], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $SiteClientParticulier = SiteClientParticulier::findOrFail($id);
        $SiteClientParticulier->delete();

        return response()->json(['message' => 'SiteClientParticulier supprimée avec succès'], 200);
    }
}
