<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MaintenanceTypeController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'maintenance_types' => MaintenanceType::orderBy('code')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $type = MaintenanceType::create($request->validate($this->rules()));

        return response()->json(['success' => true, 'type' => $type], 201);
    }

    public function show($id)
    {
        $type = MaintenanceType::find($id);
        
        if (!$type) {
            return response()->json(['message' => 'Type de maintenance non trouvé'], 404);
        }

        return response()->json(['success' => true, 'type' => $type]);
    }

    public function update(Request $request, $id)
    {
        $type = MaintenanceType::find($id);
        
        if (!$type) {
            return response()->json(['message' => 'Type de maintenance non trouvé'], 404);
        }

        $type->update($request->validate($this->rules($type)));

        return response()->json(['success' => true, 'type' => $type->fresh()]);
    }

    public function destroy($id)
    {
        $type = MaintenanceType::find($id);
        
        if (!$type) {
            return response()->json(['message' => 'Type de maintenance non trouvé'], 404);
        }

        if ($type->etatChambres()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Ce type de maintenance ne peut pas être supprimé car il est affecté à un état de chambre.',
            ], 409);
        }

        $type->delete();

        return response()->json([
            'success' => true,
            'message' => 'Type de maintenance supprimé avec succès.',
        ]);
    }

    private function rules(?MaintenanceType $type = null): array
    {
        $required = $type ? 'sometimes' : 'required';

        return [
            'code' => [
                $required,
                'string',
                'max:255',
                Rule::unique('types_maintenance', 'code')->ignore($type?->id),
            ],
            'types_maintenance' => "{$required}|string|max:255",
            'description' => 'nullable|string',
        ];
    }
}
