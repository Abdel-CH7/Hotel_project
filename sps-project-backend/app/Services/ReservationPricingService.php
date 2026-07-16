<?php

namespace App\Services;

use App\Exceptions\ReservationDomainException;
use App\Models\Chambre;
use App\Models\TarifActuel;
use App\Models\TarifChambreDetail;
use App\Models\TarifReductionDetail;
use App\Models\TarifRepasDetail;
use App\Support\DecimalMoney;
use Illuminate\Support\Collection;

class ReservationPricingService
{
    public function __construct(
        private readonly ReservationTariffPeriodResolver $periodResolver
    ) {
    }

    public function calculate(array $input): array
    {
        $roomInputs = $this->validateRoomInputs($input['chambres'] ?? null);
        $resolvedPeriods = $this->periodResolver->resolve(
            (string) ($input['date_debut'] ?? ''),
            (string) ($input['date_fin'] ?? '')
        );
        $rooms = $this->loadRooms($roomInputs);
        $totalOccupants = array_sum(array_column($roomInputs, 'occupants'));

        [$roomResults, $roomSubtotalCents] = $this->priceRooms(
            $roomInputs,
            $rooms,
            $resolvedPeriods['segments']
        );
        [$mealResults, $mealSubtotalCents] = $this->priceMeals(
            $input['repas'] ?? [],
            $totalOccupants,
            $resolvedPeriods['segments']
        );

        $subtotalCents = $roomSubtotalCents + $mealSubtotalCents;
        [$reduction, $reductionCents] = $this->priceReduction(
            $input['type_reduction_id'] ?? null,
            $subtotalCents,
            $resolvedPeriods['segments'][0]['period']
        );

        return [
            'date_debut' => $resolvedPeriods['date_debut'],
            'date_fin' => $resolvedPeriods['date_fin'],
            'nuits' => $resolvedPeriods['nuits'],
            'total_occupants' => $totalOccupants,
            'tariff_period_segments' => array_map(
                fn (array $segment): array => $this->publicPeriodSegment($segment),
                $resolvedPeriods['segments']
            ),
            'chambres' => $roomResults,
            'repas' => $mealResults,
            'montant_chambres' => DecimalMoney::format($roomSubtotalCents),
            'montant_repas' => DecimalMoney::format($mealSubtotalCents),
            'sous_total_avant_reduction' => DecimalMoney::format($subtotalCents),
            'reduction' => $reduction,
            'montant_reduction' => DecimalMoney::format($reductionCents),
            'montant_total' => DecimalMoney::format(max(0, $subtotalCents - $reductionCents)),
        ];
    }

    private function validateRoomInputs(mixed $rooms): array
    {
        if (!is_array($rooms) || $rooms === []) {
            throw new ReservationDomainException(
                'rooms_required',
                'Au moins une chambre doit être sélectionnée.',
                'chambres'
            );
        }

        $normalized = [];
        foreach ($rooms as $index => $room) {
            if (!is_array($room)) {
                throw new ReservationDomainException(
                    'invalid_room_occupancy',
                    'Les informations d’occupation de la chambre sont invalides.',
                    "chambres.{$index}"
                );
            }

            $roomId = $this->integer($room['chambre_id'] ?? null, "chambres.{$index}.chambre_id", 1);
            $adults = $this->integer($room['adultes'] ?? null, "chambres.{$index}.adultes", 1);
            $children = $this->integer($room['enfants'] ?? 0, "chambres.{$index}.enfants", 0);
            $normalized[] = [
                'chambre_id' => $roomId,
                'adultes' => $adults,
                'enfants' => $children,
                'occupants' => $adults + $children,
                'field' => "chambres.{$index}",
            ];
        }

        $ids = array_column($normalized, 'chambre_id');
        if (count($ids) !== count(array_unique($ids))) {
            throw new ReservationDomainException(
                'duplicate_room',
                'Une chambre ne peut être sélectionnée qu’une seule fois.',
                'chambres'
            );
        }

        return $normalized;
    }

    private function loadRooms(array $roomInputs): Collection
    {
        $ids = array_column($roomInputs, 'chambre_id');
        $rooms = Chambre::query()
            ->with(['typeChambre', 'etage', 'vue'])
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
        $missing = array_values(array_diff($ids, $rooms->keys()->map(fn ($id): int => (int) $id)->all()));

        if ($missing !== []) {
            throw new ReservationDomainException(
                'room_not_found',
                'Une ou plusieurs chambres sélectionnées n’existent pas.',
                'chambres',
                422,
                ['chambre_ids' => $missing]
            );
        }

        return $rooms;
    }

