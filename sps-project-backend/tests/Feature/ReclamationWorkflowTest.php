<?php

namespace Tests\Feature;

use App\Models\Reclamation;
use App\Models\ReclamationCanal;
use App\Models\ReclamationType;
use App\Models\Reservation;
use App\Models\ReservationRoom;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReclamationWorkflowTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    protected bool $authenticateApiRequests = false;

    public function test_normalized_schema_foreign_keys_and_legacy_rows_are_preserved(): void
    {
        $this->assertTrue(Schema::hasColumns('reclamations', [
            'reclamation_num', 'reservation_id', 'client_type', 'client_id',
            'client_name_snapshot', 'chambre_id', 'reclamation_type_id', 'description',
            'reclamation_canal_id', 'canal_precision', 'date_reclamation',
            'departement_id', 'priorite', 'suivi', 'reponse', 'resolved_at',
            'cancelled_at', 'cancellation_reason', 'created_by', 'updated_by',
        ]));
        $this->assertTrue(Schema::hasColumns('reclamation_historique', [
            'type_evenement', 'ancien_statut', 'nouveau_statut', 'description', 'user_id',
        ]));
        $this->assertTrue(Schema::hasTable('reclamation_types'));
        $this->assertTrue(Schema::hasTable('reclamation_canaux'));
        $this->assertSame('SET NULL', $this->foreignDeleteRule('reclamations', 'reservation_id'));
        $this->assertSame('SET NULL', $this->foreignDeleteRule('reclamations', 'chambre_id'));
        $this->assertSame('RESTRICT', $this->foreignDeleteRule('reclamations', 'reclamation_type_id'));
        $this->assertSame('RESTRICT', $this->foreignDeleteRule('reclamations', 'reclamation_canal_id'));
        $this->assertSame('RESTRICT', $this->foreignDeleteRule('reclamations', 'departement_id'));
        $this->assertSame('SET NULL', $this->foreignDeleteRule('reclamations', 'created_by'));

        DB::table('reclamations')->whereNotNull('type_reclamation')->get()->each(function ($row): void {
            $this->assertNotNull($row->reclamation_type_id);
            $this->assertNotNull($row->reclamation_canal_id);
            $this->assertNotNull($row->reclamation_num);
            $this->assertSame($row->date, $row->date_reclamation);
        });
        DB::table('reclamation_historique')->get()->each(
            fn ($row) => $this->assertNotNull($row->type_evenement)
        );
    }

    public function test_mutations_require_authentication_and_no_hard_delete_routes_exist(): void
    {
        $fixtures = $this->fixtures();
        $this->postJson('/api/reclamations', $this->payload($fixtures))->assertUnauthorized();
        $this->postJson('/api/reclamation-types', ['nom' => 'Non autorisé'])->assertUnauthorized();

        $routes = collect(Route::getRoutes()->getRoutes());
        $this->assertFalse($routes->contains(fn ($route): bool =>
            in_array('DELETE', $route->methods(), true)
            && (str_starts_with($route->uri(), 'api/reclamations')
                || str_starts_with($route->uri(), 'api/reclamation-'))
        ));
    }

    public function test_complaint_reads_and_lookup_lists_require_authentication(): void
    {
        $fixtures = $this->fixtures();
        $room = $this->createRoom(null, 'AUTH-'.uniqid());
        $reservation = $this->createBlockingReservation(
            $room,
            now()->toDateString(),
            now()->addDay()->toDateString()
        );
        $complaint = Reclamation::create([
            'reclamation_num' => 'REC-AUTH-'.uniqid(),
            'reclamation_type_id' => $fixtures['type']->id,
            'description' => 'Réclamation protégée par authentification',
            'reclamation_canal_id' => $fixtures['channel']->id,
            'date_reclamation' => now()->toDateString(),
            'departement_id' => $fixtures['department_id'],
            'priorite' => 'normale',
            'suivi' => Reclamation::STATUS_PENDING,
        ]);

        $this->getJson('/api/reclamations')->assertUnauthorized();
        $this->getJson("/api/reclamations/{$complaint->id}")->assertUnauthorized();
        $this->getJson('/api/reclamations/form-options')->assertUnauthorized();
        $this->getJson("/api/reclamations/reservations/{$reservation->id}/context")->assertUnauthorized();
        $this->getJson('/api/reclamation-types')->assertUnauthorized();
        $this->getJson('/api/reclamation-canaux')->assertUnauthorized();
        $this->getJson('/api/reclamation-departements')->assertUnauthorized();
    }

    public function test_form_options_only_include_active_references_and_list_excludes_history(): void
    {
        $fixtures = $this->fixtures();
        $inactive = ReclamationType::create(['nom' => 'Type inactif '.uniqid(), 'actif' => false]);
        $this->authenticate();
        $created = $this->postJson('/api/reclamations', $this->payload($fixtures))->assertCreated();

        $options = $this->getJson('/api/reclamations/form-options')->assertOk();
        $this->assertContains($fixtures['type']->id, collect($options->json('data.types'))->pluck('id')->all());
        $this->assertNotContains($inactive->id, collect($options->json('data.types'))->pluck('id')->all());

        $row = collect($this->getJson('/api/reclamations')->assertOk()->json('data'))
            ->firstWhere('id', $created->json('data.id'));
        $this->assertArrayNotHasKey('historique', $row);
        $this->assertSame(1, $row['historique_count']);
        $this->assertSame('En attente', $row['statut']);
    }

    public function test_same_numeric_client_id_resolves_particulier_and_societe_without_confusion(): void
    {
        $fixtures = $this->fixtures();
        $id = max((int) DB::table('clients')->max('id'), (int) DB::table('clients_particulier')->max('id')) + 1000;
        DB::table('clients')->insert([
            'id' => $id, 'CodeClient' => 'SOC-SAME-'.$id, 'raison_sociale' => 'Société Même ID',
            'adresse' => 'Test', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('clients_particulier')->insert([
            'id' => $id, 'CodeClient' => 'PAR-SAME-'.$id, 'name' => 'Invité', 'prenom' => 'Même ID',
            'cin' => 'DOC-'.$id, 'civilite' => 'M.', 'nationalite' => 'Marocaine',
            'adresse' => 'Test', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->authenticate();

        $company = $this->postJson('/api/reclamations', $this->payload($fixtures, [
            'client_type' => 'societe', 'client_id' => $id,
        ]))->assertCreated();
        $individual = $this->postJson('/api/reclamations', $this->payload($fixtures, [
            'client_type' => 'particulier', 'client_id' => $id,
        ]))->assertCreated();

        $this->assertSame('Société Même ID', $company->json('data.client.display_name'));
        $this->assertSame('Invité Même ID', $individual->json('data.client.display_name'));
        $this->assertSame('societe', $company->json('data.client.type'));
        $this->assertSame('particulier', $individual->json('data.client.type'));
        $this->assertDatabaseHas('reclamations', ['id' => $company->json('data.id'), 'client_name_snapshot' => 'Société Même ID']);
        $this->assertDatabaseHas('reclamations', ['id' => $individual->json('data.id'), 'client_name_snapshot' => 'Invité Même ID']);
    }

    public function test_reservation_derives_client_and_only_accepts_a_room_from_that_reservation(): void
    {
        $fixtures = $this->fixtures();
        $client = $this->createIndividualClient('Client', 'Réservation');
        $room = $this->createRoom(null, 'R-OK-'.uniqid());
        $otherRoom = $this->createRoom(null, 'R-NON-'.uniqid());
        $reservation = Reservation::create([
            'reservation_num' => 'RES-'.uniqid(), 'client_id' => $client->id,
            'client_type' => 'particulier', 'client_name_snapshot' => 'Client Réservation',
            'reservation_date' => now()->toDateString(), 'date_debut' => now()->toDateString(),
            'date_fin' => now()->addDay()->toDateString(), 'status' => 'en attente',
            'montant_total' => 0, 'montant_reduction' => 0, 'pricing_version' => 2,
            'legacy_pricing' => false,
        ]);
        ReservationRoom::create([
            'reservation_id' => $reservation->id, 'chambre_id' => $room->id,
            'adultes' => 1, 'enfants' => 0, 'lits_supplementaires' => 0,
            'tarif_par_nuit' => 0, 'montant_total' => 0,
        ]);
        $this->authenticate();

        $created = $this->postJson('/api/reclamations', $this->payload($fixtures, [
            'reservation_id' => $reservation->id,
            'client_type' => 'societe',
            'client_id' => 999999,
            'chambre_id' => $room->id,
        ]))->assertCreated();
        $created->assertJsonPath('data.client.type', 'particulier')
            ->assertJsonPath('data.client.display_name', 'Client Réservation')
            ->assertJsonPath('data.chambre.id', $room->id);

        $this->postJson('/api/reclamations', $this->payload($fixtures, [
            'reservation_id' => $reservation->id, 'chambre_id' => $otherRoom->id,
        ]))->assertUnprocessable()->assertJsonPath('field', 'chambre_id');
    }

    public function test_creation_validation_channel_precision_and_generated_number(): void
    {
        $fixtures = $this->fixtures();
        $other = ReclamationCanal::create(['nom' => 'Autre test '.uniqid(), 'est_autre' => true, 'actif' => true]);
        $this->authenticate();

        $this->postJson('/api/reclamations', $this->payload($fixtures, [
            'reclamation_canal_id' => $other->id,
        ]))->assertUnprocessable()->assertJsonPath('field', 'canal_precision');
        $this->postJson('/api/reclamations', $this->payload($fixtures, [
            'date_reclamation' => now()->addDay()->toDateString(),
        ]))->assertUnprocessable()->assertJsonValidationErrors('date_reclamation');
        $this->postJson('/api/reclamations', $this->payload($fixtures, [
            'suivi' => 'Résolu', 'reponse' => 'Interdite', 'reclamation_num' => 'MANUEL',
        ]))->assertUnprocessable()->assertJsonValidationErrors(['suivi', 'reponse', 'reclamation_num']);

        $created = $this->postJson('/api/reclamations', $this->payload($fixtures, [
            'canal_precision' => 'Cette valeur doit être effacée',
        ]))->assertCreated();
        $this->assertMatchesRegularExpression('/^REC-\d{8}-[A-Z0-9]{6}$/', $created->json('data.numero'));
        $this->assertNull($created->json('data.canal.precision'));
        $this->assertSame(1, DB::table('reclamation_historique')->where('reclamation_id', $created->json('data.id'))->where('type_evenement', 'creation')->count());
    }

    public function test_update_history_is_meaningful_and_no_op_creates_nothing(): void
    {
        $fixtures = $this->fixtures();
        $this->authenticate();
        $created = $this->postJson('/api/reclamations', $this->payload($fixtures))->assertCreated();
        $id = $created->json('data.id');
        $before = DB::table('reclamation_historique')->where('reclamation_id', $id)->count();

        $this->putJson("/api/reclamations/{$id}", $this->payload($fixtures))->assertOk();
        $this->assertSame($before, DB::table('reclamation_historique')->where('reclamation_id', $id)->count());

        $newDepartment = $this->department('Nouveau service '.uniqid());
        $this->putJson("/api/reclamations/{$id}", $this->payload($fixtures, [
            'description' => 'Description réellement modifiée',
            'departement_id' => $newDepartment,
        ]))->assertOk();
        $events = DB::table('reclamation_historique')->where('reclamation_id', $id)->pluck('type_evenement')->all();
        $this->assertSame(1, collect($events)->filter(fn ($event) => $event === 'modification')->count());
        $this->assertSame(1, collect($events)->filter(fn ($event) => $event === 'affectation')->count());
    }

    public function test_lifecycle_response_reopening_resolution_and_cancellation_rules(): void
    {
        $fixtures = $this->fixtures();
        $this->authenticate();
        $id = $this->postJson('/api/reclamations', $this->payload($fixtures))->assertCreated()->json('data.id');

        $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'Résolu'])
            ->assertConflict();
        $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'En cours'])
            ->assertOk()->assertJsonPath('data.statut', 'En cours');
        $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'Traité'])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'response_required')
            ->assertJsonPath('field', 'reponse');
        $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'Traité', 'reponse' => 'Action terminée'])
            ->assertOk()->assertJsonPath('data.statut', 'Traité');
        DB::table('reclamations')->where('id', $id)->update(['reponse' => null]);
        $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'Résolu'])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'response_required')
            ->assertJsonPath('field', 'reponse');
        DB::table('reclamations')->where('id', $id)->update(['reponse' => 'Action terminée']);
        $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'En cours'])
            ->assertUnprocessable()->assertJsonPath('field', 'note');
        $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'En cours', 'note' => 'Contrôle complémentaire'])
            ->assertOk();
        $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'Traité', 'reponse' => 'Action confirmée'])
            ->assertOk();
        $resolved = $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'Résolu'])
            ->assertOk()->assertJsonPath('data.statut', 'Résolu');
        $this->assertNotNull($resolved->json('data.resolved_at'));
        $this->patchJson("/api/reclamations/{$id}/status", ['statut' => 'En cours'])->assertConflict();

        $cancelId = $this->postJson('/api/reclamations', $this->payload($fixtures))->assertCreated()->json('data.id');
        $this->patchJson("/api/reclamations/{$cancelId}/cancel", ['motif' => 'x'])->assertUnprocessable();
        $cancelled = $this->patchJson("/api/reclamations/{$cancelId}/cancel", ['motif' => 'Réclamation créée en double'])
            ->assertOk()->assertJsonPath('data.statut', 'Annulé');
        $this->assertNotNull($cancelled->json('data.cancellation.cancelled_at'));
        $this->assertDatabaseHas('reclamation_historique', ['reclamation_id' => $cancelId, 'type_evenement' => 'annulation']);
    }

    public function test_lookup_management_unique_and_activation_contract(): void
    {
        $this->authenticate();
        $name = 'Type géré '.uniqid();
        $created = $this->postJson('/api/reclamation-types', [
            'nom' => $name, 'priorite_par_defaut' => 'urgente',
        ])->assertCreated();
        $id = $created->json('data.id');
        $this->postJson('/api/reclamation-types', ['nom' => $name])->assertUnprocessable();
        $this->putJson("/api/reclamation-types/{$id}", [
            'nom' => $name.' modifié', 'priorite_par_defaut' => 'elevee',
        ])->assertOk()->assertJsonPath('data.priorite_par_defaut', 'elevee');
        $this->patchJson("/api/reclamation-types/{$id}/active", ['actif' => false])
            ->assertOk()->assertJsonPath('data.actif', false);
        $this->assertNotContains($id, collect($this->getJson('/api/reclamations/form-options')->json('data.types'))->pluck('id')->all());
        $this->patchJson("/api/reclamation-types/{$id}/active", ['actif' => true])
            ->assertOk()->assertJsonPath('data.actif', true);
    }

    private function fixtures(): array
    {
        $departmentId = $this->department('Réclamations test '.uniqid());
        return [
            'department_id' => $departmentId,
            'type' => ReclamationType::create([
                'nom' => 'Type test '.uniqid(), 'departement_par_defaut_id' => $departmentId,
                'priorite_par_defaut' => 'normale', 'actif' => true,
            ]),
            'channel' => ReclamationCanal::create([
                'nom' => 'Canal test '.uniqid(), 'est_autre' => false, 'actif' => true,
            ]),
        ];
    }

    private function payload(array $fixtures, array $overrides = []): array
    {
        return array_merge([
            'reservation_id' => null, 'client_type' => null, 'client_id' => null,
            'chambre_id' => null, 'reclamation_type_id' => $fixtures['type']->id,
            'description' => 'Description complète de la réclamation',
            'reclamation_canal_id' => $fixtures['channel']->id,
            'canal_precision' => null, 'date_reclamation' => now()->toDateString(),
            'departement_id' => $fixtures['department_id'], 'priorite' => 'normale',
        ], $overrides);
    }

    private function department(string $name): int
    {
        return DB::table('departements')->insertGetId([
            'nom' => $name, 'photo' => null, 'actif' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function authenticate(): void
    {
        Sanctum::actingAs(User::factory()->create());
    }

    private function foreignDeleteRule(string $table, string $column): ?string
    {
        return DB::table('information_schema.REFERENTIAL_CONSTRAINTS as rc')
            ->join('information_schema.KEY_COLUMN_USAGE as kcu', function ($join): void {
                $join->on('rc.CONSTRAINT_SCHEMA', '=', 'kcu.CONSTRAINT_SCHEMA')
                    ->on('rc.CONSTRAINT_NAME', '=', 'kcu.CONSTRAINT_NAME')
                    ->on('rc.TABLE_NAME', '=', 'kcu.TABLE_NAME');
            })
            ->where('rc.CONSTRAINT_SCHEMA', DB::getDatabaseName())
            ->where('rc.TABLE_NAME', $table)
            ->where('kcu.COLUMN_NAME', $column)
            ->value('rc.DELETE_RULE');
    }
}
