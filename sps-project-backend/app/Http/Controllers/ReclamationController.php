<?php

namespace App\Http\Controllers;

use App\Models\Reclamation;
use App\Models\Historique;
use App\Models\Departement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ReclamationController extends Controller
{
    // Créer une réclamation
    public function create(Request $request)
    {
        $data = $request->validate([
            'type_reclamation' => 'required|string|max:255',
            'reclamer_a_travers' => 'required|string|max:255',
            'departement_id' => 'required|exists:departements,id',
            'suivi' => 'required|string|in:En cours,En attente,Traité,Résolu',
            'date' => 'required|date',
        ]);

        $reclamation = Reclamation::create($data);

        // Ajouter une entrée dans l'historique
        $reclamation->historique()->create([
            'date' => now(),
            'description' => 'Réclamation reçue et en cours d\'examen',
        ]);

        return response()->json($reclamation, 201);
    }

    // Récupérer toutes les réclamations
    public function index()
    {
        $reclamations = Reclamation::with(['historique', 'departement'])->get();
        return response()->json($reclamations);
    }

    // Mettre à jour une réclamation
    public function update(Request $request, $id)
    {
        $reclamation = Reclamation::findOrFail($id);
        $data = $request->validate([
            'type_reclamation' => 'nullable|string|max:255',
            'reclamer_a_travers' => 'nullable|string|max:255',
            'departement_id' => 'nullable|exists:departements,id',
            'suivi' => 'nullable|string',
            'reponse' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $reclamation->update($data);

        // Ajouter à l'historique
        $reclamation->historique()->create([
            'date' => now(),
            'description' => 'Réclamation mise à jour',
        ]);

        return response()->json($reclamation);
    }

    // Supprimer une réclamation
    public function destroy($id)
    {
        $reclamation = Reclamation::findOrFail($id);
        $reclamation->delete();
        return response()->json(null, 204);
    }

    // Récupérer tous les départements
    public function getDepartments()
    {
        return response()->json(Departement::all());
    }

    // Ajouter un département
    public function addDepartment(Request $request)
{
    $validatedData = $request->validate([
        'nom' => [
            'required',
            'string',
            'max:255',
            Rule::unique('departements', 'nom'),
        ],

        'photo' => [
            'nullable',
            'image',
            'mimes:jpeg,png,jpg,gif,webp',
            'max:2048',
        ],
    ]);

    $newPhotoPath = null;

    if ($request->hasFile('photo')) {
        $newPhotoPath = $request
            ->file('photo')
            ->store('departement-photos', 'public');

        $validatedData['photo'] = $newPhotoPath;
    }

    try {
        $departement = Departement::create($validatedData);
    } catch (\Throwable $exception) {
        if (
            $newPhotoPath &&
            Storage::disk('public')->exists($newPhotoPath)
        ) {
            Storage::disk('public')->delete($newPhotoPath);
        }

        throw $exception;
    }

    return response()->json([
        'message' => 'Département ajouté avec succès.',
        'departement' => $departement,
    ], 201);
}

    // Mettre à jour un département
    public function updateDepartment(
    Request $request,
    $id
) {
    $departement = Departement::findOrFail($id);

    $validatedData = $request->validate([
        'nom' => [
            'required',
            'string',
            'max:255',
            Rule::unique('departements', 'nom')
                ->ignore($departement->id),
        ],

        'photo' => [
            'nullable',
            'image',
            'mimes:jpeg,png,jpg,gif,webp',
            'max:2048',
        ],
    ]);

    $oldPhotoPath = $departement->photo;
    $newPhotoPath = null;

    if ($request->hasFile('photo')) {
        $newPhotoPath = $request
            ->file('photo')
            ->store('departement-photos', 'public');

        $validatedData['photo'] = $newPhotoPath;
    }

    try {
        $departement->update($validatedData);
    } catch (\Throwable $exception) {
        if (
            $newPhotoPath &&
            Storage::disk('public')->exists($newPhotoPath)
        ) {
            Storage::disk('public')->delete($newPhotoPath);
        }

        throw $exception;
    }

    if (
        $newPhotoPath &&
        $oldPhotoPath &&
        $oldPhotoPath !== $newPhotoPath &&
        Storage::disk('public')->exists($oldPhotoPath)
    ) {
        Storage::disk('public')->delete($oldPhotoPath);
    }

    return response()->json([
        'message' => 'Département modifié avec succès.',
        'departement' => $departement->fresh(),
    ], 200);
}

    // Supprimer un département
    public function deleteDepartment($id)
{
    $departement = Departement::findOrFail($id);

    $photoPath = $departement->photo;

    $departement->delete();

    if (
        $photoPath &&
        Storage::disk('public')->exists($photoPath)
    ) {
        Storage::disk('public')->delete($photoPath);
    }

    return response()->json([
        'message' => 'Département supprimé avec succès.',
    ], 200);
}
} 