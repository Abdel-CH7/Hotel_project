<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientParticulier;
use App\Models\Reservation;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationClientIntegrationTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_client_options_are_normalized_and_do_not_expose_legacy_particular_fields(): void
    {
        $sectorId = DB::table('secteur_clients')->insertGetId([
            'secteurClient' => 'Tourisme '.uniqid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $modeId = DB::table('mode_paimants')->insertGetId([
            'mode_paimants' => 'Virement bancaire '.uniqid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $companyId = DB::table('clients')->insertGetId([
            'CodeClient' => 'CS-OPT-'.uniqid(),
            'raison_sociale' => 'Atlas Travel Options',
            'adresse' => 'Adresse',
            'ice' => '001234567890123',
            'type_organisation' => 'agence_voyages',
            'tele' => '0522000000',
            'email' => 'atlas@example.test',
            'secteur_id' => $sectorId,
            'mod_id' => $modeId,
            'credit_autorise' => true,
            'delai_paiement_jours' => 30,
            'plafond_credit' => '50000.00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $individualId = DB::table('clients_particulier')->insertGetId([
            'CodeClient' => 'CP-OPT-'.uniqid(),
            'name' => 'Chafi',
            'prenom' => 'Jawad',
            'type_piece' => 'CIN',
            'cin' => 'TST753159-'.uniqid(),
            'civilite' => 'Monsieur',
            'nationalite' => 'Marocain',
            'tele' => '0657235897',
            'pays_code' => 'MA',
            'region_nom' => 'Tanger-Tétouan-Al Hoceïma',
            'ville' => 'Tanger',
            'adresse' => 'Adresse',
            'categorie' => 'Historique',
            'seince' => '30',
            'montant_plafond' => '1000',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/reservations/client-options')->assertOk();
        $company = collect($response->json('data.societe'))->firstWhere('id', $companyId);
        $individual = collect($response->json('data.particulier'))->firstWhere('id', $individualId);

        $this->assertSame('Agence de voyages', $company['type_organisation_label']);
        $this->assertSame('50000.00', $company['commercial']['plafond_credit']);
        $this->assertStringContainsString('ICE 001234567890123', $company['select_label']);
        $this->assertSame('CIN', $individual['type_piece']);
        $this->assertSame('Tanger', $individual['ville']);
        $this->assertStringContainsString('0657235897', $individual['select_label']);
        foreach (['seince', 'montant_plafond', 'categorie', 'zone', 'secteur', 'mod_id', 'logoC'] as $legacyField) {
            $this->assertArrayNotHasKey($legacyField, $individual);
        }
    }

    public function test_same_numeric_id_resolves_each_table_without_cross_table_confusion(): void
    {
        $sharedId = max(
            (int) DB::table('clients')->max('id'),
            (int) DB::table('clients_particulier')->max('id')
        ) + 1000;
        $companyName = 'Société ID partagé';
        $individualName = 'Client Même ID';
        $this->insertCompany($sharedId, $companyName);
        $this->insertIndividual($sharedId, 'Client', 'Même ID');

        $type = $this->createRoomType(2, 0);
        $companyRoom = $this->createRoom($type);
        $individualRoom = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type);
        $this->createPeriod('2097-01-01', '2097-01-31', $grid);

        $companyReservation = $this->postJson('/api/reservations', $this->payload(
            'societe', $sharedId, $companyRoom->id, '2097-01-10', '2097-01-12'
        ))->assertCreated();
        $individualReservation = $this->postJson('/api/reservations', $this->payload(
            'particulier', $sharedId, $individualRoom->id, '2097-01-10', '2097-01-12'
        ))->assertCreated();

        $companyId = $companyReservation->json('data.id');
        $individualId = $individualReservation->json('data.id');
        $this->assertSame($companyName, $companyReservation->json('data.client.display_name'));
        $this->assertSame($individualName, $individualReservation->json('data.client.display_name'));
        $this->assertInstanceOf(Client::class, Reservation::findOrFail($companyId)->client);
        $this->assertInstanceOf(ClientParticulier::class, Reservation::findOrFail($individualId)->client);

        $list = collect($this->getJson('/api/reservations')->assertOk()->json('data'));
        $this->assertSame($companyName, $list->firstWhere('id', $companyId)['client']['display_name']);
        $this->assertSame('societe', $list->firstWhere('id', $companyId)['client']['type']);
        $this->assertSame($individualName, $list->firstWhere('id', $individualId)['client']['display_name']);
        $this->assertSame('particulier', $list->firstWhere('id', $individualId)['client']['type']);

        $this->getJson("/api/reservations/{$companyId}")
            ->assertOk()
            ->assertJsonPath('data.client.current_display_name', $companyName)
            ->assertJsonPath('data.client.code', "SOC-SHARED-{$sharedId}");
        $this->getJson("/api/reservations/{$individualId}")
            ->assertOk()
            ->assertJsonPath('data.client.current_display_name', $individualName)
            ->assertJsonPath('data.client.code', "PAR-SHARED-{$sharedId}");
    }

    public function test_update_preserves_backfills_and_replaces_client_snapshot_as_required(): void
    {
        $company = $this->createCompanyClient('Nom société enregistré');
        $individual = $this->createIndividualClient('Invité', 'Nouveau');
        $type = $this->createRoomType(2, 0);
        $room = $this->createRoom($type);
        [$grid] = $this->createRoomGridDetail($type);
        $this->createPeriod('2097-02-01', '2097-02-28', $grid);
        $payload = $this->payload('societe', $company->id, $room->id, '2097-02-10', '2097-02-12');
        $created = $this->postJson('/api/reservations', $payload)->assertCreated();
        $reservationId = $created->json('data.id');

        DB::table('clients')->where('id', $company->id)->update(['raison_sociale' => 'Nom société actuel']);
        $this->putJson("/api/reservations/{$reservationId}", $payload)
            ->assertOk()
            ->assertJsonPath('data.client.display_name', 'Nom société enregistré')
            ->assertJsonPath('data.client.current_display_name', 'Nom société actuel');

        DB::table('reservations')->where('id', $reservationId)->update(['client_name_snapshot' => null]);
        $this->putJson("/api/reservations/{$reservationId}", $payload)
            ->assertOk()
            ->assertJsonPath('data.client.display_name', 'Nom société actuel');

        $individualPayload = array_merge($payload, [
            'client_type' => 'particulier',
            'client_id' => $individual->id,
        ]);
        $this->putJson("/api/reservations/{$reservationId}", $individualPayload)
            ->assertOk()
            ->assertJsonPath('data.client.type', 'particulier')
            ->assertJsonPath('data.client.display_name', 'Invité Nouveau');

        $this->putJson("/api/reservations/{$reservationId}", $payload)
            ->assertOk()
            ->assertJsonPath('data.client.type', 'societe')
            ->assertJsonPath('data.client.display_name', 'Nom société actuel');

        $this->assertDatabaseHas('reservations', [
            'id' => $reservationId,
            'client_type' => 'societe',
            'client_id' => $company->id,
            'client_name_snapshot' => 'Nom société actuel',
        ]);
    }

    public function test_invalid_type_wrong_table_pair_and_missing_client_are_rejected_cleanly(): void
    {
        $companyId = max(
            (int) DB::table('clients')->max('id'),
            (int) DB::table('clients_particulier')->max('id')
        ) + 2000;
        $this->insertCompany($companyId, 'Société isolée');
        DB::table('clients_particulier')->where('id', $companyId)->delete();

        $base = [
            'date_debut' => '2097-03-10',
            'date_fin' => '2097-03-12',
            'chambres' => [['chambre_id' => 1, 'adultes' => 1, 'enfants' => 0]],
            'repas' => [],
            'type_reduction_id' => null,
        ];

        $this->postJson('/api/reservations', array_merge($base, [
            'client_type' => 'entreprise',
            'client_id' => $companyId,
        ]))->assertUnprocessable()->assertJsonValidationErrors('client_type');
        $this->postJson('/api/reservations', array_merge($base, [
            'client_type' => 'particulier',
            'client_id' => $companyId,
        ]))->assertUnprocessable()
            ->assertJsonPath('code', 'client_not_found')
            ->assertJsonPath('field', 'client_id');
        $this->postJson('/api/reservations', array_merge($base, [
            'client_type' => 'societe',
            'client_id' => $companyId + 1,
        ]))->assertUnprocessable()
            ->assertJsonPath('code', 'client_not_found')
            ->assertJsonPath('field', 'client_id');
    }

    public function test_resources_have_normalized_client_without_raw_client_data(): void
    {
        $client = $this->createCompanyClient('Ressource normalisée');
        $reservation = Reservation::create([
            'reservation_num' => 'R'.strtoupper(substr(uniqid(), -10)),
            'client_type' => 'societe',
            'client_id' => $client->id,
            'client_name_snapshot' => 'Nom historique',
            'reservation_date' => '2097-04-01',
            'date_debut' => '2097-04-10',
            'date_fin' => '2097-04-12',
            'status' => 'en attente',
            'pricing_version' => 1,
            'legacy_pricing' => true,
            'montant_total' => 0,
            'montant_reduction' => 0,
        ]);

        $this->assertArrayNotHasKey('client_data', $reservation->toArray());
        $this->getJson("/api/reservations/{$reservation->id}")
            ->assertOk()
            ->assertJsonPath('data.client.display_name', 'Nom historique')
            ->assertJsonPath('data.client.current_display_name', 'Ressource normalisée')
            ->assertJsonPath('data.client.exists', true)
            ->assertJsonMissingPath('data.client_data');
    }

    private function payload(string $type, int $clientId, int $roomId, string $start, string $end): array
    {
        return [
            'client_type' => $type,
            'client_id' => $clientId,
            'date_debut' => $start,
            'date_fin' => $end,
            'chambres' => [['chambre_id' => $roomId, 'adultes' => 1, 'enfants' => 0]],
            'repas' => [],
            'type_reduction_id' => null,
        ];
    }

    private function insertCompany(int $id, string $name): void
    {
        DB::table('clients')->insert([
            'id' => $id,
            'CodeClient' => "SOC-SHARED-{$id}",
            'raison_sociale' => $name,
            'adresse' => 'Adresse',
            'type_organisation' => 'entreprise',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertIndividual(int $id, string $name, string $firstName): void
    {
        DB::table('clients_particulier')->insert([
            'id' => $id,
            'CodeClient' => "PAR-SHARED-{$id}",
            'name' => $name,
            'prenom' => $firstName,
            'cin' => "CIN-SHARED-{$id}",
            'civilite' => 'Monsieur',
            'nationalite' => 'Marocaine',
            'adresse' => 'Adresse',
            'type_piece' => 'CIN',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
