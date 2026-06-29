<?php
namespace App\Http\Controllers;

use App\Models\TypeChambre;
use App\Models\Vue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VueController extends Controller
{
    public function getAll()
    {
        $vues = Vue::all();
        return response()->json([
            "vues" => $vues
        ]);
    }

    public function ajouterVue(Request $request)
    {
        // Validate Photo
        $validatedData = $request->validate([
            'vue' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        // Storing Photo
        $photo = $request->file('photo');
        // Deleting Old Photo and Inserting The New Photo
        if ($request->hasFile('photo')) {
            // Storage::disk('public')->delete($vue->photo);
            $photoPath = $photo->storeAs('vue-photos', time() . '_' . $photo->getClientOriginalName(), 'public');
            $validatedData['photo'] = $photoPath;
        }
        // Saving Photo
        $vue = Vue::create($validatedData);
        return response()->json($vue, 201);
    }

    public function afficherVue(string $vue)
    {
        $vue = Vue::with('typeChambre')->findOrFail($vue);
        return response()->json($vue);
    }

    public function updateVue(Request $request, string $vue)
    {
        // Finding Photo
        $vue = Vue::findOrFail($vue);
        // Validating Photo
        $validatedData = $request->validate([
            'vue' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        // Storing Photo
        $photo = $request->file('photo');
        // Deleting Old Photo and Inserting The New Photo
        if ($request->hasFile('photo')) {
            // Storage::disk('public')->delete($vue->photo);
            $photoPath = $photo->storeAs('vue-photos', time() . '_' . $photo->getClientOriginalName(), 'public');
            $validatedData['photo'] = $photoPath;
        }
        // Updating Photo
        $vue->update($validatedData);
        return response()->json($request);
    }

    public function supprimerVue(string $vue)
    {
        $vue = Vue::findOrFail($vue);
        $vue->delete();

        return response()->json(['message' => 'Vue deleted successfully']);
    }
}
