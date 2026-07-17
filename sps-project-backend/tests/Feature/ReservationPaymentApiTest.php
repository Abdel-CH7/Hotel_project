<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\ReservationPaiement;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationPaymentApiTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_payment_schema_model_contract_and_foreign_key_rules(): void
    {
        $this->assertTrue(Schema::hasColumns('reservation_paiements', [
            'id', 'paiement_num', 'reservation_id', 'mode_paiement_id', 'type_paiement',
            'montant', 'date_paiement', 'reference', 'commentaire', 'statut', 'user_id',
            'annule_at', 'annule_par_id', 'motif_annulation', 'created_at', 'updated_at',
        ]));
        $this->assertSame('decimal', Schema::getColumnType('reservation_paiements', 'montant'));
        $this->assertSame('RESTRICT', $this->foreignDeleteRule('reservation_paiements', 'reservation_id'));
        $this->assertSame('RESTRICT', $this->foreignDeleteRule('reservation_paiements', 'mode_paiement_id'));
        $this->assertSame('SET NULL', $this->foreignDeleteRule('reservation_paiements', 'user_id'));
        $this->assertSame('SET NULL', $this->foreignDeleteRule('reservation_paiements', 'annule_par_id'));

        $reservation = $this->createPayableReservation('100.00');
        $modeId = $this->createPaymentMode();
        $userId = DB::table('users')->insertGetId([
            'name' => 'Agent paiement',
            'email' => 'pay-'.uniqid().'@example.test',
            'password' => bcrypt('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $valid = $this->insertPayment($reservation->id, $modeId, '40.25', ['user_id' => $userId]);
        $cancelled = $this->insertPayment($reservation->id, $modeId, '10.00', [
            'statut' => ReservationPaiement::STATUS_ANNULE,
            'annule_par_id' => $userId,
        ]);

        $model = ReservationPaiement::findOrFail($valid);
        $this->assertSame(ReservationPaiement::TYPE_ACOMPTE, 'acompte');
        $this->assertSame(ReservationPaiement::TYPE_REGLEMENT, 'reglement');
        $this->assertSame(ReservationPaiement::STATUS_VALIDE, 'valide');
        $this->assertSame('40.25', $model->montant);
        $this->assertSame([$valid], ReservationPaiement::query()
            ->where('reservation_id', $reservation->id)->valide()->pluck('id')->all());
        $this->assertSame([$cancelled], ReservationPaiement::query()
            ->where('reservation_id', $reservation->id)->annule()->pluck('id')->all());

        $duplicate = array_merge(
            ReservationPaiement::findOrFail($valid)->only([
                'paiement_num', 'reservation_id', 'mode_paiement_id', 'type_paiement',
                'montant', 'date_paiement', 'statut',
            ]),
            ['created_at' => now(), 'updated_at' => now()]
        );
        $this->expectException(QueryException::class);
        DB::table('reservation_paiements')->insert($duplicate);
    }

    public function test_payment_options_and_partial_then_final_payment_summary(): void
    {
        $cashId = $this->createPaymentMode('Espèces');
        $cardId = $this->createPaymentMode('Carte bancaire');
        $reservation = $this->createPayableReservation('1000.00');

        $this->getJson('/api/reservations/payment-options')
            ->assertOk()
            ->assertJsonFragment(['id' => $cardId, 'label' => 'Carte bancaire'])
            ->assertJsonFragment(['id' => $cashId, 'label' => 'Espèces']);

        $first = $this->postJson("/api/reservations/{$reservation->id}/payments", $this->paymentPayload($cashId, '300.00', 'acompte'))
            ->assertCreated()
            ->assertJsonPath('data.reglement.montant_paye', '300.00')
            ->assertJsonPath('data.reglement.reste_a_payer', '700.00')
            ->assertJsonPath('data.reglement.statut', 'partiellement_payee')
            ->assertJsonPath('data.paiement.type_label', 'Acompte');
        $this->assertMatchesRegularExpression('/^PAY-\d{8}-[A-Z0-9]{6}$/', $first->json('data.paiement.numero'));

        $second = $this->postJson("/api/reservations/{$reservation->id}/payments", $this->paymentPayload($cardId, '250.00'))
            ->assertCreated()
            ->assertJsonPath('data.reglement.montant_paye', '550.00')
            ->assertJsonPath('data.reglement.nombre_paiements', 2);
        $this->assertNotSame($first->json('data.paiement.numero'), $second->json('data.paiement.numero'));

        $this->postJson("/api/reservations/{$reservation->id}/payments", $this->paymentPayload($cardId, '450.00'))
            ->assertCreated()
            ->assertJsonPath('data.reglement.montant_paye', '1000.00')
            ->assertJsonPath('data.reglement.reste_a_payer', '0.00')
            ->assertJsonPath('data.reglement.statut', 'payee');

        $this->postJson("/api/reservations/{$reservation->id}/payments", $this->paymentPayload($cashId, '1.00'))
            ->assertUnprocessable()
            ->assertJsonPath('field', 'montant');
        $this->assertSame('en attente', $reservation->fresh()->status);
    }

    public function test_payment_creation_validation_and_reservation_state_rules(): void
    {
        $modeId = $this->createPaymentMode();
        $reservation = $this->createPayableReservation('100.00');
        $url = "/api/reservations/{$reservation->id}/payments";

        foreach (['0', '-1'] as $amount) {
            $this->postJson($url, $this->paymentPayload($modeId, $amount))
                ->assertUnprocessable()
                ->assertJsonValidationErrors('montant');
        }
        $this->postJson($url, $this->paymentPayload(999999999, '10.00'))
            ->assertUnprocessable()->assertJsonValidationErrors('mode_paiement_id');
        $this->postJson($url, $this->paymentPayload($modeId, '10.00', 'incorrect'))
            ->assertCreated()
            ->assertJsonPath('data.paiement.type', ReservationPaiement::TYPE_ACOMPTE);
        $this->postJson($url, array_merge($this->paymentPayload($modeId, '10.00'), [
            'date_paiement' => now()->addDay()->toDateString(),
        ]))->assertUnprocessable()->assertJsonValidationErrors('date_paiement');
        $this->postJson($url, array_merge($this->paymentPayload($modeId, '10.00'), [
            'date_paiement' => now()->subDay()->toDateString(),
        ]))->assertUnprocessable()->assertJsonValidationErrors('date_paiement');
        $this->postJson($url, $this->paymentPayload($modeId, '100.01'))
            ->assertUnprocessable()->assertJsonPath('field', 'montant');

        $reservation->update(['status' => 'annulé']);
        $this->postJson($url, $this->paymentPayload($modeId, '10.00'))
            ->assertStatus(409)
            ->assertJsonPath('code', 'cancelled_reservation_payment');

        $zeroTotal = $this->createPayableReservation('0.00');
        $this->postJson("/api/reservations/{$zeroTotal->id}/payments", $this->paymentPayload($modeId, '1.00'))
            ->assertStatus(409)
            ->assertJsonPath('code', 'reservation_total_unavailable');
    }

    public function test_cancelling_an_entry_preserves_history_and_recalculates_balance(): void
    {
        $creator = User::factory()->create();
        $canceller = User::factory()->create();
        $modeId = $this->createPaymentMode();
        $reservation = $this->createPayableReservation('500.00');

        $this->actingAs($creator);
        $created = $this->postJson(
            "/api/reservations/{$reservation->id}/payments",
            $this->paymentPayload($modeId, '200.00')
        )->assertCreated();
        $paymentId = $created->json('data.paiement.id');

        $this->actingAs($canceller);
        $this->patchJson("/api/reservations/{$reservation->id}/payments/{$paymentId}/cancel", [
            'motif_annulation' => 'Erreur de saisie',
        ])->assertOk()
            ->assertJsonPath('data.paiement.statut', 'annule')
            ->assertJsonPath('data.reglement.montant_paye', '0.00')
            ->assertJsonPath('data.reglement.reste_a_payer', '500.00');

        $this->assertDatabaseHas('reservation_paiements', [
            'id' => $paymentId,
            'statut' => 'annule',
            'user_id' => $creator->id,
            'annule_par_id' => $canceller->id,
            'motif_annulation' => 'Erreur de saisie',
        ]);
        $this->assertNotNull(ReservationPaiement::findOrFail($paymentId)->annule_at);
        $this->patchJson("/api/reservations/{$reservation->id}/payments/{$paymentId}/cancel", [
            'motif_annulation' => 'Deuxième annulation',
        ])->assertStatus(409);
        $this->patchJson("/api/reservations/{$reservation->id}/payments/{$paymentId}/cancel", [
            'motif_annulation' => ' ',
        ])->assertUnprocessable()->assertJsonValidationErrors('motif_annulation');

        $otherReservation = $this->createPayableReservation('50.00');
        $this->patchJson("/api/reservations/{$otherReservation->id}/payments/{$paymentId}/cancel", [
            'motif_annulation' => 'Mauvaise réservation',
        ])->assertNotFound();
        $this->putJson("/api/reservations/{$reservation->id}/payments/{$paymentId}", [])->assertNotFound();
        $this->deleteJson("/api/reservations/{$reservation->id}/payments/{$paymentId}")->assertNotFound();

        $this->deleteJson("/api/mode-paimants/{$modeId}")->assertStatus(409);
        $creator->delete();
        $canceller->delete();
        $this->assertDatabaseHas('reservation_paiements', [
            'id' => $paymentId,
            'user_id' => null,
            'annule_par_id' => null,
        ]);
    }

    public function test_reservation_update_respects_paid_total_and_cancellation_preserves_payments(): void
    {
        $client = $this->createCompanyClient();
        $type = $this->createRoomType(3, 0);
        $room = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type, [
            'prix_1_personne' => '50.00',
            'prix_2_personnes' => '100.00',
            'prix_3_personnes' => '150.00',
        ]);
        $this->createPeriod('2098-01-01', '2098-01-31', $grid);
        $payload = $this->reservationPayload($client->id, $room->id, 2);
        $created = $this->postJson('/api/reservations', $payload)->assertCreated();
        $reservationId = $created->json('data.id');
        unset($payload['status']);
        $modeId = $this->createPaymentMode();
        $payment = $this->postJson(
            "/api/reservations/{$reservationId}/payments",
            $this->paymentPayload($modeId, '100.00')
        )->assertCreated();
        $paymentId = $payment->json('data.paiement.id');

        $greater = $payload;
        $greater['chambres'][0]['adultes'] = 3;
        $this->putJson("/api/reservations/{$reservationId}", $greater)
            ->assertOk()->assertJsonPath('data.totals.total', '150.00')
            ->assertJsonPath('data.reglement.reste_a_payer', '50.00');

        $this->putJson("/api/reservations/{$reservationId}", $payload)
            ->assertOk()->assertJsonPath('data.totals.total', '100.00')
            ->assertJsonPath('data.reglement.statut', 'payee');

        $lower = $payload;
        $lower['chambres'][0]['adultes'] = 1;
        $this->putJson("/api/reservations/{$reservationId}", $lower)
            ->assertStatus(409)
            ->assertJsonPath('code', 'reservation_total_below_paid_amount');
        $this->assertDatabaseHas('reservations', ['id' => $reservationId, 'montant_total' => '100.00']);
        $this->assertDatabaseHas('reservation_paiements', ['id' => $paymentId, 'montant' => '100.00', 'statut' => 'valide']);

        $this->patchJson("/api/reservations/{$reservationId}/status", [
            'status' => 'annulé',
            'cancellation_reason' => 'Annulation avec paiement',
        ])->assertOk()->assertJsonPath('data.reglement.montant_paye', '100.00');
        $this->postJson("/api/reservations/{$reservationId}/payments", $this->paymentPayload($modeId, '1.00'))
            ->assertStatus(409);
        $this->patchJson("/api/reservations/{$reservationId}/payments/{$paymentId}/cancel", [
            'motif_annulation' => 'Saisie incorrecte',
        ])->assertOk()->assertJsonPath('data.reglement.montant_paye', '0.00');
    }

    public function test_resources_audit_history_and_deletion_protections(): void
    {
        $user = User::factory()->create();
        $modeId = $this->createPaymentMode();
        $freeModeId = $this->createPaymentMode('Mode libre');
        $reservation = $this->createPayableReservation('250.00');
        $this->actingAs($user);
        $created = $this->postJson(
            "/api/reservations/{$reservation->id}/payments",
            $this->paymentPayload($modeId, '75.00')
        )->assertCreated();
        $paymentId = $created->json('data.paiement.id');

        $listItem = collect($this->getJson('/api/reservations')->assertOk()->json('data'))
            ->firstWhere('id', $reservation->id);
        $this->assertSame('75.00', $listItem['reglement']['montant_paye']);
        $this->assertArrayNotHasKey('paiements', $listItem);

        $this->getJson("/api/reservations/{$reservation->id}")
            ->assertOk()
            ->assertJsonPath('data.reglement.statut', 'partiellement_payee')
            ->assertJsonPath('data.paiements.0.id', $paymentId)
            ->assertJsonMissingPath('data.paiements.0.created_by.email');

        $this->deleteJson("/api/mode-paimants/{$modeId}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Ce mode de paiement ne peut pas être supprimé car il est utilisé par un paiement de réservation.');
        $this->deleteJson("/api/mode-paimants/{$freeModeId}")->assertNoContent();

        $user->delete();
        $this->assertDatabaseHas('reservation_paiements', ['id' => $paymentId, 'user_id' => null]);

        try {
            DB::table('reservations')->where('id', $reservation->id)->delete();
            $this->fail('A reservation with payment history must not be physically deleted.');
        } catch (QueryException) {
            $this->assertDatabaseHas('reservations', ['id' => $reservation->id]);
            $this->assertDatabaseHas('reservation_paiements', ['id' => $paymentId]);
        }

        $paymentRoutes = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($route): bool => str_contains($route->uri(), 'reservations/{reservation}/payments'));
        $methods = $paymentRoutes->flatMap(fn ($route) => $route->methods())->unique()->values()->all();
        $this->assertNotContains('PUT', $methods);
        $this->assertNotContains('DELETE', $methods);
    }

    private function createPayableReservation(string $total, string $status = 'en attente'): Reservation
    {
        return Reservation::create([
            'reservation_num' => 'PAYTEST-'.uniqid(),
            'client_id' => 999999,
            'client_type' => 'societe',
            'reservation_date' => now()->toDateString(),
            'date_debut' => now()->addMonth()->toDateString(),
            'date_fin' => now()->addMonth()->addDay()->toDateString(),
            'status' => $status,
            'montant_total' => $total,
            'montant_reduction' => '0.00',
            'pricing_version' => 2,
            'legacy_pricing' => false,
        ]);
    }

    private function createPaymentMode(?string $label = null): int
    {
        return DB::table('mode_paimants')->insertGetId([
            'mode_paimants' => $label ?? 'Mode '.uniqid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertPayment(int $reservationId, int $modeId, string $amount, array $extra = []): int
    {
        return DB::table('reservation_paiements')->insertGetId(array_merge([
            'paiement_num' => 'PAY-'.now()->format('Ymd').'-'.strtoupper(substr(uniqid(), -6)),
            'reservation_id' => $reservationId,
            'mode_paiement_id' => $modeId,
            'type_paiement' => 'acompte',
            'montant' => $amount,
            'date_paiement' => now()->toDateString(),
            'statut' => 'valide',
            'created_at' => now(),
            'updated_at' => now(),
        ], $extra));
    }

    private function paymentPayload(int $modeId, string $amount, string $type = 'reglement'): array
    {
        return [
            'type_paiement' => $type,
            'mode_paiement_id' => $modeId,
            'montant' => $amount,
            'date_paiement' => now()->toDateString(),
            'reference' => 'REF-'.uniqid(),
            'commentaire' => 'Paiement de test',
        ];
    }

    private function reservationPayload(int $clientId, int $roomId, int $adults): array
    {
        return [
            'client_type' => 'societe',
            'client_id' => $clientId,
            'date_debut' => '2098-01-10',
            'date_fin' => '2098-01-11',
            'politique_paiement' => Reservation::POLICY_PAIEMENT_SUR_PLACE,
            'status' => 'en attente',
            'chambres' => [[
                'chambre_id' => $roomId,
                'adultes' => $adults,
                'enfants' => 0,
            ]],
            'repas' => [],
            'type_reduction_id' => null,
        ];
    }

    private function foreignDeleteRule(string $table, string $column): string
    {
        if (DB::getDriverName() === 'sqlite') {
            $foreignKeys = DB::select("PRAGMA foreign_key_list('{$table}')");
            $foreign = collect($foreignKeys)->firstWhere('from', $column);

            return strtoupper((string) ($foreign->on_delete ?? ''));
        }

        return strtoupper((string) DB::table('information_schema.KEY_COLUMN_USAGE as kcu')
            ->join('information_schema.REFERENTIAL_CONSTRAINTS as rc', function ($join): void {
                $join->on('rc.CONSTRAINT_SCHEMA', '=', 'kcu.CONSTRAINT_SCHEMA')
                    ->on('rc.CONSTRAINT_NAME', '=', 'kcu.CONSTRAINT_NAME');
            })
            ->where('kcu.CONSTRAINT_SCHEMA', DB::getDatabaseName())
            ->where('kcu.TABLE_NAME', $table)
            ->where('kcu.COLUMN_NAME', $column)
            ->value('rc.DELETE_RULE'));
    }
}
