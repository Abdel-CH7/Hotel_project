<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Validator;

class RegionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
            $region = Region::all();
            $count = Region::count();

            return response()->json([
                'message' => 'Liste des Regions récupérée avec succès', 'Region' => $region,
                'count' => $count
            ], 200);
    }

    /**
     * Show the form for creating a new resource.
     */

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'region' => 'required|string',
        ]);
        $region = Region::create($validatedData);
        return response()->json($region, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $region = Region::find($id);
        return response()->json($region);
    }


    public function update(Request $request, $id)
    {
        $region = Region::findOrFail($id);
        $validatedData = $request->validate([
            'region' => 'required|string',
        ]);
        $region->update($validatedData);
        return response()->json($region, 200);
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        Region::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
