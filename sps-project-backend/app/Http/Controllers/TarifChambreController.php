<?php
namespace App\Http\Controllers;

use App\Models\TypeChambre;
use App\Models\TarifChambre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TarifChambreController extends Controller
{
    public function getAll()
    {
        $typesChambre = TypeChambre::with('detail')->get();
        $tarifsChambre = TarifChambre::all();
        return response()->json([
            "tarifsChambre" => $tarifsChambre,
            "typesChambre" => $typesChambre
        ]);
    }

    public function ajouterDesiTarif(Request $request)
    {
        // Validate Photo
        $validatedData = $request->validate([
            'designation' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        // Storing Photo
        $photo = $request->file('photo');
        // Deleting Old Photo and Inserting The New Photo
        if ($request->hasFile('photo')) {
            // Storage::disk('public')->delete($tarifChambre->photo);
            $photoPath = $photo->storeAs('chambre-photos', time() . '_' . $photo->getClientOriginalName(), 'public');
            $validatedData['photo'] = $photoPath;
        }
        // Saving Photo
        $tarifChambre = TarifChambre::create($validatedData);
        return response()->json($tarifChambre, 201);
    }

    public function afficherDesiTarif(string $tarif_chambre_code)
    {
        $tarifChambre = TarifChambre::with('typeChambre')->findOrFail($tarif_chambre_code);
        return response()->json($tarifChambre);
    }

    public function updateDesiTarif(Request $request, string $tarif_chambre_code)
    {
        // Finding Photo
        $tarifChambre = TarifChambre::findOrFail($tarif_chambre_code);
        // Validating Photo
        $validatedData = $request->validate([
            'designation' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        // Storing Photo
        $photo = $request->file('photo');
        // Deleting Old Photo and Inserting The New Photo
        if ($request->hasFile('photo')) {
            // Storage::disk('public')->delete($tarifChambre->photo);
            $photoPath = $photo->storeAs('chambre-photos', time() . '_' . $photo->getClientOriginalName(), 'public');
            $validatedData['photo'] = $photoPath;
        }
        // Updating Photo
        $tarifChambre->update($validatedData);
        return response()->json($request);
    }

    public function supprimerDesiTarif(string $tarif_chambre_code)
    {
        $tarifChambre = TarifChambre::findOrFail($tarif_chambre_code);
        $tarifChambre->delete();

        return response()->json(['message' => 'Tarif chambre deleted successfully']);
    }
}
