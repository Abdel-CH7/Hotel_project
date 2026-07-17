<?php

namespace App\Http\Controllers;

use App\Models\Departement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ReclamationDepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Departement::query()->orderBy('nom')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('departement-photos', 'public');
        }

        try {
            $department = Departement::create($data);
        } catch (\Throwable $exception) {
            $this->removePhoto($data['photo'] ?? null);
            throw $exception;
        }

        return response()->json(['data' => $department], 201);
    }

    public function update(Request $request, Departement $departement): JsonResponse
    {
        $data = $this->validated($request, $departement);
        $oldPhoto = $departement->photo;
        $newPhoto = null;
        if ($request->hasFile('photo')) {
            $newPhoto = $request->file('photo')->store('departement-photos', 'public');
            $data['photo'] = $newPhoto;
        }

        try {
            $departement->update($data);
        } catch (\Throwable $exception) {
            $this->removePhoto($newPhoto);
            throw $exception;
        }
        if ($newPhoto && $oldPhoto !== $newPhoto) {
            $this->removePhoto($oldPhoto);
        }

        return response()->json(['data' => $departement->fresh()]);
    }

    public function active(Request $request, Departement $departement): JsonResponse
    {
        $data = $request->validate(['actif' => ['required', 'boolean']]);
        $departement->update($data);

        return response()->json(['data' => $departement->fresh()]);
    }

    private function validated(Request $request, ?Departement $departement = null): array
    {
        return $request->validate([
            'nom' => ['required', 'string', 'max:255', Rule::unique('departements', 'nom')->ignore($departement?->id)],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
            'actif' => ['sometimes', 'boolean'],
        ], [
            'nom.required' => 'Le nom du département est obligatoire.',
            'nom.unique' => 'Ce département existe déjà.',
        ]);
    }

    private function removePhoto(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
