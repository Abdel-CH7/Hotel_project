<?php

namespace Tests\Feature;

use App\Models\Chambre;
use App\Models\Reservation;
use App\Models\ReservationMeal;
use App\Models\ReservationReduction;
use App\Models\ReservationRoom;
use App\Models\ReservationRoomPriceSegment;
use App\Models\TypeChambre;
use App\Models\TypeReduction;
use App\Models\TypeRepas;
use App\Support\ReservationLegacyBackfill;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ReservationPersistenceFoundationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_reservation_schema_contains_snapshot_fields_and_tables(): void
    {
        $this->assertTrue(Schema::hasColumns('reservations', [
            'pricing_version',
            'legacy_pricing',
            'client_name_snapshot',
            'montant_chambres',
            'montant_repas',
            'sous_total_avant_reduction',
            'cancelled_at',
            'cancellation_reason',
        ]));
        $this->assertTrue(Schema::hasColumns('details_reservation', [
            'adultes',
            'enfants',
            'lits_supplementaires',
            'type_chambre_id',
            'type_chambre_nom_snapshot',
            'capacite_standard_snapshot',
            'lits_supplementaires_max_snapshot',
        ]));
        $this->assertTrue(Schema::hasColumns('types_chambre', [
            'capacite_standard',
            'lits_supplementaires_max',
        ]));
        $this->assertTrue(Schema::hasTable('reservation_room_price_segments'));
        $this->assertTrue(Schema::hasTable('reservation_meals'));
        $this->assertTrue(Schema::hasTable('reservation_reductions'));
    }

    public function test_type_chambre_capacity_fields_accept_nullable_and_valid_values(): void
    {
        $payload = $this->typePayload();

        $type = $this->postJson('/api/types-chambre', $payload)
            ->assertCreated()
            ->assertJsonPath('capacite_standard', null)
            ->assertJsonPath('lits_supplementaires_max', null)
            ->json();

        $payload['capacite_standard'] = 3;
        $payload['lits_supplementaires_max'] = 2;

        $this->putJson("/api/types-chambre/{$type['id']}", $payload)
            ->assertOk()
            ->assertJsonPath('capacite_standard', 3)
            ->assertJsonPath('lits_supplementaires_max', 2);
    }

    public function test_capacite_standard_rejects_values_outside_one_to_three(): void
    {
        foreach ([0, 4] as $capacity) {
            $payload = $this->typePayload();
            $payload['capacite_standard'] = $capacity;

            $this->postJson('/api/types-chambre', $payload)
                ->assertUnprocessable()
                ->assertJsonValidationErrors('capacite_standard');
        }
    }

    public function test_lits_supplementaires_max_rejects_negative_values(): void
    {
        $payload = $this->typePayload();
        $payload['lits_supplementaires_max'] = -1;

        $this->postJson('/api/types-chambre', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('lits_supplementaires_max');
    }

    public function test_duplicate_reservation_room_pair_is_rejected(): void
    {
        [, , $room, $reservation] = $this->foundationFixture();

        $this->assertConstraintViolation(function () use ($room, $reservation): void {
            DB::table('details_reservation')->insert([
                'reservation_id' => $reservation->id,
                'chambre_id' => $room->id,
                'tarif_par_nuit' => null,
                'montant_total' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function test_room_referenced_by_reservation_is_restricted_at_database_level(): void
    {
        [, , $room] = $this->foundationFixture();

        $this->assertConstraintViolation(function () use ($room): void {
            DB::table('chambres')->where('id', $room->id)->delete();
        });

        $this->assertDatabaseHas('chambres', ['id' => $room->id]);
    }

    public function test_reservation_room_has_price_segments_and_unique_segment_start(): void
    {
        [, $reservationRoom] = $this->foundationFixture();
        $segment = ReservationRoomPriceSegment::create($this->segmentPayload($reservationRoom));

        $this->assertTrue($reservationRoom->fresh()->priceSegments->contains($segment));
        $this->assertSame($reservationRoom->id, $segment->reservationRoom->id);

        $this->assertConstraintViolation(function () use ($reservationRoom): void {
            ReservationRoomPriceSegment::create($this->segmentPayload($reservationRoom));
        });
    }

    public function test_reservation_has_meal_and_reduction_relationships(): void
    {
        [, , , $reservation] = $this->foundationFixture();
        $mealType = TypeRepas::create([
            'code' => 'MEAL-'.uniqid(),
            'type_repas' => 'Repas '.uniqid(),
        ]);
        $reductionType = TypeReduction::create([
            'code' => 'RED-'.uniqid(),
            'type_reduction' => 'Reduction '.uniqid(),
        ]);

        $meal = ReservationMeal::create($this->mealPayload($reservation, $mealType));
        $reduction = ReservationReduction::create(
            $this->reductionPayload($reservation, $reductionType)
        );

        $reservation = $reservation->fresh();
        $this->assertTrue($reservation->meals->contains($meal));
        $this->assertSame($reduction->id, $reservation->reduction->id);
        $this->assertSame($mealType->id, $meal->mealType->id);
        $this->assertSame($reductionType->id, $reduction->reductionType->id);

        $this->assertConstraintViolation(function () use ($reservation, $mealType): void {
            ReservationMeal::create($this->mealPayload($reservation, $mealType));
        });
    }

    public function test_only_one_reduction_row_is_allowed_per_reservation(): void
    {
        [, , , $reservation] = $this->foundationFixture();
        $type = TypeReduction::create([
            'code' => 'RED-'.uniqid(),
            'type_reduction' => 'Reduction '.uniqid(),
        ]);
        ReservationReduction::create($this->reductionPayload($reservation, $type));

        $this->assertConstraintViolation(function () use ($reservation, $type): void {
            ReservationReduction::create($this->reductionPayload($reservation, $type));
        });
    }

    public function test_legacy_backfill_preserves_totals_zero_pivots_and_creates_no_breakdowns(): void
    {
        [$client, $reservationRoom, , $reservation] = $this->foundationFixture(true);

        $this->assertSame(1, app(ReservationLegacyBackfill::class)->run());

        $reservation = $reservation->fresh();
        $reservationRoom = $reservationRoom->fresh();

        $this->assertTrue($reservation->legacy_pricing);
        $this->assertSame(1, $reservation->pricing_version);
        $this->assertSame($client->raison_sociale, $reservation->client_name_snapshot);
        $this->assertSame('987.65', $reservation->montant_total);
        $this->assertSame('12.34', $reservation->montant_reduction);
        $this->assertNull($reservation->montant_chambres);
        $this->assertNull($reservation->montant_repas);
        $this->assertNull($reservation->sous_total_avant_reduction);
        $this->assertSame('0.00', $reservationRoom->tarif_par_nuit);
        $this->assertSame('0.00', $reservationRoom->montant_total);
        $this->assertNull($reservationRoom->adultes);
        $this->assertNull($reservationRoom->enfants);
        $this->assertNull($reservationRoom->lits_supplementaires);
        $this->assertSame(0, $reservationRoom->priceSegments()->count());
        $this->assertSame(0, $reservation->meals()->count());
        $this->assertNull($reservation->reduction);
    }

    public function test_new_snapshot_tables_enforce_parent_foreign_keys(): void
    {
        $missingReservationRoomId = ((int) DB::table('details_reservation')->max('id')) + 1000;
        $missingReservationId = ((int) DB::table('reservations')->max('id')) + 1000;

        $this->assertConstraintViolation(function () use ($missingReservationRoomId): void {
            DB::table('reservation_room_price_segments')->insert([
                'reservation_room_id' => $missingReservationRoomId,
                'segment_date_debut' => '2032-01-01',
                'segment_date_fin' => '2032-01-02',
                'nuits' => 1,
                'occupation_tarifee' => 1,
                'prix_occupation_snapshot' => 100,
                'lits_supplementaires' => 0,
                'prix_lit_supplementaire_snapshot' => 0,
                'prix_par_nuit_snapshot' => 100,
                'montant_segment' => 100,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $this->assertConstraintViolation(function () use ($missingReservationId): void {
            DB::table('reservation_meals')->insert([
                'reservation_id' => $missingReservationId,
                'type_repas_nom_snapshot' => 'Repas test',
                'segment_date_debut' => '2032-01-01',
                'segment_date_fin' => '2032-01-02',
                'prix_unitaire_snapshot' => 20,
                'quantite_par_jour' => 1,
                'jours_factures' => 1,
                'montant_total' => 20,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $this->assertConstraintViolation(function () use ($missingReservationId): void {
            DB::table('reservation_reductions')->insert([
                'reservation_id' => $missingReservationId,
                'type_reduction_nom_snapshot' => 'Reduction test',
                'montant_fixe_snapshot' => 0,
                'pourcentage_snapshot' => 5,
                'sous_total_eligible' => 100,
                'montant_applique' => 5,
                'formule_version' => 'percentage_plus_fixed_v1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    private function foundationFixture(bool $legacy = false): array
    {
        $suffix = uniqid();
        $now = now();
        $clientId = DB::table('clients')->insertGetId([
            'CodeClient' => "CF-{$suffix}",
            'raison_sociale' => "Client foundation {$suffix}",
            'adresse' => 'Adresse test',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $client = DB::table('clients')->where('id', $clientId)->first();
        $type = TypeChambre::create($this->typePayload());
        $viewId = DB::table('vues')->insertGetId([
            'vue' => "Vue {$suffix}",
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $floorId = DB::table('etages')->insertGetId([
            'etage' => "Etage {$suffix}",
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $room = Chambre::create([
            'num_chambre' => "R-{$suffix}",
            'type_chambre_id' => $type->id,
            'etage_id' => $floorId,
            'vue_id' => $viewId,
            'climat' => true,
            'wifi' => true,
        ]);
        $reservation = Reservation::create([
            'reservation_num' => "RES-{$suffix}",
            'client_id' => $clientId,
            'client_type' => 'societe',
            'reservation_date' => '2031-12-01',
            'date_debut' => '2032-01-01',
            'date_fin' => '2032-01-02',
            'status' => 'en attente',
            'montant_total' => $legacy ? 987.65 : 100,
            'montant_reduction' => $legacy ? 12.34 : 0,
            'pricing_version' => $legacy ? null : 2,
            'legacy_pricing' => false,
        ]);
        $reservationRoom = ReservationRoom::create([
            'reservation_id' => $reservation->id,
            'chambre_id' => $room->id,
            'tarif_par_nuit' => $legacy ? 0 : null,
            'montant_total' => $legacy ? 0 : 100,
        ]);

        return [$client, $reservationRoom, $room, $reservation];
    }

    private function typePayload(): array
    {
        $suffix = uniqid();

        return [
            'code' => "CAP-{$suffix}",
            'type_chambre' => "Type capacity {$suffix}",
            'nb_lit' => 2,
            'nb_salle' => 1,
            'capacite_standard' => null,
            'lits_supplementaires_max' => null,
            'commentaire' => null,
        ];
    }

    private function segmentPayload(ReservationRoom $reservationRoom): array
    {
        return [
            'reservation_room_id' => $reservationRoom->id,
            'segment_date_debut' => '2032-01-01',
            'segment_date_fin' => '2032-01-02',
            'nuits' => 1,
            'occupation_tarifee' => 2,
            'prix_occupation_snapshot' => 150,
            'lits_supplementaires' => 0,
            'prix_lit_supplementaire_snapshot' => 0,
            'prix_par_nuit_snapshot' => 150,
            'montant_segment' => 150,
        ];
    }

    private function mealPayload(Reservation $reservation, TypeRepas $type): array
    {
        return [
            'reservation_id' => $reservation->id,
            'type_repas_id' => $type->id,
            'type_repas_nom_snapshot' => $type->type_repas,
            'segment_date_debut' => '2032-01-01',
            'segment_date_fin' => '2032-01-02',
            'prix_unitaire_snapshot' => 20,
            'quantite_par_jour' => 2,
            'jours_factures' => 1,
            'montant_total' => 40,
        ];
    }

    private function reductionPayload(Reservation $reservation, TypeReduction $type): array
    {
        return [
            'reservation_id' => $reservation->id,
            'type_reduction_id' => $type->id,
            'type_reduction_nom_snapshot' => $type->type_reduction,
            'montant_fixe_snapshot' => 0,
            'pourcentage_snapshot' => 5,
            'sous_total_eligible' => 100,
            'montant_applique' => 5,
            'formule_version' => 'percentage_plus_fixed_v1',
        ];
    }

    private function assertConstraintViolation(Closure $callback): void
    {
        try {
            $callback();
            $this->fail('Expected a database constraint violation.');
        } catch (QueryException) {
            $this->addToAssertionCount(1);
        }
    }
}
