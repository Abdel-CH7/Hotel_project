<?php
namespace App\Http\Controllers;

use App\Models\TypeRepas;
use App\Models\TarifRepas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TarifRepasController extends Controller
{
    public function getAll()
    {
        $typesRepas = TypeRepas::with('detail')->get();
        $tarifsRepas = TarifRepas::all();
        return response()->json([
            "tarifsRepas" => $tarifsRepas,
            "typesRepas" => $typesRepas
        ]);
    }

    public function ajouterDesiTarif(Request $request)
    {
        // Validate Photo
        $validatedData = $request->validate([
            'designation' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);
        // Storing Photo
        $photo = $request->file('photo');
        // Deleting Old Photo and Inserting The New Photo
        if ($request->hasFile('photo')) {
            // Storage::disk('public')->delete($tarifRepas->photo);
            $photoPath = $photo->storeAs('repas-photos', time() . '_' . $photo->getClientOriginalName(), 'public');
            $validatedData['photo'] = $photoPath;
        }
        $tarifRepas = TarifRepas::create($validatedData);
        return response()->json($tarifRepas, 201);
    }

    public function afficherDesiTarif(string $tarif_repas_code)
    {
        $tarifRepas = TarifRepas::with('typeRepas')->findOrFail($tarif_repas_code);
        return response()->json($tarifRepas);
    }

    public function updateDesiTarif(Request $request, string $tarif_repas_code)
    {
        dd($request->all());
        // Finding Photo
        $tarifRepas = TarifRepas::findOrFail($tarif_repas_code);
        // Validating Photo
        $validatedData = $request->validate([
            'designation' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);
        // Storing Photo
        $photo = $request->file('photo');
        // Deleting Old Photo and Inserting The New Photo
        if ($request->hasFile('photo')) {
            // Storage::disk('public')->delete($tarifRepas->photo);
            $photoPath = $photo->storeAs('repas-photos', time() . '_' . $photo->getClientOriginalName(), 'public');
            $validatedData['photo'] = $photoPath;
        }
        // Updating Photo
        $tarifRepas->update($validatedData);
        return response()->json($request);
    }

    public function supprimerDesiTarif(string $tarif_repas_code)
    {
        $tarifRepas = TarifRepas::findOrFail($tarif_repas_code);
        $tarifRepas->delete();

        return response()->json(['message' => 'Tarif repas deleted successfully']);
    }
}