    private function priceRooms(array $roomInputs, Collection $rooms, array $periodSegments): array
    {
        $results = [];
        $totalCents = 0;

        foreach ($roomInputs as $input) {
            /** @var Chambre $room */
            $room = $rooms->get($input['chambre_id']);
            $type = $room->typeChambre;

            if (!$type || $type->capacite_standard === null) {
                throw new ReservationDomainException(
                    'room_capacity_not_configured',
                    "La capacité standard du type de chambre « {$type?->type_chambre} » n’est pas configurée.",
                    $input['field'].'.chambre_id'
                );
            }

            $standardCapacity = (int) $type->capacite_standard;
            $extraBedMaximum = (int) ($type->lits_supplementaires_max ?? 0);
            if ($input['occupants'] > $standardCapacity + $extraBedMaximum) {
                throw new ReservationDomainException(
                    'room_capacity_exceeded',
                    "L’occupation dépasse la capacité maximale de la chambre {$room->num_chambre}.",
                    $input['field'],
                    422,
                    ['capacite_maximale' => $standardCapacity + $extraBedMaximum]
                );
            }

            $pricedOccupancy = min($input['occupants'], $standardCapacity);
            if ($pricedOccupancy < 1 || $pricedOccupancy > 3) {
                throw new ReservationDomainException(
                    'unsupported_room_occupancy',
                    'Le niveau d’occupation tarifaire doit être compris entre 1 et 3 personnes.',
                    $input['field']
                );
            }

            $extraBeds = max(0, $input['occupants'] - $standardCapacity);
            $segments = [];
            $roomSubtotalCents = 0;

            foreach ($periodSegments as $periodSegment) {
                /** @var TarifActuel $period */
                $period = $periodSegment['period'];
                $detail = $period->roomRateGrid?->details
                    ->firstWhere('type_chambre_id', $type->id);

                if (!$detail) {
                    throw new ReservationDomainException(
                        'room_rate_detail_missing',
                        "Le plan tarifaire actif ne contient aucun tarif pour le type de chambre « {$type->type_chambre} ».",
                        $input['field'].'.chambre_id',
                        422,
                        ['tarif_actuel_id' => $period->id, 'type_chambre_id' => $type->id]
                    );
                }

                [$occupancyCents, $extraBedCents] = $this->roomUnitPrices(
                    $detail,
                    $pricedOccupancy,
                    $extraBeds,
                    $type->type_chambre,
                    $input['field']
                );
                $nightlyCents = $occupancyCents + ($extraBeds * $extraBedCents);
                $segmentCents = $nightlyCents * $periodSegment['nuits'];
                $roomSubtotalCents += $segmentCents;

                $segments[] = [
                    'tarif_actuel_id' => $period->id,
                    'tarif_chambre_detail_id' => $detail->id,
                    'segment_date_debut' => $periodSegment['segment_date_debut'],
                    'segment_date_fin' => $periodSegment['segment_date_fin'],
                    'nuits' => $periodSegment['nuits'],
                    'occupation_tarifee' => $pricedOccupancy,
                    'prix_occupation_snapshot' => DecimalMoney::format($occupancyCents),
                    'lits_supplementaires' => $extraBeds,
                    'prix_lit_supplementaire_snapshot' => DecimalMoney::format($extraBedCents),
                    'prix_par_nuit_snapshot' => DecimalMoney::format($nightlyCents),
                    'montant_segment' => DecimalMoney::format($segmentCents),
                    'periode_designation_snapshot' => $period->designation,
                    'plan_designation_snapshot' => $period->roomRateGrid?->designation,
                ];
            }

            $totalCents += $roomSubtotalCents;
            $results[] = [
                'chambre_id' => $room->id,
                'num_chambre' => $room->num_chambre,
                'type_chambre_id' => $type->id,
                'type_chambre' => $type->type_chambre,
                'capacite_standard' => $standardCapacity,
                'lits_supplementaires_max' => $extraBedMaximum,
                'adultes' => $input['adultes'],
                'enfants' => $input['enfants'],
                'occupants' => $input['occupants'],
                'lits_supplementaires' => $extraBeds,
                'segments' => $segments,
                'montant_total' => DecimalMoney::format($roomSubtotalCents),
            ];
        }

        return [$results, $totalCents];
    }

