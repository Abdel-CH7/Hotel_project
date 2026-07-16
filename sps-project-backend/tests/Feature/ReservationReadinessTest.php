<?php

namespace Tests\Feature;

use App\Models\TarifActuel;
use App\Models\TarifChambre;
use App\Models\TarifChambreDetail;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationReadinessTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('tarifs_actuel')->where('statut', 'actif')->update(['statut' => 'archive']);
        $usedTypeIds = DB::table('chambres')->distinct()->pluck('type_chambre_id');
        DB::table('types_chambre')->whereIn('id', $usedTypeIds)->update([
            'capacite_standard' => 1,
            'lits_supplementaires_max' => 0,
        ]);
    }

    public function test_readiness_is_false_when_a_used_room_type_has_null_capacity(): void
    {
        $type = $this->createRoomType(null, null);
        $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type);
        $this->coverUsedRoomTypes($grid);
        $this->createPeriod('2095-01-01', '2095-01-31', $grid);

        $response = $this->getJson('/api/reservations/readiness')->assertOk();

        $response->assertJsonPath('data.ready', false)
            ->assertJsonPath('data.room_types.ready', false);
        $roomTypeIssue = collect($response->json('data.room_types.issues'))
            ->firstWhere('type_chambre_id', $type->id);
        $this->assertSame(1, $roomTypeIssue['rooms_count']);
        $this->assertSame(
            ['capacity_not_configured', 'extra_beds_not_configured'],
            collect($roomTypeIssue['issues'])->pluck('code')->all()
        );
    }

    public function test_unused_room_type_with_null_capacity_does_not_block_readiness(): void
    {
        $unusedType = $this->createRoomType(null, null);
        $usedType = $this->createRoomType(1, 0);
        $this->createRoom($usedType);
        [$grid] = $this->createRoomGridDetail($usedType, [
            'prix_2_personnes' => null,
            'prix_3_personnes' => null,
        ]);
        $this->coverUsedRoomTypes($grid);
        $this->createPeriod('2095-02-01', '2095-02-28', $grid);

        $response = $this->getJson('/api/reservations/readiness')
            ->assertOk()
            ->assertJsonPath('data.ready', true);

        $this->assertNotContains(
            $unusedType->id,
            collect($response->json('data.room_types.issues'))->pluck('type_chambre_id')->all()
        );
    }

    public function test_readiness_is_false_when_active_room_detail_is_missing(): void
    {
        $usedType = $this->createRoomType(1, 0);
        $otherType = $this->createRoomType(1, 0);
        $this->createRoom($usedType);
        [$grid] = $this->createRoomGridDetail($otherType);
        $this->coverUsedRoomTypes($grid, [$usedType->id]);
        $this->createPeriod('2095-03-01', '2095-03-31', $grid);

        $response = $this->getJson('/api/reservations/readiness')
            ->assertOk()
            ->assertJsonPath('data.ready', false)
            ->assertJsonPath('data.tariff_coverage.ready', false);

        $this->assertCoverageCode($response->json('data.tariff_coverage.issues'), 'room_rate_detail_missing');
    }

    public function test_readiness_is_false_when_a_required_occupancy_tier_is_zero(): void
    {
        $type = $this->createRoomType(2, 0);
        $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type, [
            'prix_1_personne' => '100.00',
            'prix_2_personnes' => '0.00',
        ]);
        $this->coverUsedRoomTypes($grid);
        $this->createPeriod('2095-04-01', '2095-04-30', $grid);

        $response = $this->getJson('/api/reservations/readiness')
            ->assertOk()
            ->assertJsonPath('data.ready', false);
        $issue = collect($response->json('data.tariff_coverage.issues'))
            ->firstWhere('code', 'required_occupancy_price_missing');

        $this->assertSame('prix_2_personnes', $issue['field']);
        $this->assertSame($type->id, $issue['type_chambre_id']);
    }

    public function test_capacity_one_requires_only_the_one_person_tier(): void
    {
        $this->assertCapacityConfigurationIsReady(1, [
            'prix_1_personne' => '90.00',
            'prix_2_personnes' => null,
            'prix_3_personnes' => null,
        ], '2095-05-01', '2095-05-31');
    }

    public function test_capacity_two_requires_one_and_two_person_tiers(): void
    {
        $this->assertCapacityConfigurationIsReady(2, [
            'prix_1_personne' => '90.00',
            'prix_2_personnes' => '130.00',
            'prix_3_personnes' => null,
        ], '2095-06-01', '2095-06-30');
    }

    public function test_capacity_three_requires_all_three_occupancy_tiers(): void
    {
        $this->assertCapacityConfigurationIsReady(3, [
            'prix_1_personne' => '90.00',
            'prix_2_personnes' => '130.00',
            'prix_3_personnes' => '170.00',
        ], '2095-07-01', '2095-07-31');
    }

    public function test_extra_bed_enabled_type_requires_a_non_negative_extra_bed_price(): void
    {
        $type = $this->createRoomType(2, 1);
        $this->createRoom($type);
        [$grid, $detail] = $this->createRoomGridDetail($type, [
            'prix_lit_supplementaire' => '-1.00',
        ]);
        $this->coverUsedRoomTypes($grid);
        $this->createPeriod('2095-08-01', '2095-08-31', $grid);

        $response = $this->getJson('/api/reservations/readiness')
            ->assertOk()
            ->assertJsonPath('data.ready', false);
        $this->assertCoverageCode($response->json('data.tariff_coverage.issues'), 'extra_bed_price_missing');

        $detail->update(['prix_lit_supplementaire' => '0.00']);
        $this->getJson('/api/reservations/readiness')
            ->assertOk()
            ->assertJsonPath('data.ready', true);
    }

    public function test_complete_configuration_returns_ready_with_compact_period_metadata(): void
    {
        $firstType = $this->createRoomType(1, 0);
        $secondType = $this->createRoomType(3, 1);
        $this->createRoom($firstType);
        $this->createRoom($secondType);
        [$grid] = $this->createRoomGridDetail($firstType, [
            'prix_2_personnes' => null,
            'prix_3_personnes' => null,
        ]);
        TarifChambreDetail::create([
            'code' => 'READY-'.uniqid(),
            'tarif_chambre_id' => $grid->id,
            'type_chambre_id' => $secondType->id,
            'prix_1_personne' => '110.00',
            'prix_2_personnes' => '160.00',
            'prix_3_personnes' => '210.00',
            'prix_lit_supplementaire' => '30.00',
        ]);
        $this->coverUsedRoomTypes($grid);
        $period = $this->createPeriod('2095-09-01', '2095-09-30', $grid);

        $this->getJson('/api/reservations/readiness')
            ->assertOk()
            ->assertJsonPath('data.ready', true)
            ->assertJsonPath('data.room_types.ready', true)
            ->assertJsonPath('data.tariff_coverage.ready', true)
            ->assertJsonPath('data.active_periods.0.id', $period->id)
            ->assertJsonPath('data.active_periods.0.room_plan_id', $grid->id)
            ->assertJsonMissingPath('data.active_periods.0.roomRateGrid.details');
    }

    public function test_readiness_endpoint_performs_no_writes(): void
    {
        $type = $this->createRoomType(1, 0);
        $this->createRoom($type);
        [$grid, $detail] = $this->createRoomGridDetail($type);
        $this->coverUsedRoomTypes($grid);
        $period = $this->createPeriod('2095-10-01', '2095-10-31', $grid);
        $before = [
            'types' => DB::table('types_chambre')->count(),
            'rooms' => DB::table('chambres')->count(),
            'details' => DB::table('tarif_chambre_detail')->count(),
            'periods' => DB::table('tarifs_actuel')->count(),
            'type_updated_at' => DB::table('types_chambre')->where('id', $type->id)->value('updated_at'),
            'detail_updated_at' => DB::table('tarif_chambre_detail')->where('id', $detail->id)->value('updated_at'),
            'period_updated_at' => DB::table('tarifs_actuel')->where('id', $period->id)->value('updated_at'),
        ];

        $this->getJson('/api/reservations/readiness')->assertOk();

        $this->assertSame($before, [
            'types' => DB::table('types_chambre')->count(),
            'rooms' => DB::table('chambres')->count(),
            'details' => DB::table('tarif_chambre_detail')->count(),
            'periods' => DB::table('tarifs_actuel')->count(),
            'type_updated_at' => DB::table('types_chambre')->where('id', $type->id)->value('updated_at'),
            'detail_updated_at' => DB::table('tarif_chambre_detail')->where('id', $detail->id)->value('updated_at'),
            'period_updated_at' => DB::table('tarifs_actuel')->where('id', $period->id)->value('updated_at'),
        ]);
    }

    public function test_readiness_does_not_unlock_active_or_archived_room_plans(): void
    {
        $activeType = $this->createRoomType(1, 0);
        $this->createRoom($activeType);
        [$activeGrid, $activeDetail] = $this->createRoomGridDetail($activeType);
        $this->createPeriod('2095-11-01', '2095-11-30', $activeGrid);

        $archivedType = $this->createRoomType(1, 0);
        [$archivedGrid, $archivedDetail] = $this->createRoomGridDetail($archivedType);
        TarifActuel::create([
            'designation' => 'Historique '.uniqid(),
            'date_debut' => '2094-11-01',
            'date_fin' => '2094-11-30',
            'statut' => 'archive',
            'tarif_chambre_id' => $archivedGrid->id,
        ]);

        $this->getJson('/api/reservations/readiness')->assertOk();

        $this->putJson("/api/tarifs-chambre/{$activeDetail->id}", $this->detailPayload($activeGrid, $activeType->id))
            ->assertStatus(409);
        $this->putJson("/api/tarifs-chambre/{$archivedDetail->id}", $this->detailPayload($archivedGrid, $archivedType->id))
            ->assertStatus(409);
        $this->assertSame('100.00', $activeDetail->refresh()->prix_1_personne);
        $this->assertSame('100.00', $archivedDetail->refresh()->prix_1_personne);
    }

    private function assertCapacityConfigurationIsReady(
        int $capacity,
        array $prices,
        string $start,
        string $end
    ): void {
        $type = $this->createRoomType($capacity, 0);
        $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type, $prices);
        $this->coverUsedRoomTypes($grid);
        $this->createPeriod($start, $end, $grid);

        $this->getJson('/api/reservations/readiness')
            ->assertOk()
            ->assertJsonPath('data.ready', true);
    }

    private function assertCoverageCode(array $issues, string $code): void
    {
        $this->assertContains($code, collect($issues)->pluck('code')->all());
    }

    private function detailPayload(TarifChambre $grid, int $typeId): array
    {
        return [
            'tarif_chambre_id' => $grid->id,
            'type_chambre_id' => $typeId,
            'prix_1_personne' => '999.00',
            'prix_2_personnes' => '150.00',
            'prix_3_personnes' => '200.00',
            'prix_lit_supplementaire' => '25.00',
        ];
    }

    private function coverUsedRoomTypes(TarifChambre $grid, array $exceptTypeIds = []): void
    {
        $usedTypeIds = DB::table('chambres')
            ->distinct()
            ->pluck('type_chambre_id')
            ->map(fn ($id): int => (int) $id);
        $configuredTypeIds = $grid->details()
            ->pluck('type_chambre_id')
            ->map(fn ($id): int => (int) $id);

        foreach ($usedTypeIds->diff($configuredTypeIds)->diff($exceptTypeIds) as $typeId) {
            TarifChambreDetail::create([
                'code' => 'READY-COVER-'.uniqid(),
                'tarif_chambre_id' => $grid->id,
                'type_chambre_id' => $typeId,
                'prix_1_personne' => '100.00',
                'prix_2_personnes' => '150.00',
                'prix_3_personnes' => '200.00',
                'prix_lit_supplementaire' => '0.00',
            ]);
        }
    }
}
