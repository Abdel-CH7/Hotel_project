<?php

namespace App\Services;

use App\Exceptions\ReservationDomainException;
use App\Models\TarifActuel;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class ReservationTariffPeriodResolver
{
    public function resolve(string $dateDebut, string $dateFin): array
    {
        [$start, $end] = $this->parseRange($dateDebut, $dateFin);
        $lastNight = $end->subDay();

        $periods = TarifActuel::query()
            ->where('statut', 'actif')
            ->whereDate('date_debut', '<=', $lastNight->toDateString())
            ->whereDate('date_fin', '>=', $start->toDateString())
            ->with([
                'roomRateGrid.details.roomType',
                'mealRateGrid.details.mealType',
                'reductionGrid.details.reductionType',
            ])
            ->orderBy('date_debut')
            ->orderBy('id')
            ->get();

        $segments = [];
        for ($night = $start; $night->lt($end); $night = $night->addDay()) {
            $period = $this->periodForNight($periods, $night);
            $lastIndex = count($segments) - 1;

            if ($lastIndex >= 0 && $segments[$lastIndex]['tarif_actuel_id'] === $period->id) {
                $segments[$lastIndex]['segment_date_fin'] = $night->addDay()->toDateString();
                $segments[$lastIndex]['nuits']++;
                continue;
            }

            $segments[] = [
                'tarif_actuel_id' => $period->id,
                'segment_date_debut' => $night->toDateString(),
                'segment_date_fin' => $night->addDay()->toDateString(),
                'nuits' => 1,
                'period' => $period,
            ];
        }

        return [
            'date_debut' => $start->toDateString(),
            'date_fin' => $end->toDateString(),
            'nuits' => (int) $start->diffInDays($end),
            'segments' => $segments,
        ];
    }

    public function parseRange(string $dateDebut, string $dateFin): array
    {
        $start = $this->parseDate($dateDebut, 'date_debut');
        $end = $this->parseDate($dateFin, 'date_fin');

        if (!$end->gt($start)) {
            throw new ReservationDomainException(
                'invalid_date_range',
                'La date de fin doit être strictement postérieure à la date de début.',
                'date_fin'
            );
        }

        return [$start, $end];
    }

    private function periodForNight(Collection $periods, CarbonImmutable $night): TarifActuel
    {
        $matches = $periods->filter(function (TarifActuel $period) use ($night): bool {
            return $period->date_debut->lte($night) && $period->date_fin->gte($night);
        })->values();

        if ($matches->isEmpty()) {
            throw new ReservationDomainException(
                'tariff_period_missing',
                "Aucune période tarifaire active ne couvre la nuit du {$night->format('d/m/Y')}.",
                'date_debut',
                422,
                ['service_night' => $night->toDateString()]
            );
        }

        if ($matches->count() > 1) {
            throw new ReservationDomainException(
                'tariff_period_overlap',
                "Plusieurs périodes tarifaires actives couvrent la nuit du {$night->format('d/m/Y')}.",
                'date_debut',
                422,
                [
                    'service_night' => $night->toDateString(),
                    'tarif_actuel_ids' => $matches->pluck('id')->all(),
                ]
            );
        }

        return $matches->first();
    }

    private function parseDate(string $value, string $field): CarbonImmutable
    {
        try {
            $date = CarbonImmutable::createFromFormat('!Y-m-d', $value);
        } catch (\Throwable) {
            $date = null;
        }

        if (!$date || $date->format('Y-m-d') !== $value) {
            throw new ReservationDomainException(
                'invalid_date',
                'La date doit respecter le format AAAA-MM-JJ.',
                $field
            );
        }

        return $date;
    }
}
