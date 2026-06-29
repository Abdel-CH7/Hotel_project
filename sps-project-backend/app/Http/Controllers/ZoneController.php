<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Validator;

class ZoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
            $zone = Zone::all();
            $count = Zone::count();
            return response()->json([
                'message' => 'Liste des zones récupérée avec succès', 'zone' => $zone,
                'count' => $count
            ], 200);

    }

    /**
     * Show the form for creating a new resource.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'zone' => 'required|string',
        ]);
        $zone = Zone::create($validatedData);
        return response()->json($zone, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $zone = Zone::find($id);
        return response()->json($zone);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function update(Request $request, $id)
    {
        $zone = Zone::findOrFail($id);
        $validatedData = $request->validate([
            'zone' => 'required|string',
        ]);
        $zone->update($validatedData);
        return response()->json($zone, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        Zone::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
