<?php
namespace App\Http\Controllers;

use App\Models\TypeChambre;
use App\Models\TarifChambre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TarifChambreController extends Controller
{
    public function getAll()
    {
        $typesChambre = TypeChambre::with('detail')->get();
        $tarifsChambre = TarifChambre::all();
        return response()->json([
            "tarifsChambre" => $tarifsChambre,
            "typesChambre" => $typesChambre
        ]);
    }

    public function ajouterDesiTarif(Request $request)
{
    $tableName = (new TarifChambre())->getTable();

    $validatedData = $request->validate([
        'designation' => [
            'required',
            'string',
            'max:255',
            Rule::unique($tableName, 'designation'),
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
            ->store('chambre-photos', 'public');

        $validatedData['photo'] = $newPhotoPath;
    }

    try {
        $tarifChambre = TarifChambre::create($validatedData);
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
        'message' => 'Tarif Chambre ajouté avec succès.',
        'tarifChambre' => $tarifChambre,
    ], 201);
}

public function afficherDesiTarif(string $tarif_chambre_code)
{
    $tarifChambre = TarifChambre::findOrFail(
        $tarif_chambre_code
    );

    return response()->json($tarifChambre);
}

public function updateDesiTarif(
    Request $request,
    string $tarif_chambre_code
) {
    $tarifChambre = TarifChambre::findOrFail(
        $tarif_chambre_code
    );

    $validatedData = $request->validate([
        'designation' => [
            'required',
            'string',
            'max:255',
            Rule::unique(
                $tarifChambre->getTable(),
                'designation'
            )->ignore($tarifChambre->getKey()),
        ],
        'photo' => [
            'nullable',
            'image',
            'mimes:jpeg,png,jpg,gif,webp',
            'max:2048',
        ],
    ]);

    $oldPhotoPath = $tarifChambre->photo;
    $newPhotoPath = null;

    if ($request->hasFile('photo')) {
        $newPhotoPath = $request
            ->file('photo')
            ->store('chambre-photos', 'public');

        $validatedData['photo'] = $newPhotoPath;
    }

    try {
        $tarifChambre->update($validatedData);
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
        'message' => 'Tarif Chambre modifié avec succès.',
        'tarifChambre' => $tarifChambre->fresh(),
    ], 200);
}

public function supprimerDesiTarif(string $tarif_chambre_code)
{
    $tarifChambre = TarifChambre::findOrFail(
        $tarif_chambre_code
    );

    $photoPath = $tarifChambre->photo;

    $tarifChambre->delete();

    if (
        $photoPath &&
        Storage::disk('public')->exists($photoPath)
    ) {
        Storage::disk('public')->delete($photoPath);
    }

    return response()->json([
        'message' => 'Tarif Chambre supprimé avec succès.',
    ], 200);
}
}
