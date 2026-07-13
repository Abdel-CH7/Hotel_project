<?php

namespace App\Http\Controllers;

use App\Models\Etage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EtageController extends Controller
{
    public function getAll()
    {
        return response()->json([
            'etages' => Etage::all(),
        ]);
    }

    public function ajouterEtage(Request $request)
    {
        $validatedData = $request->validate([
            'etage' => [
                'required',
                'string',
                'max:255',
                Rule::unique('etages', 'etage'),
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
                ->store('etage-photos', 'public');

            $validatedData['photo'] = $newPhotoPath;
        }

        try {
            $etage = Etage::create($validatedData);
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
            'message' => 'Étage ajouté avec succès.',
            'etage' => $etage,
        ], 201);
    }

    public function afficherEtage(string $id)
    {
        $etage = Etage::findOrFail($id);

        return response()->json($etage);
    }

    public function updateEtage(Request $request, string $id)
    {
        $etage = Etage::findOrFail($id);

        $validatedData = $request->validate([
            'etage' => [
                'required',
                'string',
                'max:255',
                Rule::unique('etages', 'etage')
                    ->ignore($etage->id),
            ],

            'photo' => [
                'nullable',
                'image',
                'mimes:jpeg,png,jpg,gif,webp',
                'max:2048',
            ],
        ]);

        $oldPhotoPath = $etage->photo;
        $newPhotoPath = null;

        if ($request->hasFile('photo')) {
            $newPhotoPath = $request
                ->file('photo')
                ->store('etage-photos', 'public');

            $validatedData['photo'] = $newPhotoPath;
        }

        try {
            $etage->update($validatedData);
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
            'message' => 'Étage modifié avec succès.',
            'etage' => $etage->fresh(),
        ], 200);
    }

    public function supprimerEtage(string $id)
    {
        $etage = Etage::findOrFail($id);

        $photoPath = $etage->photo;

        $etage->delete();

        if (
            $photoPath &&
            Storage::disk('public')->exists($photoPath)
        ) {
            Storage::disk('public')->delete($photoPath);
        }

        return response()->json([
            'message' => 'Étage supprimé avec succès.',
        ], 200);
    }
}