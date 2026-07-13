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

    public function updateDesiTarif(Request $request, $desigs_id)
{
    $tarifRepas = TarifRepas::findOrFail($desigs_id);

    $validatedData = $request->validate([
        'designation' => 'required|string|max:255',
        'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
    ]);

    $tarifRepas->designation = $validatedData['designation'];

    if ($request->hasFile('photo')) {
        // Delete the old database photo
        if (
            $tarifRepas->photo &&
            Storage::disk('public')->exists($tarifRepas->photo)
        ) {
            Storage::disk('public')->delete($tarifRepas->photo);
        }

        $file = $request->file('photo');

        $fileName =
            time() . '_' .
            preg_replace(
                '/\s+/',
                '_',
                $file->getClientOriginalName()
            );

        $tarifRepas->photo = $file->storeAs(
            'tarifs-repas',
            $fileName,
            'public'
        );
    }

    $tarifRepas->save();

    return response()->json([
        'message' => 'Désignation modifiée avec succès',
        'tarifRepas' => $tarifRepas,
    ], 200);
}

    public function supprimerDesiTarif(string $tarif_repas_code)
    {
        $tarifRepas = TarifRepas::findOrFail($tarif_repas_code);
        $tarifRepas->delete();

        return response()->json(['message' => 'Tarif repas deleted successfully']);
    }
}
