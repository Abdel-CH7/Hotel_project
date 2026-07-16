<?php

namespace App\Services;

use App\Models\TarifActuel;
use App\Models\TypeChambre;
use App\Support\DecimalMoney;
use Illuminate\Support\Collection;

class ReservationReadinessService
{
    public function diagnose(): array
    {
        $roomTypes = TypeChambre::query()
            ->whereHas('chambres')
            ->withCount('chambres')
            ->orderBy('type_chambre')
            ->get();

        $periods = TarifActuel::query()
            ->where('statut', 'actif')
            ->with([
                'roomRateGrid.details',
                'mealRateGrid',
                'reductionGrid',
            ])
            ->orderBy('date_debut')
            ->orderBy('id')
            ->get();

        $roomTypeIssues = $this->roomTypeIssues($roomTypes);
        $coverageIssues = $this->coverageIssues($roomTypes, $periods);
        $hasActivePeriods = $periods->isNotEmpty();

        if (!$hasActivePeriods) {
            $coverageIssues[] = [
                'code' => 'no_active_tariff_period',
                'message' => 'Aucune période tarifaire active n\'est configurée.',
                'tarif_actuel_id' => null,
                'type_chambre_id' => null,
            ];
        }

        return [
            'ready' => $roomTypeIssues === [] && $coverageIssues === [],
            'room_types' => [
                'ready' => $roomTypeIssues === [],
                'issues' => $roomTypeIssues,
            ],
            'active_periods' => $periods
                ->map(fn (TarifActuel $period): array => $this->periodSummary($period))
                ->values()
                ->all(),
            'tariff_coverage' => [
                'ready' => $hasActivePeriods && $coverageIssues === [],
                'issues' => $coverageIssues,
            ],
        ];
    }

    private function roomTypeIssues(Collection $roomTypes): array
    {
        return $roomTypes
            ->map(function (TypeChambre $type): ?array {
                $issues = [];
                $capacity = $type->capacite_standard;
                $extraBeds = $type->lits_supplementaires_max;

                if ($capacity === null) {
                    $issues[] = $this->issue(
                        'capacity_not_configured',
                        'Capacité standard non configurée.',
                        'capacite_standard'
                    );
                } elseif ($capacity < 1 || $capacity > 3) {
                    $issues[] = $this->issue(
                        'capacity_invalid',
                        'La capacité standard doit être comprise entre 1 et 3.',
                        'capacite_standard'
                    );
                }

                if ($extraBeds === null) {
                    $issues[] = $this->issue(
                        'extra_beds_not_configured',
                        'Le nombre maximal de lits supplémentaires n\'est pas configuré.',
                        'lits_supplementaires_max'
                    );
                } elseif ($extraBeds < 0) {
                    $issues[] = $this->issue(
                        'extra_beds_invalid',
                        'Le nombre maximal de lits supplémentaires ne peut pas être négatif.',
                        'lits_supplementaires_max'
                    );
                }

                if ($issues === []) {
                    return null;
                }

                return [
                    'type_chambre_id' => $type->id,
                    'type_chambre' => $type->type_chambre,
                    'rooms_count' => (int) $type->chambres_count,
                    'issues' => $issues,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function coverageIssues(Collection $roomTypes, Collection $periods): array
    {
        $issues = [];

        foreach ($periods as $period) {
            if (!$period->roomRateGrid) {
                $issues[] = $this->coverageIssue(
                    $period,
                    null,
                    'room_plan_missing',
                    "La période tarifaire active « {$period->designation} » ne contient aucun plan tarifaire chambre."
                );

                continue;
            }

            foreach ($roomTypes as $type) {
                $detail = $period->roomRateGrid->details
                    ->firstWhere('type_chambre_id', $type->id);

                if (!$detail) {
                    $issues[] = $this->coverageIssue(
                        $period,
                        $type,
                        'room_rate_detail_missing',
                        "Le plan « {$period->roomRateGrid->designation} » ne contient aucun prix pour le type « {$type->type_chambre} »."
                    );

                    continue;
                }

                $occupancyFields = [
                    1 => ['prix_1_personne', '1 personne'],
                    2 => ['prix_2_personnes', '2 personnes'],
                    3 => ['prix_3_personnes', '3 personnes'],
                ];
                $hasPositiveOccupancyPrice = collect($occupancyFields)
                    ->contains(fn (array $tier): bool => $this->isPositive($detail->{$tier[0]}));

                if (!$hasPositiveOccupancyPrice) {
                    $issues[] = $this->coverageIssue(
                        $period,
                        $type,
                        'room_rate_no_positive_occupancy_price',
                        "Le plan « {$period->roomRateGrid->designation} » ne contient aucun prix d'occupation positif pour le type « {$type->type_chambre} »."
                    );
                }

                $capacity = $type->capacite_standard;
                if ($capacity !== null && $capacity >= 1 && $capacity <= 3) {
                    for ($occupancy = 1; $occupancy <= $capacity; $occupancy++) {
                        [$field, $label] = $occupancyFields[$occupancy];
                        if (!$this->isPositive($detail->{$field})) {
                            $issues[] = $this->coverageIssue(
                                $period,
                                $type,
                                'required_occupancy_price_missing',
                                "Le prix pour {$label} doit être strictement positif pour le type « {$type->type_chambre} ».",
                                $field
                            );
                        }
                    }
                }

                if (($type->lits_supplementaires_max ?? 0) > 0
                    && !$this->isNonNegative($detail->prix_lit_supplementaire)) {
                    $issues[] = $this->coverageIssue(
                        $period,
                        $type,
                        'extra_bed_price_missing',
                        "Le prix du lit supplémentaire doit être configuré pour le type « {$type->type_chambre} ».",
                        'prix_lit_supplementaire'
                    );
                }
            }
        }

        return $issues;
    }

    private function periodSummary(TarifActuel $period): array
    {
        return [
            'id' => $period->id,
            'designation' => $period->designation,
            'date_debut' => $period->date_debut?->format('Y-m-d'),
            'date_fin' => $period->date_fin?->format('Y-m-d'),
            'room_plan_id' => $period->roomRateGrid?->id,
            'room_plan_designation' => $period->roomRateGrid?->designation,
            'meal_plan_id' => $period->mealRateGrid?->id,
            'meal_plan_designation' => $period->mealRateGrid?->designation,
            'reduction_plan_id' => $period->reductionGrid?->id,
            'reduction_plan_designation' => $period->reductionGrid?->designation,
        ];
    }

    private function issue(string $code, string $message, ?string $field = null): array
    {
        return array_filter([
            'code' => $code,
            'message' => $message,
            'field' => $field,
        ], fn (mixed $value): bool => $value !== null);
    }

    private function coverageIssue(
        TarifActuel $period,
        ?TypeChambre $type,
        string $code,
        string $message,
        ?string $field = null
    ): array {
        return array_filter([
            'code' => $code,
            'message' => $message,
            'field' => $field,
            'tarif_actuel_id' => $period->id,
            'periode' => $period->designation,
            'type_chambre_id' => $type?->id,
            'type_chambre' => $type?->type_chambre,
            'rooms_count' => $type ? (int) $type->chambres_count : null,
        ], fn (mixed $value): bool => $value !== null);
    }

    private function isPositive(mixed $value): bool
    {
        return $value !== null && DecimalMoney::toCents((string) $value) > 0;
    }

    private function isNonNegative(mixed $value): bool
    {
        return $value !== null && DecimalMoney::toCents((string) $value) >= 0;
    }
}
