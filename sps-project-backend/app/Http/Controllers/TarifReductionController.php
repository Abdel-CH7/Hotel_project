<?php

namespace App\Http\Controllers;

use App\Models\TarifReduction;
use App\Models\TypeReduction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TarifReductionController extends Controller
{
    public function getAll()
    {
        return response()->json([
            'tarifsReduction' => TarifReduction::with('details.reductionType')->orderBy('designation')->get(),
            'typesReduction' => TypeReduction::orderBy('type_reduction')->get(),
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
            $grid = TarifReduction::create($data);
        } catch (\Throwable $exception) {
            $this->deletePhoto($newPhoto);
            throw $exception;
        }

        return response()->json(['message' => 'Plan de réductions ajouté avec succès.', 'tarifReduction' => $grid], 201);
    }

    public function afficherDesiTarif(TarifReduction $tarifReduction)
    {
        return response()->json($tarifReduction->load('details.reductionType'));
    }

    public function updateDesiTarif(Request $request, TarifReduction $tarifReduction)
    {
        if ($message = $tarifReduction->detailLockMessage()) {
            return response()->json(['message' => $message], 409);
        }

        $data = $this->validatedData($request, $tarifReduction);
        $oldPhoto = $tarifReduction->photo;
        $newPhoto = $this->storePhoto($request);
        if ($newPhoto) {
            $data['photo'] = $newPhoto;
        }

        try {
            $tarifReduction->update($data);
        } catch (\Throwable $exception) {
            $this->deletePhoto($newPhoto);
            throw $exception;
        }

        if ($newPhoto && $oldPhoto !== $newPhoto) {
            $this->deletePhoto($oldPhoto);
        }

        return response()->json(['message' => 'Plan de réductions modifié avec succès.', 'tarifReduction' => $tarifReduction->refresh()]);
    }

    public function supprimerDesiTarif(TarifReduction $tarifReduction)
    {
        if ($message = $tarifReduction->deletionBlockMessage()) {
            return response()->json(['message' => $message], 409);
        }

        $photo = $tarifReduction->photo;
        $tarifReduction->delete();
        $this->deletePhoto($photo);

        return response()->json(['message' => 'Plan de réductions supprimé avec succès.']);
    }

    private function validatedData(Request $request, ?TarifReduction $grid = null): array
    {
        $request->merge(['designation' => trim((string) $request->input('designation', ''))]);

        return $request->validate([
            'designation' => ['required', 'string', 'max:255', Rule::unique('tarifs_reduction', 'designation')->ignore($grid?->id)],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);
    }

    private function storePhoto(Request $request): ?string
    {
        return $request->hasFile('photo') ? $request->file('photo')->store('reduction-photos', 'public') : null;
    }

    private function deletePhoto(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
