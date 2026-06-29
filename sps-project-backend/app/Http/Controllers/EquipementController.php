<?php

namespace App\Http\Controllers;

use App\Models\Equipement;
use App\Models\CategorieEquipement;
use App\Models\Maintenance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class EquipementController extends Controller
{
    // Liste paginée des équipements
    public function index(Request $request)
    {
        try {
            $query = Equipement::with(['categorie'])
                ->orderBy('created_at', 'desc');

            // Filtrage
            if ($request->has('search')) {
                $search = $request->search;     
                $query->where(function($q) use ($search) {
                    $q->where('nom', 'like', "%$search%")
                      ->orWhere('numero_serie', 'like', "%$search%")
                      ->orWhere('localisation', 'like', "%$search%");
                });
            }

            if ($request->has('statut')) {
                $query->where('statut', $request->statut);
            }

            if ($request->has('categorie_id')) {
                $query->where('categorie_id', $request->categorie_id);
            }

            $equipements = $query->paginate(15);

            return response()->json([
                'success' => true,
                'equipements' => $equipements,
                'categories' => CategorieEquipement::all(),
                'stats' => $this->getStats()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dans EquipementController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des équipements: ' . $e->getMessage()
            ], 500);
        }
    }

    // Création d'un nouvel équipement
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'numero_serie' => 'required|string|unique:equipements',
            'modele' => 'required|string|max:255',
            'marque' => 'required|string|max:255',
            'date_acquisition' => 'required|date',
            'date_fin_garantie' => 'nullable|date',
            'categorie_id' => 'required|exists:categories_equipements,id',
            'statut' => 'required|string|in:disponible,en_maintenance,hors_service',
            'localisation' => 'required|string|max:255',
            'fournisseur' => 'nullable|string|max:255',
            'prix_achat' => 'nullable|numeric|min:0',
            'document_path' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        if ($request->hasFile('document_path')) {
            $path = $request->file('document_path')->store('equipements/documentation');
            $data['document_path'] = $path;
        }

        $equipement = Equipement::create($data);

        return response()->json($equipement, 201);
    }

    // Affichage d'un équipement spécifique
    public function show(Equipement $equipement)
    {
        return response()->json($equipement->load('categorie'));
    }

    // Mise à jour d'un équipement
    public function update(Request $request, Equipement $equipement)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'numero_serie' => 'sometimes|required|string|unique:equipements,numero_serie,' . $equipement->id,
            'modele' => 'sometimes|required|string|max:255',
            'marque' => 'sometimes|required|string|max:255',
            'date_acquisition' => 'sometimes|required|date',
            'date_fin_garantie' => 'nullable|date',
            'categorie_id' => 'sometimes|required|exists:categories_equipements,id',
            'statut' => 'sometimes|required|string|in:disponible,en_maintenance,hors_service',
            'localisation' => 'sometimes|required|string|max:255',
            'fournisseur' => 'nullable|string|max:255',
            'prix_achat' => 'nullable|numeric|min:0',
            'document_path' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        if ($request->hasFile('document_path')) {
            if ($equipement->document_path) {
                Storage::delete($equipement->document_path);
            }
            $path = $request->file('document_path')->store('equipements/documentation');
            $data['document_path'] = $path;
        }

        $equipement->update($data);

        return response()->json($equipement);
    }

    // Suppression d'un équipement
    public function destroy(Equipement $equipement)
    {
        if ($equipement->document_path) {
            Storage::delete($equipement->document_path);
        }
        $equipement->delete();
        return response()->json(null, 204);
    }

    // Récupérer les statistiques
    public function stats()
    {
        try {
            return response()->json([
                'success' => true,
                'stats' => $this->getStats()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }

    // Récupérer les catégories
    public function categories()
    {
        try {
            return response()->json([
                'success' => true,
                'categories' => CategorieEquipement::all()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des catégories'
            ], 500);
        }
    }

    // Méthode privée pour les statistiques
    private function getStats()
    {
        try {
            return [
                'total' => (int) Equipement::count(),
                'disponible' => (int) Equipement::where('statut', 'disponible')->count(),
                'en_maintenance' => (int) Equipement::where('statut', 'en_maintenance')->count(),
                'hors_service' => (int) Equipement::where('statut', 'hors_service')->count()
            ];
        } catch (\Exception $e) {
            Log::error('Erreur dans getStats: ' . $e->getMessage());
            return [
                'total' => 0,
                'disponible' => 0,
                'en_maintenance' => 0,
                'hors_service' => 0
            ];
        }
    }

    // Export Excel
    public function exportExcel()
    {
        try {
            $equipements = Equipement::with('categorie')->get();

            $data = $equipements->map(function ($equipement) {
                return [
                    'Nom' => $equipement->nom,
                    'N° Série' => $equipement->numero_serie,
                    'Modèle' => $equipement->modele,
                    'Marque' => $equipement->marque,
                    'Catégorie' => $equipement->categorie->nom,
                    'Localisation' => $equipement->localisation,
                    'Statut' => $equipement->statut,
                    'Date acquisition' => $equipement->date_acquisition,
                    'Fin garantie' => $equipement->date_fin_garantie,
                    'Fournisseur' => $equipement->fournisseur,
                    'Prix d\'achat' => $equipement->prix_achat,
                ];
            });
    
            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export Excel'
            ], 500);
        }
    }
}

