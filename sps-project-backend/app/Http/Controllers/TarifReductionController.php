<?php
namespace App\Http\Controllers;

use App\Models\TypeReduction;
use App\Models\TarifReduction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TarifReductionController extends Controller
{
    public function getAll()
    {
        $typesReduction = TypeReduction::with('detail')->get();
        $tarifsReduction = TarifReduction::all();
        return response()->json([
            "tarifsReduction" => $tarifsReduction,
            "typesReduction" => $typesReduction
        ]);
    }

    public function ajouterDesiTarif(Request $request)
{
    $tableName = (new TarifReduction())->getTable();

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
            ->store('reduction-photos', 'public');

        $validatedData['photo'] = $newPhotoPath;
    }

    try {
        $tarifReduction = TarifReduction::create(
            $validatedData
        );
    } catch (\Throwable $exception) {
        if (
            $newPhotoPath &&
            Storage::disk('public')->exists(
                $newPhotoPath
            )
        ) {
            Storage::disk('public')->delete(
                $newPhotoPath
            );
        }

        throw $exception;
    }

    return response()->json([
        'message' =>
            'Tarif Réduction ajouté avec succès.',
        'tarifReduction' => $tarifReduction,
    ], 201);
}

public function afficherDesiTarif(
    string $tarif_reduction_code
) {
    $tarifReduction = TarifReduction::findOrFail(
        $tarif_reduction_code
    );

    return response()->json($tarifReduction);
}

public function updateDesiTarif(
    Request $request,
    string $tarif_reduction_code
) {
    $tarifReduction = TarifReduction::findOrFail(
        $tarif_reduction_code
    );

    $validatedData = $request->validate([
        'designation' => [
            'required',
            'string',
            'max:255',
            Rule::unique(
                $tarifReduction->getTable(),
                'designation'
            )->ignore($tarifReduction->getKey()),
        ],
        'photo' => [
            'nullable',
            'image',
            'mimes:jpeg,png,jpg,gif,webp',
            'max:2048',
        ],
    ]);

    $oldPhotoPath = $tarifReduction->photo;
    $newPhotoPath = null;

    if ($request->hasFile('photo')) {
        $newPhotoPath = $request
            ->file('photo')
            ->store('reduction-photos', 'public');

        $validatedData['photo'] = $newPhotoPath;
    }

    try {
        $tarifReduction->update($validatedData);
    } catch (\Throwable $exception) {
        if (
            $newPhotoPath &&
            Storage::disk('public')->exists(
                $newPhotoPath
            )
        ) {
            Storage::disk('public')->delete(
                $newPhotoPath
            );
        }

        throw $exception;
    }

    if (
        $newPhotoPath &&
        $oldPhotoPath &&
        $oldPhotoPath !== $newPhotoPath &&
        Storage::disk('public')->exists(
            $oldPhotoPath
        )
    ) {
        Storage::disk('public')->delete(
            $oldPhotoPath
        );
    }

    return response()->json([
        'message' =>
            'Tarif Réduction modifié avec succès.',
        'tarifReduction' =>
            $tarifReduction->fresh(),
    ], 200);
}

public function supprimerDesiTarif(
    string $tarif_reduction_code
) {
    $tarifReduction = TarifReduction::findOrFail(
        $tarif_reduction_code
    );

    $photoPath = $tarifReduction->photo;

    $tarifReduction->delete();

    if (
        $photoPath &&
        Storage::disk('public')->exists($photoPath)
    ) {
        Storage::disk('public')->delete($photoPath);
    }

    return response()->json([
        'message' =>
            'Tarif Réduction supprimé avec succès.',
    ], 200);
}
}
