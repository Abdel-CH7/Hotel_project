<?php

namespace App\Http\Controllers;

use App\Models\Emplacement;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmplacementController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'emplacements' => Emplacement::orderBy('nom')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->merge(['nom' => $this->normalizeName($request->input('nom'))]);

        $validatedData = $request->validate([
            'nom' => 'required|string|max:255|unique:emplacements,nom',
            'type' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $emplacement = Emplacement::create($validatedData);

        return response()->json([
            'success' => true,
            'emplacement' => $emplacement,
        ], 201);
    }

    public function update(Request $request, Emplacement $emplacement)
    {
        $request->merge(['nom' => $this->normalizeName($request->input('nom'))]);

        $validatedData = $request->validate([
            'nom' => [
                'required',
                'string',
                'max:255',
                Rule::unique('emplacements', 'nom')->ignore($emplacement->id),
            ],
            'type' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $emplacement->update($validatedData);

        return response()->json([
            'success' => true,
            'emplacement' => $emplacement->fresh(),
        ]);
    }

    public function destroy(Emplacement $emplacement)
    {
        if ($emplacement->equipements()->withTrashed()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cet emplacement ne peut pas être supprimé car des équipements y sont affectés.',
            ], 409);
        }

        $emplacement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Emplacement supprimé avec succès.',
        ]);
    }

    private function normalizeName(mixed $name): string
    {
        return preg_replace('/\s+/u', ' ', trim((string) $name)) ?? '';
    }
}
