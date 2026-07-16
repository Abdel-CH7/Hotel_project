<?php

namespace App\Http\Controllers;

use App\Models\TarifChambre;
use App\Models\TypeChambre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TarifChambreController extends Controller
{
    public function getAll()
    {
        return response()->json([
            'tarifsChambre' => TarifChambre::with('details.roomType')->orderBy('designation')->get(),
            'typesChambre' => TypeChambre::orderBy('type_chambre')->get(),
        ]);
    }

    public function ajouterDesiTarif(Request $request)
    {
        $data = $this->validatedData($request);
        $newPhoto = $this->storePhoto($request);

        if ($newPhoto) {
            $data['photo'] = $newPhoto;
        }

        try {
            $grid = TarifChambre::create($data);
        } catch (\Throwable $exception) {
            $this->deletePhoto($newPhoto);
            throw $exception;
        }

        return response()->json(['message' => 'Plan tarifaire chambre ajouté avec succès.', 'tarifChambre' => $grid], 201);
    }

    public function afficherDesiTarif(TarifChambre $tarifChambre)
    {
        return response()->json($tarifChambre->load('details.roomType'));
    }

    public function updateDesiTarif(Request $request, TarifChambre $tarifChambre)
    {
        if ($message = $tarifChambre->detailLockMessage()) {
            return response()->json(['message' => $message], 409);
        }

        $data = $this->validatedData($request, $tarifChambre);
        $oldPhoto = $tarifChambre->photo;
        $newPhoto = $this->storePhoto($request);

        if ($newPhoto) {
            $data['photo'] = $newPhoto;
        }

        try {
            $tarifChambre->update($data);
        } catch (\Throwable $exception) {
            $this->deletePhoto($newPhoto);
            throw $exception;
        }

        if ($newPhoto && $oldPhoto !== $newPhoto) {
            $this->deletePhoto($oldPhoto);
        }

        return response()->json(['message' => 'Plan tarifaire chambre modifié avec succès.', 'tarifChambre' => $tarifChambre->refresh()]);
    }

    public function supprimerDesiTarif(TarifChambre $tarifChambre)
    {
        if ($message = $tarifChambre->deletionBlockMessage()) {
            return response()->json(['message' => $message], 409);
        }

        $photo = $tarifChambre->photo;
        $tarifChambre->delete();
        $this->deletePhoto($photo);

        return response()->json(['message' => 'Plan tarifaire chambre supprimé avec succès.']);
    }

    private function validatedData(Request $request, ?TarifChambre $grid = null): array
    {
        $request->merge(['designation' => trim((string) $request->input('designation', ''))]);

        return $request->validate([
            'designation' => ['required', 'string', 'max:255', Rule::unique('tarifs_chambre', 'designation')->ignore($grid?->id)],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);
    }

    private function storePhoto(Request $request): ?string
    {
        return $request->hasFile('photo') ? $request->file('photo')->store('chambre-photos', 'public') : null;
    }

    private function deletePhoto(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
