<?php
namespace App\Http\Controllers;

use App\Models\Etage;
use Illuminate\Http\Request;
use App\Services\ImageService;
use Illuminate\Support\Facades\Storage;

class EtageController extends Controller
{
    public function getAll()
    {
        $etages = Etage::all();
        return response()->json([
            "etages" => $etages
        ]);
    }

    public function ajouterEtage(Request $request)
    {
        // Validate Photo
        $validatedData = $request->validate([
            'etage' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        // Storing Photo
        $photo = $request->file('photo');
        if ($request->hasFile('photo')) {
            $webpImagePath = 'etage-photos/' . time() . '_' . pathinfo($photo->getClientOriginalName(), PATHINFO_FILENAME) . '.webp';
            $convertedImage = ImageService::convertToWebp($photo->getRealPath());
            Storage::disk('public')->put($webpImagePath, $convertedImage);
            $validatedData['photo'] = $webpImagePath;
            // Storage::disk('public')->delete($etage->photo);
        }
        // Saving Photo
        $etage = Etage::create($validatedData);
        return response()->json($etage, 201);
    }

    public function afficherEtage(string $etage)
    {
        $etage = Etage::with('typeChambre')->findOrFail($etage);
        return response()->json($etage);
    }

    public function updateEtage(Request $request, string $etage)
    {
        // Finding Photo
        $etage = Etage::findOrFail($etage);
        // Validating Photo
        $validatedData = $request->validate([
            'etage' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        // Storing Photo
        $photo = $request->file('photo');
        // Deleting Old Photo and Inserting The New Photo
        if ($request->hasFile('photo')) {
            $webpImagePath = 'etage-photos/' . time() . '_' . pathinfo($photo->getClientOriginalName(), PATHINFO_FILENAME) . '.webp';
            $convertedImage = ImageService::convertToWebp($photo->getRealPath());
            Storage::disk('public')->put($webpImagePath, $convertedImage);
            $validatedData['photo'] = $webpImagePath;
            Storage::disk('public')->delete($etage->photo);
        }
        // Updating Photo
        $etage->update($validatedData);
        return response()->json($request);
    }

    public function supprimerEtage(string $etage)
    {
        $etage = Etage::findOrFail($etage);
        $etage->delete();

        return response()->json(['message' => 'Etage deleted successfully']);
    }
}