    private function roomUnitPrices(
        TarifChambreDetail $detail,
        int $pricedOccupancy,
        int $extraBeds,
        string $typeName,
        string $field
    ): array {
        $priceField = match ($pricedOccupancy) {
            1 => 'prix_1_personne',
            2 => 'prix_2_personnes',
            3 => 'prix_3_personnes',
        };
        $price = $detail->{$priceField};
        $occupancyCents = $price === null ? 0 : DecimalMoney::toCents($price);

        if ($occupancyCents <= 0) {
            throw new ReservationDomainException(
                'room_occupancy_price_missing',
                "Le plan tarifaire actif ne contient aucun prix valide pour l’occupation demandée du type de chambre « {$typeName} ».",
                $field,
                422,
                ['tarif_chambre_detail_id' => $detail->id, 'occupation_tarifee' => $pricedOccupancy]
            );
        }

        $extraBedPrice = $detail->prix_lit_supplementaire;
        $extraBedCents = $extraBedPrice === null ? -1 : DecimalMoney::toCents($extraBedPrice);
        if ($extraBeds > 0 && $extraBedCents < 0) {
            throw new ReservationDomainException(
                'extra_bed_price_missing',
                "Le prix du lit supplémentaire n’est pas configuré pour le type de chambre « {$typeName} ».",
                $field
            );
        }

        return [$occupancyCents, max(0, $extraBedCents)];
    }

    private function priceMeals(array $mealInputs, int $totalOccupants, array $periodSegments): array
    {
        if ($mealInputs === []) {
            return [[], 0];
        }

        $results = [];
        $totalCents = 0;
        $seenTypeIds = [];

        foreach ($mealInputs as $index => $mealInput) {
            if (!is_array($mealInput)) {
                throw new ReservationDomainException(
                    'invalid_meal_selection',
                    'La sélection de repas est invalide.',
                    "repas.{$index}"
                );
            }

            $typeId = $this->integer($mealInput['type_repas_id'] ?? null, "repas.{$index}.type_repas_id", 1);
            $quantity = $this->integer(
                $mealInput['quantite_par_jour'] ?? null,
                "repas.{$index}.quantite_par_jour",
                1
            );
            if (in_array($typeId, $seenTypeIds, true)) {
                throw new ReservationDomainException(
                    'duplicate_meal_type',
                    'Un type de repas ne peut être sélectionné qu’une seule fois.',
                    "repas.{$index}.type_repas_id"
                );
            }
            $seenTypeIds[] = $typeId;

            if ($quantity > $totalOccupants) {
                throw new ReservationDomainException(
                    'meal_quantity_exceeded',
                    'La quantité quotidienne de repas ne peut pas dépasser le nombre total d’occupants.',
                    "repas.{$index}.quantite_par_jour"
                );
            }

            $segments = [];
            $mealSubtotalCents = 0;
            $typeName = null;
            foreach ($periodSegments as $periodSegment) {
                /** @var TarifActuel $period */
                $period = $periodSegment['period'];
                if (!$period->mealRateGrid) {
                    throw new ReservationDomainException(
                        'meal_plan_missing',
                        "La période tarifaire « {$period->designation} » ne contient aucun plan tarifaire repas.",
                        "repas.{$index}.type_repas_id",
                        422,
                        ['tarif_actuel_id' => $period->id]
                    );
                }

                /** @var TarifRepasDetail|null $detail */
                $detail = $period->mealRateGrid->details->firstWhere('type_repas_id', $typeId);
                $unitCents = $detail?->prix_par_personne === null
                    ? 0
                    : DecimalMoney::toCents($detail->prix_par_personne);
                if (!$detail || $unitCents <= 0) {
                    throw new ReservationDomainException(
                        'meal_rate_detail_missing',
                        'Le plan tarifaire repas actif ne contient aucun prix valide pour le type de repas sélectionné.',
                        "repas.{$index}.type_repas_id",
                        422,
                        ['tarif_actuel_id' => $period->id, 'type_repas_id' => $typeId]
                    );
                }

                $typeName = $detail->mealType?->type_repas ?? (string) $typeId;
                $segmentCents = $unitCents * $quantity * $periodSegment['nuits'];
                $mealSubtotalCents += $segmentCents;
                $segments[] = [
                    'tarif_actuel_id' => $period->id,
                    'tarif_repas_detail_id' => $detail->id,
                    'type_repas_id' => $typeId,
                    'type_repas_nom_snapshot' => $typeName,
                    'segment_date_debut' => $periodSegment['segment_date_debut'],
                    'segment_date_fin' => $periodSegment['segment_date_fin'],
                    'prix_unitaire_snapshot' => DecimalMoney::format($unitCents),
                    'quantite_par_jour' => $quantity,
                    'jours_factures' => $periodSegment['nuits'],
                    'montant_total' => DecimalMoney::format($segmentCents),
                ];
            }

            $totalCents += $mealSubtotalCents;
            $results[] = [
                'type_repas_id' => $typeId,
                'type_repas' => $typeName,
                'quantite_par_jour' => $quantity,
                'segments' => $segments,
                'montant_total' => DecimalMoney::format($mealSubtotalCents),
            ];
        }

        return [$results, $totalCents];
    }

