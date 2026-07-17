<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\ReservationRoom;
use App\Models\TarifChambreDetail;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationApiTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_create_persists_authoritative_header_room_and_same_price_segments(): void
    {
        $context = $this->apiContext('2095-01-01', '2095-01-31');

        $response = $this->postJson('/api/reservations', $context['payload'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'en attente')
            ->assertJsonPath('data.pricing_version', 2)
            ->assertJsonPath('data.legacy_pricing', false)
            ->assertJsonPath('data.client.display_name', $context['client']->raison_sociale)
            ->assertJsonPath('data.totals.total', '200.00');

        $reservationId = $response->json('data.id');
        $allocation = ReservationRoom::where('reservation_id', $reservationId)->firstOrFail();
        $this->assertSame('100.00', $allocation->tarif_par_nuit);
        $this->assertSame('200.00', $allocation->montant_total);
        $this->assertSame(1, $allocation->adultes);
        $this->assertSame(0, $allocation->enfants);
        $this->assertSame(1, $allocation->priceSegments()->count());
        $this->assertDatabaseHas('reservations', [
            'id' => $reservationId,
            'pricing_version' => 2,
            'legacy_pricing' => false,
            'client_name_snapshot' => $context['client']->raison_sociale,
            'montant_chambres' => '200.00',
            'montant_repas' => '0.00',
            'montant_total' => '200.00',
        ]);
    }

    public function test_create_accepts_confirmed_status_and_ignores_no_client_money(): void
    {
        $context = $this->apiContext('2095-02-01', '2095-02-28');
        $context['payload']['status'] = 'confirmé';

        $this->postJson('/api/reservations', $context['payload'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'confirmé');

        $context['payload']['montant_total'] = '0.01';
        $this->postJson('/api/reservations', $context['payload'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('montant_total');
    }

    public function test_cross_period_multi_price_room_persists_null_legacy_nightly_price(): void
    {
        $client = $this->createCompanyClient();
        $type = $this->createRoomType(1, 0);
        $room = $this->createRoom($type);
        [$firstGrid] = $this->createRoomGridDetail($type, ['prix_1_personne' => '100.00']);
        [$secondGrid] = $this->createRoomGridDetail($type, ['prix_1_personne' => '120.00']);
        $this->createPeriod('2095-03-01', '2095-03-31', $firstGrid);
        $this->createPeriod('2095-04-01', '2095-04-30', $secondGrid);

        $response = $this->postJson('/api/reservations', $this->storePayload(
            $client,
            $room,
            '2095-03-31',
            '2095-04-03'
        ))->assertCreated();
        $allocation = ReservationRoom::where('reservation_id', $response->json('data.id'))->firstOrFail();

        $this->assertNull($allocation->tarif_par_nuit);
        $this->assertSame('340.00', $allocation->montant_total);
        $this->assertSame(2, $allocation->priceSegments()->count());
        $this->assertSame(
            ['100.00', '120.00'],
            $allocation->priceSegments()->orderBy('segment_date_debut')->pluck('prix_par_nuit_snapshot')->all()
        );
    }

    public function test_meal_and_reduction_segments_persist_and_match_header_totals(): void
    {
        $client = $this->createCompanyClient();
        $type = $this->createRoomType(2, 0);
        $room = $this->createRoom($type);
        [$roomGrid] = $this->createRoomGridDetail($type, ['prix_2_personnes' => '150.00']);
        [$mealGrid, , $mealType] = $this->createMealGridDetail(null, '20.00');
        [$reductionGrid, , $reductionType] = $this->createReductionGridDetail(null, '10.00', '10.00');
        $period = $this->createPeriod(
            '2095-05-01',
            '2095-05-31',
            $roomGrid,
            $mealGrid,
            $reductionGrid
        );
        $payload = $this->storePayload($client, $room, '2095-05-10', '2095-05-12', 2);
        $payload['repas'] = [[
            'type_repas_id' => $mealType->id,
            'quantite_par_jour' => 2,
        ]];
        $payload['type_reduction_id'] = $reductionType->id;

        $response = $this->postJson('/api/reservations', $payload)
            ->assertCreated()
            ->assertJsonPath('data.totals.chambres', '300.00')
            ->assertJsonPath('data.totals.repas', '80.00')
            ->assertJsonPath('data.totals.avant_reduction', '380.00')
            ->assertJsonPath('data.totals.reduction', '48.00')
            ->assertJsonPath('data.totals.total', '332.00');
        $reservationId = $response->json('data.id');

        $this->assertDatabaseHas('reservation_meals', [
            'reservation_id' => $reservationId,
            'tarif_actuel_id' => $period->id,
            'type_repas_id' => $mealType->id,
            'prix_unitaire_snapshot' => '20.00',
            'quantite_par_jour' => 2,
            'jours_factures' => 2,
            'montant_total' => '80.00',
        ]);
        $this->assertDatabaseHas('reservation_reductions', [
            'reservation_id' => $reservationId,
            'tarif_actuel_id' => $period->id,
            'type_reduction_id' => $reductionType->id,
            'montant_fixe_snapshot' => '10.00',
            'pourcentage_snapshot' => '10.00',
            'sous_total_eligible' => '380.00',
            'montant_applique' => '48.00',
        ]);
        $childTotal = DB::table('details_reservation')->where('reservation_id', $reservationId)->sum('montant_total')
            + DB::table('reservation_meals')->where('reservation_id', $reservationId)->sum('montant_total');
        $this->assertSame('380.00', number_format((float) $childTotal, 2, '.', ''));
    }

    public function test_invalid_client_conflicts_and_missing_price_return_structured_errors_without_partial_rows(): void
    {
        $context = $this->apiContext('2095-06-01', '2095-06-30');
        $before = Reservation::count();
        $invalidClient = $context['payload'];
        $invalidClient['client_id'] = 999999999;
        $this->postJson('/api/reservations', $invalidClient)
            ->assertUnprocessable()
            ->assertJsonPath('code', 'client_not_found');

        $this->createBlockingReservation($context['room'], '2095-06-10', '2095-06-12');
        $this->postJson('/api/reservations', $context['payload'])
            ->assertStatus(409)
            ->assertJsonPath('code', 'room_unavailable');

        DB::table('reservations')->where('reservation_num', 'like', 'BLOCK-%')->update([
            'status' => 'annulé',
        ]);
        DB::table('etat_chambre')->where('num_chambre', $context['room']->num_chambre)->update([
            'maintenance' => true,
            'date_debut_maintenance' => '2095-06-10',
            'date_fin_maintenance' => '2095-06-12',
        ]);
        $this->postJson('/api/reservations', $context['payload'])
            ->assertStatus(409)
            ->assertJsonPath('code', 'maintenance_overlap');

        DB::table('etat_chambre')->where('num_chambre', $context['room']->num_chambre)->update([
            'maintenance' => false,
        ]);
        TarifChambreDetail::where('tarif_chambre_id', $context['period']->tarif_chambre_id)
            ->update(['prix_1_personne' => 0]);
        $this->postJson('/api/reservations', $context['payload'])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'room_occupancy_price_missing');

        $this->assertSame($before + 1, Reservation::count());
        $this->assertSame(0, Reservation::where('pricing_version', 2)
            ->where('date_debut', '2095-06-10')
            ->where('reservation_num', 'not like', 'BLOCK-%')
            ->count());
    }

    public function test_future_pending_and_confirmed_reservations_can_replace_snapshots(): void
    {
        foreach (['en attente', 'confirmé'] as $index => $status) {
            $month = $index + 7;
            $start = sprintf('2095-%02d-01', $month);
            $end = sprintf('2095-%02d-28', $month);
            $context = $this->apiContext($start, $end);
            $payload = $context['payload'];
            $payload['status'] = $status;
            $created = $this->postJson('/api/reservations', $payload)->assertCreated();
            $id = $created->json('data.id');
            $oldAllocationId = $created->json('data.chambres.0.allocation_id');
            $updated = $payload;
            unset($updated['status']);
            $updated['chambres'][0]['adultes'] = 2;

            $this->putJson("/api/reservations/{$id}", $updated)
                ->assertOk()
                ->assertJsonPath('data.status', $status)
                ->assertJsonPath('data.chambres.0.adultes', 2)
                ->assertJsonPath('data.totals.chambres', '300.00');
            $this->assertDatabaseMissing('details_reservation', ['id' => $oldAllocationId]);
            $this->assertSame(1, ReservationRoom::where('reservation_id', $id)->count());
            $this->assertSame(1, DB::table('reservation_room_price_segments')
                ->whereIn('reservation_room_id', ReservationRoom::where('reservation_id', $id)->pluck('id'))
                ->count());
        }
    }

    public function test_update_excludes_its_rooms_and_failed_update_rolls_back_everything(): void
    {
        $context = $this->apiContext('2095-09-01', '2095-09-30');
        $created = $this->postJson('/api/reservations', $context['payload'])->assertCreated();
        $id = $created->json('data.id');
        $before = Reservation::findOrFail($id);
        $allocationIds = ReservationRoom::where('reservation_id', $id)->pluck('id')->all();
        $update = $context['payload'];
        unset($update['status']);

        $this->putJson("/api/reservations/{$id}", $update)->assertOk();

        TarifChambreDetail::where('tarif_chambre_id', $context['period']->tarif_chambre_id)
            ->update(['prix_1_personne' => 0]);
        $failed = $update;
        $failed['date_fin'] = '2095-09-13';
        $this->putJson("/api/reservations/{$id}", $failed)
            ->assertUnprocessable()
            ->assertJsonPath('code', 'room_occupancy_price_missing');

        $fresh = Reservation::findOrFail($id);
        $this->assertSame($before->montant_total, $fresh->montant_total);
        $this->assertSame('2095-09-12', $fresh->date_fin->format('Y-m-d'));
        $this->assertNotEmpty(ReservationRoom::where('reservation_id', $id)->pluck('id')->all());
        $this->assertNotEmpty($allocationIds);
    }

    public function test_cancelled_and_past_reservations_are_not_structurally_editable(): void
    {
        $context = $this->apiContext('2095-10-01', '2095-10-31');
        $created = $this->postJson('/api/reservations', $context['payload'])->assertCreated();
        $id = $created->json('data.id');
        $this->patchJson("/api/reservations/{$id}/status", [
            'status' => 'annulé',
            'cancellation_reason' => 'Test',
        ])->assertOk();
        $update = $context['payload'];
        unset($update['status']);
        $this->putJson("/api/reservations/{$id}", $update)
            ->assertStatus(409)
            ->assertJsonPath('code', 'invalid_reservation_lifecycle');

        $past = $this->createLegacyReservation($context['room'], '2020-01-01', '2020-01-02');
        $this->putJson("/api/reservations/{$past->id}", $update)
            ->assertStatus(409)
            ->assertJsonPath('code', 'invalid_reservation_lifecycle');
    }

    public function test_successful_legacy_update_converts_to_version_two_and_failure_preserves_legacy_data(): void
    {
        $context = $this->apiContext('2095-11-01', '2095-11-30');
        $legacy = $this->createLegacyReservation($context['room'], '2095-11-10', '2095-11-12');
        $payload = $context['payload'];
        unset($payload['status']);
        $payload['date_debut'] = '2095-11-10';
        $payload['date_fin'] = '2095-11-12';

        $this->putJson("/api/reservations/{$legacy->id}", $payload)
            ->assertOk()
            ->assertJsonPath('data.pricing_version', 2)
            ->assertJsonPath('data.legacy_pricing', false);

        $otherLegacy = $this->createLegacyReservation($context['room'], '2095-11-20', '2095-11-22');
        $originalTotal = $otherLegacy->montant_total;
        $originalAllocation = $otherLegacy->reservationRooms()->firstOrFail();
        TarifChambreDetail::where('tarif_chambre_id', $context['period']->tarif_chambre_id)
            ->update(['prix_1_personne' => 0]);
        $payload['date_debut'] = '2095-11-20';
        $payload['date_fin'] = '2095-11-22';

        $this->putJson("/api/reservations/{$otherLegacy->id}", $payload)->assertUnprocessable();
        $otherLegacy->refresh();
        $this->assertTrue($otherLegacy->legacy_pricing);
        $this->assertSame(1, $otherLegacy->pricing_version);
        $this->assertSame($originalTotal, $otherLegacy->montant_total);
        $this->assertDatabaseHas('details_reservation', [
            'id' => $originalAllocation->id,
            'tarif_par_nuit' => '0.00',
        ]);
    }

    public function test_status_lifecycle_and_cancellation_preserve_snapshots_and_totals(): void
    {
        $context = $this->apiContext('2095-12-01', '2095-12-31');
        $created = $this->postJson('/api/reservations', $context['payload'])->assertCreated();
        $id = $created->json('data.id');
        $segmentCount = DB::table('reservation_room_price_segments')->count();
        $total = Reservation::findOrFail($id)->montant_total;

        $this->patchJson("/api/reservations/{$id}/status", ['status' => 'confirmé'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmé');
        $this->patchJson("/api/reservations/{$id}/status", ['status' => 'annulé'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cancellation_reason');
        $this->patchJson("/api/reservations/{$id}/status", [
            'status' => 'annulé',
            'cancellation_reason' => 'Demande du client',
        ])->assertOk()
            ->assertJsonPath('data.status', 'annulé')
            ->assertJsonPath('data.cancellation.reason', 'Demande du client');

        $reservation = Reservation::findOrFail($id);
        $this->assertSame($total, $reservation->montant_total);
        $this->assertNotNull($reservation->cancelled_at);
        $this->assertSame($segmentCount, DB::table('reservation_room_price_segments')->count());
        $this->patchJson("/api/reservations/{$id}/status", ['status' => 'confirmé'])
            ->assertStatus(409)
            ->assertJsonPath('code', 'invalid_reservation_lifecycle');

        $pending = $this->postJson('/api/reservations', $context['payload'])->assertCreated();
        $this->patchJson("/api/reservations/{$pending->json('data.id')}/status", [
            'status' => 'annulé',
            'cancellation_reason' => 'Annulation avant confirmation',
        ])->assertOk()->assertJsonPath('data.status', 'annulé');
    }

    public function test_deprecated_delete_cancels_without_deleting_or_changing_legacy_totals(): void
    {
        $room = $this->createRoom();
        $legacy = $this->createLegacyReservation($room, '2096-01-10', '2096-01-12');
        $total = $legacy->montant_total;

        $this->deleteJson("/api/reservations/{$legacy->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'annulé')
            ->assertJsonPath(
                'data.cancellation.reason',
                'Annulation effectuée depuis l’ancienne interface.'
            );

        $legacy->refresh();
        $this->assertSame($total, $legacy->montant_total);
        $this->assertTrue($legacy->legacy_pricing);
        $this->assertDatabaseHas('reservations', ['id' => $legacy->id]);
        $this->assertSame(1, $legacy->reservationRooms()->count());
    }

    public function test_list_is_compact_and_show_is_normalized_for_version_two_and_legacy(): void
    {
        $context = $this->apiContext('2096-02-01', '2096-02-28');
        $created = $this->postJson('/api/reservations', $context['payload'])->assertCreated();
        $id = $created->json('data.id');
        $legacy = $this->createLegacyReservation($context['room'], '2096-02-20', '2096-02-22');
        $clientQueries = [];
        DB::listen(function ($query) use (&$clientQueries): void {
            if (str_contains(strtolower($query->sql), 'from `clients')) {
                $clientQueries[] = $query->sql;
            }
        });

        $list = $this->getJson('/api/reservations')->assertOk();
        $this->assertNotEmpty($list->json('data'));
        $this->assertArrayNotHasKey('chambres', $list->json('data.0'));
        $this->assertGreaterThanOrEqual(1, count($clientQueries));
        $this->assertLessThanOrEqual(2, count($clientQueries));
        $this->assertSame(
            count($clientQueries),
            count(array_unique($clientQueries)),
            'Reservation list must eager-load each client table once instead of querying per row.'
        );

        $this->getJson("/api/reservations/{$id}")
            ->assertOk()
            ->assertJsonPath('data.id', $id)
            ->assertJsonCount(1, 'data.chambres.0.segments');
        $this->getJson("/api/reservations/{$legacy->id}")
            ->assertOk()
            ->assertJsonPath('data.legacy_pricing', true)
            ->assertJsonPath('data.totals.total', '987.65')
            ->assertJsonCount(0, 'data.chambres.0.segments');
        $this->getJson("/api/reservations/{$legacy->reservation_num}")
            ->assertOk()
            ->assertJsonPath('data.id', $legacy->id);

        $update = $context['payload'];
        unset($update['status']);
        $update['date_debut'] = '2096-02-20';
        $update['date_fin'] = '2096-02-22';
        $this->putJson("/api/reservations/{$legacy->reservation_num}", $update)
            ->assertOk()
            ->assertJsonPath('data.id', $legacy->id)
            ->assertJsonPath('data.pricing_version', 2);
    }

    public function test_available_rooms_and_preview_endpoints_use_normalized_services_without_writes(): void
    {
        $context = $this->apiContext('2096-03-01', '2096-03-31');
        $created = $this->postJson('/api/reservations', $context['payload'])->assertCreated();
        $reservationId = $created->json('data.id');

        $this->getJson('/api/reservations/available-rooms?'.http_build_query([
            'date_debut' => '2096-03-10',
            'date_fin' => '2096-03-12',
            'reservation_id' => $reservationId,
        ]))->assertOk()
            ->assertJsonPath('data.nuits', 2)
            ->assertJsonPath('data.periodes.0.id', $context['period']->id)
            ->assertJsonFragment(['id' => $context['room']->id, 'selected' => true]);
        $this->getJson('/api/available-rooms?'.http_build_query([
            'date_debut' => '2096-03-10',
            'date_fin' => '2096-03-12',
            'reservation_num' => $created->json('data.reservation_num'),
        ]))->assertOk()->assertJsonFragment(['id' => $context['room']->id, 'selected' => true]);

        $counts = $this->snapshotCounts();
        $previewPayload = $context['payload'];
        unset($previewPayload['client_type'], $previewPayload['client_id'], $previewPayload['status']);
        $this->postJson('/api/reservations/calculate-price', $previewPayload)
            ->assertOk()
            ->assertJsonPath('data.montant_total', '200.00')
            ->assertJsonPath('data.occupants_total', 1);
        $this->assertSame($counts, $this->snapshotCounts());

        $this->postJson('/api/reservations/calculate-tarif', [
            'date_debut' => '2096-03-10',
            'date_fin' => '2096-03-12',
            'chambre_ids' => [$context['room']->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('chambres')
            ->assertJsonFragment([
                'Le nombre d’adultes et d’enfants doit être renseigné pour chaque chambre.',
            ]);
    }

    public function test_reservation_routes_are_unique_valid_and_never_physically_delete(): void
    {
        $routes = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($route): bool => str_starts_with($route->uri(), 'api/reservations'));
        $signatures = $routes->flatMap(fn ($route) => collect($route->methods())
            ->reject(fn (string $method): bool => $method === 'HEAD')
            ->map(fn (string $method): string => $method.' '.$route->uri().' '.$route->getActionName()));

        $this->assertSame($signatures->count(), $signatures->unique()->count());
        $this->assertFalse($signatures->contains(
            fn (string $signature): bool => str_contains($signature, 'getReservationsByDateRange')
        ));
        $this->assertFalse($signatures->contains(
            fn (string $signature): bool => str_contains($signature, 'supprimerReservation')
        ));
        $this->assertTrue($signatures->contains(
            fn (string $signature): bool => str_contains($signature, 'cancelFromDelete')
        ));
    }

    private function apiContext(string $periodStart, string $periodEnd): array
    {
        $client = $this->createCompanyClient();
        $type = $this->createRoomType(2, 0);
        $room = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type);
        $period = $this->createPeriod($periodStart, $periodEnd, $grid);
        $stayStart = substr($periodStart, 0, 8).'10';
        $stayEnd = substr($periodStart, 0, 8).'12';

        return [
            'client' => $client,
            'type' => $type,
            'room' => $room,
            'period' => $period,
            'payload' => $this->storePayload($client, $room, $stayStart, $stayEnd),
        ];
    }

    private function storePayload(
        object $client,
        object $room,
        string $start,
        string $end,
        int $adults = 1,
        int $children = 0
    ): array {
        return [
            'client_type' => 'societe',
            'client_id' => $client->id,
            'date_debut' => $start,
            'date_fin' => $end,
            'chambres' => [[
                'chambre_id' => $room->id,
                'adultes' => $adults,
                'enfants' => $children,
            ]],
            'repas' => [],
            'type_reduction_id' => null,
        ];
    }

    private function createLegacyReservation(object $room, string $start, string $end): Reservation
    {
        $reservation = Reservation::create([
            'reservation_num' => 'R'.strtoupper(substr(uniqid(), -10)),
            'client_type' => 'societe',
            'client_id' => 999999,
            'reservation_date' => $start,
            'date_debut' => $start,
            'date_fin' => $end,
            'status' => 'en attente',
            'pricing_version' => 1,
            'legacy_pricing' => true,
            'montant_total' => '987.65',
            'montant_reduction' => '12.34',
        ]);
        ReservationRoom::create([
            'reservation_id' => $reservation->id,
            'chambre_id' => $room->id,
            'tarif_par_nuit' => '0.00',
            'montant_total' => '0.00',
        ]);

        return $reservation;
    }

    private function snapshotCounts(): array
    {
        return [
            Reservation::count(),
            ReservationRoom::count(),
            DB::table('reservation_room_price_segments')->count(),
            DB::table('reservation_meals')->count(),
            DB::table('reservation_reductions')->count(),
        ];
    }
}
