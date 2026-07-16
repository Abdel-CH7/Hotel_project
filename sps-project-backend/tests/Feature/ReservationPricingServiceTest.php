<?php

namespace Tests\Feature;

use App\Exceptions\ReservationDomainException;
use App\Models\Reservation;
use App\Models\ReservationRoom;
use App\Models\TarifChambreDetail;
use App\Models\TarifRepas;
use App\Models\TarifRepasDetail;
use App\Services\ReservationPricingService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationPricingServiceTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_exact_one_two_and_three_person_room_tiers_are_used(): void
    {
        $type = $this->createRoomType(3, 0);
        $room = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type, [
            'prix_1_personne' => '101.00',
            'prix_2_personnes' => '152.00',
            'prix_3_personnes' => '203.00',
        ]);
        $this->createPeriod('2092-01-01', '2092-01-31', $grid);
        $service = app(ReservationPricingService::class);

        foreach ([1 => '101.00', 2 => '152.00', 3 => '203.00'] as $occupants => $expected) {
            $result = $service->calculate(
                $this->pricingInput($room, '2092-01-10', '2092-01-11', $occupants)
            );
            $this->assertSame($expected, $result['chambres'][0]['segments'][0]['prix_par_nuit_snapshot']);
            $this->assertSame($occupants, $result['chambres'][0]['segments'][0]['occupation_tarifee']);
        }
    }

    public function test_extra_bed_and_children_are_included_in_occupancy_price(): void
    {
        $type = $this->createRoomType(2, 1);
        $room = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type, [
            'prix_2_personnes' => '150.00',
            'prix_lit_supplementaire' => '30.00',
        ]);
        $this->createPeriod('2092-02-01', '2092-02-28', $grid);

        $result = app(ReservationPricingService::class)->calculate(
            $this->pricingInput($room, '2092-02-10', '2092-02-11', 1, 2)
        );

        $this->assertSame(3, $result['total_occupants']);
        $this->assertSame(1, $result['chambres'][0]['lits_supplementaires']);
        $this->assertSame(2, $result['chambres'][0]['segments'][0]['occupation_tarifee']);
        $this->assertSame('180.00', $result['montant_chambres']);
    }

    public function test_capacity_exceeded_and_unconfigured_capacity_fail(): void
    {
        $type = $this->createRoomType(2, 0);
        $room = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type);
        $this->createPeriod('2092-03-01', '2092-03-15', $grid);

        $this->assertDomainError(
            fn () => app(ReservationPricingService::class)->calculate(
                $this->pricingInput($room, '2092-03-05', '2092-03-06', 2, 1)
            ),
            'room_capacity_exceeded'
        );

        $unconfiguredType = $this->createRoomType(null, null);
        $unconfiguredRoom = $this->createRoom($unconfiguredType);
        [$unconfiguredGrid] = $this->createRoomGridDetail($unconfiguredType);
        $this->createPeriod('2092-03-16', '2092-03-31', $unconfiguredGrid);
        $this->assertDomainError(
            fn () => app(ReservationPricingService::class)->calculate(
                $this->pricingInput($unconfiguredRoom, '2092-03-20', '2092-03-21')
            ),
            'room_capacity_not_configured'
        );
    }

    public function test_missing_exact_tier_and_legacy_zero_price_fail_without_fallback(): void
    {
        $type = $this->createRoomType(2, 0);
        $room = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type, ['prix_2_personnes' => null]);
        $this->createPeriod('2092-04-01', '2092-04-15', $grid);

        $this->assertDomainError(
            fn () => app(ReservationPricingService::class)->calculate(
                $this->pricingInput($room, '2092-04-05', '2092-04-06', 2)
            ),
            'room_occupancy_price_missing'
        );

        $zeroType = $this->createRoomType(1, 0);
        $zeroRoom = $this->createRoom($zeroType);
        [$zeroGrid] = $this->createRoomGridDetail($zeroType, [
            'prix_1_personne' => '0.00',
            'prix_2_personnes' => '0.00',
            'prix_3_personnes' => '0.00',
        ]);
        $this->createPeriod('2092-04-16', '2092-04-30', $zeroGrid);
        $this->assertDomainError(
            fn () => app(ReservationPricingService::class)->calculate(
                $this->pricingInput($zeroRoom, '2092-04-20', '2092-04-21')
            ),
            'room_occupancy_price_missing'
        );
    }

    public function test_missing_room_tariff_detail_fails(): void
    {
        $pricedType = $this->createRoomType();
        $selectedType = $this->createRoomType();
        $room = $this->createRoom($selectedType);
        [$grid] = $this->createRoomGridDetail($pricedType);
        $this->createPeriod('2092-05-01', '2092-05-31', $grid);

        $this->assertDomainError(
            fn () => app(ReservationPricingService::class)->calculate(
                $this->pricingInput($room, '2092-05-10', '2092-05-11')
            ),
            'room_rate_detail_missing'
        );
    }

    public function test_cross_period_room_prices_create_immutable_segments(): void
    {
        $type = $this->createRoomType(1, 0);
        $room = $this->createRoom($type);
        [$julyGrid, $julyDetail] = $this->createRoomGridDetail($type, ['prix_1_personne' => '100.00']);
        [$augustGrid, $augustDetail] = $this->createRoomGridDetail($type, ['prix_1_personne' => '120.00']);
        $july = $this->createPeriod('2092-07-01', '2092-07-31', $julyGrid);
        $august = $this->createPeriod('2092-08-01', '2092-08-31', $augustGrid);

        $result = app(ReservationPricingService::class)->calculate(
            $this->pricingInput($room, '2092-07-31', '2092-08-03')
        );
        $segments = $result['chambres'][0]['segments'];

        $this->assertSame([$july->id, $august->id], array_column($segments, 'tarif_actuel_id'));
        $this->assertSame([$julyDetail->id, $augustDetail->id], array_column($segments, 'tarif_chambre_detail_id'));
        $this->assertSame(['100.00', '120.00'], array_column($segments, 'prix_occupation_snapshot'));
        $this->assertSame(['100.00', '240.00'], array_column($segments, 'montant_segment'));
        $this->assertSame('340.00', $result['montant_chambres']);
    }

    public function test_meals_are_quantity_times_positive_unit_price_times_nights(): void
    {
        $type = $this->createRoomType(3, 0);
        $room = $this->createRoom($type);
        [$roomGrid] = $this->createRoomGridDetail($type);
        [$mealGrid, , $mealType] = $this->createMealGridDetail(null, '20.00');
        $this->createPeriod('2092-09-01', '2092-09-30', $roomGrid, $mealGrid);

        $result = app(ReservationPricingService::class)->calculate(
            $this->pricingInput($room, '2092-09-10', '2092-09-13', 2, 1, [[
                'type_repas_id' => $mealType->id,
                'quantite_par_jour' => 2,
            ]])
        );

        $this->assertSame('120.00', $result['montant_repas']);
        $this->assertSame(2, $result['repas'][0]['quantite_par_jour']);
        $this->assertSame(3, $result['repas'][0]['segments'][0]['jours_factures']);
    }

    public function test_meal_quantity_below_occupants_is_allowed_but_above_fails(): void
    {
        $type = $this->createRoomType(3, 0);
        $room = $this->createRoom($type);
        [$roomGrid] = $this->createRoomGridDetail($type);
        [$mealGrid, , $mealType] = $this->createMealGridDetail();
        $this->createPeriod('2092-10-01', '2092-10-31', $roomGrid, $mealGrid);
        $service = app(ReservationPricingService::class);

        $allowed = $service->calculate($this->pricingInput($room, '2092-10-10', '2092-10-11', 3, 0, [[
            'type_repas_id' => $mealType->id,
            'quantite_par_jour' => 1,
        ]]));
        $this->assertSame('20.00', $allowed['montant_repas']);

        $this->assertDomainError(
            fn () => $service->calculate($this->pricingInput($room, '2092-10-10', '2092-10-11', 2, 0, [[
                'type_repas_id' => $mealType->id,
                'quantite_par_jour' => 3,
            ]])),
            'meal_quantity_exceeded'
        );
    }

    public function test_cross_period_meals_create_segments_with_each_period_price(): void
    {
        $type = $this->createRoomType(1, 0);
        $room = $this->createRoom($type);
        [$firstRoomGrid] = $this->createRoomGridDetail($type);
        [$secondRoomGrid] = $this->createRoomGridDetail($type);
        [$firstMealGrid, , $mealType] = $this->createMealGridDetail(null, '10.00');
        [$secondMealGrid, $secondMealDetail] = $this->createMealGridDetail($mealType, '15.00');
        $this->createPeriod('2092-11-01', '2092-11-30', $firstRoomGrid, $firstMealGrid);
        $this->createPeriod('2092-12-01', '2092-12-31', $secondRoomGrid, $secondMealGrid);

        $result = app(ReservationPricingService::class)->calculate(
            $this->pricingInput($room, '2092-11-30', '2092-12-03', 1, 0, [[
                'type_repas_id' => $mealType->id,
                'quantite_par_jour' => 1,
            ]])
        );

        $segments = $result['repas'][0]['segments'];
        $this->assertCount(2, $segments);
        $this->assertSame(['10.00', '15.00'], array_column($segments, 'prix_unitaire_snapshot'));
        $this->assertSame($secondMealDetail->id, $segments[1]['tarif_repas_detail_id']);
        $this->assertSame('40.00', $result['montant_repas']);
    }

    public function test_missing_meal_plan_or_detail_fails_and_empty_meals_cost_zero(): void
    {
        $type = $this->createRoomType(2, 0);
        $room = $this->createRoom($type);
        [$roomGrid] = $this->createRoomGridDetail($type);
        [, , $mealType] = $this->createMealGridDetail();
        $this->createPeriod('2093-01-01', '2093-01-15', $roomGrid);

        $service = app(ReservationPricingService::class);
        $this->assertSame('0.00', $service->calculate(
            $this->pricingInput($room, '2093-01-02', '2093-01-03')
        )['montant_repas']);
        $this->assertDomainError(
            fn () => $service->calculate($this->pricingInput($room, '2093-01-02', '2093-01-03', 1, 0, [[
                'type_repas_id' => $mealType->id,
                'quantite_par_jour' => 1,
            ]])),
            'meal_plan_missing'
        );

        $otherType = $this->createRoomType(2, 0);
        $otherRoom = $this->createRoom($otherType);
        [$otherRoomGrid] = $this->createRoomGridDetail($otherType);
        $emptyMealGrid = TarifRepas::create(['designation' => 'Plan repas vide '.uniqid()]);
        $this->createPeriod('2093-01-16', '2093-01-31', $otherRoomGrid, $emptyMealGrid);
        $this->assertDomainError(
            fn () => $service->calculate($this->pricingInput($otherRoom, '2093-01-20', '2093-01-21', 1, 0, [[
                'type_repas_id' => $mealType->id,
                'quantite_par_jour' => 1,
            ]])),
            'meal_rate_detail_missing'
        );
    }

    public function test_percentage_fixed_combined_and_capped_reductions_are_decimal_safe(): void
    {
        foreach ([
            ['0.00', '10.00', '20.00'],
            ['30.00', '0.00', '30.00'],
            ['30.00', '10.00', '50.00'],
            ['500.00', '10.00', '200.00'],
        ] as $caseIndex => [$fixed, $percentage, $expected]) {
            $type = $this->createRoomType(1, 0);
            $room = $this->createRoom($type);
            [$roomGrid] = $this->createRoomGridDetail($type, ['prix_1_personne' => '100.00']);
            [$reductionGrid, , $reductionType] = $this->createReductionGridDetail(null, $fixed, $percentage);
            $month = $caseIndex + 2;
            $start = sprintf('2093-%02d-01', $month);
            $end = sprintf('2093-%02d-28', $month);
            $this->createPeriod($start, $end, $roomGrid, null, $reductionGrid);

            $result = app(ReservationPricingService::class)->calculate(
                $this->pricingInput($room, sprintf('2093-%02d-10', $month), sprintf('2093-%02d-12', $month), 1, 0, [], $reductionType->id)
            );
            $this->assertSame($expected, $result['montant_reduction']);
            $this->assertSame(number_format(200 - (float) $expected, 2, '.', ''), $result['montant_total']);
        }
    }

    public function test_arrival_period_supplies_cross_period_reduction_and_no_selection_is_zero(): void
    {
        $type = $this->createRoomType(1, 0);
        $room = $this->createRoom($type);
        [$firstRoomGrid] = $this->createRoomGridDetail($type);
        [$secondRoomGrid] = $this->createRoomGridDetail($type);
        [$firstReductionGrid, , $reductionType] = $this->createReductionGridDetail(null, '0.00', '10.00');
        [$secondReductionGrid] = $this->createReductionGridDetail($reductionType, '0.00', '50.00');
        $firstPeriod = $this->createPeriod('2093-06-01', '2093-06-30', $firstRoomGrid, null, $firstReductionGrid);
        $this->createPeriod('2093-07-01', '2093-07-31', $secondRoomGrid, null, $secondReductionGrid);
        $service = app(ReservationPricingService::class);

        $result = $service->calculate(
            $this->pricingInput($room, '2093-06-30', '2093-07-02', 1, 0, [], $reductionType->id)
        );
        $this->assertSame($firstPeriod->id, $result['reduction']['tarif_actuel_id']);
        $this->assertSame('20.00', $result['montant_reduction']);

        $withoutReduction = $service->calculate(
            $this->pricingInput($room, '2093-06-30', '2093-07-02')
        );
        $this->assertNull($withoutReduction['reduction']);
        $this->assertSame('0.00', $withoutReduction['montant_reduction']);
    }

    public function test_missing_reduction_plan_or_detail_fails(): void
    {
        $type = $this->createRoomType(1, 0);
        $room = $this->createRoom($type);
        [$roomGrid] = $this->createRoomGridDetail($type);
        [, , $reductionType] = $this->createReductionGridDetail();
        $this->createPeriod('2093-08-01', '2093-08-15', $roomGrid);

        $service = app(ReservationPricingService::class);
        $this->assertDomainError(
            fn () => $service->calculate(
                $this->pricingInput($room, '2093-08-02', '2093-08-03', 1, 0, [], $reductionType->id)
            ),
            'reduction_plan_missing'
        );

        $otherType = $this->createRoomType(1, 0);
        $otherRoom = $this->createRoom($otherType);
        [$otherRoomGrid] = $this->createRoomGridDetail($otherType);
        [$otherReductionGrid] = $this->createReductionGridDetail();
        $this->createPeriod('2093-08-16', '2093-08-31', $otherRoomGrid, null, $otherReductionGrid);
        $this->assertDomainError(
            fn () => $service->calculate(
                $this->pricingInput($otherRoom, '2093-08-20', '2093-08-21', 1, 0, [], $reductionType->id)
            ),
            'reduction_rate_detail_missing'
        );
    }

    public function test_pricing_is_read_only_and_legacy_reservation_values_remain_unchanged(): void
    {
        $type = $this->createRoomType(1, 0);
        $room = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type);
        $this->createPeriod('2093-09-01', '2093-09-30', $grid);
        $legacy = Reservation::create([
            'reservation_num' => 'LEGACY-'.uniqid(),
            'client_id' => 999999,
            'client_type' => 'societe',
            'reservation_date' => '2020-01-01',
            'date_debut' => '2020-01-01',
            'date_fin' => '2020-01-02',
            'status' => 'confirmé',
            'montant_total' => '987.65',
            'montant_reduction' => '12.34',
            'pricing_version' => 1,
            'legacy_pricing' => true,
        ]);
        $legacyRoom = ReservationRoom::create([
            'reservation_id' => $legacy->id,
            'chambre_id' => $room->id,
            'tarif_par_nuit' => '0.00',
            'montant_total' => '0.00',
        ]);
        $beforeCounts = $this->snapshotCounts();

        app(ReservationPricingService::class)->calculate(
            $this->pricingInput($room, '2093-09-10', '2093-09-11')
        );

        $this->assertSame($beforeCounts, $this->snapshotCounts());
        $this->assertSame('987.65', $legacy->fresh()->montant_total);
        $this->assertSame('12.34', $legacy->fresh()->montant_reduction);
        $this->assertSame('0.00', $legacyRoom->fresh()->tarif_par_nuit);
        $this->assertSame('0.00', $legacyRoom->fresh()->montant_total);
    }

    private function snapshotCounts(): array
    {
        return [
            DB::table('reservation_room_price_segments')->count(),
            DB::table('reservation_meals')->count(),
            DB::table('reservation_reductions')->count(),
        ];
    }

    private function assertDomainError(callable $callback, string $code): void
    {
        try {
            $callback();
            $this->fail("Expected reservation domain error {$code}.");
        } catch (ReservationDomainException $exception) {
            $this->assertSame($code, $exception->errorCode);
            $this->assertSame(422, $exception->recommendedStatus);
            $this->assertNotSame('', $exception->getMessage());
        }
    }
}
