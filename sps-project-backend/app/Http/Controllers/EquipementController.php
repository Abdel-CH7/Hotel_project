<?php

namespace App\Http\Controllers;

use App\Exceptions\EquipmentRoomImpactException;
use App\Models\CategorieEquipement;
use App\Models\Chambre;
use App\Models\Emplacement;
use App\Models\Equipement;
use App\Models\MaintenanceType;
use App\Services\EquipmentRoomImpactService;
use App\Support\EquipmentLocationName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class EquipementController extends Controller
{
    public function index()
    {
        try {
            $equipements = Equipement::with([
                'categorie.maintenanceType',
                'chambre.etatChambre',
                'emplacement',
            ])
                ->latest()
                ->get();
            $equipements->each(fn (Equipement $equipment) => $this->appendRoomMaintenance($equipment));

            return response()->json([
                'success' => true,
                'equipements' => [
                    'data' => $equipements,
                ],
                'categories' => CategorieEquipement::with('maintenanceType')->orderBy('nom')->get(),
                'chambres' => Chambre::orderBy('num_chambre')->get(['id', 'num_chambre']),
                'emplacements' => Emplacement::orderBy('nom')->get(),
                'maintenance_types' => MaintenanceType::orderBy('code')->get(),
                'stats' => $this->getStats(),
            ]);
        } catch (Throwable $exception) {
            Log::error('Unable to retrieve equipment.', [
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des équipements.',
            ], 500);
        }
    }

    // Création d'un nouvel équipement
    public function store(Request $request, EquipmentRoomImpactService $impactService)
    {
        $validatedData = $request->validate([
            'nom' => 'required|string|max:255',
            'numero_serie' => 'required|string|unique:equipements,numero_serie',
            'modele' => 'required|string|max:255',
            'marque' => 'required|string|max:255',
            'date_acquisition' => 'required|date',
            'date_fin_garantie' => 'nullable|date|after_or_equal:date_acquisition',
            'categorie_id' => 'required|exists:categories_equipements,id',
            'statut' => 'required|in:disponible,en_maintenance,hors_service',
            'impact_chambre' => ['nullable', Rule::in(EquipmentRoomImpactService::IMPACTS)],
            'chambre_id' => [
                'nullable',
                'integer',
                'exists:chambres,id',
                'required_without:emplacement_id',
                Rule::prohibitedIf(fn () => $request->filled('emplacement_id')),
            ],
            'emplacement_id' => [
                'nullable',
                'integer',
                'exists:emplacements,id',
                'required_without:chambre_id',
                Rule::prohibitedIf(fn () => $request->filled('chambre_id')),
            ],
            'fournisseur' => 'nullable|string|max:255',
            'prix_achat' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'room_maintenance' => 'nullable|array',
            'room_maintenance.maintenance_type_id' => 'nullable|integer|exists:types_maintenance,id',
            'room_maintenance.date_debut_maintenance' => 'nullable|date',
            'room_maintenance.date_fin_maintenance' => 'nullable|date',
            'room_maintenance.commentaire' => 'nullable|string',
            'confirm_reservation_conflicts' => 'sometimes|boolean',
        ], $this->locationValidationMessages());

        $this->rejectHistoricalPseudoRoomEmplacement($validatedData['emplacement_id'] ?? null);

        unset($validatedData['document']);
        $validatedData = $this->normalizeLocationSelection($validatedData);
        $newDocumentPath = null;

        try {
            if ($request->hasFile('document')) {
                $newDocumentPath = $request->file('document')
                    ->store('equipements/documentation', 'public');

                if (! $newDocumentPath) {
                    throw new \RuntimeException('The equipment document could not be stored.');
                }

                $validatedData['document_path'] = $newDocumentPath;
            }

            $result = $impactService->persist(null, $validatedData);
        } catch (ValidationException $exception) {
            if ($newDocumentPath) {
                Storage::disk('public')->delete($newDocumentPath);
            }

            throw $exception;
        } catch (EquipmentRoomImpactException $exception) {
            if ($newDocumentPath) {
                Storage::disk('public')->delete($newDocumentPath);
            }

            return $this->impactConflict($exception);
        } catch (Throwable $exception) {
            if ($newDocumentPath) {
                Storage::disk('public')->delete($newDocumentPath);
            }

            Log::error('Unable to create equipment.', [
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'équipement.',
            ], 500);
        }

        return $this->equipmentResponse($result, 201);
    }

    // Affichage d'un équipement spécifique
    public function show(Equipement $equipement)
    {
        $equipement->load(['categorie.maintenanceType', 'chambre.etatChambre', 'emplacement']);

        return response()->json($this->appendRoomMaintenance($equipement));
    }

    // Mise à jour d'un équipement
    public function update(
        Request $request,
        Equipement $equipement,
        EquipmentRoomImpactService $impactService
    )
    {
        $validatedData = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'numero_serie' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('equipements', 'numero_serie')->ignore($equipement->id),
            ],
            'modele' => 'sometimes|required|string|max:255',
            'marque' => 'sometimes|required|string|max:255',
            'date_acquisition' => 'sometimes|required|date',
            'date_fin_garantie' => 'nullable|date|after_or_equal:date_acquisition',
            'categorie_id' => 'sometimes|required|exists:categories_equipements,id',
            'statut' => 'sometimes|required|in:disponible,en_maintenance,hors_service',
            'impact_chambre' => ['nullable', Rule::in(EquipmentRoomImpactService::IMPACTS)],
            'chambre_id' => [
                'nullable',
                'integer',
                'exists:chambres,id',
                Rule::requiredIf(
                    fn () => $request->hasAny(['chambre_id', 'emplacement_id'])
                        && ! $request->filled('emplacement_id')
                ),
                Rule::prohibitedIf(fn () => $request->filled('emplacement_id')),
            ],
            'emplacement_id' => [
                'nullable',
                'integer',
                'exists:emplacements,id',
                Rule::requiredIf(
                    fn () => $request->hasAny(['chambre_id', 'emplacement_id'])
                        && ! $request->filled('chambre_id')
                ),
                Rule::prohibitedIf(fn () => $request->filled('chambre_id')),
            ],
            'fournisseur' => 'nullable|string|max:255',
            'prix_achat' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'room_maintenance' => 'nullable|array',
            'room_maintenance.maintenance_type_id' => 'nullable|integer|exists:types_maintenance,id',
            'room_maintenance.date_debut_maintenance' => 'nullable|date',
            'room_maintenance.date_fin_maintenance' => 'nullable|date',
            'room_maintenance.commentaire' => 'nullable|string',
            'confirm_reservation_conflicts' => 'sometimes|boolean',
        ], $this->locationValidationMessages());

        $this->rejectHistoricalPseudoRoomEmplacement($validatedData['emplacement_id'] ?? null);

        unset($validatedData['document']);
        $validatedData = $this->normalizeLocationSelection($validatedData);
        $oldDocumentPath = $equipement->document_path;
        $newDocumentPath = null;

        try {
            if ($request->hasFile('document')) {
                $newDocumentPath = $request->file('document')
                    ->store('equipements/documentation', 'public');

                if (! $newDocumentPath) {
                    throw new \RuntimeException('The equipment document could not be stored.');
                }

                $validatedData['document_path'] = $newDocumentPath;
            }

            $result = $impactService->persist($equipement, $validatedData);
        } catch (ValidationException $exception) {
            if ($newDocumentPath) {
                Storage::disk('public')->delete($newDocumentPath);
            }

            throw $exception;
        } catch (EquipmentRoomImpactException $exception) {
            if ($newDocumentPath) {
                Storage::disk('public')->delete($newDocumentPath);
            }

            return $this->impactConflict($exception);
        } catch (Throwable $exception) {
            if ($newDocumentPath) {
                Storage::disk('public')->delete($newDocumentPath);
            }

            Log::error('Unable to update equipment.', [
                'equipment_id' => $equipement->id,
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de l\'équipement.',
            ], 500);
        }

        if ($newDocumentPath && $oldDocumentPath) {
            Storage::disk('public')->delete($oldDocumentPath);
        }

        return $this->equipmentResponse($result);
    }

    // Suppression d'un équipement
    public function destroy(Equipement $equipement)
    {
        $documentPath = $equipement->document_path;
        $reviewRoomId = $equipement->impact_chambre === EquipmentRoomImpactService::IMPACT_BLOCKING
            ? $equipement->chambre_id
            : null;

        try {
            $equipement->delete();
        } catch (Throwable $exception) {
            Log::error('Unable to delete equipment.', [
                'equipment_id' => $equipement->id,
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'équipement.',
            ], 500);
        }

        if ($documentPath) {
            Storage::disk('public')->delete($documentPath);
        }

        return response()->json([
            'success' => true,
            'message' => 'Équipement supprimé avec succès.',
            'room_maintenance_review_required' => (bool) $reviewRoomId,
            'room_id' => $reviewRoomId ? (int) $reviewRoomId : null,
            'review_url' => $reviewRoomId ? '/etat-chambre?room_id='.$reviewRoomId : null,
        ]);
    }

    // Récupérer les statistiques
    public function stats()
    {
        try {
            return response()->json([
                'success' => true,
                'stats' => $this->getStats()
            ]);

        } catch (Throwable $exception) {
            Log::error('Unable to retrieve equipment statistics.', [
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques.',
            ], 500);
        }
    }

    // Récupérer les catégories
    public function categories()
    {
        try {
            return response()->json([
                'success' => true,
                'categories' => CategorieEquipement::with('maintenanceType')->orderBy('nom')->get(),
                'maintenance_types' => MaintenanceType::orderBy('code')->get(),
            ]);

        } catch (Throwable $exception) {
            Log::error('Unable to retrieve equipment categories.', [
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des catégories.',
            ], 500);
        }
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', Rule::unique('categories_equipements', 'nom')->whereNull('deleted_at')],
            'description' => 'nullable|string',
            'maintenance_type_id' => 'nullable|integer|exists:types_maintenance,id',
        ]);

        $category = CategorieEquipement::create($validated)->load('maintenanceType');

        return response()->json(['success' => true, 'categorie' => $category], 201);
    }

    public function updateCategory(Request $request, CategorieEquipement $category)
    {
        $validated = $request->validate([
            'nom' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories_equipements', 'nom')->whereNull('deleted_at')->ignore($category->id),
            ],
            'description' => 'nullable|string',
            'maintenance_type_id' => 'nullable|integer|exists:types_maintenance,id',
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'categorie' => $category->fresh('maintenanceType'),
        ]);
    }

    // Méthode privée pour les statistiques
    private function getStats()
    {
        return [
            'total' => (int) Equipement::count(),
            'disponible' => (int) Equipement::where('statut', 'disponible')->count(),
            'en_maintenance' => (int) Equipement::where('statut', 'en_maintenance')->count(),
            'hors_service' => (int) Equipement::where('statut', 'hors_service')->count(),
        ];
    }

    // Export Excel
    public function exportExcel()
    {
        try {
            $equipements = Equipement::with(['categorie', 'chambre', 'emplacement'])->get();

            $data = $equipements->map(function ($equipement) {
                return [
                    'Nom' => $equipement->nom,
                    'N° Série' => $equipement->numero_serie,
                    'Modèle' => $equipement->modele,
                    'Marque' => $equipement->marque,
                    'Catégorie' => $equipement->categorie?->nom,
                    'Localisation' => $this->getLocationLabel($equipement),
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

        } catch (Throwable $exception) {
            Log::error('Unable to export equipment.', [
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export Excel.',
            ], 500);
        }
    }

    private function locationValidationMessages(): array
    {
        return [
            'chambre_id.required_without' => 'Sélectionnez une chambre ou un emplacement.',
            'emplacement_id.required_without' => 'Sélectionnez une chambre ou un emplacement.',
            'chambre_id.prohibited' => 'Un équipement ne peut pas être affecté à une chambre et un emplacement simultanément.',
            'emplacement_id.prohibited' => 'Un équipement ne peut pas être affecté à une chambre et un emplacement simultanément.',
        ];
    }

    private function normalizeLocationSelection(array $validatedData): array
    {
        if (! empty($validatedData['chambre_id'])) {
            $validatedData['emplacement_id'] = null;
        } elseif (! empty($validatedData['emplacement_id'])) {
            $validatedData['chambre_id'] = null;
        }

        return $validatedData;
    }

    private function rejectHistoricalPseudoRoomEmplacement(mixed $emplacementId): void
    {
        if (! $emplacementId) {
            return;
        }

        $name = Emplacement::query()->whereKey($emplacementId)->value('nom');

        if (! EquipmentLocationName::isNumericRoomEmplacement($name)) {
            return;
        }

        throw ValidationException::withMessages([
            'emplacement_id' => 'Cette localisation historique ne peut plus être affectée. Sélectionnez une chambre réelle ou un emplacement interne valide.',
        ]);
    }

    private function equipmentResponse(array $result, int $status = 200)
    {
        $equipment = $result['equipment']->load([
            'categorie.maintenanceType',
            'chambre.etatChambre',
            'emplacement',
        ]);
        $payload = $this->appendRoomMaintenance($equipment)->toArray();
        $payload['room_maintenance_already_active'] = $result['room_maintenance_already_active'];
        $payload['room_maintenance_review_required'] = $result['room_maintenance_review_required'];
        $payload['room_id'] = $result['room_id'];

        return response()->json($payload, $status);
    }

    private function appendRoomMaintenance(Equipement $equipment): Equipement
    {
        $state = $equipment->chambre?->etatChambre;
        $maintenance = null;

        if (
            $equipment->impact_chambre === EquipmentRoomImpactService::IMPACT_BLOCKING
            && $state?->maintenance
        ) {
            $maintenance = [
                'maintenance_type_id' => $state->maintenance_type_id,
                'date_debut_maintenance' => $state->date_debut_maintenance?->format('Y-m-d'),
                'date_fin_maintenance' => $state->date_fin_maintenance?->format('Y-m-d'),
                'commentaire' => $state->commentaire,
            ];
        }

        $equipment->setAttribute('room_maintenance', $maintenance);
        $equipment->chambre?->unsetRelation('etatChambre');

        return $equipment;
    }

    private function impactConflict(EquipmentRoomImpactException $exception)
    {
        return response()->json(array_merge([
            'code' => $exception->errorCode,
            'message' => $exception->getMessage(),
        ], $exception->context), $exception->status);
    }

    private function getLocationLabel(Equipement $equipement): string
    {
        if ($equipement->chambre) {
            return 'Chambre '.$equipement->chambre->num_chambre;
        }

        return $equipement->emplacement?->nom
            ?? $equipement->localisation
            ?? 'Non affecté';
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
