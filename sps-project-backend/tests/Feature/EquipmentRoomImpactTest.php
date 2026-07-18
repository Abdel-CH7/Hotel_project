<?php

namespace Tests\Feature;

use App\Models\CategorieEquipement;
use App\Models\Chambre;
use App\Models\Emplacement;
use App\Models\Equipement;
use App\Models\EtatChambre;
use App\Models\MaintenanceType;
use App\Services\ReservationAvailabilityService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use RuntimeException;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class EquipmentRoomImpactTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_available_status_normalizes_impact_and_internal_locations_reject_room_impacts(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom(number: 'IMPACT-101');
        $state = $this->roomState($room);
        $state->update([
            'maintenance' => true,
            'maintenance_type_id' => $this->createMaintenanceType()->id,
            'date_debut_maintenance' => '2095-01-01',
            'date_fin_maintenance' => '2095-01-10',
        ]);
        $equipment = $this->createEquipment($category, [
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'statut' => 'hors_service',
            'impact_chambre' => 'chambre_indisponible',
        ]);

        $this->putJson("/api/equipements/{$equipment->id}", [
            'statut' => 'disponible',
            'impact_chambre' => 'chambre_indisponible',
            'chambre_id' => $room->id,
        ])
            ->assertOk()
            ->assertJsonPath('impact_chambre', 'aucun')
            ->assertJsonPath('room_maintenance_review_required', true)
            ->assertJsonPath('room_id', $room->id);

        $this->assertTrue($state->fresh()->maintenance);

        $emplacement = Emplacement::create(['nom' => 'Réception impact '.uniqid()]);
        foreach (['service_degrade', 'chambre_indisponible'] as $impact) {
            $this->postJson('/api/equipements', $this->equipmentPayload($category, [
                'numero_serie' => 'INTERNAL-'.strtoupper($impact).'-'.uniqid(),
                'statut' => 'en_maintenance',
                'impact_chambre' => $impact,
                'chambre_id' => null,
                'emplacement_id' => $emplacement->id,
            ]))
                ->assertUnprocessable()
                ->assertJsonValidationErrors('impact_chambre');
        }

        $this->postJson('/api/equipements', $this->equipmentPayload($category, [
            'numero_serie' => 'INTERNAL-NONE-'.uniqid(),
            'statut' => 'en_maintenance',
            'impact_chambre' => 'aucun',
            'chambre_id' => null,
            'emplacement_id' => $emplacement->id,
        ]))
            ->assertCreated()
            ->assertJsonPath('impact_chambre', 'aucun');

        $roomPayload = $this->equipmentPayload($category, [
            'numero_serie' => 'ROOM-EXPLICIT-'.uniqid(),
            'statut' => 'en_maintenance',
            'chambre_id' => $room->id,
            'emplacement_id' => null,
        ]);
        unset($roomPayload['impact_chambre']);
        $this->postJson('/api/equipements', $roomPayload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('impact_chambre');
    }

    public function test_non_blocking_impacts_keep_room_available_and_only_degraded_equipment_is_returned_as_warning(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom(number: 'IMPACT-102');

        $this->postJson('/api/equipements', $this->equipmentPayload($category, [
            'numero_serie' => 'NONE-'.uniqid(),
            'statut' => 'en_maintenance',
            'impact_chambre' => 'aucun',
            'chambre_id' => $room->id,
            'emplacement_id' => null,
        ]))->assertCreated();

        $degraded = $this->postJson('/api/equipements', $this->equipmentPayload($category, [
            'nom' => 'Télévision indisponible',
            'numero_serie' => 'DEGRADED-'.uniqid(),
            'statut' => 'hors_service',
            'impact_chambre' => 'service_degrade',
            'chambre_id' => $room->id,
            'emplacement_id' => null,
        ]))->assertCreated()->json();

        $metadata = collect(app(ReservationAvailabilityService::class)
            ->availableRooms('2095-02-01', '2095-02-03'))
            ->firstWhere('id', $room->id);

        $this->assertNotNull($metadata);
        $this->assertSame(1, $metadata['equipment_alerts']['count']);
        $this->assertSame($degraded['id'], $metadata['equipment_alerts']['items'][0]['id']);
        $this->assertSame('service_degrade', $metadata['equipment_alerts']['items'][0]['impact_chambre']);
        $this->assertFalse($this->roomState($room)->fresh()->maintenance);

        $statePayload = collect($this->getJson('/api/etat-chambre')
            ->assertOk()
            ->json('etat_chambres'))
            ->firstWhere('num_chambre', $room->num_chambre);
        $this->assertSame(2, $statePayload['equipements']['total_problematiques']);
        $this->assertSame(1, $statePayload['equipements']['service_degrade']);
        $this->assertSame(0, $statePayload['equipements']['bloquants']);
    }

    public function test_moving_away_from_blocking_impact_reviews_the_original_room(): void
    {
        $category = $this->createCategory();
        $originalRoom = $this->createRoom(number: 'IMPACT-ORIGINAL');
        $newRoom = $this->createRoom(number: 'IMPACT-NEW');
        $this->roomState($originalRoom)->update([
            'maintenance' => true,
            'maintenance_type_id' => $this->createMaintenanceType()->id,
            'date_debut_maintenance' => '2095-02-01',
            'date_fin_maintenance' => '2095-02-10',
        ]);
        $equipment = $this->createEquipment($category, [
            'chambre_id' => $originalRoom->id,
            'emplacement_id' => null,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'chambre_indisponible',
        ]);

        $this->putJson("/api/equipements/{$equipment->id}", [
            'chambre_id' => $newRoom->id,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'service_degrade',
        ])
            ->assertOk()
            ->assertJsonPath('room_maintenance_review_required', true)
            ->assertJsonPath('room_id', $originalRoom->id);

        $this->assertTrue($this->roomState($originalRoom)->fresh()->maintenance);
        $this->assertFalse($this->roomState($newRoom)->fresh()->maintenance);
    }

    public function test_moving_blocking_equipment_to_another_room_requires_maintenance_and_reviews_original_room(): void
    {
        $category = $this->createCategory();
        $maintenanceType = $this->createMaintenanceType();
        $originalRoom = $this->createRoom(number: 'IMPACT-BLOCK-A');
        $destinationRoom = $this->createRoom(number: 'IMPACT-BLOCK-B');
        $this->roomState($originalRoom)->update([
            'maintenance' => true,
            'maintenance_type_id' => $maintenanceType->id,
            'date_debut_maintenance' => '2095-02-01',
            'date_fin_maintenance' => '2095-02-10',
            'commentaire' => 'Maintenance chambre A',
        ]);
        $equipment = $this->createEquipment($category, [
            'chambre_id' => $originalRoom->id,
            'emplacement_id' => null,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'chambre_indisponible',
        ]);

        $this->putJson("/api/equipements/{$equipment->id}", [
            'chambre_id' => $destinationRoom->id,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'chambre_indisponible',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'room_maintenance.maintenance_type_id',
                'room_maintenance.date_debut_maintenance',
                'room_maintenance.date_fin_maintenance',
            ]);

        $this->assertSame($originalRoom->id, $equipment->fresh()->chambre_id);
        $this->assertFalse($this->roomState($destinationRoom)->fresh()->maintenance);

        $this->putJson("/api/equipements/{$equipment->id}", [
            'chambre_id' => $destinationRoom->id,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'chambre_indisponible',
            'room_maintenance' => $this->maintenancePayload(
                $maintenanceType,
                '2095-02-03',
                '2095-02-08'
            ),
        ])
            ->assertOk()
            ->assertJsonPath('room_maintenance_review_required', true)
            ->assertJsonPath('room_id', $originalRoom->id);

        $this->assertTrue($this->roomState($originalRoom)->fresh()->maintenance);
        $this->assertTrue($this->roomState($destinationRoom)->fresh()->maintenance);
        $this->assertSame($destinationRoom->id, $equipment->fresh()->chambre_id);
    }

    public function test_unrelated_edit_reuses_and_returns_existing_blocking_room_maintenance(): void
    {
        $category = $this->createCategory();
        $maintenanceType = $this->createMaintenanceType();
        $room = $this->createRoom(number: 'IMPACT-REUSE');
        $state = $this->roomState($room);
        $state->update([
            'maintenance' => true,
            'maintenance_type_id' => $maintenanceType->id,
            'date_debut_maintenance' => '2095-02-11',
            'date_fin_maintenance' => '2095-02-19',
            'commentaire' => 'Maintenance à conserver exactement',
        ]);
        $equipment = $this->createEquipment($category, [
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'statut' => 'hors_service',
            'impact_chambre' => 'chambre_indisponible',
        ]);

        $listed = collect($this->getJson('/api/equipements')->assertOk()->json('equipements.data'))
            ->firstWhere('id', $equipment->id);
        $this->assertSame($maintenanceType->id, $listed['room_maintenance']['maintenance_type_id']);
        $this->assertSame('2095-02-11', $listed['room_maintenance']['date_debut_maintenance']);
        $this->assertSame('2095-02-19', $listed['room_maintenance']['date_fin_maintenance']);
        $this->assertSame('Maintenance à conserver exactement', $listed['room_maintenance']['commentaire']);

        $this->putJson("/api/equipements/{$equipment->id}", [
            'nom' => 'Équipement renommé uniquement',
        ])
            ->assertOk()
            ->assertJsonPath('nom', 'Équipement renommé uniquement')
            ->assertJsonPath('room_maintenance_already_active', true)
            ->assertJsonPath('room_maintenance.maintenance_type_id', $maintenanceType->id)
            ->assertJsonPath('room_maintenance.date_debut_maintenance', '2095-02-11')
            ->assertJsonPath('room_maintenance.date_fin_maintenance', '2095-02-19')
            ->assertJsonPath('room_maintenance.commentaire', 'Maintenance à conserver exactement');

        $state->refresh();
        $this->assertSame($maintenanceType->id, $state->maintenance_type_id);
        $this->assertSame('2095-02-11', $state->date_debut_maintenance->format('Y-m-d'));
        $this->assertSame('2095-02-19', $state->date_fin_maintenance->format('Y-m-d'));
        $this->assertSame('Maintenance à conserver exactement', $state->commentaire);
    }

    public function test_blocking_equipment_without_active_room_maintenance_requires_complete_payload(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom(number: 'IMPACT-MISSING-STATE');
        $state = $this->roomState($room);
        $state->update([
            'maintenance' => false,
            'maintenance_type_id' => null,
            'date_debut_maintenance' => null,
            'date_fin_maintenance' => null,
            'commentaire' => null,
        ]);
        $equipment = $this->createEquipment($category, [
            'nom' => 'Nom avant échec',
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'chambre_indisponible',
        ]);

        $this->putJson("/api/equipements/{$equipment->id}", [
            'nom' => 'Nom qui ne doit pas être enregistré',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'room_maintenance.maintenance_type_id',
                'room_maintenance.date_debut_maintenance',
                'room_maintenance.date_fin_maintenance',
            ]);

        $this->assertSame('Nom avant échec', $equipment->fresh()->nom);
        $this->assertFalse($state->fresh()->maintenance);
    }

    public function test_deleting_blocking_equipment_preserves_room_maintenance_and_requests_review(): void
    {
        $category = $this->createCategory();
        $maintenanceType = $this->createMaintenanceType();
        $room = $this->createRoom(number: 'IMPACT-DELETE');
        $state = $this->roomState($room);
        $state->update([
            'maintenance' => true,
            'maintenance_type_id' => $maintenanceType->id,
            'date_debut_maintenance' => '2095-02-20',
            'date_fin_maintenance' => '2095-02-28',
            'commentaire' => 'Maintenance conservée après suppression',
        ]);
        $equipment = $this->createEquipment($category, [
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'statut' => 'hors_service',
            'impact_chambre' => 'chambre_indisponible',
        ]);

        $this->deleteJson("/api/equipements/{$equipment->id}")
            ->assertOk()
            ->assertJsonPath('room_maintenance_review_required', true)
            ->assertJsonPath('room_id', $room->id)
            ->assertJsonPath('review_url', "/etat-chambre?room_id={$room->id}");

        $this->assertSoftDeleted('equipements', ['id' => $equipment->id]);
        $state->refresh();
        $this->assertTrue($state->maintenance);
        $this->assertSame($maintenanceType->id, $state->maintenance_type_id);
        $this->assertSame('2095-02-20', $state->date_debut_maintenance->format('Y-m-d'));
        $this->assertSame('2095-02-28', $state->date_fin_maintenance->format('Y-m-d'));
        $this->assertSame('Maintenance conservée après suppression', $state->commentaire);
    }

    public function test_blocking_impact_for_both_problem_statuses_updates_room_state_and_excludes_availability(): void
    {
        $category = $this->createCategory();
        $maintenanceType = $this->createMaintenanceType();

        foreach (['en_maintenance', 'hors_service'] as $index => $status) {
            $room = $this->createRoom(number: 'IMPACT-BLOCK-'.($index + 1));
            $this->postJson('/api/equipements', $this->equipmentPayload($category, [
                'numero_serie' => 'BLOCKING-'.$status.'-'.uniqid(),
                'statut' => $status,
                'impact_chambre' => 'chambre_indisponible',
                'chambre_id' => $room->id,
                'emplacement_id' => null,
                'room_maintenance' => $this->maintenancePayload($maintenanceType),
            ]))
                ->assertCreated()
                ->assertJsonPath('impact_chambre', 'chambre_indisponible');

            $this->assertDatabaseHas('etat_chambre', [
                'num_chambre' => $room->num_chambre,
                'maintenance' => true,
                'maintenance_type_id' => $maintenanceType->id,
            ]);
            $availableIds = collect(app(ReservationAvailabilityService::class)
                ->availableRooms('2095-03-02', '2095-03-04'))
                ->pluck('id');
            $this->assertNotContains($room->id, $availableIds);
        }
    }

    public function test_category_maintenance_type_is_only_a_returned_suggestion(): void
    {
        $maintenanceType = $this->createMaintenanceType();
        $categoryId = $this->postJson('/api/equipements/categories', [
            'nom' => 'Catégorie avec suggestion '.uniqid(),
            'description' => 'Suggestion configurable',
            'maintenance_type_id' => $maintenanceType->id,
        ])
            ->assertCreated()
            ->assertJsonPath('categorie.maintenance_type_id', $maintenanceType->id)
            ->json('categorie.id');
        $room = $this->createRoom(number: 'IMPACT-103');

        $this->getJson('/api/equipements')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $categoryId,
                'maintenance_type_id' => $maintenanceType->id,
            ])
            ->assertJsonFragment([
                'id' => $maintenanceType->id,
                'types_maintenance' => $maintenanceType->types_maintenance,
            ]);

        $this->assertFalse($this->roomState($room)->maintenance);
    }

    public function test_reservation_conflict_returns_details_without_writes_then_confirmed_request_blocks_room(): void
    {
        $category = $this->createCategory();
        $maintenanceType = $this->createMaintenanceType();
        $room = $this->createRoom(number: 'IMPACT-104');
        $reservation = $this->createBlockingReservation(
            $room,
            '2095-04-03',
            '2095-04-06',
            'confirmé'
        );
        $payload = $this->equipmentPayload($category, [
            'numero_serie' => 'CONFLICT-'.uniqid(),
            'statut' => 'en_maintenance',
            'impact_chambre' => 'chambre_indisponible',
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'room_maintenance' => $this->maintenancePayload($maintenanceType, '2095-04-01', '2095-04-08'),
        ]);

        $this->postJson('/api/equipements', $payload)
            ->assertStatus(409)
            ->assertJsonPath('code', 'existing_reservations_overlap')
            ->assertJsonPath('conflicts.0.id', $reservation->id)
            ->assertJsonPath('conflicts.0.reservation_num', $reservation->reservation_num);

        $this->assertDatabaseMissing('equipements', ['numero_serie' => $payload['numero_serie']]);
        $this->assertFalse($this->roomState($room)->fresh()->maintenance);

        $this->postJson('/api/equipements', array_merge($payload, [
            'confirm_reservation_conflicts' => true,
        ]))->assertCreated();

        $this->assertTrue($this->roomState($room)->fresh()->maintenance);
        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'status' => 'confirmé',
        ]);
    }

    public function test_existing_covering_maintenance_is_preserved_and_non_covering_maintenance_rejects_all_writes(): void
    {
        $category = $this->createCategory();
        $existingType = $this->createMaintenanceType();
        $requestedType = $this->createMaintenanceType();
        $room = $this->createRoom(number: 'IMPACT-105');
        $state = $this->roomState($room);
        $state->update([
            'maintenance' => true,
            'maintenance_type_id' => $existingType->id,
            'date_debut_maintenance' => '2095-05-01',
            'date_fin_maintenance' => '2095-05-20',
            'commentaire' => 'Maintenance existante à préserver',
        ]);

        $this->postJson('/api/equipements', $this->equipmentPayload($category, [
            'numero_serie' => 'COVERED-'.uniqid(),
            'statut' => 'hors_service',
            'impact_chambre' => 'chambre_indisponible',
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'room_maintenance' => $this->maintenancePayload($requestedType, '2095-05-05', '2095-05-10'),
        ]))
            ->assertCreated()
            ->assertJsonPath('room_maintenance_already_active', true);

        $state->refresh();
        $this->assertSame($existingType->id, $state->maintenance_type_id);
        $this->assertSame('2095-05-01', $state->date_debut_maintenance->format('Y-m-d'));
        $this->assertSame('2095-05-20', $state->date_fin_maintenance->format('Y-m-d'));
        $this->assertSame('Maintenance existante à préserver', $state->commentaire);

        $serial = 'NOT-COVERED-'.uniqid();
        $this->postJson('/api/equipements', $this->equipmentPayload($category, [
            'numero_serie' => $serial,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'chambre_indisponible',
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'room_maintenance' => $this->maintenancePayload($requestedType, '2095-05-21', '2095-05-25'),
        ]))
            ->assertStatus(409)
            ->assertJsonPath('code', 'room_maintenance_period_conflict')
            ->assertJsonPath('review_url', "/etat-chambre?room_id={$room->id}");

        $this->assertDatabaseMissing('equipements', ['numero_serie' => $serial]);
        $this->assertSame('Maintenance existante à préserver', $state->fresh()->commentaire);
    }

    public function test_state_update_failure_rolls_back_equipment_creation(): void
    {
        $category = $this->createCategory();
        $maintenanceType = $this->createMaintenanceType();
        $room = $this->createRoom(number: 'IMPACT-106');
        $serial = 'ROLLBACK-'.uniqid();
        $originalDispatcher = EtatChambre::getEventDispatcher();

        try {
            EtatChambre::setEventDispatcher(clone $originalDispatcher);
            EtatChambre::updating(function (): void {
                throw new RuntimeException('Forced room-state failure.');
            });

            $this->postJson('/api/equipements', $this->equipmentPayload($category, [
                'numero_serie' => $serial,
                'statut' => 'en_maintenance',
                'impact_chambre' => 'chambre_indisponible',
                'chambre_id' => $room->id,
                'emplacement_id' => null,
                'room_maintenance' => $this->maintenancePayload($maintenanceType),
            ]))->assertInternalServerError();
        } finally {
            EtatChambre::setEventDispatcher($originalDispatcher);
        }

        $this->assertDatabaseMissing('equipements', ['numero_serie' => $serial]);
        $this->assertFalse($this->roomState($room)->fresh()->maintenance);
    }

    public function test_availability_metadata_excludes_none_internal_available_and_soft_deleted_equipment(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom(number: 'IMPACT-107');
        $emplacement = Emplacement::create(['nom' => 'Buanderie impact '.uniqid()]);
        $expected = $this->createEquipment($category, [
            'nom' => 'Climatiseur dégradé',
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'service_degrade',
        ]);
        $this->createEquipment($category, [
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'statut' => 'hors_service',
            'impact_chambre' => 'aucun',
        ]);
        $this->createEquipment($category, [
            'chambre_id' => null,
            'emplacement_id' => $emplacement->id,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'aucun',
        ]);
        $deleted = $this->createEquipment($category, [
            'chambre_id' => $room->id,
            'emplacement_id' => null,
            'statut' => 'en_maintenance',
            'impact_chambre' => 'service_degrade',
        ]);
        $deleted->delete();

        $metadata = collect(app(ReservationAvailabilityService::class)
            ->availableRooms('2095-07-01', '2095-07-03'))
            ->firstWhere('id', $room->id);

        $this->assertSame(1, $metadata['equipment_alerts']['count']);
        $this->assertSame([$expected->id], collect($metadata['equipment_alerts']['items'])->pluck('id')->all());
    }

    private function createCategory(array $attributes = []): CategorieEquipement
    {
        return CategorieEquipement::create(array_merge([
            'nom' => 'Catégorie impact '.uniqid(),
            'description' => 'Catégorie de test',
        ], $attributes));
    }

    private function createMaintenanceType(): MaintenanceType
    {
        return MaintenanceType::create([
            'code' => 'IMPACT-'.uniqid(),
            'types_maintenance' => 'Maintenance équipement '.uniqid(),
            'description' => 'Type de maintenance suggéré',
        ]);
    }

    private function createEquipment(CategorieEquipement $category, array $attributes = []): Equipement
    {
        return Equipement::create(array_merge([
            'nom' => 'Équipement impact',
            'numero_serie' => 'IMPACT-SERIAL-'.uniqid(),
            'modele' => 'Modèle test',
            'marque' => 'Marque test',
            'date_acquisition' => '2095-01-01',
            'categorie_id' => $category->id,
            'statut' => 'disponible',
            'impact_chambre' => 'aucun',
        ], $attributes));
    }

    private function equipmentPayload(CategorieEquipement $category, array $attributes = []): array
    {
        return array_merge([
            'nom' => 'Équipement API impact',
            'numero_serie' => 'IMPACT-API-'.uniqid(),
            'modele' => 'Modèle API',
            'marque' => 'Marque API',
            'date_acquisition' => '2095-01-01',
            'categorie_id' => $category->id,
            'statut' => 'disponible',
            'impact_chambre' => 'aucun',
        ], $attributes);
    }

    private function maintenancePayload(
        MaintenanceType $type,
        string $start = '2095-03-01',
        string $end = '2095-03-05'
    ): array {
        return [
            'maintenance_type_id' => $type->id,
            'date_debut_maintenance' => $start,
            'date_fin_maintenance' => $end,
            'commentaire' => 'Maintenance créée depuis un équipement',
        ];
    }

    private function roomState(Chambre $room): EtatChambre
    {
        return EtatChambre::firstOrCreate(
            ['num_chambre' => $room->num_chambre],
            ['status' => 'non nettoyée', 'maintenance' => false]
        );
    }
}
