<?php

namespace App\Http\Controllers;

use App\Models\Enfant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class EnfantController extends Controller
{


public function store(Request $request)
{
    return $this->saveEnfants($request);
}

public function update(Request $request)
{
    return $this->saveEnfants($request);
}

private function saveEnfants(Request $request)
{
    $infos = $request->input('infos', $request->input('info_clients', []));
    $clientId = $request->input('client_id');

    $request->merge([
        'infos' => $infos,
        'client_id' => $clientId,
    ]);

    $validator = Validator::make($request->all(), [
        'client_id' => 'nullable|exists:clients_particulier,id',
        'infos' => 'nullable|array',
        'infos.*.id' => 'nullable|exists:enfants,id',
        'infos.*.idClient' => 'required_with:infos|exists:clients_particulier,id',
        'infos.*.type' => 'nullable|string|max:10',
        'infos.*.name' => 'required_with:infos|string|max:255',
        'infos.*.prenom' => 'nullable|string|max:255',
        'infos.*.age' => 'nullable|integer|min:0|max:17',
    ], [
        'infos.*.age.integer' => 'L’âge de l’enfant doit être compris entre 0 et 17 ans.',
        'infos.*.age.min' => 'L’âge de l’enfant doit être compris entre 0 et 17 ans.',
        'infos.*.age.max' => 'L’âge de l’enfant doit être compris entre 0 et 17 ans.',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    return DB::transaction(function () use ($infos, $clientId) {
        $savedEnfants = [];
        $savedIds = [];

        foreach ($infos as $enfant) {
            $savedEnfant = Enfant::updateOrCreate(
                [
                    'id' => $enfant['id'] ?? null,
                ],
                [
                    'idClient' => $enfant['idClient'],
                    'type' => $enfant['type'] ?? 'C',
                    'name' => $enfant['name'],
                    'prenom' => $enfant['prenom'] ?? null,
                    'age' => $enfant['age'] ?? null,
                ]
            );

            $savedEnfants[] = $savedEnfant;
            $savedIds[] = $savedEnfant->id;
        }

        $targetClientId = $clientId ?: ($infos[0]['idClient'] ?? null);

        if ($targetClientId) {
            Enfant::where('idClient', $targetClientId)
                ->where('type', 'C')
                ->when(count($savedIds) > 0, function ($query) use ($savedIds) {
                    $query->whereNotIn('id', $savedIds);
                })
                ->when(count($savedIds) === 0, function ($query) {
                    return $query;
                })
                ->delete();
        }

        return response()->json([
            'message' => 'Enfants enregistrés avec succès',
            'enfants' => $savedEnfants,
        ], 200);
    });
}    public function destroy($id)
    {
        try {
            $client = Enfant::findOrFail($id);
            $client->delete();

            return response()->json(['message' => 'Client supprimé avec succès'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        } catch (\Illuminate\Database\QueryException $e) {
            // Vérifier si l'erreur est liée à une contrainte d'intégrité
            if ($e->errorInfo[1] === 1451) {
                // Renvoyer le message d'erreur spécifique
                return response()->json(['error' => 'Impossible de supprimer ce client car il est associées a d\'autres platformes.'], 400);
            } else {
                // Renvoyer l'erreur par défaut
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }
}
}
