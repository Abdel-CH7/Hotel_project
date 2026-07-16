<?php

namespace Tests\Feature;

use App\Models\Chambre;
use App\Models\Employe;
use App\Models\EtatChambre;
use App\Models\MaintenanceType;
use App\Support\RoomStateBackfill;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EtatChambreEmployeApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_creating_a_room_automatically_creates_its_default_state(): void
    {
        $room = $this->createRoom();

        $this->assertDatabaseHas('etat_chambre', [
            'num_chambre' => $room->num_chambre,
            'status' => 'non nettoyée',
            'maintenance' => false,
        ]);
        $this->assertSame($room->num_chambre, $room->etatChambre->num_chambre);
    }

    public function test_backfill_creates_default_states_for_rooms_without_one(): void
    {
        $room = Chambre::withoutEvents(fn () => $this->createRoom());
        $this->assertDatabaseMissing('etat_chambre', ['num_chambre' => $room->num_chambre]);

        $created = app(RoomStateBackfill::class)->run();

        $this->assertSame(1, $created);
        $this->assertDatabaseHas('etat_chambre', [
            'num_chambre' => $room->num_chambre,
            'status' => 'non nettoyée',
            'maintenance' => false,
        ]);
    }

    public function test_duplicate_room_state_is_rejected(): void
    {
        $room = $this->createRoom();

        $this->postJson('/api/etat-chambre', [
            'num_chambre' => $room->num_chambre,
            'status' => 'non nettoyée',
            'maintenance' => false,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('num_chambre');
    }

    public function test_allowed_statuses_are_accepted_and_invalid_statuses_are_rejected(): void
    {
        $room = $this->createRoom();
        $employee = $this->createEmployee('nettoyage');

        $this->putJson("/api/etat-chambre/{$room->num_chambre}", [
            'status' => 'nettoyée',
            'date_nettoyage' => '2026-07-14',
            'nettoyee_par_id' => $employee->id,
            'maintenance' => false,
        ])->assertOk();

        $this->putJson("/api/etat-chambre/{$room->num_chambre}", [
            'status' => 'non nettoyée',
        ])
            ->assertOk()
            ->assertJsonPath('etat_chambre.nettoyee_par_id', $employee->id)
            ->assertJsonPath('etat_chambre.date_nettoyage', '2026-07-14T00:00:00.000000Z');

        $this->putJson("/api/etat-chambre/{$room->num_chambre}", [
            'status' => 'en attente',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_maintenance_true_requires_type_and_valid_dates(): void
    {
        $room = $this->createRoom();

        $this->putJson("/api/etat-chambre/{$room->num_chambre}", [
            'maintenance' => true,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'maintenance_type_id',
                'date_debut_maintenance',
                'date_fin_maintenance',
            ]);

        $type = $this->createMaintenanceType();

        $this->putJson("/api/etat-chambre/{$room->num_chambre}", [
            'maintenance' => true,
            'maintenance_type_id' => $type->id,
            'date_debut_maintenance' => '2026-07-15',
            'date_fin_maintenance' => '2026-07-14',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('date_fin_maintenance');

        $this->putJson("/api/etat-chambre/{$room->num_chambre}", [
            'maintenance' => true,
            'maintenance_type_id' => $type->id,
            'date_debut_maintenance' => '2026-07-14',
            'date_fin_maintenance' => '2026-07-15',
        ])->assertOk();
    }

    public function test_maintenance_false_clears_existing_maintenance_data(): void
    {
        $room = $this->createRoom();
        $type = $this->createMaintenanceType();
        $state = $room->etatChambre;
        $state->update([
            'maintenance' => true,
            'maintenance_type_id' => $type->id,
            'date_debut_maintenance' => '2026-07-14',
            'date_fin_maintenance' => '2026-07-15',
        ]);

        $this->putJson("/api/etat-chambre/{$room->num_chambre}", [
            'maintenance' => false,
        ])
            ->assertOk()
            ->assertJsonPath('etat_chambre.maintenance', false)
            ->assertJsonPath('etat_chambre.maintenance_type_id', null)
            ->assertJsonPath('etat_chambre.date_debut_maintenance', null)
            ->assertJsonPath('etat_chambre.date_fin_maintenance', null);
    }

    public function test_cleaning_requires_an_employee_and_date(): void
    {
        $room = $this->createRoom();

        $this->putJson("/api/etat-chambre/{$room->num_chambre}", [
            'status' => 'nettoyée',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date_nettoyage', 'nettoyee_par_id']);
    }

    public function test_employee_with_invalid_function_or_inactive_status_is_rejected_for_cleaning(): void
    {
        $room = $this->createRoom();
        $maintenanceEmployee = $this->createEmployee('maintenance');
        $inactiveCleaner = $this->createEmployee('nettoyage', false);

        foreach ([$maintenanceEmployee, $inactiveCleaner] as $employee) {
            $this->putJson("/api/etat-chambre/{$room->num_chambre}", [
                'status' => 'nettoyée',
                'date_nettoyage' => '2026-07-14',
                'nettoyee_par_id' => $employee->id,
            ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('nettoyee_par_id');
        }
    }

    public function test_employee_deletion_is_blocked_when_referenced(): void
    {
        $room = $this->createRoom();
        $employee = $this->createEmployee('supervision');
        $room->etatChambre->update(['nettoyee_par_id' => $employee->id]);

        $this->deleteJson("/api/employes/{$employee->id}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('employes', ['id' => $employee->id]);
    }

    public function test_maintenance_type_deletion_is_blocked_when_referenced(): void
    {
        $room = $this->createRoom();
        $type = $this->createMaintenanceType();
        $room->etatChambre->update(['maintenance_type_id' => $type->id]);

        $this->deleteJson("/api/maintenance-types/{$type->id}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('types_maintenance', ['id' => $type->id]);
    }

    public function test_index_returns_relationships_types_and_active_cleaning_employees(): void
    {
        $room = $this->createRoom();
        $employee = $this->createEmployee('nettoyage');
        $excludedEmployee = $this->createEmployee('maintenance');
        $type = $this->createMaintenanceType();
        $room->etatChambre->update([
            'status' => 'nettoyée',
            'date_nettoyage' => '2026-07-14',
            'nettoyee_par_id' => $employee->id,
            'maintenance' => true,
            'maintenance_type_id' => $type->id,
            'date_debut_maintenance' => '2026-07-14',
            'date_fin_maintenance' => '2026-07-15',
        ]);

        $this->getJson('/api/etat-chambre')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['num_chambre' => $room->num_chambre])
            ->assertJsonFragment(['matricule' => $employee->matricule])
            ->assertJsonFragment(['code' => $type->code])
            ->assertJsonMissing(['matricule' => $excludedEmployee->matricule]);
    }

    public function test_unreferenced_employee_and_maintenance_type_crud_works(): void
    {
        $employee = $this->postJson('/api/employes', [
            'matricule' => 'EMP-'.uniqid(),
            'nom' => 'Amrani',
            'prenom' => 'Salma',
            'fonction' => 'nettoyage',
        ])
            ->assertCreated()
            ->assertJsonPath('employe.actif', true)
            ->json('employe');

        $this->patchJson("/api/employes/{$employee['id']}", [
            'telephone' => '0600000000',
        ])->assertOk();

        $this->deleteJson("/api/employes/{$employee['id']}")->assertOk();

        $type = $this->postJson('/api/maintenance-types', [
            'code' => 'MT-'.uniqid(),
            'types_maintenance' => 'Climatisation',
        ])
            ->assertCreated()
            ->json('type');

        $this->patchJson("/api/maintenance-types/{$type['id']}", [
            'description' => 'Contrôle technique',
        ])->assertOk();

        $this->deleteJson("/api/maintenance-types/{$type['id']}")->assertOk();
    }

    private function createRoom(): Chambre
    {
        $now = now();
        $suffix = uniqid();
        $typeId = DB::table('types_chambre')->insertGetId([
            'code' => "TC-{$suffix}",
            'type_chambre' => 'Test',
            'nb_lit' => 1,
            'nb_salle' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $viewId = DB::table('vues')->insertGetId([
            'vue' => "Vue {$suffix}",
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $floorId = DB::table('etages')->insertGetId([
            'etage' => "Étage {$suffix}",
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return Chambre::create([
            'num_chambre' => (string) random_int(1000000, 9999999),
            'type_chambre_id' => $typeId,
            'etage_id' => $floorId,
            'climat' => true,
            'wifi' => true,
            'vue_id' => $viewId,
        ]);
    }

    private function createEmployee(string $function, bool $active = true): Employe
    {
        return Employe::create([
            'matricule' => 'EMP-'.uniqid(),
            'nom' => 'Employé',
            'prenom' => uniqid(),
            'fonction' => $function,
            'actif' => $active,
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