// use App\Models\Zone;
// use App\Models\Equipement;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Auth;
// use Illuminate\Support\Facades\Gate;
// use Illuminate\Support\Facades\Storage;
// use App\Http\Controllers\AgentController;
// use Illuminate\Support\Facades\Validator;

// class EquipementController extends Controller
// {
//     public function index()
//     {
//         // if (Gate::allows('view_all_equipements')) {
//                 $equipements = Equipement::with(['zone', 'intervention'])->get();
//                 $count = Equipement::count();
//                 $zones = Zone::all();

//                 return response()->json([
//                     'message' => 'Liste des équipements récupérée avec succès',
//                     'equipements' => $equipements,
//                     'zones' => $zones,
//                     'count' => $count
//                 ], 200);

//         // } else {
//         //     abort(403, 'Vous n\'avez pas l\'autorisation de voir la liste des équipements.');
//         // }
//     }

//     public function store(Request $request)
//     {
//         // if (Gate::allows('create_equipements')) {
//                 $validatedData = $request->validate([
//                     'designation' => 'required|string',
//                     'reference' => 'required|string|unique:equipements,reference',
//                     'fiche_technique' => 'nullable|file|mimes:pdf|max:2048',
//                     'mode_operatoire' => 'nullable|file|mimes:pdf|max:2048',
//                     'zone' => 'required|exists:zones,id|integer',
//                     'date_place' => 'required',
//                     'date_marche' => 'required',
//                     'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
//                 ]);

//                 // Storing Fiche Technique
//                 $photo = $request->file('fiche_technique');
//                 // Deleting Old Photo and Inserting The New Photo
//                 if ($request->hasFile('fiche_technique')) {
//                     // Storage::disk('public')->delete($tarifRepas->photo);
//                     $photoPath = $photo->storeAs('fiche_technique', time() . '_' . $photo->getClientOriginalName(), 'public');
//                     $validatedData['fiche_technique'] = $photoPath;
//                 }
//                 if ($request->hasFile('mode_operatoire')) {
//                     $modeOperatoire = $request->file('mode_operatoire');
//                     $modeOperatoirePath = $modeOperatoire->storeAs('mode_operatoire', time() . '_' . $modeOperatoire->getClientOriginalName(), 'public');
//                     $validatedData['mode_operatoire'] = $modeOperatoirePath;
//                 }