    private function priceReduction(mixed $typeReductionId, int $subtotalCents, TarifActuel $arrivalPeriod): array
    {
        if ($typeReductionId === null || $typeReductionId === '') {
            return [null, 0];
        }

        $typeId = $this->integer($typeReductionId, 'type_reduction_id', 1);
        if (!$arrivalPeriod->reductionGrid) {
            throw new ReservationDomainException(
                'reduction_plan_missing',
                'La période tarifaire de la nuit d’arrivée ne contient aucun plan de réductions.',
                'type_reduction_id',
                422,
                ['tarif_actuel_id' => $arrivalPeriod->id]
            );
        }

        /** @var TarifReductionDetail|null $detail */
        $detail = $arrivalPeriod->reductionGrid->details->firstWhere('type_reduction_id', $typeId);
        if (!$detail) {
            throw new ReservationDomainException(
                'reduction_rate_detail_missing',
                'Le plan de réductions de la nuit d’arrivée ne contient pas la réduction sélectionnée.',
                'type_reduction_id',
                422,
                ['tarif_actuel_id' => $arrivalPeriod->id, 'type_reduction_id' => $typeId]
            );
        }

        $fixedCents = DecimalMoney::toCents($detail->montant_fixe);
        $percentageHundredths = DecimalMoney::percentageToHundredths($detail->pourcentage);
        $percentageCents = DecimalMoney::percentageOf($subtotalCents, $percentageHundredths);
        $requestedCents = $percentageCents + $fixedCents;
        $appliedCents = min($subtotalCents, max(0, $requestedCents));

        return [[
            'tarif_actuel_id' => $arrivalPeriod->id,
            'tarif_reduction_detail_id' => $detail->id,
            'type_reduction_id' => $typeId,
            'type_reduction_nom_snapshot' => $detail->reductionType?->type_reduction ?? (string) $typeId,
            'montant_fixe_snapshot' => DecimalMoney::format($fixedCents),
            'pourcentage_snapshot' => DecimalMoney::format($percentageHundredths),
            'sous_total_eligible' => DecimalMoney::format($subtotalCents),
            'montant_pourcentage' => DecimalMoney::format($percentageCents),
            'montant_applique' => DecimalMoney::format($appliedCents),
            'formule_version' => 'percentage_plus_fixed_v1',
        ], $appliedCents];
    }

    private function publicPeriodSegment(array $segment): array
    {
        /** @var TarifActuel $period */
        $period = $segment['period'];

        return [
            'tarif_actuel_id' => $period->id,
            'designation' => $period->designation,
            'segment_date_debut' => $segment['segment_date_debut'],
            'segment_date_fin' => $segment['segment_date_fin'],
            'nuits' => $segment['nuits'],
        ];
    }

    private function integer(mixed $value, string $field, int $minimum): int
    {
        $valid = filter_var($value, FILTER_VALIDATE_INT);
        if ($valid === false || $valid < $minimum) {
            throw new ReservationDomainException(
                'invalid_integer',
                "La valeur du champ {$field} doit être un entier supérieur ou égal à {$minimum}.",
                $field
            );
        }

        return (int) $valid;
    }
}
