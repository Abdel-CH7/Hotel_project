<?php
namespace App\Http\Controllers;

use App\Models\TypeReduction;
use App\Models\TarifReduction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TarifReductionController extends Controller
{
    public function getAll()
    {
        $typesReduction = TypeReduction::with('detail')->get();
        $tarifsReduction = TarifReduction::all();
        return response()->json([
            "tarifsReduction" => $tarifsReduction,
            "typesReduction" => $typesReduction
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
            // Storage::disk('public')->delete($tarifReduction->photo);
            $photoPath = $photo->storeAs('reduction-photos', time() . '_' . $photo->getClientOriginalName(), 'public');
            $validatedData['photo'] = $photoPath;
        }
        // Saving Photo
        $tarifReduction = TarifReduction::create($validatedData);
        return response()->json($tarifReduction, 201);
    }

    public function afficherDesiTarif(string $tarif_reduction_code)
    {
        $tarifReduction = TarifReduction::with('typeReduction')->findOrFail($tarif_reduction_code);
        return response()->json($tarifReduction);
    }

    public function updateDesiTarif(Request $request, string $tarif_reduction_code)
    {
        // Finding Photo
        $tarifReduction = TarifReduction::findOrFail($tarif_reduction_code);
        // Validating Photo
        $validatedData = $request->validate([
            'designation' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        // Storing Photo
        $photo = $request->file('photo');
        // Deleting Old Photo and Inserting The New Photo
        if ($request->hasFile('photo')) {
            // Storage::disk('public')->delete($tarifReduction->photo);
            $photoPath = $photo->storeAs('reduction-photos', time() . '_' . $photo->getClientOriginalName(), 'public');
            $validatedData['photo'] = $photoPath;
        }
        // Updating Photo
        $tarifReduction->update($validatedData);
        return response()->json($request);
    }

    public function supprimerDesiTarif(string $tarif_reduction_code)
    {
        $tarifReduction = TarifReduction::findOrFail($tarif_reduction_code);
        $tarifReduction->delete();

        return response()->json(['message' => 'Tarif reduction deleted successfully']);
    }
}
