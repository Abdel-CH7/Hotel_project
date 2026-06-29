<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Info;

class InfoController extends Controller
{
    public function getAll()
    {
        $infos = Info::all();
        return response()->json($infos);
    }

    public function ajouterInfo(Request $request)
    {
        $validatedData = $request->validate([
            'nom' => 'required|string|max:35',
            'prenom' => 'required|string|max:35',
            'age' => 'required|integer|max:35',
            "code_client" => 'required|integer|max:255',
        ]);
        $info = Info::create($validatedData);
        return response()->json($info, 201);
    }

    public function afficherInfo(string $info_id)
    {
        $info = Info::findOrFail($info_id);
        return response()->json($info);
    }

    public function updateInfo(Request $request, string $info_id)
    {
        $info = Info::findOrFail($info_id);
        $validatedData = $request->validate([
            'nom' => 'required|string|max:35',
            'prenom' => 'required|string|max:35',
            'age' => 'required|integer|max:35',
            "code_client" => 'required|integer|max:255',
        ]);

        $info->update($validatedData);
        return response()->json($info);
    }

    public function supprimerInfo(string $info_id)
    {
        $info = Info::findOrFail($info_id);
        $info->delete();
        return response()->json(['message' => 'Info Paiement deleted successfully']);
    }
}
