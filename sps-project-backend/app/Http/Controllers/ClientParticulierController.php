<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Zone;
use App\Models\Agent;
use App\Models\Ville;
use App\Models\Enfant;
use App\Models\ClientParticulier;
use App\Models\Region;
use App\Models\SiteClientParticulier;
use App\Models\modePaimant;
use Illuminate\Http\Request;
use App\Models\SecteurClient;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB; // <-- Ajoutez cette ligne

class ClientParticulierController extends Controller
{

    public function statsByVille()
{
    $data = ClientParticulier::select('ville', DB::raw('COUNT(*) as count'))
            ->groupBy('ville')
            ->orderBy('ville')
            ->get();

    return response()->json($data);
}
public function statsBySecteur()
{
    $data = ClientParticulier::join('secteur_clients', 'clients_particulier.secteur_id', '=', 'secteur_clients.id')
        ->select('secteur_clients.secteurClient as secteur', DB::raw('COUNT(*) as count'))
        ->groupBy('secteur_clients.secteurClient')
        ->get();

    return response()->json($data);
}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // if (Gate::allows('view_all_clients')) {
                $client = ClientParticulier::with(
                    'user',
                    'site_clients',
                    'zone',
                    'site_clients.zone',
                    'site_clients.info_site_clients',
                    'site_clients.region',
                    'region',
                    'info_clients',
                    'secteur',
                    'agent')->get();
                $count = ClientParticulier::count();
                return response()->json([
                    'message' => 'Liste des client récupérée avec succès', 'client' =>  $client,
                    'count' => $count
                ], 200);

        // } else {
        //     abort(403, 'Vous n\'avez pas l\'autorisation de voir la liste des Clients.');
        // } 
    }
    /**
     * Show the form for creating a new resource.
     */
    public function getAllDataDachborde()
    {
            // Fetch data from multiple models
            $clients = ClientParticulier::count();

            // Return the consolidated data as a JSON response
            return response()->json([
                'clients' => $clients,
            ], 200);

    }

     public function getAllData()
     {
             // Fetch all the data from multiple models
             $clients = ClientParticulier::with('user', 'site_clients', 'zone', 'site_clients.zone', 'site_clients.info_site_clients', 'site_clients.region', 'region', 'info_clients', 'site_clients.zone', 'site_clients.represantant','site_clients.last_represantant','represantant','last_represantant','lastInfo')->get();
             $users = User::all();
             $zones = Zone::all();
             $villes = Ville::all();

             $secteurClients = SecteurClient::all();
             $regions = Region::all();
             $agent = Agent::all();
             $siteClients = SiteClientParticulier::with('client', 'zone', 'user', 'region', 'info_site_clients','secteur','agent','represantant','last_represantant')->get();
             $modpai = ModePaimant::all();
             // Combine the data into one response
             return response()->json([
                 'clients' => $clients,
                 'users' => $users,
                 'zones' => $zones,
                 'secteurClients' => $secteurClients,
                 'regions' => $regions,
                 'agent' => $agent,
                 'siteClients' => $siteClients,
                 'modpai' => $modpai,
                 'villes'=>$villes
             ]);
     }
    public function siteclients($clientId)
    {
            $siteClients = SiteClientParticulier::where('client_id', $clientId)
                ->with('zone', 'region')
                ->get();
            return response()->json(['message' => 'Site clients récupérés avec succès', 'siteClients' => $siteClients], 200);

    }
    public function store(Request $request)
    {
                $validatedData = $request->validate([
                    'CodeClient' => 'string|unique:clients_particulier,CodeClient',
                    'name' => 'required|string',
                    'prenom' => 'required|string',
                    'cin' => 'required|string|unique:clients_particulier,cin',
                    'civilite' => 'required|string',
                    'nationalite' => 'required|string',
                    'adresse' => 'string',
                    'tele' => 'nullable',
                    'ville' => 'nullable',
                    'abreviation' => 'nullable',
                    'type_client' => 'nullable',
                    'categorie' => 'nullable',
                    'code_postal' => 'nullable',
                    'zone_id' => 'nullable',
                    'region_id' => 'nullable',
                    'secteur_id' => 'nullable',
                    'logoC' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                    'mod_id' => 'nullable',
                    'seince' => 'nullable',
                    'montant_plafond' => 'nullable',
                ]);
                $validatedData['user_id'] = $request['user_id'] = Auth::id();
                // Storing Photo
                $photo = $request->file('logoC');
                // Deleting Old Photo and Inserting The New Photo
                if ($request->hasFile('logoC')) {
                    // Storage::disk('public')->delete($tarifRepas->photo);
                    $photoPath = $photo->storeAs('logos-particulier', time() . '_' . $photo->getClientOriginalName(), 'public');
                    $validatedData['logoC'] = $photoPath;
                }
                $client = ClientParticulier::create($validatedData);

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

                return response()->json([
                    'message' => 'Client ajouté avec succès',
                    'client' => $client,
                    'request' => $request,
                ], 200);
        // } else {
        //     abort(403, 'You are not authorized to add clients.');
        // }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $client = ClientParticulier::with('user', 'zone', 'site_clients')->findOrFail($id);
        $client['logo_url'] = asset('storage/' . $client->logoC);
        return response()->json(['client' => $client]);
    }

    public function update(Request $request, $id)
    {
        // if (Gate::allows('update_clients')) {
                $client = ClientParticulier::findOrFail($id);
                $validatedData = $request->validate([
                    'name' => 'required|string',
                    'prenom' => 'required|string',
                    'cin' => 'required|string',
                    'civilite' => 'required|string',
                    'nationalite' => 'required|string',
                    'adresse' => 'string',
                    'tele' => 'nullable',
                    'ville' => 'nullable',
                    'abreviation' => 'nullable',
                    'type_client' => 'nullable',
                    'categorie' => 'nullable',
                    'code_postal' => 'nullable',
                    'zone_id' => 'nullable',
                    'region_id' => 'nullable',
                    'secteur_id' => 'nullable',
                    'logoC' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                    'mod_id' => 'nullable',
                    'seince' => 'nullable',
                    'montant_plafond' => 'nullable',
                ]);
                $validatedDataEnfant = $request->validate([
                    'enfantPrenom' => 'nullable|string',
                    'enfantAge' => 'integer|nullable'
                ]);


                $photo = $request->file('logoC');
                // Deleting Old Photo and Inserting The New Photo
                if ($request->hasFile('logoC')) {
                    Storage::disk('public')->delete($validatedData['logoC']);
                    $photoPath = $photo->storeAs('logos-particulier', time() . '_' . $photo->getClientOriginalName(), 'public');
                    $validatedData['logoC'] = $photoPath;
                }

                // Update the client with the request data
                $client->update($validatedData);

                if ($validatedDataEnfant["enfantPrenom"] || $validatedDataEnfant["enfantAge"])
                    Enfant::create([
                        'idClient' => $client->id,
                        'name' => $client->name,
                        'prenom' => $validatedDataEnfant["enfantPrenom"],
                        'age' => $validatedDataEnfant["enfantAge"],
                    ]);

                return response()->json(['message' => 'Client modified successfully', 'client' => $client], 200);
        // } else {
        //     abort(403, 'You are not authorized to modify clients.');
        // }
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        // if (Gate::allows('delete_clients')) {
                $client = ClientParticulier::findOrFail($id);
                $client->delete();
                return response()->json(['message' => 'Client supprimé avec succès'], 200);

        // } else {
        //     abort(403, 'Vous n\'avez pas l\'autorisation de supprimer un client.');
        // }
    }
}
