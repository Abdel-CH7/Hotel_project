<?php

namespace App\Http\Controllers;

use App\Models\TarifChambre;
use App\Models\TarifChambreDetail;
use App\Models\TypeChambre;
use App\Support\GeneratedRecordCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TarifChambreDetailController extends Controller
{
    public function getAll()
    {
        return response()->json([
            'tarifsChambreDetail' => TarifChambreDetail::with(['roomType', 'roomRateGrid'])->orderBy('id')->get(),
            'typesChambre' => TypeChambre::orderBy('type_chambre')->get(),
            'tarifsChambre' => TarifChambre::orderBy('designation')->get(),
        ]);
    }

    public function ajouterTarifChambreDetail(Request $request)
    {
        $data = $this->validatedData($request);
        if ($locked = $this->lockedGridResponse((int) $data['tarif_chambre_id'])) {
            return $locked;
        }

        $detail = DB::transaction(function () use ($data): TarifChambreDetail {
            $detail = TarifChambreDetail::create(array_merge($data, [
                'code' => GeneratedRecordCode::temporary('TC'),
            ]));
            $detail->forceFill([
                'code' => GeneratedRecordCode::fromId('TC', $detail->id),
            ])->save();

            return $detail;
        });

        return response()->json($detail->load(['roomType', 'roomRateGrid']), 201);
    }

    public function afficherTarifChambreDetail(TarifChambreDetail $tarifChambreDetail)
    {
        return response()->json($tarifChambreDetail->load(['roomType', 'roomRateGrid']));
    }

    public function updateTarifChambreDetail(Request $request, TarifChambreDetail $tarifChambreDetail)
    {
        $data = $this->validatedData($request, $tarifChambreDetail);
        foreach (array_unique([$tarifChambreDetail->tarif_chambre_id, (int) $data['tarif_chambre_id']]) as $gridId) {
            if ($locked = $this->lockedGridResponse((int) $gridId)) {
                return $locked;
            }
        }

        $tarifChambreDetail->update($data);

        return response()->json($tarifChambreDetail->refresh()->load(['roomType', 'roomRateGrid']));
    }

    public function supprimerTarifChambreDetail(TarifChambreDetail $tarifChambreDetail)
    {
        if ($locked = $this->lockedGridResponse($tarifChambreDetail->tarif_chambre_id)) {
            return $locked;
        }

        $tarifChambreDetail->delete();

        return response()->json(['message' => 'Tarif chambre supprimé avec succès.']);
    }

    private function validatedData(Request $request, ?TarifChambreDetail $detail = null): array
    {
        $input = [
            'tarif_chambre_id' => $request->input('tarif_chambre_id', $request->input('tarif_chambre')),
            'type_chambre_id' => $request->input('type_chambre_id', $request->input('type_chambre')),
            'prix_1_personne' => $this->nullableMoney($request->input('prix_1_personne', $request->input('single'))),
            'prix_2_personnes' => $this->nullableMoney($request->input('prix_2_personnes', $request->input('double'))),
            'prix_3_personnes' => $this->nullableMoney($request->input('prix_3_personnes', $request->input('triple'))),
            'prix_lit_supplementaire' => $request->input('prix_lit_supplementaire', $request->input('lit_supp', 0)),
        ];

        $validator = Validator::make($input, [
            'tarif_chambre_id' => ['required', 'integer', 'exists:tarifs_chambre,id'],
            'type_chambre_id' => [
                'required',
                'integer',
                'exists:types_chambre,id',
                Rule::unique('tarif_chambre_detail', 'type_chambre_id')
                    ->where(fn ($query) => $query->where('tarif_chambre_id', $input['tarif_chambre_id']))
                    ->ignore($detail?->id),
            ],
            'prix_1_personne' => ['nullable', 'numeric', 'min:0'],
            'prix_2_personnes' => ['nullable', 'numeric', 'min:0'],
            'prix_3_personnes' => ['nullable', 'numeric', 'min:0'],
            'prix_lit_supplementaire' => ['required', 'numeric', 'min:0'],
        ]);

        $validator->after(function ($validator) use ($input): void {
            $hasPositiveOccupancyPrice = collect([
                $input['prix_1_personne'],
                $input['prix_2_personnes'],
                $input['prix_3_personnes'],
            ])->contains(fn ($price) => $price !== null && (float) $price > 0);

            if (! $hasPositiveOccupancyPrice) {
                $validator->errors()->add('prix_1_personne', "Au moins un prix d'occupation strictement supérieur à zéro est requis.");
            }
        });

        return $validator->validate();
    }

    private function lockedGridResponse(int $gridId)
    {
        $plan = TarifChambre::find($gridId);
        if ($message = $plan?->detailLockMessage()) {
            return response()->json(['message' => $message], 409);
        }

        return null;
    }

    private function nullableMoney(mixed $value): mixed
    {
        return $value === '' ? null : $value;
    }

}
