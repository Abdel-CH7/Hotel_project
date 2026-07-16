<?php

namespace App\Http\Controllers;

use App\Models\Chambre;
use App\Models\TarifActuel;
use App\Models\TarifChambre;
use App\Models\TarifChambreDetail;
use App\Models\TarifReduction;
use App\Models\TarifReductionDetail;
use App\Models\TarifRepas;
use App\Models\TarifRepasDetail;
use App\Models\TypeChambre;
use App\Models\TypeReduction;
use App\Models\TypeRepas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TarifActuelController extends Controller
{
    private const RELATIONS = [
        'roomRateGrid.details.roomType',
        'mealRateGrid.details.mealType',
        'reductionGrid.details.reductionType',
    ];

    public function getAll()
    {
        return response()->json([
            'tarifsActuel' => TarifActuel::with(self::RELATIONS)->orderByDesc('date_debut')->get(),
            'tarifsChambreDetail' => TarifChambreDetail::with(['roomType', 'roomRateGrid'])->get(),
            'tarifsRepasDetail' => TarifRepasDetail::with(['mealType', 'mealRateGrid'])->get(),
            'tarifsReductionDetail' => TarifReductionDetail::with(['reductionType', 'reductionGrid'])->get(),
            'tarifChambre' => TarifChambre::orderBy('designation')->get(),
            'tarifRepas' => TarifRepas::orderBy('designation')->get(),
            'tarifReduction' => TarifReduction::orderBy('designation')->get(),
            'typesChambre' => TypeChambre::orderBy('type_chambre')->get(),
            'typesRepas' => TypeRepas::orderBy('type_repas')->get(),
            'typesReduction' => TypeReduction::orderBy('type_reduction')->get(),
        ]);
    }

    public function ajouterTarifActuel(Request $request)
    {
        $period = TarifActuel::create($this->validatedData($request, null, true));

        return response()->json($period->load(self::RELATIONS), 201);
    }

    public function afficherTarifActuel(TarifActuel $tarifActuel)
    {
        return response()->json($tarifActuel->load(self::RELATIONS));
    }

    public function updateTarifActuel(Request $request, TarifActuel $tarifActuel)
    {
        if ($tarifActuel->statut === 'archive') {
            return response()->json([
                'message' => 'Cette période tarifaire est archivée et ne peut plus être modifiée.',
            ], 409);
        }

        $tarifActuel->update($this->validatedData($request, $tarifActuel));

        return response()->json($tarifActuel->refresh()->load(self::RELATIONS));
    }

    public function supprimerTarifActuel(TarifActuel $tarifActuel)
    {
        if ($tarifActuel->reservations()->exists()) {
            return response()->json([
                'message' => 'Cette période tarifaire ne peut pas être supprimée car elle est utilisée par des réservations.',
            ], 409);
        }

        if ($tarifActuel->statut !== 'brouillon') {
            return response()->json([
                'message' => $tarifActuel->statut === 'actif'
                    ? 'Une période active doit être archivée et ne peut pas être supprimée.'
                    : 'Une période archivée appartient à l’historique tarifaire et ne peut pas être supprimée.',
            ], 409);
        }

        $tarifActuel->delete();

        return response()->json(['message' => 'Période tarifaire supprimée avec succès.']);
    }

    private function validatedData(Request $request, ?TarifActuel $period = null, bool $creating = false): array
    {
        $start = $request->input('date_debut', $period?->date_debut?->format('Y-m-d'));
        $end = $request->input('date_fin', $period?->date_fin?->format('Y-m-d'));
        $designation = trim((string) $request->input('designation', $period?->designation ?? ''));

        if ($designation === '' && $start && $end) {
            $designation = "Période {$start} - {$end}";
        }

        $input = [
            'designation' => $designation,
            'date_debut' => $start,
            'date_fin' => $end,
            'statut' => $creating ? 'brouillon' : $request->input('statut', $period?->statut ?? 'brouillon'),
            'tarif_chambre_id' => $request->input('tarif_chambre_id', $request->input('tarif_chambre', $period?->tarif_chambre_id)),
            'tarif_repas_id' => $this->nullableId($request->input('tarif_repas_id', $request->input('tarif_repas', $period?->tarif_repas_id))),
            'tarif_reduction_id' => $this->nullableId($request->input('tarif_reduction_id', $request->input('tarif_reduction', $period?->tarif_reduction_id))),
        ];

        $validator = Validator::make($input, [
            'designation' => ['required', 'string', 'max:255'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['required', 'date', 'after_or_equal:date_debut'],
            'statut' => ['required', Rule::in(['brouillon', 'actif', 'archive'])],
            'tarif_chambre_id' => ['required', 'integer', 'exists:tarifs_chambre,id'],
            'tarif_repas_id' => ['nullable', 'integer', 'exists:tarifs_repas,id'],
            'tarif_reduction_id' => ['nullable', 'integer', 'exists:tarifs_reduction,id'],
        ]);

        $validator->after(function ($validator) use ($input, $period): void {
            if ($period) {
                $this->validateLifecycle($validator, $input, $period);
            }

            if ($input['statut'] !== 'actif' || $validator->errors()->any()) {
                return;
            }

            $overlapExists = TarifActuel::query()
                ->where('statut', 'actif')
                ->when($period, fn ($query) => $query->where('id', '!=', $period->id))
                ->whereDate('date_debut', '<=', $input['date_fin'])
                ->whereDate('date_fin', '>=', $input['date_debut'])
                ->exists();

            if ($overlapExists) {
                $validator->errors()->add('date_debut', 'Cette période active chevauche une autre période active.');
            }

            $usedTypeIds = Chambre::query()->distinct()->pluck('type_chambre_id');
            $coveredTypeIds = TarifChambreDetail::query()
                ->where('tarif_chambre_id', $input['tarif_chambre_id'])
                ->pluck('type_chambre_id');
            $missingTypeIds = $usedTypeIds->diff($coveredTypeIds)->values();

            if ($missingTypeIds->isNotEmpty()) {
                $validator->errors()->add(
                    'tarif_chambre_id',
                    'Le plan tarifaire chambre ne couvre pas tous les types utilisés (IDs manquants: '
                    .$missingTypeIds->implode(', ').').'
                );
            }
        });

        return $validator->validate();
    }

    private function nullableId(mixed $value): mixed
    {
        return $value === '' ? null : $value;
    }

    private function validateLifecycle($validator, array $input, TarifActuel $period): void
    {
        if ($period->statut === 'brouillon' && ! in_array($input['statut'], ['brouillon', 'actif'], true)) {
            $validator->errors()->add('statut', 'Une période brouillon peut uniquement être activée.');
        }

        if ($period->statut === 'actif') {
            if (! in_array($input['statut'], ['actif', 'archive'], true)) {
                $validator->errors()->add('statut', 'Une période active peut uniquement rester active ou être archivée.');
            }

            $immutableFields = [
                'date_debut' => $period->date_debut?->format('Y-m-d'),
                'date_fin' => $period->date_fin?->format('Y-m-d'),
                'tarif_chambre_id' => $period->tarif_chambre_id,
                'tarif_repas_id' => $period->tarif_repas_id,
                'tarif_reduction_id' => $period->tarif_reduction_id,
            ];

            foreach ($immutableFields as $field => $currentValue) {
                if ((string) ($input[$field] ?? '') !== (string) ($currentValue ?? '')) {
                    $validator->errors()->add($field, 'Ce champ ne peut plus être modifié lorsque la période est active.');
                }
            }
        }
    }
}
