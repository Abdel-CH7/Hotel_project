<?php

namespace Tests\Feature;

use App\Exceptions\ReservationDomainException;
use App\Models\Client;
use App\Models\Reservation;
use App\Models\ReservationPaiement;
use App\Services\ReservationPolicyService;
use App\Support\ReservationPaymentData;
use App\Support\ReservationPolicyData;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationPaymentPolicyTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-07-17 10:00:00');
        CarbonImmutable::setTestNow('2026-07-17 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_policy_schema_constants_default_and_normalization_rules(): void
    {
        $this->assertTrue(Schema::hasColumns('reservations', [
            'politique_paiement', 'montant_acompte_requis', 'date_limite_paiement',
        ]));
        $this->assertSame('decimal', Schema::getColumnType('reservations', 'montant_acompte_requis'));
        $this->assertSame([
            Reservation::POLICY_PAIEMENT_SUR_PLACE,
            Reservation::POLICY_ACOMPTE_REQUIS,
            Reservation::POLICY_PAIEMENT_INTEGRAL,
            Reservation::POLICY_CREDIT_SOCIETE,
        ], Reservation::paymentPolicyCodes());

        $company = $this->company('20000.00', true, 30);
        $service = app(ReservationPolicyService::class);
        $client = ['client_type' => 'societe', 'client_id' => $company->id, 'client' => $company];
        $base = [
            'politique_paiement' => Reservation::POLICY_PAIEMENT_SUR_PLACE,
            'montant_acompte_requis' => '500.00',
            'date_limite_paiement' => '2026-07-20',
            'date_debut' => '2026-07-25',
            'date_fin' => '2026-07-27',
        ];

        $onsite = $service->normalize($base, $client, '2000.00', '2026-07-17');
        $this->assertNull($onsite['montant_acompte_requis']);
        $this->assertNull($onsite['date_limite_paiement']);

        $deposit = $service->normalize(array_merge($base, [
            'politique_paiement' => Reservation::POLICY_ACOMPTE_REQUIS,
        ]), $client, '2000.00', '2026-07-17');
        $this->assertSame('500.00', $deposit['montant_acompte_requis']);
        $this->assertSame('2026-07-20', $deposit['date_limite_paiement']);

        $full = $service->normalize(array_merge($base, [
            'politique_paiement' => Reservation::POLICY_PAIEMENT_INTEGRAL,
        ]), $client, '2000.00', '2026-07-17');
        $this->assertNull($full['montant_acompte_requis']);
        $this->assertSame('2026-07-20', $full['date_limite_paiement']);

        $credit = $service->normalize(array_merge($base, [
            'politique_paiement' => Reservation::POLICY_CREDIT_SOCIETE,
            'date_limite_paiement' => '1900-01-01',
        ]), $client, '2000.00', '2026-07-17');
        $this->assertSame('2026-08-26', $credit['date_limite_paiement']);
        $this->assertNull($credit['montant_acompte_requis']);

        $individual = $this->createIndividualClient();
        $this->assertDomainFailure(fn () => $service->normalize(
            array_merge($base, ['politique_paiement' => Reservation::POLICY_CREDIT_SOCIETE]),
            ['client_type' => 'particulier', 'client_id' => $individual->id, 'client' => null],
            '2000.00',
            '2026-07-17'
        ), 'politique_paiement');
        $this->assertDomainFailure(fn () => $service->normalize(
            array_merge($base, [
                'politique_paiement' => Reservation::POLICY_ACOMPTE_REQUIS,
                'montant_acompte_requis' => '2000.01',
            ]),
            $client,
            '2000.00',
            '2026-07-17'
        ), 'montant_acompte_requis');
        $this->assertDomainFailure(fn () => $service->normalize(
            array_merge($base, [
                'politique_paiement' => Reservation::POLICY_PAIEMENT_INTEGRAL,
                'date_limite_paiement' => '2026-07-26',
            ]),
            $client,
            '2000.00',
            '2026-07-17'
        ), 'date_limite_paiement');
    }

    public function test_create_and_update_persist_normalized_policy_fields(): void
    {
        $client = $this->company('20000.00', true, 30);
        $type = $this->createRoomType(2, 0);
        $room = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type);
        $this->createPeriod('2099-01-01', '2099-01-31', $grid);
        $payload = [
            'client_type' => 'societe',
            'client_id' => $client->id,
            'date_debut' => '2099-01-10',
            'date_fin' => '2099-01-12',
            'politique_paiement' => Reservation::POLICY_PAIEMENT_SUR_PLACE,
            'status' => 'en attente',
            'chambres' => [['chambre_id' => $room->id, 'adultes' => 1, 'enfants' => 0]],
            'repas' => [],
            'type_reduction_id' => null,
        ];

        $created = $this->postJson('/api/reservations', $payload)
            ->assertCreated()
            ->assertJsonPath('data.politique_paiement.code', Reservation::POLICY_PAIEMENT_SUR_PLACE)
            ->assertJsonPath('data.echeance.date', '2099-01-10');

        unset($payload['status']);
        $payload['politique_paiement'] = Reservation::POLICY_ACOMPTE_REQUIS;
        $payload['montant_acompte_requis'] = '50.00';
        $payload['date_limite_paiement'] = '2099-01-09';
        $this->putJson('/api/reservations/'.$created->json('data.id'), $payload)
            ->assertOk()
            ->assertJsonPath('data.politique_paiement.montant_acompte_requis', '50.00')
            ->assertJsonPath('data.politique_paiement.date_limite_paiement', '2099-01-09');
    }

    public function test_new_payment_types_are_derived_and_legacy_reglement_stays_readable(): void
    {
        $reservation = $this->reservation('societe', $this->company()->id, '1000.00');
        $mode = $this->paymentMode();
        $url = "/api/reservations/{$reservation->id}/payments";

        $this->postJson($url, $this->paymentPayload($mode, '300.00', ['type_paiement' => 'solde']))
            ->assertCreated()
            ->assertJsonPath('data.paiement.type', ReservationPaiement::TYPE_ACOMPTE);
        $this->postJson($url, $this->paymentPayload($mode, '200.00', ['type_paiement' => 'acompte']))
            ->assertCreated()
            ->assertJsonPath('data.paiement.type', ReservationPaiement::TYPE_PAIEMENT_PARTIEL);
        $this->postJson($url, $this->paymentPayload($mode, '500.00'))
            ->assertCreated()
            ->assertJsonPath('data.paiement.type', ReservationPaiement::TYPE_SOLDE)
            ->assertJsonPath('data.reglement.statut', ReservationPaymentData::STATUS_PAYEE);

        $legacy = $this->payment($reservation, $mode, '1.00', ReservationPaiement::TYPE_REGLEMENT, ReservationPaiement::STATUS_ANNULE);
        $this->getJson("/api/reservations/{$reservation->id}")
            ->assertOk()
            ->assertJsonFragment(['id' => $legacy->id, 'type' => 'reglement', 'type_label' => 'Règlement']);
    }

    public function test_confirmation_requirements_for_onsite_deposit_and_full_payment(): void
    {
        $client = $this->company();
        $mode = $this->paymentMode();

        $onsite = $this->reservation('societe', $client->id, '1000.00');
        $this->patchJson("/api/reservations/{$onsite->id}/status", ['status' => 'confirmé'])
            ->assertOk();

        $deposit = $this->reservation(
            'societe', $client->id, '1000.00', Reservation::POLICY_ACOMPTE_REQUIS,
            'en attente', '2026-07-25', '2026-07-27', '500.00', '2026-07-20'
        );
        $this->payment($deposit, $mode, '300.00');
        $this->patchJson("/api/reservations/{$deposit->id}/status", ['status' => 'confirmé'])
            ->assertStatus(409)
            ->assertJsonPath('context.confirmation.montant_manquant', '200.00');
        $this->payment($deposit, $mode, '200.00', ReservationPaiement::TYPE_PAIEMENT_PARTIEL);
        $this->patchJson("/api/reservations/{$deposit->id}/status", ['status' => 'confirmé'])
            ->assertOk();

        $full = $this->reservation(
            'societe', $client->id, '1000.00', Reservation::POLICY_PAIEMENT_INTEGRAL,
            'en attente', '2026-07-25', '2026-07-27', null, '2026-07-20'
        );
        $this->payment($full, $mode, '999.00');
        $this->patchJson("/api/reservations/{$full->id}/status", ['status' => 'confirmé'])
            ->assertStatus(409);
        $this->payment($full, $mode, '1.00', ReservationPaiement::TYPE_SOLDE);
        $this->patchJson("/api/reservations/{$full->id}/status", ['status' => 'confirmé'])
            ->assertOk();
    }

    public function test_credit_exposure_confirmation_endpoint_and_shared_ceiling(): void
    {
        $company = $this->company('20000.00', true, 30);
        if (! DB::table('clients_particulier')->where('id', $company->id)->exists()) {
            DB::table('clients_particulier')->insert([
                'id' => $company->id,
                'CodeClient' => 'PAR-SAME-'.$company->id,
                'name' => 'Même',
                'prenom' => 'Identifiant',
                'cin' => 'CIN-SAME-'.$company->id,
                'civilite' => 'M.',
                'nationalite' => 'Marocaine',
                'adresse' => 'Adresse test',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        $existing = $this->reservation(
            'societe', $company->id, '12000.00', Reservation::POLICY_CREDIT_SOCIETE, 'confirmé'
        );
        $this->reservation(
            'particulier', $company->id, '50000.00', Reservation::POLICY_CREDIT_SOCIETE, 'confirmé'
        );
        $this->reservation(
            'societe', $company->id, '50000.00', Reservation::POLICY_PAIEMENT_SUR_PLACE, 'confirmé'
        );
        $this->reservation(
            'societe', $company->id, '50000.00', Reservation::POLICY_CREDIT_SOCIETE, 'annulé'
        );

        $this->getJson("/api/reservations/societes/{$company->id}/credit-summary")
            ->assertOk()
            ->assertJsonPath('data.exposition_actuelle', '12000.00')
            ->assertJsonPath('data.credit_disponible', '8000.00')
            ->assertJsonPath('data.configuration_complete', true);

        $within = $this->reservation(
            'societe', $company->id, '6000.00', Reservation::POLICY_CREDIT_SOCIETE
        );
        $this->patchJson("/api/reservations/{$within->id}/status", ['status' => 'confirmé'])
            ->assertOk()
            ->assertJsonPath('data.credit.exposition_projetee', '18000.00');

        $above = $this->reservation(
            'societe', $company->id, '3000.00', Reservation::POLICY_CREDIT_SOCIETE
        );
        $this->patchJson("/api/reservations/{$above->id}/status", ['status' => 'confirmé'])
            ->assertStatus(409)
            ->assertJsonPath('context.confirmation.code', 'plafond_credit_depasse');

        $mode = $this->paymentMode();
        $this->payment($existing, $mode, '4000.00');
        $this->patchJson("/api/reservations/{$above->id}/status", ['status' => 'confirmé'])
            ->assertOk();
    }

    public function test_confirmed_credit_update_guard_and_payment_cancellation_warning_context(): void
    {
        $company = $this->company('10000.00', true, 30);
        $other = $this->reservation(
            'societe', $company->id, '6000.00', Reservation::POLICY_CREDIT_SOCIETE, 'confirmé'
        );
        $current = $this->reservation(
            'societe', $company->id, '5000.00', Reservation::POLICY_CREDIT_SOCIETE, 'confirmé'
        );
        $service = app(ReservationPolicyService::class);
        $resolution = ['client_type' => 'societe', 'client_id' => $company->id, 'client' => $company];
        $policy = [
            'politique_paiement' => Reservation::POLICY_CREDIT_SOCIETE,
            'montant_acompte_requis' => null,
            'date_limite_paiement' => '2026-08-26',
        ];

        DB::transaction(fn () => $service->assertConfirmedCreditUpdateAllowed(
            $current->fresh(), $resolution, $policy, '4000.00'
        ));
        $this->assertDomainFailure(fn () => DB::transaction(
            fn () => $service->assertConfirmedCreditUpdateAllowed(
                $current->fresh(), $resolution, $policy, '5000.00'
            )
        ), 'politique_paiement', 409);

        $mode = $this->paymentMode();
        $payment = $this->payment($other, $mode, '3000.00');
        $this->patchJson("/api/reservations/{$other->id}/payments/{$payment->id}/cancel", [
            'motif_annulation' => 'Correction de saisie',
        ])->assertOk();
        $this->getJson("/api/reservations/{$other->id}")
            ->assertOk()
            ->assertJsonPath('data.credit.depassement', true);
    }

    public function test_deadline_states_are_separate_from_balance_status(): void
    {
        $client = $this->company();
        $mode = $this->paymentMode();
        $reservation = $this->reservation(
            'societe', $client->id, '1000.00', Reservation::POLICY_ACOMPTE_REQUIS,
            'en attente', '2026-07-25', '2026-07-27', '500.00', '2026-07-20'
        );
        $this->payment($reservation, $mode, '300.00');
        $reservation = $reservation->fresh()->load('paiements');
        $summary = ReservationPaymentData::summary($reservation);
        $this->assertSame('partiellement_payee', $summary['statut']);
        $this->assertSame('a_jour', ReservationPolicyData::deadline($reservation, $summary)['statut']);

        Carbon::setTestNow('2026-07-20 10:00:00');
        CarbonImmutable::setTestNow('2026-07-20 10:00:00');
        $this->assertSame('du_aujourdhui', ReservationPolicyData::deadline($reservation, $summary)['statut']);
        Carbon::setTestNow('2026-07-21 10:00:00');
        CarbonImmutable::setTestNow('2026-07-21 10:00:00');
        $this->assertSame('en_retard', ReservationPolicyData::deadline($reservation, $summary)['statut']);

        $this->payment($reservation, $mode, '200.00', ReservationPaiement::TYPE_PAIEMENT_PARTIEL);
        $reservation = $reservation->fresh()->load('paiements');
        $next = ReservationPolicyData::deadline($reservation, ReservationPaymentData::summary($reservation));
        $this->assertSame('2026-07-25', $next['date']);
        $this->assertSame('a_jour', $next['statut']);

        $reservation->update(['status' => 'annulé']);
        $this->assertSame(
            'non_applicable',
            ReservationPolicyData::deadline($reservation->fresh()->load('paiements'), ReservationPaymentData::summary($reservation->fresh()->load('paiements')))['statut']
        );
    }

    public function test_policy_rejects_invalid_credit_and_deadline_configurations_and_keeps_legacy_default(): void
    {
        $service = app(ReservationPolicyService::class);
        $base = [
            'politique_paiement' => Reservation::POLICY_CREDIT_SOCIETE,
            'date_debut' => '2026-07-25',
            'date_fin' => '2026-07-27',
        ];
        $resolve = static fn (Client $company): array => [
            'client_type' => 'societe',
            'client_id' => $company->id,
            'client' => $company,
        ];

        $this->assertDomainFailure(fn () => $service->normalize(
            array_merge($base, ['politique_paiement' => 'inconnue']),
            $resolve($this->company()),
            '1000.00',
            '2026-07-17'
        ), 'politique_paiement');
        $this->assertDomainFailure(fn () => $service->normalize(
            $base,
            $resolve($this->company('20000.00', false, 30)),
            '1000.00',
            '2026-07-17'
        ), 'politique_paiement');
        $this->assertDomainFailure(fn () => $service->normalize(
            $base,
            $resolve($this->company(null, true, 30)),
            '1000.00',
            '2026-07-17'
        ), 'politique_paiement');
        $this->assertDomainFailure(fn () => $service->normalize(
            $base,
            $resolve($this->company('20000.00', true, null)),
            '1000.00',
            '2026-07-17'
        ), 'politique_paiement');

        foreach (['0.00', '-1.00'] as $invalidDeposit) {
            $this->assertDomainFailure(fn () => $service->normalize(
                array_merge($base, [
                    'politique_paiement' => Reservation::POLICY_ACOMPTE_REQUIS,
                    'montant_acompte_requis' => $invalidDeposit,
                    'date_limite_paiement' => '2026-07-20',
                ]),
                $resolve($this->company()),
                '1000.00',
                '2026-07-17'
            ), 'montant_acompte_requis');
        }

        $this->assertDomainFailure(fn () => $service->normalize(
            array_merge($base, [
                'politique_paiement' => Reservation::POLICY_ACOMPTE_REQUIS,
                'montant_acompte_requis' => '100.00',
                'date_limite_paiement' => '2026-07-16',
            ]),
            $resolve($this->company()),
            '1000.00',
            '2026-07-17'
        ), 'date_limite_paiement');
        $this->assertDomainFailure(fn () => $service->normalize(
            array_merge($base, [
                'politique_paiement' => Reservation::POLICY_PAIEMENT_INTEGRAL,
                'date_limite_paiement' => null,
            ]),
            $resolve($this->company()),
            '1000.00',
            '2026-07-17'
        ), 'date_limite_paiement');

        $legacyDefault = Reservation::create([
            'reservation_num' => 'RPOL-DEFAULT-'.strtoupper(substr(uniqid(), -6)),
            'client_type' => 'societe',
            'client_id' => $this->company()->id,
            'client_name_snapshot' => 'Client existant',
            'reservation_date' => '2026-07-17',
            'date_debut' => '2026-07-25',
            'date_fin' => '2026-07-27',
            'status' => 'en attente',
            'montant_total' => '1000.00',
            'montant_reduction' => '0.00',
            'pricing_version' => 2,
            'legacy_pricing' => false,
        ]);
        $this->assertSame(
            Reservation::POLICY_PAIEMENT_SUR_PLACE,
            $legacyDefault->fresh()->politique_paiement
        );
    }

    public function test_first_full_payment_is_solde_and_cancellation_does_not_reclassify_it(): void
    {
        $reservation = $this->reservation('societe', $this->company()->id, '750.00');
        $mode = $this->paymentMode();
        $payment = $this->postJson(
            "/api/reservations/{$reservation->id}/payments",
            $this->paymentPayload($mode, '750.00', ['type_paiement' => 'acompte'])
        )
            ->assertCreated()
            ->assertJsonPath('data.paiement.type', ReservationPaiement::TYPE_SOLDE)
            ->json('data.paiement');

        $this->patchJson(
            "/api/reservations/{$reservation->id}/payments/{$payment['id']}/cancel",
            ['motif_annulation' => 'Correction de saisie']
        )
            ->assertOk()
            ->assertJsonPath('data.paiement.type', ReservationPaiement::TYPE_SOLDE)
            ->assertJsonPath('data.reglement.statut', ReservationPaymentData::STATUS_NON_PAYEE);
    }

    public function test_cancelled_payment_does_not_reduce_credit_exposure(): void
    {
        $company = $this->company('10000.00', true, 30);
        $reservation = $this->reservation(
            'societe', $company->id, '6000.00', Reservation::POLICY_CREDIT_SOCIETE, 'confirmé'
        );
        $mode = $this->paymentMode();
        $this->payment($reservation, $mode, '5000.00', ReservationPaiement::TYPE_ACOMPTE, ReservationPaiement::STATUS_ANNULE);

        $this->getJson("/api/reservations/societes/{$company->id}/credit-summary")
            ->assertOk()
            ->assertJsonPath('data.exposition_actuelle', '6000.00');
    }

    public function test_confirmed_credit_guard_rechecks_new_company_and_preserves_existing_data_on_failure(): void
    {
        $originalCompany = $this->company('10000.00', true, 30);
        $newCompany = $this->company('3000.00', true, 30);
        $reservation = $this->reservation(
            'societe', $originalCompany->id, '5000.00', Reservation::POLICY_CREDIT_SOCIETE, 'confirmé'
        );
        $mode = $this->paymentMode();
        $payment = $this->payment($reservation, $mode, '1000.00');
        $policy = [
            'politique_paiement' => Reservation::POLICY_CREDIT_SOCIETE,
            'montant_acompte_requis' => null,
            'date_limite_paiement' => '2026-08-26',
        ];

        $this->assertDomainFailure(fn () => DB::transaction(
            fn () => app(ReservationPolicyService::class)->assertConfirmedCreditUpdateAllowed(
                $reservation->fresh(),
                ['client_type' => 'societe', 'client_id' => $newCompany->id, 'client' => $newCompany],
                $policy,
                '5000.00'
            )
        ), 'politique_paiement', 409);

        $this->assertSame($originalCompany->id, $reservation->fresh()->client_id);
        $this->assertSame('5000.00', $reservation->fresh()->montant_total);
        $this->assertSame(ReservationPaiement::STATUS_VALIDE, $payment->fresh()->statut);
    }

    public function test_frozen_deadline_matrix_for_onsite_full_credit_paid_and_cancelled_reservations(): void
    {
        $company = $this->company();
        $mode = $this->paymentMode();
        $onsite = $this->reservation(
            'societe', $company->id, '1000.00', Reservation::POLICY_PAIEMENT_SUR_PLACE,
            'en attente', '2026-07-20', '2026-07-22'
        );

        $this->assertDeadlineStatus($onsite, ReservationPolicyData::DEADLINE_A_JOUR);
        $this->freezeDate('2026-07-20');
        $this->assertDeadlineStatus($onsite, ReservationPolicyData::DEADLINE_DU_AUJOURDHUI);
        $this->freezeDate('2026-07-21');
        $this->assertDeadlineStatus($onsite, ReservationPolicyData::DEADLINE_EN_RETARD);

        $full = $this->reservation(
            'societe', $company->id, '1000.00', Reservation::POLICY_PAIEMENT_INTEGRAL,
            'en attente', '2026-07-25', '2026-07-27', null, '2026-07-19'
        );
        $this->assertDeadlineStatus($full, ReservationPolicyData::DEADLINE_EN_RETARD);

        $credit = $this->reservation(
            'societe', $company->id, '1000.00', Reservation::POLICY_CREDIT_SOCIETE,
            'confirmé', '2026-06-01', '2026-06-03'
        );
        $credit->update(['date_limite_paiement' => '2026-07-19']);
        $this->assertDeadlineStatus($credit, ReservationPolicyData::DEADLINE_EN_RETARD);

        $this->payment($full, $mode, '1000.00', ReservationPaiement::TYPE_SOLDE);
        $this->assertDeadlineStatus($full, ReservationPolicyData::DEADLINE_SOLDE_REGLE);
        $credit->update(['status' => 'annulé']);
        $this->assertDeadlineStatus($credit, ReservationPolicyData::DEADLINE_NON_APPLICABLE);
    }

    private function company(
        ?string $ceiling = '20000.00',
        bool $authorized = true,
        ?int $delay = 30
    ): Client {
        return Client::create([
            'CodeClient' => 'SOC-POL-'.uniqid(),
            'raison_sociale' => 'Société politique '.uniqid(),
            'adresse' => 'Adresse test',
            'credit_autorise' => $authorized,
            'plafond_credit' => $ceiling,
            'delai_paiement_jours' => $delay,
        ]);
    }

    private function reservation(
        string $clientType,
        int $clientId,
        string $total,
        string $policy = Reservation::POLICY_PAIEMENT_SUR_PLACE,
        string $status = 'en attente',
        string $start = '2026-07-25',
        string $end = '2026-07-27',
        ?string $deposit = null,
        ?string $deadline = null
    ): Reservation {
        return Reservation::create([
            'reservation_num' => 'RPOL-'.strtoupper(substr(uniqid(), -8)),
            'client_type' => $clientType,
            'client_id' => $clientId,
            'client_name_snapshot' => 'Client politique',
            'reservation_date' => '2026-07-17',
            'date_debut' => $start,
            'date_fin' => $end,
            'status' => $status,
            'montant_total' => $total,
            'montant_reduction' => '0.00',
            'pricing_version' => 2,
            'legacy_pricing' => false,
            'politique_paiement' => $policy,
            'montant_acompte_requis' => $deposit,
            'date_limite_paiement' => $policy === Reservation::POLICY_CREDIT_SOCIETE
                ? CarbonImmutable::parse($end)->addDays(30)->toDateString()
                : $deadline,
        ]);
    }

    private function paymentMode(): int
    {
        return DB::table('mode_paimants')->insertGetId([
            'mode_paimants' => 'Mode politique '.uniqid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function payment(
        Reservation $reservation,
        int $modeId,
        string $amount,
        string $type = ReservationPaiement::TYPE_ACOMPTE,
        string $status = ReservationPaiement::STATUS_VALIDE
    ): ReservationPaiement {
        return ReservationPaiement::create([
            'paiement_num' => 'PAY-TEST-'.strtoupper(substr(uniqid(), -8)),
            'reservation_id' => $reservation->id,
            'mode_paiement_id' => $modeId,
            'type_paiement' => $type,
            'montant' => $amount,
            'date_paiement' => '2026-07-17',
            'statut' => $status,
        ]);
    }

    private function paymentPayload(int $modeId, string $amount, array $extra = []): array
    {
        return array_merge([
            'mode_paiement_id' => $modeId,
            'montant' => $amount,
            'date_paiement' => '2026-07-17',
            'reference' => null,
            'commentaire' => null,
        ], $extra);
    }

    private function freezeDate(string $date): void
    {
        Carbon::setTestNow($date.' 10:00:00');
        CarbonImmutable::setTestNow($date.' 10:00:00');
    }

    private function assertDeadlineStatus(Reservation $reservation, string $expected): void
    {
        $loaded = $reservation->fresh()->load('paiements');
        $this->assertSame(
            $expected,
            ReservationPolicyData::deadline($loaded, ReservationPaymentData::summary($loaded))['statut']
        );
    }

    private function assertDomainFailure(
        callable $callback,
        ?string $field,
        int $status = 422
    ): void {
        try {
            $callback();
            $this->fail('Expected a ReservationDomainException.');
        } catch (ReservationDomainException $exception) {
            $this->assertSame($field, $exception->field);
            $this->assertSame($status, $exception->recommendedStatus);
        }
    }
}
