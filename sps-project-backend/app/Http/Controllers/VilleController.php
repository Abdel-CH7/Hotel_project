<?php

namespace App\Http\Controllers;

use App\Models\Ville;
use Illuminate\Http\Request;

class VilleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $villes = Ville::with('region')->get();
        return response()->json($villes);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request
        $request->validate([
            'ville' => 'required|string|max:255',
            'region_id' => 'nullable|exists:regions,id',  // Check if region_id exists in the regions table
        ]);

        // Create a new Ville
        $ville = Ville::create($request->all());

        return response()->json($ville, 201); // Return the newly created Ville
    }

    /**
     * Display the specified resource.
     */
    public function show(Ville $ville)
    {
        return response()->json($ville);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ville $ville)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Ville $ville)
    {
        // Validate the request
        $request->validate([
            'ville' => 'required|string|max:255',
        ]);

        // Update the Ville
        $ville->update($request->all());

        return response()->json($ville);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ville $ville)
    {
        $ville->delete();

        return response()->json(null, 204);  // Return 204 No Content
    }
}