//                 // Storing Photo
//                 $photo = $request->file('photo');
//                 if ($request->hasFile('photo')) {
//                     // Storage::disk('public')->delete($tarifRepas->photo);
//                     $photoPath = $photo->storeAs('equipements', time() . '_' . $photo->getClientOriginalName(), 'public');
//                     $validatedData['photo'] = $photoPath;
//                 }

//                 $equipement = Equipement::create($validatedData);

//                 return response()->json([
//                     'message' => 'Équipement ajouté avec succès',
//                     'equipement' => $equipement,
//                 ], 200);

//         // } else {
//         //     abort(403, 'Vous n\'avez pas l\'autorisation d\'ajouter des équipements.');
//         // }
//     }

//     public function update(Request $request, $id)
//     {
//         // if (Gate::allows('update_equipements')) {
//                 $equipement = Equipement::findOrFail($id);
//                 $validatedData = $request->validate([
//                     'designation' => 'string',
//                     'reference' => 'string|unique:equipements,reference,' . $id,
//                     'fiche_technique' => 'nullable|file|mimes:pdf|max:2048',
//                     'mode_operatoire' => 'nullable|file|mimes:pdf|max:2048',
//                     'zone' => 'required|exists:zones,id|integer',
//                     'date_place' => 'required',
//                     'date_marche' => 'required',
//                     'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
//                 ]);

//                 $photo = $request->file('fiche_technique');
//                 // Deleting Old Photo and Inserting The New Photo
//                 if ($request->hasFile('fiche_technique')) {
//                     if (!empty($equipement->fiche_technique))
//                     Storage::disk('public')->delete($equipement->fiche_technique);
//                     $photoPath = $photo->storeAs('fiche_technique', time() . '_' . $photo->getClientOriginalName(), 'public');
//                     $validatedData['fiche_technique'] = $photoPath;
//                 }
//                       // Storing Mode Operatoire
//                   if ($request->hasFile('mode_operatoire')) {
//                       if (!empty($equipement->mode_operatoire)) {
//                       Storage::disk('public')->delete($equipement->mode_operatoire);
//         }
//         $modeOperatoire = $request->file('mode_operatoire');
//         $modeOperatoirePath = $modeOperatoire->storeAs('mode_operatoire', time() . '_' . $modeOperatoire->getClientOriginalName(), 'public');
//         $validatedData['mode_operatoire'] = $modeOperatoirePath;
//     }


//                 // Storing Photo
//                 $photo = $request->file('photo');
//                 // Deleting Old Photo and Inserting The New Photo
//                 if ($request->hasFile('photo')) {
//                     if (!empty($equipement->photo))
//                     Storage::disk('public')->delete($equipement->photo);
//                     $photoPath = $photo->storeAs('equipements', time() . '_' . $photo->getClientOriginalName(), 'public');
//                     $validatedData['photo'] = $photoPath;
//                 }
//                 $equipement->update($validatedData);
//                 return response()->json(['message' => 'Équipement modifié avec succès', 'equipement' => $equipement], 200);
//         // } else {
//         //     abort(403, 'Vous n\'avez pas l\'autorisation de modifier des équipements.');
//         // }
//     }

//     public function destroy($id)
//     {
//         // if (Gate::allows('delete_equipements')) {
//                 $equipement = Equipement::findOrFail($id);
//                 $photo = $equipement->photo;
//                 if (!empty($equipement->photo))
//                     Storage::disk('public')->delete($equipement->photo);

//                 if ($equipement->fiche_technique) {
//                     if (!empty($equipement->fiche_technique))
//                     Storage::disk('public')->delete($equipement->fiche_technique);
//                 }
//                 $equipement->delete();

//                 return response()->json(['message' => 'Équipement supprimé avec succès'], 200);

//         // } else {
//         //     abort(403, 'Vous n\'avez pas l\'autorisation de supprimer cet équipement.');
//         // }
//     }
// }

