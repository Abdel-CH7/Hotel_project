<?php

namespace Tests\Feature;

use App\Models\CategorieEquipement;
use App\Models\Chambre;
use App\Models\Emplacement;
use App\Models\Etage;
use App\Models\Equipement;
use App\Models\TypeChambre;
use App\Models\Vue;
use App\Support\EquipmentLocationBackfill;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class EquipementApiTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_index_returns_all_active_equipment_in_the_frontend_contract(): void
    {
        $category = $this->createCategory();

        foreach (range(1, 17) as $index) {
            $this->createEquipment($category, [
                'numero_serie' => "INDEX-{$index}-".uniqid(),
                'statut' => $index % 2 === 0 ? 'disponible' : 'en_maintenance',
            ]);
        }

        $deletedEquipment = $this->createEquipment($category, [
            'numero_serie' => 'DELETED-'.uniqid(),
            'statut' => 'hors_service',
        ]);
        $deletedEquipment->delete();

        $deletedCategory = $this->createCategory();
        $deletedCategory->delete();

        $response = $this->getJson('/api/equipements');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'equipements' => ['data'],
                'categories',
                'chambres',
                'emplacements',
                'stats' => ['total', 'disponible', 'en_maintenance', 'hors_service'],
            ])
            ->assertJsonPath('success', true)
            ->assertJsonCount(Equipement::count(), 'equipements.data');

        $equipmentIds = collect($response->json('equipements.data'))->pluck('id');
        $categoryIds = collect($response->json('categories'))->pluck('id');

        $this->assertFalse($equipmentIds->contains($deletedEquipment->id));
        $this->assertFalse($categoryIds->contains($deletedCategory->id));

        $this->assertSame(Equipement::count(), $response->json('stats.total'));
        $this->assertSame(Equipement::where('statut', 'disponible')->count(), $response->json('stats.disponible'));
        $this->assertSame(Equipement::where('statut', 'en_maintenance')->count(), $response->json('stats.en_maintenance'));
        $this->assertSame(Equipement::where('statut', 'hors_service')->count(), $response->json('stats.hors_service'));
    }

    public function test_static_equipment_routes_are_not_captured_by_show(): void
    {
        $this->getJson('/api/equipements/stats')
            ->assertOk()
            ->assertJsonStructure(['success', 'stats']);

        $this->getJson('/api/equipements/categories')
            ->assertOk()
            ->assertJsonStructure(['success', 'categories']);
    }

    public function test_store_accepts_exactly_one_room_or_emplacement(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom('701');
        $emplacement = $this->createEmplacement('Réception test');

        $roomResponse = $this->postJson('/api/equipements', $this->validPayload($category, [
            'numero_serie' => 'ROOM-'.uniqid(),
            'chambre_id' => $room->id,
            'emplacement_id' => null,
        ]));

        $roomResponse
            ->assertCreated()
            ->assertJsonPath('chambre.id', $room->id)
            ->assertJsonPath('emplacement', null);

        $emplacementResponse = $this->postJson('/api/equipements', $this->validPayload($category, [
            'numero_serie' => 'LOCATION-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $emplacement->id,
        ]));

        $emplacementResponse
            ->assertCreated()
            ->assertJsonPath('chambre', null)
            ->assertJsonPath('emplacement.id', $emplacement->id);
    }

    public function test_store_rejects_both_locations_or_no_location(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom('702');
        $emplacement = $this->createEmplacement('Cuisine test');

        $this->postJson('/api/equipements', $this->validPayload($category, [
            'numero_serie' => 'BOTH-'.uniqid(),
            'chambre_id' => $room->id,
            'emplacement_id' => $emplacement->id,
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['chambre_id', 'emplacement_id']);

        $payload = $this->validPayload($category, [
            'numero_serie' => 'NONE-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => null,
        ]);

        $this->postJson('/api/equipements', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['chambre_id', 'emplacement_id']);
    }

    public function test_update_switches_between_room_and_emplacement(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom('703');
        $emplacement = $this->createEmplacement('Stock test');
        $equipment = $this->createEquipment($category, [
            'chambre_id' => $room->id,
            'emplacement_id' => null,
        ]);

        $this->putJson("/api/equipements/{$equipment->id}", [
            'emplacement_id' => $emplacement->id,
        ])->assertOk()
            ->assertJsonPath('chambre', null)
            ->assertJsonPath('emplacement.id', $emplacement->id);

        $this->putJson("/api/equipements/{$equipment->id}", [
            'chambre_id' => $room->id,
        ])->assertOk()
            ->assertJsonPath('chambre.id', $room->id)
            ->assertJsonPath('emplacement', null);
    }

    public function test_assigned_room_and_emplacement_cannot_be_deleted(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom('704');
        $emplacement = $this->createEmplacement('Buanderie test');
        $this->createEquipment($category, [
            'chambre_id' => $room->id,
            'emplacement_id' => null,
        ]);
        $this->createEquipment($category, [
            'numero_serie' => 'ASSIGNED-LOCATION-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $emplacement->id,
        ]);

        $this->deleteJson("/api/chambres/{$room->id}")
            ->assertStatus(409);
        $this->deleteJson("/api/emplacements/{$emplacement->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('chambres', ['id' => $room->id]);
        $this->assertDatabaseHas('emplacements', ['id' => $emplacement->id]);
    }

    public function test_legacy_location_backfill_maps_rooms_and_deduplicates_emplacements(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom('705');
        $roomEquipment = $this->createEquipment($category, [
            'localisation' => '  Chambre   705 ',
            'chambre_id' => null,
            'emplacement_id' => null,
        ]);
        $firstLocationEquipment = $this->createEquipment($category, [
            'numero_serie' => 'LEGACY-ONE-'.uniqid(),
            'localisation' => '  Réception   principale ',
            'chambre_id' => null,
            'emplacement_id' => null,
        ]);
        $secondLocationEquipment = $this->createEquipment($category, [
            'numero_serie' => 'LEGACY-TWO-'.uniqid(),
            'localisation' => 'réception principale',
            'chambre_id' => null,
            'emplacement_id' => null,
        ]);

        app(EquipmentLocationBackfill::class)->run();

        $this->assertSame($room->id, $roomEquipment->fresh()->chambre_id);
        $this->assertNotNull($firstLocationEquipment->fresh()->emplacement_id);
        $this->assertSame(
            $firstLocationEquipment->fresh()->emplacement_id,
            $secondLocationEquipment->fresh()->emplacement_id
        );
        $this->assertDatabaseHas('emplacements', [
            'id' => $firstLocationEquipment->fresh()->emplacement_id,
            'nom' => 'Réception principale',
        ]);
    }

    public function test_emplacement_crud_normalizes_names_and_rejects_duplicates(): void
    {
        $created = $this->postJson('/api/emplacements', [
            'nom' => '  Réception   secondaire  ',
            'type' => 'Accueil',
        ])
            ->assertCreated()
            ->assertJsonPath('emplacement.nom', 'Réception secondaire')
            ->json('emplacement');

        $this->getJson('/api/emplacements')
            ->assertOk()
            ->assertJsonFragment(['nom' => 'Réception secondaire']);

        $this->postJson('/api/emplacements', [
            'nom' => 'Réception secondaire',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('nom');

        $this->putJson("/api/emplacements/{$created['id']}", [
            'nom' => 'Stock principal',
            'description' => 'Réserve du matériel',
        ])
            ->assertOk()
            ->assertJsonPath('emplacement.nom', 'Stock principal');

        $this->deleteJson("/api/emplacements/{$created['id']}")
            ->assertOk();

        $this->assertDatabaseMissing('emplacements', ['id' => $created['id']]);
    }

    public function test_store_accepts_no_document_pdf_jpg_and_png(): void
    {
        $category = $this->createCategory();

        $this->postJson('/api/equipements', $this->validPayload($category))
            ->assertCreated()
            ->assertJsonPath('categorie.id', $category->id);

        $files = [
            UploadedFile::fake()->create('documentation.pdf', 100, 'application/pdf'),
            UploadedFile::fake()->create('equipment.jpg', 100, 'image/jpeg'),
            UploadedFile::fake()->create('equipment.png', 100, 'image/png'),
        ];

        foreach ($files as $index => $file) {
            $payload = $this->validPayload($category, [
                'numero_serie' => "FILE-{$index}-".uniqid(),
                'document' => $file,
            ]);

            $response = $this->post('/api/equipements', $payload);

            $response->assertCreated();
            Storage::disk('public')->assertExists($response->json('document_path'));
        }
    }

    public function test_store_returns_standard_validation_errors(): void
    {
        $category = $this->createCategory();
        $existing = $this->createEquipment($category);

        $this->postJson('/api/equipements', $this->validPayload($category, [
            'numero_serie' => $existing->numero_serie,
        ]))->assertUnprocessable()->assertJsonValidationErrors('numero_serie');

        $this->postJson('/api/equipements', $this->validPayload($category, [
            'numero_serie' => 'INVALID-CATEGORY-'.uniqid(),
            'categorie_id' => 999999999,
        ]))->assertUnprocessable()->assertJsonValidationErrors('categorie_id');

        $this->postJson('/api/equipements', $this->validPayload($category, [
            'numero_serie' => 'INVALID-DATE-'.uniqid(),
            'date_acquisition' => '2026-07-10',
            'date_fin_garantie' => '2026-07-09',
        ]))->assertUnprocessable()->assertJsonValidationErrors('date_fin_garantie');
    }

    public function test_multipart_update_preserves_or_replaces_the_document(): void
    {
        $category = $this->createCategory();
        $oldPath = 'equipements/documentation/old.pdf';
        Storage::disk('public')->put($oldPath, 'old document');

        $equipment = $this->createEquipment($category, [
            'document_path' => $oldPath,
        ]);

        $this->post("/api/equipements/{$equipment->id}", [
            '_method' => 'PUT',
            'nom' => 'Updated without document',
            'emplacement_id' => $equipment->emplacement_id,
        ])->assertOk()->assertJsonPath('document_path', $oldPath);

        Storage::disk('public')->assertExists($oldPath);

        $response = $this->post("/api/equipements/{$equipment->id}", [
            '_method' => 'PUT',
            'nom' => 'Updated with document',
            'emplacement_id' => $equipment->emplacement_id,
            'document' => UploadedFile::fake()->create('replacement.pdf', 100, 'application/pdf'),
        ]);

        $response->assertOk();
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($response->json('document_path'));
    }

    public function test_failed_creation_and_update_remove_only_the_new_document(): void
    {
        $category = $this->createCategory();
        $originalDispatcher = Equipement::getEventDispatcher();

        try {
            Equipement::setEventDispatcher(clone $originalDispatcher);
            Equipement::creating(function () {
                throw new RuntimeException('Forced create failure.');
            });

            $this->post('/api/equipements', $this->validPayload($category, [
                'document' => UploadedFile::fake()->create('orphan.pdf', 100, 'application/pdf'),
            ]))->assertInternalServerError();

            $this->assertSame([], Storage::disk('public')->allFiles('equipements/documentation'));
        } finally {
            Equipement::setEventDispatcher($originalDispatcher);
        }

        $oldPath = 'equipements/documentation/current.pdf';
        Storage::disk('public')->put($oldPath, 'current document');
        $equipment = $this->createEquipment($category, ['document_path' => $oldPath]);

        try {
            Equipement::setEventDispatcher(clone $originalDispatcher);
            Equipement::updating(function () {
                throw new RuntimeException('Forced update failure.');
            });

            $this->post("/api/equipements/{$equipment->id}", [
                '_method' => 'PUT',
                'emplacement_id' => $equipment->emplacement_id,
                'document' => UploadedFile::fake()->create('failed-replacement.pdf', 100, 'application/pdf'),
            ])->assertInternalServerError();

            Storage::disk('public')->assertExists($oldPath);
            $this->assertSame([$oldPath], Storage::disk('public')->allFiles('equipements/documentation'));
            $this->assertSame($oldPath, $equipment->fresh()->document_path);
        } finally {
            Equipement::setEventDispatcher($originalDispatcher);
        }
    }

    public function test_destroy_removes_the_document_and_soft_deletes_the_equipment(): void
    {
        $category = $this->createCategory();
        $documentPath = 'equipements/documentation/delete-me.pdf';
        Storage::disk('public')->put($documentPath, 'document');
        $equipment = $this->createEquipment($category, ['document_path' => $documentPath]);

        $this->deleteJson("/api/equipements/{$equipment->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        Storage::disk('public')->assertMissing($documentPath);
        $this->assertSoftDeleted('equipements', ['id' => $equipment->id]);
    }

    public function test_legacy_location_repair_migrates_exact_room_matches_including_soft_deleted_equipment(): void
    {
        $category = $this->createCategory();
        $roomNumber = 'R'.uniqid();
        $room = $this->createRoom($roomNumber);
        $pseudoRoom = $this->createEmplacement("Chambre {$roomNumber}");
        $activeEquipment = $this->createEquipment($category, [
            'numero_serie' => 'REPAIR-ACTIVE-'.uniqid(),
            'localisation' => "Chambre {$roomNumber}",
            'chambre_id' => null,
            'emplacement_id' => $pseudoRoom->id,
        ]);
        $deletedEquipment = $this->createEquipment($category, [
            'numero_serie' => 'REPAIR-DELETED-'.uniqid(),
            'localisation' => "Chambre {$roomNumber}",
            'chambre_id' => null,
            'emplacement_id' => $pseudoRoom->id,
        ]);
        $deletedEquipment->delete();

        $this->assertSame(0, Artisan::call('equipment:repair-legacy-locations', ['--apply' => true]));

        foreach ([$activeEquipment, $deletedEquipment] as $equipment) {
            $repaired = Equipement::withTrashed()->findOrFail($equipment->id);
            $this->assertSame($room->id, $repaired->chambre_id);
            $this->assertNull($repaired->emplacement_id);
            $this->assertNull($repaired->localisation);
        }

        $this->assertSoftDeleted('equipements', ['id' => $deletedEquipment->id]);
        $this->assertDatabaseMissing('emplacements', ['id' => $pseudoRoom->id]);
    }

    public function test_legacy_location_repair_reports_unresolved_and_ignores_internal_locations(): void
    {
        $category = $this->createCategory();
        $missingRoom = $this->createEmplacement('Chambre 999-'.uniqid());
        $unsupported = $this->createEmplacement('Porte Chambre 201-'.uniqid());
        $internal = $this->createEmplacement('Couloir 1er Étage '.uniqid());
        $missingEquipment = $this->createEquipment($category, [
            'numero_serie' => 'MISSING-ROOM-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $missingRoom->id,
        ]);
        $unsupportedEquipment = $this->createEquipment($category, [
            'numero_serie' => 'UNSUPPORTED-ROOM-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $unsupported->id,
        ]);
        $internalEquipment = $this->createEquipment($category, [
            'numero_serie' => 'INTERNAL-LOCATION-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $internal->id,
        ]);

        $this->assertSame(0, Artisan::call('equipment:repair-legacy-locations', ['--apply' => true]));
        $output = Artisan::output();

        $this->assertStringContainsString($missingRoom->nom, $output);
        $this->assertStringContainsString('chambre réelle introuvable', $output);
        $this->assertStringContainsString($unsupported->nom, $output);
        $this->assertStringContainsString('format historique non pris en charge', $output);

        foreach ([$missingEquipment, $unsupportedEquipment, $internalEquipment] as $equipment) {
            $this->assertNull($equipment->fresh()->chambre_id);
            $this->assertNotNull($equipment->fresh()->emplacement_id);
        }
    }

    public function test_legacy_location_repair_dry_run_performs_no_writes(): void
    {
        $category = $this->createCategory();
        $roomNumber = 'DRY'.uniqid();
        $this->createRoom($roomNumber);
        $pseudoRoom = $this->createEmplacement("Chambre {$roomNumber}");
        $equipment = $this->createEquipment($category, [
            'numero_serie' => 'DRY-RUN-'.uniqid(),
            'localisation' => "Chambre {$roomNumber}",
            'chambre_id' => null,
            'emplacement_id' => $pseudoRoom->id,
        ]);

        $this->assertSame(0, Artisan::call('equipment:repair-legacy-locations', ['--dry-run' => true]));

        $this->assertNull($equipment->fresh()->chambre_id);
        $this->assertSame($pseudoRoom->id, $equipment->fresh()->emplacement_id);
        $this->assertSame("Chambre {$roomNumber}", $equipment->fresh()->localisation);
        $this->assertDatabaseHas('emplacements', ['id' => $pseudoRoom->id]);
        $output = Artisan::output();
        $this->assertStringContainsString('Mode simulation (aucune écriture)', $output);
        $this->assertStringContainsString('Correspondances exactes', $output);
    }

    public function test_legacy_location_repair_apply_is_idempotent(): void
    {
        $category = $this->createCategory();
        $roomNumber = 'IDEM'.uniqid();
        $room = $this->createRoom($roomNumber);
        $pseudoRoom = $this->createEmplacement("Chambre {$roomNumber}");
        $equipment = $this->createEquipment($category, [
            'numero_serie' => 'IDEMPOTENT-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $pseudoRoom->id,
        ]);

        $this->assertSame(0, Artisan::call('equipment:repair-legacy-locations', ['--apply' => true]));
        $this->assertSame(0, Artisan::call('equipment:repair-legacy-locations', ['--apply' => true]));

        $this->assertSame($room->id, $equipment->fresh()->chambre_id);
        $this->assertNull($equipment->fresh()->emplacement_id);
        $this->assertDatabaseMissing('emplacements', ['id' => $pseudoRoom->id]);
    }

    public function test_emplacement_store_and_update_reject_names_that_match_an_existing_room(): void
    {
        $roomNumber = 'BLOCK'.uniqid();
        $this->createRoom($roomNumber);
        $message = 'Cette localisation correspond à une chambre existante. Affectez l’équipement directement à la chambre.';

        $this->postJson('/api/emplacements', ['nom' => "  cHaMbRe   {$roomNumber}  "])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('nom')
            ->assertJsonPath('errors.nom.0', $message);

        $emplacement = $this->createEmplacement('Stock '.uniqid());
        $this->putJson("/api/emplacements/{$emplacement->id}", ['nom' => "Chambre {$roomNumber}"])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('nom')
            ->assertJsonPath('errors.nom.0', $message);

        $this->postJson('/api/emplacements', ['nom' => 'Chambre froide dédiée'])
            ->assertCreated();
    }

    public function test_equipment_index_contract_supports_exact_room_context_filtering(): void
    {
        $category = $this->createCategory();
        $room = $this->createRoom('CTX'.uniqid());
        $internal = $this->createEmplacement('Réception '.uniqid());
        $roomEquipment = $this->createEquipment($category, [
            'numero_serie' => 'ROOM-CONTEXT-'.uniqid(),
            'chambre_id' => $room->id,
            'emplacement_id' => null,
        ]);
        $internalEquipment = $this->createEquipment($category, [
            'numero_serie' => 'INTERNAL-CONTEXT-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $internal->id,
        ]);

        $rowsForRoom = collect($this->getJson('/api/equipements')->assertOk()->json('equipements.data'))
            ->filter(fn (array $equipment) => (string) ($equipment['chambre_id'] ?? '') === (string) $room->id);

        $this->assertTrue($rowsForRoom->contains('id', $roomEquipment->id));
        $this->assertFalse($rowsForRoom->contains('id', $internalEquipment->id));
    }

    public function test_equipment_assignment_rejects_numeric_pseudo_rooms_but_accepts_valid_locations(): void
    {
        $category = $this->createCategory();
        $pseudoRoom = $this->createEmplacement('Chambre 999999');
        $coldRoom = $this->createEmplacement('Chambre froide');
        $realRoom = $this->createRoom('REAL'.uniqid());
        $message = 'Cette localisation historique ne peut plus être affectée. Sélectionnez une chambre réelle ou un emplacement interne valide.';

        $this->postJson('/api/equipements', $this->validPayload($category, [
            'numero_serie' => 'PSEUDO-ROOM-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $pseudoRoom->id,
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('emplacement_id')
            ->assertJsonPath('errors.emplacement_id.0', $message);

        $historicalEquipment = $this->createEquipment($category, [
            'numero_serie' => 'HISTORICAL-EDIT-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $pseudoRoom->id,
        ]);

        $this->putJson("/api/equipements/{$historicalEquipment->id}", [
            'nom' => 'Tentative de modification historique',
            'emplacement_id' => $pseudoRoom->id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('emplacement_id')
            ->assertJsonPath('errors.emplacement_id.0', $message);

        $this->assertSame('Test equipment', $historicalEquipment->fresh()->nom);
        $this->assertSame($pseudoRoom->id, $historicalEquipment->fresh()->emplacement_id);

        $this->postJson('/api/equipements', $this->validPayload($category, [
            'numero_serie' => 'COLD-ROOM-'.uniqid(),
            'chambre_id' => null,
            'emplacement_id' => $coldRoom->id,
        ]))
            ->assertCreated()
            ->assertJsonPath('emplacement.id', $coldRoom->id);

        $this->postJson('/api/equipements', $this->validPayload($category, [
            'numero_serie' => 'REAL-ROOM-'.uniqid(),
            'chambre_id' => $realRoom->id,
            'emplacement_id' => null,
        ]))
            ->assertCreated()
            ->assertJsonPath('chambre.id', $realRoom->id)
            ->assertJsonPath('emplacement', null);
    }

    private function createCategory(): CategorieEquipement
    {
        return CategorieEquipement::create([
            'nom' => 'Category '.uniqid(),
            'description' => 'Equipment API test category',
        ]);
    }

    private function createEquipment(CategorieEquipement $category, array $overrides = []): Equipement
    {
        $defaultEmplacement = $this->createEmplacement();

        return Equipement::create(array_merge([
            'nom' => 'Test equipment',
            'numero_serie' => 'SERIAL-'.uniqid(),
            'modele' => 'Model',
            'marque' => 'Brand',
            'date_acquisition' => '2026-07-01',
            'date_fin_garantie' => '2027-07-01',
            'categorie_id' => $category->id,
            'statut' => 'disponible',
            'localisation' => null,
            'chambre_id' => null,
            'emplacement_id' => $defaultEmplacement->id,
            'fournisseur' => 'Test supplier',
            'prix_achat' => 100,
            'notes' => 'Test notes',
        ], $overrides));
    }

    private function validPayload(CategorieEquipement $category, array $overrides = []): array
    {
        $defaultEmplacement = $this->createEmplacement();

        return array_merge([
            'nom' => 'API equipment',
            'numero_serie' => 'API-SERIAL-'.uniqid(),
            'modele' => 'API model',
            'marque' => 'API brand',
            'date_acquisition' => '2026-07-01',
            'date_fin_garantie' => '2027-07-01',
            'categorie_id' => $category->id,
            'statut' => 'disponible',
            'chambre_id' => null,
            'emplacement_id' => $defaultEmplacement->id,
            'fournisseur' => 'API supplier',
            'prix_achat' => 150,
            'notes' => 'API notes',
        ], $overrides);
    }

    private function createEmplacement(?string $name = null): Emplacement
    {
        return Emplacement::create([
            'nom' => $name ?? 'Emplacement '.uniqid(),
            'type' => 'test',
            'description' => 'Equipment API test emplacement',
        ]);
    }

    private function createRoom(string $roomNumber): Chambre
    {
        $type = TypeChambre::create([
            'code' => 'TYPE-'.uniqid(),
            'type_chambre' => 'Type '.uniqid(),
            'nb_lit' => 1,
            'nb_salle' => 1,
            'commentaire' => null,
        ]);
        $view = Vue::create(['vue' => 'Vue '.uniqid()]);
        $floor = Etage::create(['etage' => 'Etage '.uniqid()]);

        return Chambre::create([
            'num_chambre' => $roomNumber,
            'type_chambre_id' => $type->id,
            'etage_id' => $floor->id,
            'vue_id' => $view->id,
            'climat' => true,
            'wifi' => true,
        ]);
    }
}
