<?php

namespace App\Http\Controllers;

use App\Models\ModePaimant;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModePaimantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Récupérer tous les modes de paiement
        $modes = ModePaimant::all();
        return response()->json($modes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Valider les données entrantes
        $validatedData = $request->validate([
            'mode_paimants' => 'required|string|max:255',
        ]);

        // Créer un nouveau mode de paiement
        $mode = ModePaimant::create($validatedData);
        return response()->json($mode, 201); // 201 Created
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        // Récupérer un mode de paiement par son ID
        $mode = ModePaimant::findOrFail($id);
        return response()->json($mode);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        // Vous pouvez retourner une vue pour l'édition si nécessaire
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        // Valider les données entrantes
        $validatedData = $request->validate([
            'mode_paimants' => 'required|string|max:255',
        ]);

        // Mettre à jour le mode de paiement
        $mode = ModePaimant::findOrFail($id);
        $mode->update($validatedData);
        return response()->json($mode);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $mode = ModePaimant::findOrFail($id);
        if (DB::table('reservation_paiements')->where('mode_paiement_id', $mode->id)->exists()) {
            return response()->json([
                'message' => 'Ce mode de paiement ne peut pas être supprimé car il est utilisé par un paiement de réservation.',
            ], 409);
        }
        if ($this->isUsedByClient('mod_id', $mode->id)) {
            return response()->json([
                'message' => 'Ce mode de paiement ne peut pas être supprimé car il est utilisé par un ou plusieurs clients.',
            ], 409);
        }

        try {
            $mode->delete();
        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Ce mode de paiement ne peut pas être supprimé car il est utilisé par un ou plusieurs clients.',
            ], 409);
        }

        return response()->json(null, 204);
    }

    private function isUsedByClient(string $column, int $id): bool
    {
        foreach (['clients_particulier', 'clients', 'site_clients', 'site_clients_particulier'] as $table) {
            if (DB::table($table)->where($column, $id)->exists()) {
                return true;
            }
        }

        return false;
    }
}
