<?php

namespace App\Http\Controllers;

use App\Models\ModePaimant;
use Illuminate\Http\Request;

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
        // Supprimer un mode de paiement
        $mode = ModePaimant::findOrFail($id);
        $mode->delete();
        return response()->json(null, 204); // 204 No Content
    }
}
