<?php

namespace Tests\Feature;

use App\Models\Chambre;
use App\Models\TarifActuel;
use App\Models\TarifChambre;
use App\Models\TarifChambreDetail;
use App\Models\TarifReduction;
use App\Models\TarifRepas;
use App\Models\TypeChambre;
use App\Models\TypeReduction;
use App\Models\TypeRepas;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TariffNormalizationApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_meal_and_reduction_type_codes_and_names_are_unique_case_insensitively(): void
    {
        $meal = $this->mealType();
        $reduction = $this->reductionType();

        $this->postJson('/api/types-repas', [
            'code' => strtolower($meal->code),
            'type_repas' => 'Autre repas '.uniqid(),
        ])->assertUnprocessable()->assertJsonValidationErrors('code');

        $this->postJson('/api/types-repas', [
            'code' => 'MR-'.uniqid(),
            'type_repas' => strtolower($meal->type_repas),
        ])->assertUnprocessable()->assertJsonValidationErrors('type_repas');

        $this->postJson('/api/types-reduction', [
            'code' => strtolower($reduction->code),
            'type_reduction' => 'Autre reduction '.uniqid(),
        ])->assertUnprocessable()->assertJsonValidationErrors('code');

        $this->postJson('/api/types-reduction', [
            'code' => 'RD-'.uniqid(),
            'type_reduction' => strtolower($reduction->type_reduction),
        ])->assertUnprocessable()->assertJsonValidationErrors('type_reduction');
    }

    public function test_each_detail_table_rejects_a_duplicate_grid_type_pair(): void
    {
        $roomGrid = $this->roomGrid();
        $roomType = TypeChambre::query()->firstOrFail();
        $roomPayload = $this->roomDetailPayload($roomGrid, $roomType);
        $this->postJson('/api/tarifs-chambre', $roomPayload)->assertCreated();
        $this->postJson('/api/tarifs-chambre', array_merge($roomPayload, ['code' => 'R-'.uniqid()]))
            ->assertUnprocessable()->assertJsonValidationErrors('type_chambre_id');

        $mealGrid = $this->mealGrid();
        $mealType = $this->mealType();
        $mealPayload = [
            'tarif_repas_id' => $mealGrid->id,
            'type_repas_id' => $mealType->id,
            'prix_par_personne' => 30,
        ];
        $this->postJson('/api/tarifs-repas', $mealPayload)->assertCreated();
        $this->postJson('/api/tarifs-repas', $mealPayload)
            ->assertUnprocessable()->assertJsonValidationErrors('type_repas_id');

        $reductionGrid = $this->reductionGrid();
        $reductionType = $this->reductionType();
        $reductionPayload = [
            'tarif_reduction_id' => $reductionGrid->id,
            'type_reduction_id' => $reductionType->id,
            'montant_fixe' => 10,
            'pourcentage' => 0,
        ];
        $this->postJson('/api/tarifs-reduction', $reductionPayload)->assertCreated();
        $this->postJson('/api/tarifs-reduction', $reductionPayload)
            ->assertUnprocessable()->assertJsonValidationErrors('type_reduction_id');
    }

    public function test_normalized_detail_price_rules_are_enforced(): void
    {
        $roomGrid = $this->roomGrid();
        $roomType = TypeChambre::query()->firstOrFail();
        $this->postJson('/api/tarifs-chambre', [
            'code' => 'EMPTY-'.uniqid(),
            'tarif_chambre_id' => $roomGrid->id,
            'type_chambre_id' => $roomType->id,
            'prix_lit_supplementaire' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('prix_1_personne');

        $this->postJson('/api/tarifs-repas', [
            'tarif_repas_id' => $this->mealGrid()->id,
            'type_repas_id' => $this->mealType()->id,
            'prix_par_personne' => -1,
        ])->assertUnprocessable()->assertJsonValidationErrors('prix_par_personne');

        $this->postJson('/api/tarifs-reduction', [
            'tarif_reduction_id' => $this->reductionGrid()->id,
            'type_reduction_id' => $this->reductionType()->id,
            'montant_fixe' => 0,
            'pourcentage' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('montant_fixe');
    }

    public function test_room_detail_code_is_generated_unique_and_preserved_on_update(): void
    {
        $type = TypeChambre::query()->firstOrFail();
        $firstGrid = $this->roomGrid();
        $secondGrid = $this->roomGrid();

        $first = $this->postJson('/api/tarifs-chambre', [
            'tarif_chambre_id' => $firstGrid->id,
            'type_chambre_id' => $type->id,
            'prix_1_personne' => 100,
            'prix_lit_supplementaire' => 0,
        ])->assertCreated();
        $second = $this->postJson('/api/tarifs-chambre', [
            'tarif_chambre_id' => $secondGrid->id,
            'type_chambre_id' => $type->id,
            'prix_1_personne' => 120,
            'prix_lit_supplementaire' => 0,
        ])->assertCreated();

        $firstCode = $first->json('code');
        $secondCode = $second->json('code');
        $this->assertMatchesRegularExpression('/^TC-[A-Z0-9]+$/', $firstCode);
        $this->assertNotSame($firstCode, $secondCode);

        $this->putJson("/api/tarifs-chambre/{$first->json('id')}", [
            'tarif_chambre_id' => $firstGrid->id,
            'type_chambre_id' => $type->id,
            'prix_1_personne' => 130,
            'prix_lit_supplementaire' => 0,
        ])->assertOk()->assertJsonPath('code', $firstCode);
    }

    public function test_all_zero_room_occupancy_prices_are_rejected_but_one_positive_price_is_accepted(): void
    {
        $type = TypeChambre::query()->firstOrFail();

        $this->postJson('/api/tarifs-chambre', [
            'tarif_chambre_id' => $this->roomGrid()->id,
            'type_chambre_id' => $type->id,
            'prix_1_personne' => 0,
            'prix_2_personnes' => 0,
            'prix_3_personnes' => 0,
            'prix_lit_supplementaire' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('prix_1_personne');

        $this->postJson('/api/tarifs-chambre', [
            'tarif_chambre_id' => $this->roomGrid()->id,
            'type_chambre_id' => $type->id,
            'prix_1_personne' => null,
            'prix_2_personnes' => 150,
            'prix_3_personnes' => null,
            'prix_lit_supplementaire' => 0,
        ])->assertCreated()->assertJsonPath('prix_2_personnes', '150.00');
    }

    public function test_a_type_referenced_by_a_detail_cannot_be_deleted(): void
    {
        $type = $this->mealType();
        $this->postJson('/api/tarifs-repas', [
            'tarif_repas_id' => $this->mealGrid()->id,
            'type_repas_id' => $type->id,
            'prix_par_personne' => 25,
        ])->assertCreated();

        $this->deleteJson("/api/types-repas/{$type->id}")->assertStatus(409);
    }

    public function test_unused_plan_details_are_editable_and_deletable_for_all_plan_types(): void
    {
        $roomGrid = $this->roomGrid();
        $roomType = TypeChambre::query()->firstOrFail();
        $roomDetailId = $this->postJson('/api/tarifs-chambre', $this->roomDetailPayload($roomGrid, $roomType))
            ->assertCreated()->json('id');
        $this->putJson("/api/tarifs-chambre/{$roomDetailId}", array_merge(
            $this->roomDetailPayload($roomGrid, $roomType),
            ['prix_1_personne' => 125]
        ))->assertOk()->assertJsonPath('prix_1_personne', '125.00');
        $this->deleteJson("/api/tarifs-chambre/{$roomDetailId}")->assertOk();

        $mealGrid = $this->mealGrid();
        $mealType = $this->mealType();
        $mealDetailId = $this->postJson('/api/tarifs-repas', [
            'tarif_repas_id' => $mealGrid->id,
            'type_repas_id' => $mealType->id,
            'prix_par_personne' => 20,
        ])->assertCreated()->json('id');
        $this->putJson("/api/tarifs-repas/{$mealDetailId}", [
            'tarif_repas_id' => $mealGrid->id,
            'type_repas_id' => $mealType->id,
            'prix_par_personne' => 25,
        ])->assertOk()->assertJsonPath('prix_par_personne', '25.00');
        $this->deleteJson("/api/tarifs-repas/{$mealDetailId}")->assertOk();

        $reductionGrid = $this->reductionGrid();
        $reductionType = $this->reductionType();
        $reductionDetailId = $this->postJson('/api/tarifs-reduction', [
            'tarif_reduction_id' => $reductionGrid->id,
            'type_reduction_id' => $reductionType->id,
            'montant_fixe' => 10,
            'pourcentage' => 0,
        ])->assertCreated()->json('id');
        $this->putJson("/api/tarifs-reduction/{$reductionDetailId}", [
            'tarif_reduction_id' => $reductionGrid->id,
            'type_reduction_id' => $reductionType->id,
            'montant_fixe' => 15,
            'pourcentage' => 5,
        ])->assertOk()->assertJsonPath('montant_fixe', '15.00');
        $this->deleteJson("/api/tarifs-reduction/{$reductionDetailId}")->assertOk();
    }

    public function test_draft_referenced_plans_remain_editable_but_cannot_be_deleted(): void
    {
        [$period, $roomGrid, $mealGrid, $reductionGrid, $roomDetailId, $mealDetailId, $reductionDetailId] =
            $this->periodWithAllPlans('brouillon', '2031-01-01', '2031-01-31');

        $roomType = TypeChambre::query()->findOrFail(
            DB::table('tarif_chambre_detail')->where('id', $roomDetailId)->value('type_chambre_id')
        );
        $this->putJson("/api/tarifs-chambre/{$roomDetailId}", array_merge(
            $this->roomDetailPayload($roomGrid, $roomType),
            ['prix_1_personne' => 140]
        ))->assertOk();
        $this->putJson("/api/tarifs-repas/{$mealDetailId}", [
            'tarif_repas_id' => $mealGrid->id,
            'type_repas_id' => DB::table('tarif_repas_detail')->where('id', $mealDetailId)->value('type_repas_id'),
            'prix_par_personne' => 35,
        ])->assertOk();
        $this->putJson("/api/tarifs-reduction/{$reductionDetailId}", [
            'tarif_reduction_id' => $reductionGrid->id,
            'type_reduction_id' => DB::table('tarif_reduction_detail')->where('id', $reductionDetailId)->value('type_reduction_id'),
            'montant_fixe' => 12,
            'pourcentage' => 3,
        ])->assertOk();

        $this->putJson("/api/desigs-chambre/{$roomGrid->id}", ['designation' => 'Draft room '.uniqid()])->assertOk();
        $this->putJson("/api/desigs-repas/{$mealGrid->id}", ['designation' => 'Draft meal '.uniqid()])->assertOk();
        $this->putJson("/api/desigs-reduction/{$reductionGrid->id}", ['designation' => 'Draft reduction '.uniqid()])->assertOk();

        $this->deleteJson("/api/desigs-chambre/{$roomGrid->id}")->assertStatus(409)
            ->assertJsonPath('message', 'Ce plan est utilisé dans une période brouillon. Retirez-le de la période avant de le supprimer.');
        $this->deleteJson("/api/desigs-repas/{$mealGrid->id}")->assertStatus(409);
        $this->deleteJson("/api/desigs-reduction/{$reductionGrid->id}")->assertStatus(409);
        $this->assertDatabaseHas('tarifs_actuel', ['id' => $period->id]);
    }

    public function test_active_period_plans_lock_details_and_metadata(): void
    {
        [, $roomGrid, $mealGrid, $reductionGrid, $roomDetailId, $mealDetailId, $reductionDetailId] =
            $this->periodWithAllPlans('actif', '2038-01-01', '2038-01-31');

        $this->assertPlanMutationsLocked(
            $roomGrid,
            $mealGrid,
            $reductionGrid,
            $roomDetailId,
            $mealDetailId,
            $reductionDetailId,
            'période active'
        );
    }

    public function test_archived_period_plans_lock_details_and_metadata(): void
    {
        [, $roomGrid, $mealGrid, $reductionGrid, $roomDetailId, $mealDetailId, $reductionDetailId] =
            $this->periodWithAllPlans('archive', '2039-01-01', '2039-01-31');

        $this->assertPlanMutationsLocked(
            $roomGrid,
            $mealGrid,
            $reductionGrid,
            $roomDetailId,
            $mealDetailId,
            $reductionDetailId,
            'historique tarifaire'
        );
    }

    public function test_active_usage_takes_priority_over_archived_usage(): void
    {
        $plan = $this->coveredRoomGrid();
        $this->createPeriod($plan, 'archive', '2043-01-01', '2043-01-31');
        $this->createPeriod($plan, 'actif', '2043-02-01', '2043-02-28');

        $plan = $plan->fresh();

        $this->assertSame('active', $plan->usage['state']);
        $this->assertTrue($plan->usage['locked']);
        $this->assertSame('Verrouillé — période active', $plan->usage['label']);
        $this->assertStringContainsString('période active', $plan->detailLockMessage());
    }

    public function test_draft_periods_may_overlap(): void
    {
        $first = $this->createPeriod($this->roomGrid(), 'brouillon', '2032-01-01', '2032-02-01');
        $second = $this->createPeriod($this->roomGrid(), 'brouillon', '2032-01-15', '2032-02-15');

        $this->assertSame('brouillon', $first->statut);
        $this->assertSame('brouillon', $second->statut);
    }

    public function test_new_period_is_always_draft_and_can_follow_the_valid_lifecycle(): void
    {
        $grid = $this->coveredRoomGrid();
        $payload = $this->periodPayload($grid, 'archive', '2040-01-01', '2040-01-31');
        $periodId = $this->postJson('/api/tarifs-actuel', $payload)
            ->assertCreated()
            ->assertJsonPath('statut', 'brouillon')
            ->json('id');

        $payload['statut'] = 'actif';
        $this->putJson("/api/tarifs-actuel/{$periodId}", $payload)
            ->assertOk()->assertJsonPath('statut', 'actif');

        $payload['statut'] = 'archive';
        $this->putJson("/api/tarifs-actuel/{$periodId}", $payload)
            ->assertOk()->assertJsonPath('statut', 'archive');
    }

    public function test_active_period_cannot_return_to_draft_or_change_dates(): void
    {
        $period = $this->createPeriod($this->coveredRoomGrid(), 'actif', '2041-01-01', '2041-01-31');
        $payload = $this->periodPayload($period->roomRateGrid, 'brouillon', '2041-01-01', '2041-01-31');
        $this->putJson("/api/tarifs-actuel/{$period->id}", $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('statut');

        $payload['statut'] = 'actif';
        $payload['date_fin'] = '2041-02-01';
        $this->putJson("/api/tarifs-actuel/{$period->id}", $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('date_fin');
    }

    public function test_archived_period_cannot_be_reactivated_edited_or_deleted(): void
    {
        $period = $this->createPeriod($this->coveredRoomGrid(), 'archive', '2042-01-01', '2042-01-31');
        $payload = $this->periodPayload($period->roomRateGrid, 'actif', '2042-01-01', '2042-01-31');
        $this->putJson("/api/tarifs-actuel/{$period->id}", $payload)->assertStatus(409);
        $payload['designation'] = 'Tentative de modification';
        $this->putJson("/api/tarifs-actuel/{$period->id}", $payload)->assertStatus(409);
        $this->deleteJson("/api/tarifs-actuel/{$period->id}")->assertStatus(409);
    }

    public function test_active_periods_may_not_overlap(): void
    {
        $firstGrid = $this->coveredRoomGrid();
        $secondGrid = $this->coveredRoomGrid();
        $this->createPeriod($firstGrid, 'actif', '2033-01-01', '2033-02-01');

        $periodId = $this->postJson('/api/tarifs-actuel', $this->periodPayload(
            $secondGrid,
            'brouillon',
            '2033-01-15',
            '2033-02-15'
        ))->assertCreated()->json('id');
        $this->putJson("/api/tarifs-actuel/{$periodId}", $this->periodPayload(
            $secondGrid,
            'actif',
            '2033-01-15',
            '2033-02-15'
        ))->assertUnprocessable()->assertJsonValidationErrors('date_debut');
    }

    public function test_activating_a_period_requires_room_type_coverage(): void
    {
        $periodId = $this->postJson('/api/tarifs-actuel', $this->periodPayload(
            $this->roomGrid(),
            'brouillon',
            '2034-01-01',
            '2034-01-31'
        ))->assertCreated()->json('id');
        $period = TarifActuel::findOrFail($periodId);
        $this->putJson("/api/tarifs-actuel/{$periodId}", $this->periodPayload(
            $period->roomRateGrid,
            'actif',
            '2034-01-01',
            '2034-01-31'
        ))->assertUnprocessable()->assertJsonValidationErrors('tarif_chambre_id');
    }

    public function test_reservation_referenced_period_cannot_be_deleted(): void
    {
        $period = $this->createPeriod($this->roomGrid(), 'brouillon', '2035-01-01', '2035-01-31');
        $now = now();
        DB::table('reservations')->insert([
            'reservation_num' => 'TAR-'.uniqid(),
            'client_id' => 1,
            'client_type' => 'particulier',
            'reservation_date' => '2034-12-01',
            'date_debut' => '2035-01-05',
            'date_fin' => '2035-01-06',
            'status' => 'en attente',
            'tarif_actuel_id' => $period->id,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->deleteJson("/api/tarifs-actuel/{$period->id}")->assertStatus(409);
    }

    public function test_existing_legacy_periods_are_archived(): void
    {
        $legacyPeriods = DB::table('tarifs_actuel')->whereIn('id', [1, 2, 3])->get();

        $this->assertNotEmpty($legacyPeriods);
        $this->assertTrue($legacyPeriods->every(fn ($period) => $period->statut === 'archive'));
    }

    public function test_normalized_apis_expose_temporary_legacy_aliases(): void
    {
        $grid = $this->roomGrid();
        $type = TypeChambre::query()->firstOrFail();
        $detail = $this->postJson('/api/tarifs-chambre', [
            'code' => 'ALIAS-'.uniqid(),
            'tarif_chambre' => $grid->id,
            'type_chambre' => $type->id,
            'single' => 110,
            'double' => 160,
            'triple' => 210,
            'lit_supp' => 20,
        ])->assertCreated();

        $detail
            ->assertJsonPath('tarif_chambre_id', $grid->id)
            ->assertJsonPath('type_chambre_id', $type->id)
            ->assertJsonPath('single', '110.00')
            ->assertJsonPath('double', '160.00')
            ->assertJsonPath('triple', '210.00')
            ->assertJsonPath('lit_supp', '20.00')
            ->assertJsonPath('type_chambre.id', $type->id)
            ->assertJsonPath('tarif_chambre.id', $grid->id);

        $mealGrid = $this->mealGrid();
        $mealType = $this->mealType();
        $this->postJson('/api/tarifs-repas', [
            'tarif_repas' => $mealGrid->id,
            'type_repas' => $mealType->id,
            'montant' => 35,
        ])->assertCreated()
            ->assertJsonPath('prix_par_personne', '35.00')
            ->assertJsonPath('montant', '35.00')
            ->assertJsonPath('tarif_repas.id', $mealGrid->id)
            ->assertJsonPath('type_repas.id', $mealType->id);

        $reductionGrid = $this->reductionGrid();
        $reductionType = $this->reductionType();
        $this->postJson('/api/tarifs-reduction', [
            'tarif_reduction' => $reductionGrid->id,
            'type_reduction' => $reductionType->id,
            'montant' => 12,
            'percentage' => 5,
        ])->assertCreated()
            ->assertJsonPath('montant_fixe', '12.00')
            ->assertJsonPath('montant', '12.00')
            ->assertJsonPath('pourcentage', '5.00')
            ->assertJsonPath('percentage', '5.00')
            ->assertJsonPath('tarif_reduction.id', $reductionGrid->id)
            ->assertJsonPath('type_reduction.id', $reductionType->id);

        $period = $this->createPeriod($grid, 'brouillon', '2036-01-01', '2036-01-31');
        $this->getJson("/api/tarifs-actuel/{$period->id}")
            ->assertOk()
            ->assertJsonPath('tarif_chambre_id', $grid->id)
            ->assertJsonPath('tarif_chambre.id', $grid->id);
    }

    public function test_reservation_tariff_compatibility_uses_normalized_relationships(): void
    {
        $roomGrid = $this->coveredRoomGrid();
        $mealGrid = $this->mealGrid();
        $mealType = $this->mealType();
        $this->postJson('/api/tarifs-repas', [
            'tarif_repas_id' => $mealGrid->id,
            'type_repas_id' => $mealType->id,
            'prix_par_personne' => 20,
        ])->assertCreated()->json('id');

        $reductionGrid = $this->reductionGrid();
        $reductionType = $this->reductionType();
        $this->postJson('/api/tarifs-reduction', [
            'tarif_reduction_id' => $reductionGrid->id,
            'type_reduction_id' => $reductionType->id,
            'montant_fixe' => 5,
            'pourcentage' => 10,
        ])->assertCreated();

        $periodPayload = [
            'designation' => 'Reservation compatibility '.uniqid(),
            'date_debut' => '2037-01-01',
            'date_fin' => '2037-01-31',
            'statut' => 'brouillon',
            'tarif_chambre_id' => $roomGrid->id,
            'tarif_repas_id' => $mealGrid->id,
            'tarif_reduction_id' => $reductionGrid->id,
        ];
        $periodId = $this->postJson('/api/tarifs-actuel', $periodPayload)->assertCreated()->json('id');
        $periodPayload['statut'] = 'actif';
        $this->putJson("/api/tarifs-actuel/{$periodId}", $periodPayload)->assertOk();

        $room = Chambre::query()->with('typeChambre')->firstOrFail();
        $room->typeChambre->update([
            'capacite_standard' => 1,
            'lits_supplementaires_max' => 0,
        ]);
        $this->postJson('/api/reservations/calculate-tarif', [
            'date_debut' => '2037-01-05',
            'date_fin' => '2037-01-06',
            'chambres' => [[
                'chambre_id' => $room->id,
                'adultes' => 1,
                'enfants' => 0,
            ]],
            'repas' => [[
                'type_repas_id' => $mealType->id,
                'quantite_par_jour' => 1,
            ]],
            'type_reduction_id' => $reductionType->id,
        ])->assertOk()->assertJsonPath('data.periodes.0.tarif_actuel_id', $periodId);
    }

    private function roomGrid(): TarifChambre
    {
        return TarifChambre::create(['designation' => 'Room grid '.uniqid()]);
    }

    private function mealGrid(): TarifRepas
    {
        return TarifRepas::create(['designation' => 'Meal grid '.uniqid()]);
    }

    private function reductionGrid(): TarifReduction
    {
        return TarifReduction::create(['designation' => 'Reduction grid '.uniqid()]);
    }

    private function mealType(): TypeRepas
    {
        $suffix = uniqid();

        return TypeRepas::create(['code' => "MR-{$suffix}", 'type_repas' => "Repas {$suffix}"]);
    }

    private function reductionType(): TypeReduction
    {
        $suffix = uniqid();

        return TypeReduction::create(['code' => "RD-{$suffix}", 'type_reduction' => "Reduction {$suffix}"]);
    }

    private function roomDetailPayload(TarifChambre $grid, TypeChambre $type): array
    {
        return [
            'code' => 'ROOM-'.uniqid(),
            'tarif_chambre_id' => $grid->id,
            'type_chambre_id' => $type->id,
            'prix_1_personne' => 100,
            'prix_2_personnes' => 150,
            'prix_3_personnes' => null,
            'prix_lit_supplementaire' => 20,
        ];
    }

    private function coveredRoomGrid(): TarifChambre
    {
        $grid = $this->roomGrid();
        $typeIds = DB::table('chambres')->distinct()->pluck('type_chambre_id');

        foreach ($typeIds as $typeId) {
            TarifChambreDetail::create([
                'code' => 'COVER-'.uniqid(),
                'tarif_chambre_id' => $grid->id,
                'type_chambre_id' => $typeId,
                'prix_1_personne' => 100,
                'prix_lit_supplementaire' => 0,
            ]);
        }

        return $grid;
    }

    private function periodWithAllPlans(string $status, string $start, string $end): array
    {
        $roomGrid = $this->coveredRoomGrid();
        $roomDetailId = TarifChambreDetail::where('tarif_chambre_id', $roomGrid->id)->value('id');

        $mealGrid = $this->mealGrid();
        $mealType = $this->mealType();
        $mealDetailId = $this->postJson('/api/tarifs-repas', [
            'tarif_repas_id' => $mealGrid->id,
            'type_repas_id' => $mealType->id,
            'prix_par_personne' => 25,
        ])->assertCreated()->json('id');

        $reductionGrid = $this->reductionGrid();
        $reductionType = $this->reductionType();
        $reductionDetailId = $this->postJson('/api/tarifs-reduction', [
            'tarif_reduction_id' => $reductionGrid->id,
            'type_reduction_id' => $reductionType->id,
            'montant_fixe' => 10,
            'pourcentage' => 0,
        ])->assertCreated()->json('id');

        $payload = [
            'designation' => 'Period all plans '.uniqid(),
            'date_debut' => $start,
            'date_fin' => $end,
            'statut' => 'brouillon',
            'tarif_chambre_id' => $roomGrid->id,
            'tarif_repas_id' => $mealGrid->id,
            'tarif_reduction_id' => $reductionGrid->id,
        ];
        $periodId = $this->postJson('/api/tarifs-actuel', $payload)->assertCreated()->json('id');

        if (in_array($status, ['actif', 'archive'], true)) {
            $payload['statut'] = 'actif';
            $this->putJson("/api/tarifs-actuel/{$periodId}", $payload)->assertOk();
        }
        if ($status === 'archive') {
            $payload['statut'] = 'archive';
            $this->putJson("/api/tarifs-actuel/{$periodId}", $payload)->assertOk();
        }

        return [
            TarifActuel::findOrFail($periodId),
            $roomGrid,
            $mealGrid,
            $reductionGrid,
            $roomDetailId,
            $mealDetailId,
            $reductionDetailId,
        ];
    }

    private function assertPlanMutationsLocked(
        TarifChambre $roomGrid,
        TarifRepas $mealGrid,
        TarifReduction $reductionGrid,
        int $roomDetailId,
        int $mealDetailId,
        int $reductionDetailId,
        string $reason
    ): void {
        $roomTypeId = DB::table('tarif_chambre_detail')->where('id', $roomDetailId)->value('type_chambre_id');
        $mealTypeId = DB::table('tarif_repas_detail')->where('id', $mealDetailId)->value('type_repas_id');
        $reductionTypeId = DB::table('tarif_reduction_detail')->where('id', $reductionDetailId)->value('type_reduction_id');

        $this->putJson("/api/tarifs-chambre/{$roomDetailId}", [
            'tarif_chambre_id' => $roomGrid->id,
            'type_chambre_id' => $roomTypeId,
            'prix_1_personne' => 150,
            'prix_lit_supplementaire' => 0,
        ])->assertStatus(409)->assertJsonPath('message', "Ce plan est verrouillé car il ".($reason === 'période active' ? 'est utilisé par une période active.' : 'appartient à l’historique tarifaire.'));
        $this->putJson("/api/tarifs-repas/{$mealDetailId}", [
            'tarif_repas_id' => $mealGrid->id,
            'type_repas_id' => $mealTypeId,
            'prix_par_personne' => 30,
        ])->assertStatus(409);
        $this->putJson("/api/tarifs-reduction/{$reductionDetailId}", [
            'tarif_reduction_id' => $reductionGrid->id,
            'type_reduction_id' => $reductionTypeId,
            'montant_fixe' => 12,
            'pourcentage' => 2,
        ])->assertStatus(409);

        $this->putJson("/api/desigs-chambre/{$roomGrid->id}", ['designation' => 'Locked room '.uniqid()])->assertStatus(409);
        $this->putJson("/api/desigs-repas/{$mealGrid->id}", ['designation' => 'Locked meal '.uniqid()])->assertStatus(409);
        $this->putJson("/api/desigs-reduction/{$reductionGrid->id}", ['designation' => 'Locked reduction '.uniqid()])->assertStatus(409);
        $this->deleteJson("/api/desigs-chambre/{$roomGrid->id}")->assertStatus(409);
        $this->deleteJson("/api/desigs-repas/{$mealGrid->id}")->assertStatus(409);
        $this->deleteJson("/api/desigs-reduction/{$reductionGrid->id}")->assertStatus(409);
    }

    private function createPeriod(
        TarifChambre $grid,
        string $status,
        string $start,
        string $end
    ): TarifActuel {
        $payload = $this->periodPayload($grid, 'brouillon', $start, $end);
        $id = $this->postJson('/api/tarifs-actuel', $payload)
            ->assertCreated()->json('id');

        if (in_array($status, ['actif', 'archive'], true)) {
            $payload['statut'] = 'actif';
            $this->putJson("/api/tarifs-actuel/{$id}", $payload)->assertOk();
        }

        if ($status === 'archive') {
            $payload['statut'] = 'archive';
            $this->putJson("/api/tarifs-actuel/{$id}", $payload)->assertOk();
        }

        return TarifActuel::query()->findOrFail($id);
    }

    private function periodPayload(TarifChambre $grid, string $status, string $start, string $end): array
    {
        return [
            'designation' => 'Period '.uniqid(),
            'date_debut' => $start,
            'date_fin' => $end,
            'statut' => $status,
            'tarif_chambre_id' => $grid->id,
            'tarif_repas_id' => null,
            'tarif_reduction_id' => null,
        ];
    }
}
