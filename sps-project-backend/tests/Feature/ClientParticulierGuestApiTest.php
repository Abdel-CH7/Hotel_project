<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class ClientParticulierGuestApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_particular_client_schema_has_no_redundant_client_type_column(): void
    {
        $this->assertFalse(Schema::hasColumn('clients_particulier', 'type_client'));
        $this->assertTrue(Schema::hasColumn('reservations', 'client_type'));
        $this->assertFalse(Schema::hasColumn('reservations', 'type_organisation'));
    }

    public function test_deleting_application_user_keeps_the_particular_client(): void
    {
        $user = User::factory()->create();
        $clientId = DB::table('clients_particulier')->insertGetId(array_merge(
            $this->guestPayload(),
            ['user_id' => $user->id]
        ));

        $user->delete();

        $this->assertDatabaseHas('clients_particulier', [
            'id' => $clientId,
            'user_id' => null,
        ]);
    }

    public function test_existing_client_list_endpoints_still_load(): void
    {
        $this->getJson('/api/clients')->assertOk();
        $this->getJson('/api/all-data-client-particulier')->assertOk();
    }

    public function test_location_options_are_centralized_sorted_and_include_the_twelve_morocco_regions(): void
    {
        $response = $this->getJson('/api/client-particulier/location-options')->assertOk();

        $this->assertSame('MA', $response->json('countries.0.code'));
        $this->assertSame('Maroc', $response->json('countries.0.name'));
        $this->assertCount(12, $response->json('moroccoRegions'));
        foreach ($response->json('moroccoRegions') as $region) {
            $this->assertContains('Autre ville', $region['cities']);
        }

        $otherNames = collect($response->json('countries'))->skip(1)->pluck('name')->values();
        $sortedNames = $otherNames->sortBy(fn (string $name): string => Str::lower(Str::ascii($name)))->values();
        $this->assertSame($sortedNames->all(), $otherNames->all());
    }

    public function test_required_guest_fields_return_french_validation_errors(): void
    {
        $this->postJson('/api/clients_particulier', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'CodeClient', 'name', 'prenom', 'type_piece', 'cin',
                'nationalite', 'tele', 'pays_code', 'ville',
            ])
            ->assertJsonPath('errors.CodeClient.0', 'Le code client est obligatoire.')
            ->assertJsonPath('errors.cin.0', 'Le numéro de pièce est obligatoire.');
    }

    public function test_code_and_document_number_remain_unique(): void
    {
        $created = $this->postJson('/api/clients_particulier', $this->guestPayload())->assertCreated();

        $this->postJson('/api/clients_particulier', $this->guestPayload([
            'CodeClient' => $created->json('client.CodeClient'),
        ]))->assertUnprocessable()->assertJsonValidationErrors('CodeClient');

        $this->postJson('/api/clients_particulier', $this->guestPayload([
            'cin' => $created->json('client.cin'),
        ]))->assertUnprocessable()->assertJsonValidationErrors('cin');
    }

    public function test_valid_morocco_region_and_city_pair_creates_a_guest(): void
    {
        $response = $this->postJson('/api/clients_particulier', $this->guestPayload())
            ->assertCreated()
            ->assertJsonPath('client.pays_code', 'MA')
            ->assertJsonPath('client.region_nom', 'Casablanca-Settat')
            ->assertJsonPath('client.ville', 'Casablanca');

        $this->assertDatabaseHas('clients_particulier', [
            'id' => $response->json('client.id'),
            'type_piece' => 'CIN',
            'pays_code' => 'MA',
            'region_nom' => 'Casablanca-Settat',
            'ville' => 'Casablanca',
        ]);
    }

    public function test_morocco_city_must_belong_to_the_selected_region(): void
    {
        $this->postJson('/api/clients_particulier', $this->guestPayload(['ville' => 'Tanger']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ville')
            ->assertJsonPath('errors.ville.0', 'La ville sélectionnée ne correspond pas à la région marocaine choisie.');
    }

    public function test_morocco_requires_a_configured_region(): void
    {
        $this->postJson('/api/clients_particulier', $this->guestPayload(['region_nom' => null]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('region_nom')
            ->assertJsonPath('errors.region_nom.0', 'La région est obligatoire pour une adresse au Maroc.');
    }

    public function test_custom_morocco_city_is_accepted_only_through_other_city_input(): void
    {
        $response = $this->postJson('/api/clients_particulier', $this->guestPayload([
            'ville' => 'Autre ville',
            'ville_autre' => 'Bouskoura',
        ]))->assertCreated();

        $this->assertSame('Bouskoura', $response->json('client.ville'));
    }

    public function test_foreign_country_accepts_optional_free_region_and_required_free_city(): void
    {
        $response = $this->postJson('/api/clients_particulier', $this->guestPayload([
            'pays_code' => 'FR',
            'region_nom' => 'Île-de-France',
            'ville' => 'Paris',
        ]))->assertCreated();

        $this->assertSame('FR', $response->json('client.pays_code'));
        $this->assertSame('Île-de-France', $response->json('client.region_nom'));
        $this->assertSame('Paris', $response->json('client.ville'));
    }

    public function test_invalid_country_code_is_rejected(): void
    {
        $this->postJson('/api/clients_particulier', $this->guestPayload(['pays_code' => 'XX']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('pays_code');
    }

    public function test_update_changes_guest_fields_without_erasing_legacy_commercial_values(): void
    {
        $clientId = DB::table('clients_particulier')->insertGetId(array_merge($this->guestPayload(), [
            'categorie' => 'Valeur historique',
            'abreviation' => 'VH',
            'logoC' => 'legacy/logo.png',
        ]));

        $payload = $this->guestPayload([
            'CodeClient' => DB::table('clients_particulier')->where('id', $clientId)->value('CodeClient'),
            'cin' => DB::table('clients_particulier')->where('id', $clientId)->value('cin'),
            'tele' => '+212600000001',
            'ville' => 'Mohammedia',
        ]);

        $this->putJson("/api/clients_particulier/{$clientId}", $payload)
            ->assertOk()
            ->assertJsonPath('client.tele', '+212600000001')
            ->assertJsonPath('client.ville', 'Mohammedia');

        $this->assertDatabaseHas('clients_particulier', [
            'id' => $clientId,
            'categorie' => 'Valeur historique',
            'abreviation' => 'VH',
            'logoC' => 'legacy/logo.png',
        ]);
    }

    public function test_incomplete_legacy_guest_is_returned_without_fabricated_location_data(): void
    {
        $clientId = DB::table('clients_particulier')->insertGetId([
            'CodeClient' => 'LEG-'.uniqid(),
            'name' => 'Ancien',
            'prenom' => 'Client',
            'cin' => 'LEG-CIN-'.uniqid(),
            'civilite' => null,
            'nationalite' => 'Marocaine',
            'adresse' => null,
            'type_piece' => null,
            'pays_code' => null,
            'region_nom' => null,
        ]);

        $this->getJson("/api/clients_particulier/{$clientId}")
            ->assertOk()
            ->assertJsonPath('client.id', $clientId)
            ->assertJsonPath('client.type_piece', null)
            ->assertJsonPath('client.pays_code', null)
            ->assertJsonPath('client.region_nom', null);
    }

    private function guestPayload(array $overrides = []): array
    {
        return array_merge([
            'CodeClient' => 'CP-'.uniqid(),
            'name' => 'Nom',
            'prenom' => 'Prénom',
            'type_piece' => 'CIN',
            'cin' => 'DOC-'.uniqid(),
            'civilite' => 'Madame',
            'nationalite' => 'Marocaine',
            'tele' => '+212600000000',
            'pays_code' => 'MA',
            'region_nom' => 'Casablanca-Settat',
            'ville' => 'Casablanca',
            'adresse' => 'Adresse test',
            'code_postal' => '20000',
        ], $overrides);
    }
}
