<?php

namespace Tests\Feature;

use App\Models\Chambre;
use App\Models\Employe;
use App\Models\EtatChambre;
use App\Models\MaintenanceType;
use App\Models\TypeChambre;
use App\Services\ReservationAvailabilityService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class ChambreTypeChambreApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_room_creation_accepts_type_id_and_alphanumeric_number_and_creates_state(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();

        $response = $this->postJson('/api/chambres', [
            'num_chambre' => ' 101A ',
            'type_chambre_id' => $type->id,
            'etage_id' => $floorId,
            'vue_id' => $viewId,
            'climat' => 'oui',
            'wifi' => 'non',
            'nb_lit' => 99,
            'nb_salle' => 99,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('chambre.num_chambre', '101A')
            ->assertJsonPath('chambre.type_chambre_id', $type->id)
            ->assertJsonPath('chambre.nb_lit', $type->nb_lit)
            ->assertJsonPath('chambre.nb_salle', $type->nb_salle)
            ->assertJsonPath('chambre.climat', true)
            ->assertJsonPath('chambre.wifi', false);

        $this->assertDatabaseHas('chambres', [
            'num_chambre' => '101A',
            'type_chambre_id' => $type->id,
        ]);
        $this->assertDatabaseHas('etat_chambre', [
            'num_chambre' => '101A',
            'status' => 'non nettoyée',
            'maintenance' => false,
        ]);
        $this->assertFalse(Schema::hasColumn('chambres', 'nb_lit'));
        $this->assertFalse(Schema::hasColumn('chambres', 'nb_salle'));
    }

    public function test_room_response_derives_capacities_and_type_edits_affect_all_rooms(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();
        $firstRoom = $this->createRoom($type, $floorId, $viewId, '201A');
        $secondRoom = $this->createRoom($type, $floorId, $viewId, '201B');

        $this->putJson("/api/types-chambre/{$type->id}", [
            'code' => $type->code,
            'type_chambre' => $type->type_chambre,
            'nb_lit' => 4,
            'nb_salle' => 2,
            'commentaire' => 'Capacite mise a jour',
        ])->assertOk();

        foreach ([$firstRoom, $secondRoom] as $room) {
            $this->getJson("/api/chambres/{$room->id}")
                ->assertOk()
                ->assertJsonPath('nb_lit', 4)
                ->assertJsonPath('nb_salle', 2)
                ->assertJsonPath('type_chambre.nb_lit', 4)
                ->assertJsonPath('type_chambre.nb_salle', 2);
        }
    }

    public function test_duplicate_type_code_and_name_are_rejected_case_insensitively(): void
    {
        $type = $this->createType('TC-CASE', 'Suite Test');

        $this->postJson('/api/types-chambre', [
            'code' => strtolower($type->code),
            'type_chambre' => 'Autre type',
            'nb_lit' => 1,
            'nb_salle' => 1,
        ])->assertUnprocessable()->assertJsonValidationErrors('code');

        $this->postJson('/api/types-chambre', [
            'code' => 'TC-OTHER-'.uniqid(),
            'type_chambre' => strtolower($type->type_chambre),
            'nb_lit' => 1,
            'nb_salle' => 1,
        ])->assertUnprocessable()->assertJsonValidationErrors('type_chambre');
    }

    public function test_deleting_type_used_by_room_is_blocked(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();
        $this->createRoom($type, $floorId, $viewId, '301A');

        $this->deleteJson("/api/types-chambre/{$type->id}")
            ->assertStatus(409)
            ->assertJsonPath(
                'message',
                'Ce type ne peut pas être supprimé car il est utilisé par des chambres.'
            );
    }

    public function test_deleting_type_used_by_tariff_is_blocked(): void
    {
        $type = $this->createType();
        $now = now();
        $tariffId = DB::table('tarifs_chambre')->insertGetId([
            'designation' => 'Tarif test '.uniqid(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('tarif_chambre_detail')->insert([
            'code' => 'TCD-'.uniqid(),
            'tarif_chambre_id' => $tariffId,
            'type_chambre_id' => $type->id,
            'prix_1_personne' => 100,
            'prix_2_personnes' => 150,
            'prix_3_personnes' => 200,
            'prix_lit_supplementaire' => 25,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->deleteJson("/api/types-chambre/{$type->id}")
            ->assertStatus(409)
            ->assertJsonPath(
                'message',
                'Ce type ne peut pas être supprimé car il est utilisé par des tarifs.'
            );
    }

    public function test_deleting_unused_type_succeeds(): void
    {
        $type = $this->createType();

        $this->deleteJson("/api/types-chambre/{$type->id}")->assertOk();

        $this->assertDatabaseMissing('types_chambre', ['id' => $type->id]);
    }

    public function test_deleting_room_used_by_reservation_is_blocked(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();
        $room = $this->createRoom($type, $floorId, $viewId, '401A');
        $now = now();
        $reservationId = DB::table('reservations')->insertGetId([
            'reservation_num' => 'RES-'.uniqid(),
            'client_id' => 1,
            'reservation_date' => '2026-07-14',
            'date_debut' => '2026-07-15',
            'date_fin' => '2026-07-16',
            'client_type' => 'particulier',
            'status' => 'confirmee',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('details_reservation')->insert([
            'reservation_id' => $reservationId,
            'chambre_id' => $room->id,
            'tarif_par_nuit' => 100,
            'montant_total' => 100,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->deleteJson("/api/chambres/{$room->id}")
            ->assertStatus(409)
            ->assertJsonPath(
                'message',
                'Cette chambre ne peut pas etre supprimee car elle est utilisee par des reservations.'
            );
    }

    public function test_updating_room_without_renaming_preserves_the_same_state(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();
        $room = $this->createRoom($type, $floorId, $viewId, '501A');
        $state = $room->etatChambre;
        $state->update([
            'status' => 'nettoyée',
            'date_nettoyage' => '2092-01-02',
            'commentaire' => 'Etat conserve',
        ]);

        $this->putJson("/api/chambres/{$room->id}", [
            'num_chambre' => '501A',
            'type_chambre_id' => $type->id,
            'etage_id' => $floorId,
            'vue_id' => $viewId,
            'climat' => false,
            'wifi' => true,
        ])->assertOk();

        $this->assertDatabaseHas('etat_chambre', [
            'id' => $state->id,
            'num_chambre' => '501A',
            'status' => 'nettoyée',
            'date_nettoyage' => '2092-01-02',
            'commentaire' => 'Etat conserve',
        ]);
        $this->assertSame(1, DB::table('etat_chambre')->where('num_chambre', '501A')->count());
    }

    public function test_renaming_room_preserves_all_operational_state_values(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();
        $room = $this->createRoom($type, $floorId, $viewId, '501A');
        $employee = $this->createEmployee();
        $maintenanceType = $this->createMaintenanceType();
        $state = $room->etatChambre;
        $state->update([
            'status' => 'nettoyée',
            'date_nettoyage' => '2092-02-01',
            'nettoyee_par_id' => $employee->id,
            'maintenance' => true,
            'maintenance_type_id' => $maintenanceType->id,
            'date_debut_maintenance' => '2092-02-02',
            'date_fin_maintenance' => '2092-02-05',
            'commentaire' => 'Maintenance planifiée',
        ]);

        $this->putJson("/api/chambres/{$room->id}", $this->roomPayload(
            $type,
            $floorId,
            $viewId,
            '501B'
        ))->assertOk();

        $this->assertDatabaseMissing('etat_chambre', ['num_chambre' => '501A']);
        $this->assertDatabaseHas('etat_chambre', [
            'id' => $state->id,
            'num_chambre' => '501B',
            'status' => 'nettoyée',
            'date_nettoyage' => '2092-02-01',
            'nettoyee_par_id' => $employee->id,
            'maintenance' => true,
            'maintenance_type_id' => $maintenanceType->id,
            'date_debut_maintenance' => '2092-02-02',
            'date_fin_maintenance' => '2092-02-05',
            'commentaire' => 'Maintenance planifiée',
        ]);
        $this->assertSame(1, DB::table('etat_chambre')->where('num_chambre', '501B')->count());
    }

    public function test_renamed_room_in_maintenance_remains_unavailable(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();
        $room = $this->createRoom($type, $floorId, $viewId, '601A');
        $room->etatChambre->update([
            'maintenance' => true,
            'date_debut_maintenance' => '2092-03-01',
            'date_fin_maintenance' => '2092-03-10',
        ]);

        $this->putJson("/api/chambres/{$room->id}", $this->roomPayload(
            $type,
            $floorId,
            $viewId,
            '601B'
        ))->assertOk();

        $availableIds = collect(app(ReservationAvailabilityService::class)
            ->availableRooms('2092-03-03', '2092-03-05'))
            ->pluck('id');

        $this->assertNotContains($room->id, $availableIds);
        $this->assertDatabaseHas('etat_chambre', [
            'num_chambre' => '601B',
            'maintenance' => true,
        ]);
    }

    public function test_failed_state_sync_rolls_back_room_and_state_numbers(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();
        $room = $this->createRoom($type, $floorId, $viewId, '701A');
        $stateId = $room->etatChambre->id;
        $eventName = 'eloquent.updating: '.EtatChambre::class;

        Event::listen($eventName, function (EtatChambre $state): void {
            if ($state->isDirty('num_chambre')) {
                throw new RuntimeException('Forced room-state synchronization failure.');
            }
        });

        try {
            $this->putJson("/api/chambres/{$room->id}", $this->roomPayload(
                $type,
                $floorId,
                $viewId,
                '701B'
            ))->assertStatus(500);
        } finally {
            Event::forget($eventName);
        }

        $this->assertDatabaseHas('chambres', [
            'id' => $room->id,
            'num_chambre' => '701A',
        ]);
        $this->assertDatabaseHas('etat_chambre', [
            'id' => $stateId,
            'num_chambre' => '701A',
        ]);
        $this->assertDatabaseMissing('chambres', ['num_chambre' => '701B']);
        $this->assertDatabaseMissing('etat_chambre', ['num_chambre' => '701B']);
    }

    public function test_duplicate_room_number_validation_preserves_both_rooms_and_states(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();
        $first = $this->createRoom($type, $floorId, $viewId, '801A');
        $second = $this->createRoom($type, $floorId, $viewId, '801B');

        $this->putJson("/api/chambres/{$first->id}", $this->roomPayload(
            $type,
            $floorId,
            $viewId,
            '801B'
        ))->assertUnprocessable()->assertJsonValidationErrors('num_chambre');

        $this->assertDatabaseHas('chambres', ['id' => $first->id, 'num_chambre' => '801A']);
        $this->assertDatabaseHas('chambres', ['id' => $second->id, 'num_chambre' => '801B']);
        $this->assertDatabaseHas('etat_chambre', ['num_chambre' => '801A']);
        $this->assertDatabaseHas('etat_chambre', ['num_chambre' => '801B']);
        $this->assertSame(2, DB::table('etat_chambre')->whereIn('num_chambre', ['801A', '801B'])->count());
    }

    public function test_updating_room_repairs_missing_historical_state_and_logs_warning(): void
    {
        [$type, $floorId, $viewId] = $this->roomDependencies();
        $room = $this->createRoom($type, $floorId, $viewId, '901A');
        DB::table('etat_chambre')->where('num_chambre', '901A')->delete();
        Log::spy();

        $this->putJson("/api/chambres/{$room->id}", $this->roomPayload(
            $type,
            $floorId,
            $viewId,
            '901B'
        ))->assertOk();

        $this->assertDatabaseMissing('etat_chambre', ['num_chambre' => '901A']);
        $this->assertDatabaseHas('etat_chambre', [
            'num_chambre' => '901B',
            'status' => 'non nettoyée',
            'maintenance' => false,
        ]);
        Log::shouldHaveReceived('warning')
            ->once()
            ->with('Missing room state repaired during room update.', [
                'chambre_id' => $room->id,
                'old_num_chambre' => '901A',
                'new_num_chambre' => '901B',
            ]);
    }

    private function roomDependencies(): array
    {
        $now = now();
        $suffix = uniqid();
        $type = $this->createType();
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

        return [$type, $floorId, $viewId];
    }

    private function createType(?string $code = null, ?string $name = null): TypeChambre
    {
        $suffix = uniqid();

        return TypeChambre::create([
            'code' => $code ?? "TC-{$suffix}",
            'type_chambre' => $name ?? "Type {$suffix}",
            'nb_lit' => 2,
            'nb_salle' => 1,
            'commentaire' => null,
        ]);
    }

    private function createRoom(
        TypeChambre $type,
        int $floorId,
        int $viewId,
        string $number
    ): Chambre {
        return Chambre::create([
            'num_chambre' => $number,
            'type_chambre_id' => $type->id,
            'etage_id' => $floorId,
            'vue_id' => $viewId,
            'climat' => true,
            'wifi' => true,
        ]);
    }

    private function roomPayload(
        TypeChambre $type,
        int $floorId,
        int $viewId,
        string $number
    ): array {
        return [
            'num_chambre' => $number,
            'type_chambre_id' => $type->id,
            'etage_id' => $floorId,
            'vue_id' => $viewId,
            'climat' => false,
            'wifi' => true,
        ];
    }

    private function createEmployee(): Employe
    {
        return Employe::create([
            'matricule' => 'EMP-'.uniqid(),
            'nom' => 'Employé',
            'prenom' => uniqid(),
            'fonction' => 'nettoyage',
            'actif' => true,
        ]);
    }

    private function createMaintenanceType(): MaintenanceType
    {
        return MaintenanceType::create([
            'code' => 'MT-'.uniqid(),
            'types_maintenance' => 'Maintenance test',
        ]);
    }
}
