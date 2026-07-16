<?php

namespace App\Http\Controllers;

use App\Models\TarifRepas;
use App\Models\TarifRepasDetail;
use App\Models\TypeRepas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TarifRepasDetailController extends Controller
{
    public function getAll()
    {
        return response()->json([
            'tarifRepas' => TarifRepasDetail::with(['mealType', 'mealRateGrid'])->orderBy('id')->get(),
            'tarifsRepas' => TarifRepas::orderBy('designation')->get(),
            'typesRepas' => TypeRepas::orderBy('type_repas')->get(),
        ]);
    }

    public function ajouterTarifRepasDetail(Request $request)
    {
        $data = $this->validatedData($request);
        if ($locked = $this->lockedGridResponse((int) $data['tarif_repas_id'])) {
            return $locked;
        }

        $detail = TarifRepasDetail::create($data);

        return response()->json($detail->load(['mealType', 'mealRateGrid']), 201);
    }

    public function afficherTarifRepasDetail(TarifRepasDetail $tarifRepasDetail)
    {
        return response()->json($tarifRepasDetail->load(['mealType', 'mealRateGrid']));
    }

    public function updateTarifRepasDetail(Request $request, TarifRepasDetail $tarifRepasDetail)
    {
        $data = $this->validatedData($request, $tarifRepasDetail);
        foreach (array_unique([$tarifRepasDetail->tarif_repas_id, (int) $data['tarif_repas_id']]) as $gridId) {
            if ($locked = $this->lockedGridResponse((int) $gridId)) {
                return $locked;
            }
        }

        $tarifRepasDetail->update($data);

        return response()->json($tarifRepasDetail->refresh()->load(['mealType', 'mealRateGrid']));
    }

    public function supprimerTarifRepasDetail(TarifRepasDetail $tarifRepasDetail)
    {
        if ($locked = $this->lockedGridResponse($tarifRepasDetail->tarif_repas_id)) {
            return $locked;
        }

        $tarifRepasDetail->delete();

        return response()->json(['message' => 'Tarif repas supprimé avec succès.']);
    }

    private function validatedData(Request $request, ?TarifRepasDetail $detail = null): array
    {
        $input = [
            'tarif_repas_id' => $request->input('tarif_repas_id', $request->input('tarif_repas')),
            'type_repas_id' => $request->input('type_repas_id', $request->input('type_repas')),
            'prix_par_personne' => $request->input('prix_par_personne', $request->input('montant')),
        ];

        return Validator::make($input, [
            'tarif_repas_id' => ['required', 'integer', 'exists:tarifs_repas,id'],
            'type_repas_id' => [
                'required',
                'integer',
                'exists:types_repas,id',
                Rule::unique('tarif_repas_detail', 'type_repas_id')
                    ->where(fn ($query) => $query->where('tarif_repas_id', $input['tarif_repas_id']))
                    ->ignore($detail?->id),
            ],
            'prix_par_personne' => ['required', 'numeric', 'min:0'],
        ])->validate();
    }

    private function lockedGridResponse(int $gridId)
    {
        $plan = TarifRepas::find($gridId);
        if ($message = $plan?->detailLockMessage()) {
            return response()->json(['message' => $message], 409);
        }

        return null;
    }
}
