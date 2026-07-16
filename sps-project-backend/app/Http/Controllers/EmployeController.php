<?php

namespace App\Http\Controllers;

use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'employes' => Employe::orderBy('nom')->orderBy('prenom')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $employe = Employe::create($request->validate($this->rules()));

        return response()->json([
            'success' => true,
            'employe' => $employe,
        ], 201);
    }

    public function show(Employe $employe)
    {
        return response()->json([
            'success' => true,
            'employe' => $employe,
        ]);
    }

    public function update(Request $request, Employe $employe)
    {
        $employe->update($request->validate($this->rules($employe)));

        return response()->json([
            'success' => true,
            'employe' => $employe->fresh(),
        ]);
    }

    public function destroy(Employe $employe)
    {
        if ($employe->etatChambres()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cet employé ne peut pas être supprimé car il est référencé par un état de chambre.',
            ], 409);
        }

        $employe->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employé supprimé avec succès.',
        ]);
    }

    private function rules(?Employe $employe = null): array
    {
        $required = $employe ? 'sometimes' : 'required';

        return [
            'matricule' => [
                $required,
                'string',
                'max:255',
                Rule::unique('employes', 'matricule')->ignore($employe?->id),
            ],
            'nom' => "{$required}|string|max:255",
            'prenom' => "{$required}|string|max:255",
            'fonction' => [$required, Rule::in(['nettoyage', 'maintenance', 'supervision'])],
            'telephone' => 'nullable|string|max:255',
            'actif' => 'sometimes|boolean',
            'user_id' => 'nullable|integer|exists:users,id',
        ];
    }
}
