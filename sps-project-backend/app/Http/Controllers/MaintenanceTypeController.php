<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MaintenanceTypeController extends Controller
{
    public function index()
    {
        $types = MaintenanceType::all();
        return response()->json(['types' => $types]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:types_maintenance',
            'types_maintenance' => 'required|string',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = MaintenanceType::create($request->all());
        return response()->json(['type' => $type], 201);
    }

    public function show($id)
    {
        $type = MaintenanceType::find($id);
        
        if (!$type) {
            return response()->json(['message' => 'Type de maintenance non trouvé'], 404);
        }

        return response()->json(['type' => $type]);
    }

    public function update(Request $request, $id)
    {
        $type = MaintenanceType::find($id);
        
        if (!$type) {
            return response()->json(['message' => 'Type de maintenance non trouvé'], 404);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|required|string|unique:types_maintenance,code,' . $id,
            'types_maintenance' => 'sometimes|required|string',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type->update($request->all());
        return response()->json(['type' => $type]);
    }

    public function destroy($id)
    {
        $type = MaintenanceType::find($id);
        
        if (!$type) {
            return response()->json(['message' => 'Type de maintenance non trouvé'], 404);
        }

        $type->delete();
        return response()->json(['message' => 'Type de maintenance supprimé avec succès']);
    }
} 