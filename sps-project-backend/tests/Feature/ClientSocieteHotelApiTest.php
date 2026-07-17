<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ClientSocieteHotelApiTest extends TestCase
{
    use DatabaseTransactions;

    private static int $sequence = 100000000000000;

    public function test_company_schema_uses_only_the_canonical_organization_column(): void
    {
        $this->assertTrue(Schema::hasColumn('clients', 'type_organisation'));
        $this->assertFalse(Schema::hasColumn('clients', 'type_client'));

        $clientId = DB::table('clients')->insertGetId([
            'CodeClient' => 'ORG-'.uniqid(),
            'raison_sociale' => 'Organisation historique',
            'adresse' => 'Adresse historique',
            'type_organisation' => 'association_ong',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertDatabaseHas('clients', [
            'id' => $clientId,
            'type_organisation' => 'association_ong',
        ]);
    }

    public function test_form_options_reuse_locations_and_expose_business_options(): void
    {
        $response = $this->getJson('/api/client-societe/form-options')->assertOk();

        $this->assertSame('MA', $response->json('countries.0.code'));
        $this->assertCount(12, $response->json('moroccoRegions'));
        $this->assertSame([
            'entreprise', 'agence_voyages', 'tour_operateur',
            'organisme_public', 'association_ong', 'autre',
        ], collect($response->json('organizationTypes'))->pluck('value')->all());
        $this->assertSame([15, 30, 45, 60, 90], collect($response->json('paymentDelays'))->pluck('value')->all());
    }

    public function test_required_company_fields_return_french_validation_errors(): void
    {
        $this->postJson('/api/clients', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'raison_sociale', 'ice', 'type_organisation',
                'tele', 'email', 'pays_code', 'ville', 'adresse',
            ])
            ->assertJsonPath('errors.raison_sociale.0', 'La raison sociale est obligatoire.');
    }

    public function test_company_code_is_generated_immutable_and_tax_identifier_is_unique(): void
    {
        $created = $this->postJson('/api/clients', $this->companyPayload([
            'CodeClient' => 'USER-SUPPLIED-CODE',
        ]))->assertCreated();
        $second = $this->postJson('/api/clients', $this->companyPayload([
            'CodeClient' => 'USER-SUPPLIED-CODE',
        ]))->assertCreated();

        $firstCode = $created->json('client.CodeClient');
        $secondCode = $second->json('client.CodeClient');
        $this->assertMatchesRegularExpression('/^CS-\d{6}$/', $firstCode);
        $this->assertMatchesRegularExpression('/^CS-\d{6}$/', $secondCode);
        $this->assertNotSame('USER-SUPPLIED-CODE', $firstCode);
        $this->assertNotSame($firstCode, $secondCode);

        $this->postJson('/api/clients', $this->companyPayload([
            'ice' => $created->json('client.ice'),
        ]))->assertUnprocessable()->assertJsonValidationErrors('ice');

        $this->putJson('/api/clients/'.$created->json('client.id'), $this->companyPayload([
            'CodeClient' => 'CS-999999',
            'ice' => $created->json('client.ice'),
        ]))->assertOk()->assertJsonPath('client.CodeClient', $firstCode);
    }

    public function test_moroccan_company_requires_a_fifteen_digit_ice(): void
    {
        $this->postJson('/api/clients', $this->companyPayload(['ice' => '123ABC']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ice')
            ->assertJsonPath('errors.ice.0', 'L’ICE doit contenir exactement 15 chiffres.');
    }

    public function test_foreign_company_accepts_an_alphanumeric_tax_identifier(): void
    {
        $this->postJson('/api/clients', $this->companyPayload([
            'ice' => 'FR-ACME/2026',
            'pays_code' => 'FR',
            'region_nom' => 'Île-de-France',
            'ville' => 'Paris',
        ]))->assertCreated()->assertJsonPath('client.ice', 'FR-ACME/2026');
    }

    public function test_organization_type_must_be_supported(): void
    {
        $this->postJson('/api/clients', $this->companyPayload(['type_organisation' => 'revendeur']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('type_organisation');
    }

    public function test_company_create_stores_the_canonical_organization_type(): void
    {
        $response = $this->postJson('/api/clients', $this->companyPayload([
            'type_organisation' => 'agence_voyages',
        ]))
            ->assertCreated()
            ->assertJsonPath('client.type_organisation', 'agence_voyages');

        $this->assertDatabaseHas('clients', [
            'id' => $response->json('client.id'),
            'type_organisation' => 'agence_voyages',
        ]);
    }

    public function test_company_update_changes_the_canonical_organization_type(): void
    {
        $created = $this->postJson('/api/clients', $this->companyPayload([
            'type_organisation' => 'entreprise',
        ]))->assertCreated();

        $payload = $this->companyPayload([
            'CodeClient' => $created->json('client.CodeClient'),
            'ice' => $created->json('client.ice'),
            'type_organisation' => 'tour_operateur',
        ]);

        $this->putJson('/api/clients/'.$created->json('client.id'), $payload)
            ->assertOk()
            ->assertJsonPath('client.type_organisation', 'tour_operateur');

        $this->assertDatabaseHas('clients', [
            'id' => $created->json('client.id'),
            'type_organisation' => 'tour_operateur',
        ]);
    }

    public function test_valid_morocco_location_is_accepted_and_invalid_pair_is_rejected(): void
    {
        $this->postJson('/api/clients', $this->companyPayload())
            ->assertCreated()
            ->assertJsonPath('client.region_nom', 'Casablanca-Settat')
            ->assertJsonPath('client.ville', 'Casablanca');

        $this->postJson('/api/clients', $this->companyPayload(['ville' => 'Tanger']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ville');
    }

    public function test_moroccan_company_requires_a_region(): void
    {
        $this->postJson('/api/clients', $this->companyPayload(['region_nom' => null]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('region_nom')
            ->assertJsonPath('errors.region_nom.0', 'La région est obligatoire pour une adresse au Maroc.');
    }

    public function test_foreign_location_uses_free_region_and_city(): void
    {
        $this->postJson('/api/clients', $this->companyPayload([
            'ice' => 'DE-ACME-'.uniqid(),
            'pays_code' => 'DE',
            'region_nom' => 'Berlin',
            'ville' => 'Berlin',
        ]))->assertCreated()->assertJsonPath('client.pays_code', 'DE');
    }

    public function test_credit_disabled_forces_delay_and_limit_to_null(): void
    {
        $response = $this->postJson('/api/clients', $this->companyPayload([
            'credit_autorise' => false,
            'delai_paiement_jours' => 30,
            'plafond_credit' => 25000,
        ]))->assertCreated();

        $this->assertDatabaseHas('clients', [
            'id' => $response->json('client.id'),
            'credit_autorise' => false,
            'delai_paiement_jours' => null,
            'plafond_credit' => null,
        ]);
    }

    public function test_credit_enabled_requires_delay_and_positive_limit(): void
    {
        $this->postJson('/api/clients', $this->companyPayload([
            'credit_autorise' => true,
            'delai_paiement_jours' => null,
            'plafond_credit' => 1000,
        ]))->assertUnprocessable()->assertJsonValidationErrors('delai_paiement_jours');

        $this->postJson('/api/clients', $this->companyPayload([
            'credit_autorise' => true,
            'delai_paiement_jours' => 30,
            'plafond_credit' => null,
        ]))->assertUnprocessable()->assertJsonValidationErrors('plafond_credit');
    }

    public function test_valid_credit_settings_are_persisted(): void
    {
        $response = $this->postJson('/api/clients', $this->companyPayload([
            'credit_autorise' => true,
            'delai_paiement_jours' => 45,
            'plafond_credit' => '125000.50',
        ]))->assertCreated();

        $this->assertDatabaseHas('clients', [
            'id' => $response->json('client.id'),
            'credit_autorise' => true,
            'delai_paiement_jours' => 45,
            'plafond_credit' => '125000.50',
        ]);
    }

    public function test_company_and_contacts_are_created_atomically_with_string_telephone(): void
    {
        $payload = $this->companyPayload(['contacts' => [[
            'name' => 'Dupont',
            'prenom' => 'Claire',
            'telephone' => '+33 01 23 45 67 89',
            'email' => 'claire@example.test',
        ]]]);
        $response = $this->postJson('/api/clients', $payload)
            ->assertCreated()
            ->assertJsonCount(1, 'client.contact_clients');

        $this->assertDatabaseHas('contact_clients', [
            'idClient' => $response->json('client.id'),
            'type' => 'C',
            'name' => 'Dupont',
            'telephone' => '+33 01 23 45 67 89',
        ]);

        $invalid = $this->companyPayload(['contacts' => [['name' => '', 'telephone' => '0600000000']]]);
        $this->postJson('/api/clients', $invalid)->assertUnprocessable();
        $this->assertDatabaseMissing('clients', ['CodeClient' => $invalid['CodeClient']]);
    }

    public function test_update_creates_updates_and_deletes_only_company_contacts(): void
    {
        $created = $this->postJson('/api/clients', $this->companyPayload(['contacts' => [
            ['name' => 'Conserver', 'telephone' => '0600000001'],
            ['name' => 'Supprimer', 'email' => 'remove@example.test'],
        ]]))->assertCreated();
        $clientId = $created->json('client.id');
        $keptId = $created->json('client.contact_clients.0.id');
        $removedId = $created->json('client.contact_clients.1.id');

        $payload = $this->companyPayload([
            'CodeClient' => $created->json('client.CodeClient'),
            'ice' => $created->json('client.ice'),
            'contacts' => [
                ['id' => $keptId, 'name' => 'Conserver modifié', 'telephone' => '0600000099'],
                ['name' => 'Nouveau', 'email' => 'new@example.test'],
            ],
        ]);
        $this->putJson("/api/clients/{$clientId}", $payload)
            ->assertOk()
            ->assertJsonCount(2, 'client.contact_clients');

        $this->assertDatabaseHas('contact_clients', ['id' => $keptId, 'name' => 'Conserver modifié']);
        $this->assertDatabaseMissing('contact_clients', ['id' => $removedId]);
        $this->assertDatabaseHas('contact_clients', ['idClient' => $clientId, 'name' => 'Nouveau', 'type' => 'C']);
    }

    public function test_update_cannot_claim_another_company_contact(): void
    {
        $first = $this->postJson('/api/clients', $this->companyPayload(['contacts' => [
            ['name' => 'Premier', 'telephone' => '0600000001'],
        ]]))->assertCreated();
        $second = $this->postJson('/api/clients', $this->companyPayload(['contacts' => [
            ['name' => 'Second', 'telephone' => '0600000002'],
        ]]))->assertCreated();

        $payload = $this->companyPayload([
            'CodeClient' => $first->json('client.CodeClient'),
            'ice' => $first->json('client.ice'),
            'contacts' => [[
                'id' => $second->json('client.contact_clients.0.id'),
                'name' => 'Volé',
                'telephone' => '0600000003',
            ]],
        ]);

        $this->putJson('/api/clients/'.$first->json('client.id'), $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('contacts.0.id');
        $this->assertDatabaseHas('contact_clients', [
            'id' => $second->json('client.contact_clients.0.id'),
            'name' => 'Second',
        ]);
    }

    public function test_reservation_and_historical_site_protect_company_deletion(): void
    {
        $reserved = $this->postJson('/api/clients', $this->companyPayload())->assertCreated()->json('client');
        Reservation::create([
            'reservation_num' => 'R'.strtoupper(substr(uniqid(), -10)),
            'client_type' => 'societe',
            'client_id' => $reserved['id'],
            'reservation_date' => '2096-01-01',
            'date_debut' => '2096-01-10',
            'date_fin' => '2096-01-12',
            'status' => 'en attente',
            'pricing_version' => 1,
            'legacy_pricing' => true,
            'montant_total' => 0,
            'montant_reduction' => 0,
        ]);
        $this->deleteJson("/api/clients/{$reserved['id']}")->assertStatus(409);

        $withSite = $this->postJson('/api/clients', $this->companyPayload())->assertCreated()->json('client');
        DB::table('site_clients')->insert([
            'CodeSiteclient' => 'SITE-'.uniqid(),
            'raison_sociale' => 'Site historique',
            'adresse' => 'Adresse site',
            'client_id' => $withSite['id'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->deleteJson("/api/clients/{$withSite['id']}")
            ->assertStatus(409)
            ->assertJsonFragment(['message' => 'Ce client ne peut pas être supprimé car des sites historiques lui sont rattachés.']);
        $this->assertDatabaseHas('clients', ['id' => $withSite['id']]);
    }

    public function test_deleting_company_removes_only_its_company_contacts(): void
    {
        $created = $this->postJson('/api/clients', $this->companyPayload(['contacts' => [
            ['name' => 'Contact', 'telephone' => '0600000000'],
        ]]))->assertCreated()->json('client');
        DB::table('contact_clients')->insert([
            'idClient' => $created['id'],
            'type' => 'SC',
            'name' => 'Contact historique site',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->deleteJson("/api/clients/{$created['id']}")->assertOk();
        $this->assertDatabaseMissing('contact_clients', ['idClient' => $created['id'], 'type' => 'C']);
        $this->assertDatabaseHas('contact_clients', ['idClient' => $created['id'], 'type' => 'SC']);
    }

    public function test_incomplete_legacy_company_is_returned_without_fabricated_values(): void
    {
        $id = DB::table('clients')->insertGetId([
            'CodeClient' => 'LEG-'.uniqid(),
            'raison_sociale' => 'Société historique',
            'adresse' => 'Adresse historique',
            'type_organisation' => null,
            'email' => null,
            'pays_code' => null,
            'region_nom' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson("/api/clients/{$id}")
            ->assertOk()
            ->assertJsonPath('client.type_organisation', null)
            ->assertJsonPath('client.email', null)
            ->assertJsonPath('client.pays_code', null);
    }

    public function test_deleting_application_user_does_not_delete_company(): void
    {
        $user = User::factory()->create();
        $clientId = DB::table('clients')->insertGetId([
            'CodeClient' => 'USR-'.uniqid(),
            'raison_sociale' => 'Société liée utilisateur',
            'adresse' => 'Adresse',
            'user_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user->delete();

        $this->assertDatabaseHas('clients', ['id' => $clientId, 'user_id' => null]);
    }

    private function companyPayload(array $overrides = []): array
    {
        self::$sequence++;

        return array_merge([
            'CodeClient' => 'CS-'.uniqid(),
            'raison_sociale' => 'Société Test',
            'ice' => (string) self::$sequence,
            'type_organisation' => 'entreprise',
            'abreviation' => 'ST',
            'secteur_id' => null,
            'tele' => '+212522000000',
            'email' => 'societe-'.uniqid().'@example.test',
            'pays_code' => 'MA',
            'region_nom' => 'Casablanca-Settat',
            'ville' => 'Casablanca',
            'adresse' => 'Adresse société',
            'code_postal' => '20000',
            'mod_id' => null,
            'credit_autorise' => false,
            'delai_paiement_jours' => null,
            'plafond_credit' => null,
            'contacts' => [],
        ], $overrides);
    }
}
