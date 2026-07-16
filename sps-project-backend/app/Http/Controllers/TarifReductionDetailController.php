<?php

namespace App\Http\Controllers;

use App\Models\TarifReduction;
use App\Models\TarifReductionDetail;
use App\Models\TypeReduction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TarifReductionDetailController extends Controller
{
    public function getAll()
    {
        return response()->json([
            'tarifsReductionDetail' => TarifReductionDetail::with(['reductionType', 'reductionGrid'])->orderBy('id')->get(),
            'tarifsReduction' => TarifReduction::orderBy('designation')->get(),
            'typesReduction' => TypeReduction::orderBy('type_reduction')->get(),
        ]);
    }

    public function ajouterTarifReductionDetail(Request $request)
    {
        $data = $this->validatedData($request);
        if ($locked = $this->lockedGridResponse((int) $data['tarif_reduction_id'])) {
            return $locked;
        }

        $detail = TarifReductionDetail::create($data);

        return response()->json($detail->load(['reductionType', 'reductionGrid']), 201);
    }

    public function afficherTarifReductionDetail(TarifReductionDetail $tarifReductionDetail)
    {
        return response()->json($tarifReductionDetail->load(['reductionType', 'reductionGrid']));
    }

    public function updateTarifReductionDetail(Request $request, TarifReductionDetail $tarifReductionDetail)
    {
        $data = $this->validatedData($request, $tarifReductionDetail);
        foreach (array_unique([$tarifReductionDetail->tarif_reduction_id, (int) $data['tarif_reduction_id']]) as $gridId) {
            if ($locked = $this->lockedGridResponse((int) $gridId)) {
                return $locked;
            }
        }

        $tarifReductionDetail->update($data);

        return response()->json($tarifReductionDetail->refresh()->load(['reductionType', 'reductionGrid']));
    }

    public function supprimerTarifReductionDetail(TarifReductionDetail $tarifReductionDetail)
    {
        if ($locked = $this->lockedGridResponse($tarifReductionDetail->tarif_reduction_id)) {
            return $locked;
        }

        $tarifReductionDetail->delete();

        return response()->json(['message' => 'Tarif réduction supprimé avec succès.']);
    }

    private function validatedData(Request $request, ?TarifReductionDetail $detail = null): array
    {
        $input = [
            'tarif_reduction_id' => $request->input('tarif_reduction_id', $request->input('tarif_reduction')),
            'type_reduction_id' => $request->input('type_reduction_id', $request->input('type_reduction')),
            'montant_fixe' => $request->input('montant_fixe', $request->input('montant', 0)),
            'pourcentage' => $request->input('pourcentage', $request->input('percentage', 0)),
        ];

        $validator = Validator::make($input, [
            'tarif_reduction_id' => ['required', 'integer', 'exists:tarifs_reduction,id'],
            'type_reduction_id' => [
                'required',
                'integer',
                'exists:types_reduction,id',
                Rule::unique('tarif_reduction_detail', 'type_reduction_id')
                    ->where(fn ($query) => $query->where('tarif_reduction_id', $input['tarif_reduction_id']))
                    ->ignore($detail?->id),
            ],
            'montant_fixe' => ['required', 'numeric', 'min:0'],
            'pourcentage' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $validator->after(function ($validator) use ($input): void {
            if ((float) $input['montant_fixe'] <= 0 && (float) $input['pourcentage'] <= 0) {
                $validator->errors()->add('montant_fixe', 'Un montant fixe ou un pourcentage supérieur à zéro est requis.');
            }
        });

        return $validator->validate();
    }

    private function lockedGridResponse(int $gridId)
    {
        $plan = TarifReduction::find($gridId);
        if ($message = $plan?->detailLockMessage()) {
            return response()->json(['message' => $message], 409);
        }

        return null;
    }
}
