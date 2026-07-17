<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ClientLookupDeletionProtectionTest extends TestCase
{
    use DatabaseTransactions;

    public function test_used_client_lookups_return_friendly_conflicts_for_every_lookup_type(): void
    {
        $zoneId = DB::table('zones')->insertGetId(['zone' => 'Zone '.uniqid()]);
        $regionId = DB::table('regions')->insertGetId(['region' => 'Region '.uniqid()]);
        $secteurId = DB::table('secteur_clients')->insertGetId(['secteurClient' => 'Secteur '.uniqid()]);
        $modeId = DB::table('mode_paimants')->insertGetId(['mode_paimants' => 'Mode '.uniqid()]);

        $individualId = $this->createIndividualClient(['zone_id' => $zoneId]);
        $companyId = $this->createCompanyClient(['region_id' => $regionId]);

        DB::table('site_clients')->insert([
            'CodeSiteclient' => 'SC-'.uniqid(),
            'raison_sociale' => 'Site societe',
            'adresse' => 'Adresse test',
            'client_id' => $companyId,
            'secteur_id' => $secteurId,
        ]);
        DB::table('site_clients_particulier')->insert([
            'codeSiteClient' => 'SCP-'.uniqid(),
            'name' => 'Site',
            'prenom' => 'Particulier',
            'cin' => 'CIN-'.uniqid(),
            'civilite' => 'M',
            'nationalite' => 'Marocaine',
            'adresse' => 'Adresse test',
            'client_id' => $individualId,
            'mod_id' => $modeId,
        ]);

        $this->deleteJson("/api/zones/{$zoneId}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Cette zone ne peut pas être supprimée car elle est utilisée par un ou plusieurs clients.');
        $this->deleteJson("/api/regions/{$regionId}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Cette région ne peut pas être supprimée car elle est utilisée par un ou plusieurs clients.');
        $this->deleteJson("/api/secteur_clients/{$secteurId}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Ce secteur ne peut pas être supprimé car il est utilisé par un ou plusieurs clients.');
        $this->deleteJson("/api/mode-paimants/{$modeId}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Ce mode de paiement ne peut pas être supprimé car il est utilisé par un ou plusieurs clients.');

        $this->assertDatabaseHas('clients_particulier', ['id' => $individualId, 'zone_id' => $zoneId]);
        $this->assertDatabaseHas('clients', ['id' => $companyId, 'region_id' => $regionId]);
        $this->assertDatabaseHas('site_clients', ['client_id' => $companyId, 'secteur_id' => $secteurId]);
        $this->assertDatabaseHas('site_clients_particulier', ['client_id' => $individualId, 'mod_id' => $modeId]);
    }

    public function test_unused_client_lookups_can_still_be_deleted(): void
    {
        $zoneId = DB::table('zones')->insertGetId(['zone' => 'Zone libre '.uniqid()]);
        $regionId = DB::table('regions')->insertGetId(['region' => 'Region libre '.uniqid()]);
        $secteurId = DB::table('secteur_clients')->insertGetId(['secteurClient' => 'Secteur libre '.uniqid()]);
        $modeId = DB::table('mode_paimants')->insertGetId(['mode_paimants' => 'Mode libre '.uniqid()]);

        $this->deleteJson("/api/zones/{$zoneId}")->assertNoContent();
        $this->deleteJson("/api/regions/{$regionId}")->assertNoContent();
        $this->deleteJson("/api/secteur_clients/{$secteurId}")->assertNoContent();
        $this->deleteJson("/api/mode-paimants/{$modeId}")->assertNoContent();
    }

    public function test_database_restrict_prevents_bypassing_the_controller(): void
    {
        $zoneId = DB::table('zones')->insertGetId(['zone' => 'Zone protegee '.uniqid()]);
        $clientId = $this->createIndividualClient(['zone_id' => $zoneId]);

        try {
            DB::table('zones')->where('id', $zoneId)->delete();
            $this->fail('The database should reject deletion of a used lookup.');
        } catch (QueryException) {
            $this->assertDatabaseHas('zones', ['id' => $zoneId]);
            $this->assertDatabaseHas('clients_particulier', ['id' => $clientId, 'zone_id' => $zoneId]);
        }
    }

    private function createIndividualClient(array $overrides = []): int
    {
        return DB::table('clients_particulier')->insertGetId(array_merge([
            'CodeClient' => 'CP-'.uniqid(),
            'name' => 'Client',
            'prenom' => 'Particulier',
            'cin' => 'CIN-'.uniqid(),
            'civilite' => 'M',
            'nationalite' => 'Marocaine',
            'adresse' => 'Adresse test',
        ], $overrides));
    }

    private function createCompanyClient(array $overrides = []): int
    {
        return DB::table('clients')->insertGetId(array_merge([
            'CodeClient' => 'CS-'.uniqid(),
            'raison_sociale' => 'Societe test',
            'adresse' => 'Adresse test',
        ], $overrides));
    }
}
