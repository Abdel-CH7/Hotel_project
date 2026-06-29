<?php
namespace App\Http\Controllers;

use App\Models\Chambre;
use App\Models\TypeChambre;
use App\Models\Vue;
use App\Models\Etage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ChambreController extends Controller
{
    public function index()
    {
        return $this->getAll();
    }

    public function getAll()
    {
        try {
            $chambres = Chambre::with(['typeChambre', 'vue', 'etage'])->get();
            $types = TypeChambre::all();
            $vues = Vue::all();
            $etages = Etage::all();

            return response()->json([
                'chambres' => $chambres,
                'types' => $types,
                'vues' => $vues,
                'etages' => $etages
            ]);
        } catch (\Exception $e) {
            Log::error('Error in ChambreController@getAll:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Erreur lors de la récupération des données'], 500);
        }
    }

    public function ajouterChambre(Request $request)
    {
        try {
            Log::info('Incoming Data:', $request->all());
            $rules = [
                'type_chambre' => 'required|integer',
                'num_chambre' => 'required|integer|unique:chambres,num_chambre',
                'etage_id' => 'required|integer',
                'nb_lit' => 'required|integer',
                'nb_salle' => 'required|integer',
                'climat' => 'required',
                'wifi' => 'required',
                'vue_id' => 'required|integer',
            ];

            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $validatedData = $validator->validated();

            // Coerce common boolean-like values (including French 'oui'/'non') to actual booleans
            $validatedData['climat'] = $this->toBool($validatedData['climat']);
            $validatedData['wifi'] = $this->toBool($validatedData['wifi']);

            $chambre = Chambre::create($validatedData);
            return response()->json(['message' => 'Chambre ajoutée', 'chambre' => $chambre], 201);
        } catch (\Exception $e) {
            Log::error('Error creating chambre:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Erreur lors de l\'ajout'], 500);
        }
    }

    /**
     * Convert various representations to boolean.
     */
    private function toBool($value)
    {
        if (is_bool($value)) return $value;
        $v = strtolower((string) $value);
        if (in_array($v, ['1', 'true', 'yes', 'on', 'oui'], true)) return true;
        return false;
    }

    public function afficherChambre($num_chambre)
    {
        try {
            $chambre = Chambre::with(['typeChambre', 'vue', 'etage'])->findOrFail($num_chambre);
            return response()->json($chambre);
        } catch (\Exception $e) {
            Log::error('Error in ChambreController@afficherChambre:', [
                'error' => $e->getMessage(),
                'num_chambre' => $num_chambre
            ]);
            return response()->json(['error' => 'Chambre non trouvée'], 404);
        }
    }

    public function updateChambre(Request $request, $num_chambre)
    {
        try {
            $chambre = Chambre::findOrFail($num_chambre);

            $rules = [
                'num_chambre' => 'required|integer|unique:chambres,num_chambre,' . $chambre->id,
                'type_chambre' => 'required|integer',
                'etage_id' => 'required|integer',
                'nb_lit' => 'required|integer',
                'nb_salle' => 'required|integer',
                'climat' => 'required',
                'wifi' => 'required',
                'vue_id' => 'required|integer',
            ];

            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $validatedData = $validator->validated();

            // Coerce boolean-like values
            $validatedData['climat'] = $this->toBool($validatedData['climat']);
            $validatedData['wifi'] = $this->toBool($validatedData['wifi']);

            $chambre->update($validatedData);

            return response()->json(['message' => 'Chambre mise à jour avec succès', 'chambre' => $chambre]);
        } catch (\Exception $e) {
            Log::error('Error in ChambreController@updateChambre:', [
                'error' => $e->getMessage(),
                'num_chambre' => $num_chambre
            ]);
            return response()->json(['error' => 'Erreur lors de la mise à jour'], 500);
        }
    }
    

    public function supprimerChambre($num_chambre)
    {
        try {
            $chambre = Chambre::findOrFail($num_chambre);
            $chambre->delete();
            return response()->json(['message' => 'Chambre supprimée avec succès']);
        } catch (\Exception $e) {
            Log::error('Error in ChambreController@supprimerChambre:', [
                'error' => $e->getMessage(),
                'num_chambre' => $num_chambre
            ]);
            return response()->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }

    public function supprimerChambres()
    {
        try {
            Chambre::truncate();
            return response()->json(['message' => 'Toutes les chambres ont été supprimées']);
        } catch (\Exception $e) {
            Log::error('Error in ChambreController@supprimerChambres:', [
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }
}
