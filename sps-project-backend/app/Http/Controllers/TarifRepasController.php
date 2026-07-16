<?php

namespace App\Http\Controllers;

use App\Models\TarifRepas;
use App\Models\TypeRepas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TarifRepasController extends Controller
{
    public function getAll()
    {
        return response()->json([
            'tarifsRepas' => TarifRepas::with('details.mealType')->orderBy('designation')->get(),
            'typesRepas' => TypeRepas::orderBy('type_repas')->get(),
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
            $grid = TarifRepas::create($data);
        } catch (\Throwable $exception) {
            $this->deletePhoto($newPhoto);
            throw $exception;
        }

        return response()->json(['message' => 'Plan tarifaire repas ajouté avec succès.', 'tarifRepas' => $grid], 201);
    }

    public function afficherDesiTarif(TarifRepas $tarifRepas)
    {
        return response()->json($tarifRepas->load('details.mealType'));
    }

    public function updateDesiTarif(Request $request, TarifRepas $tarifRepas)
    {
        if ($message = $tarifRepas->detailLockMessage()) {
            return response()->json(['message' => $message], 409);
        }

        $data = $this->validatedData($request, $tarifRepas);
        $oldPhoto = $tarifRepas->photo;
        $newPhoto = $this->storePhoto($request);
        if ($newPhoto) {
            $data['photo'] = $newPhoto;
        }

        try {
            $tarifRepas->update($data);
        } catch (\Throwable $exception) {
            $this->deletePhoto($newPhoto);
            throw $exception;
        }

        if ($newPhoto && $oldPhoto !== $newPhoto) {
            $this->deletePhoto($oldPhoto);
        }

        return response()->json(['message' => 'Plan tarifaire repas modifié avec succès.', 'tarifRepas' => $tarifRepas->refresh()]);
    }

    public function supprimerDesiTarif(TarifRepas $tarifRepas)
    {
        if ($message = $tarifRepas->deletionBlockMessage()) {
            return response()->json(['message' => $message], 409);
        }

        $photo = $tarifRepas->photo;
        $tarifRepas->delete();
        $this->deletePhoto($photo);

        return response()->json(['message' => 'Plan tarifaire repas supprimé avec succès.']);
    }

    private function validatedData(Request $request, ?TarifRepas $grid = null): array
    {
        $request->merge(['designation' => trim((string) $request->input('designation', ''))]);

        return $request->validate([
            'designation' => ['required', 'string', 'max:255', Rule::unique('tarifs_repas', 'designation')->ignore($grid?->id)],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);
    }

    private function storePhoto(Request $request): ?string
    {
        return $request->hasFile('photo') ? $request->file('photo')->store('repas-photos', 'public') : null;
    }

    private function deletePhoto(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
