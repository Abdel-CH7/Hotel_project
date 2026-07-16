<?php

namespace App\Http\Controllers;

use App\Exceptions\ReservationDomainException;
use App\Http\Requests\ReservationFormOptionsRequest;
use App\Services\ReservationTariffPeriodResolver;
use App\Support\DecimalMoney;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ReservationFormOptionsController extends Controller
{
    public function __invoke(
        ReservationFormOptionsRequest $request,
        ReservationTariffPeriodResolver $periodResolver
    ): JsonResponse {
        try {
            $validated = $request->validated();
            $resolved = $periodResolver->resolve(
                $validated['date_debut'],
                $validated['date_fin']
            );
            $periods = collect($resolved['segments'])
                ->pluck('period')
                ->unique('id')
                ->values();

            return response()->json(['data' => [
                'repas' => $this->mealOptions($periods),
                'reductions' => $this->reductionOptions($periods->first()),
            ]]);
        } catch (ReservationDomainException $exception) {
            return response()->json(array_filter([
                'message' => $exception->getMessage(),
                'code' => $exception->errorCode,
                'field' => $exception->field,
                'context' => $exception->context ?: null,
            ], static fn (mixed $value): bool => $value !== null), $exception->recommendedStatus);
        } catch (\Throwable $exception) {
            Log::error('Unexpected reservation form options failure.', ['exception' => $exception]);

            return response()->json([
                'message' => 'Une erreur interne est survenue. Veuillez réessayer.',
                'code' => 'internal_error',
            ], 500);
        }
    }

    private function mealOptions(Collection $periods): array
    {
        if ($periods->isEmpty() || $periods->contains(fn ($period): bool => !$period->mealRateGrid)) {
            return [];
        }

        $optionsByPeriod = $periods->map(function ($period): Collection {
            return $period->mealRateGrid->details
                ->filter(fn ($detail): bool => $detail->prix_par_personne !== null
                    && DecimalMoney::toCents($detail->prix_par_personne) > 0
                    && $detail->mealType)
                ->mapWithKeys(fn ($detail): array => [
                    (int) $detail->type_repas_id => [
                        'type_repas_id' => (int) $detail->type_repas_id,
                        'nom' => $detail->mealType->type_repas,
                    ],
                ]);
        });

        $commonIds = $optionsByPeriod
            ->skip(1)
            ->reduce(
                fn (Collection $ids, Collection $options): Collection => $ids->intersect($options->keys()),
                $optionsByPeriod->first()->keys()
            );

        return $optionsByPeriod->first()
            ->only($commonIds->all())
            ->sortBy('nom', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }

    private function reductionOptions(mixed $arrivalPeriod): array
    {
        if (!$arrivalPeriod?->reductionGrid) {
            return [];
        }

        return $arrivalPeriod->reductionGrid->details
            ->filter(fn ($detail): bool => $detail->reductionType
                && (DecimalMoney::toCents($detail->montant_fixe) > 0
                    || DecimalMoney::percentageToHundredths($detail->pourcentage) > 0))
            ->map(fn ($detail): array => [
                'type_reduction_id' => (int) $detail->type_reduction_id,
                'nom' => $detail->reductionType->type_reduction,
            ])
            ->sortBy('nom', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }
}
