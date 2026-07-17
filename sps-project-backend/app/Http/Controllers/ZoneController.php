<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
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
        $zone = Zone::findOrFail($id);
        if ($this->isUsedByClient('zone_id', $zone->id)) {
            return response()->json([
                'message' => 'Cette zone ne peut pas être supprimée car elle est utilisée par un ou plusieurs clients.',
            ], 409);
        }

        try {
            $zone->delete();
        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Cette zone ne peut pas être supprimée car elle est utilisée par un ou plusieurs clients.',
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
