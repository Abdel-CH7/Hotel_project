<?php

namespace Tests\Feature;

use App\Models\Reservation;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationClientDeletionProtectionTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_referenced_company_client_cannot_be_deleted(): void
    {
        $client = $this->createCompanyClient();
        $this->reservationForClient('societe', $client->id);

        $this->deleteJson("/api/clients/{$client->id}")
            ->assertStatus(409)
            ->assertJsonFragment(['message' => 'Ce client ne peut pas être supprimé car il est utilisé par des réservations.']);
        $this->assertDatabaseHas('clients', ['id' => $client->id]);
    }

    public function test_referenced_individual_client_cannot_be_deleted(): void
    {
        $client = $this->createIndividualClient();
        $this->reservationForClient('particulier', $client->id);

        $this->deleteJson("/api/clients_particulier/{$client->id}")
            ->assertStatus(409)
            ->assertJsonFragment(['message' => 'Ce client ne peut pas être supprimé car il est utilisé par des réservations.']);
        $this->assertDatabaseHas('clients_particulier', ['id' => $client->id]);
    }

    public function test_unreferenced_clients_can_still_be_deleted(): void
    {
        $company = $this->createCompanyClient();
        $individual = $this->createIndividualClient();

        $this->deleteJson("/api/clients/{$company->id}")->assertOk();
        $this->deleteJson("/api/clients_particulier/{$individual->id}")->assertOk();
        $this->assertDatabaseMissing('clients', ['id' => $company->id]);
        $this->assertDatabaseMissing('clients_particulier', ['id' => $individual->id]);
    }

    private function reservationForClient(string $type, int $clientId): Reservation
    {
        return Reservation::create([
            'reservation_num' => 'R'.strtoupper(substr(uniqid(), -10)),
            'client_type' => $type,
            'client_id' => $clientId,
            'reservation_date' => '2096-01-01',
            'date_debut' => '2096-01-10',
            'date_fin' => '2096-01-12',
            'status' => 'en attente',
            'pricing_version' => 1,
            'legacy_pricing' => true,
            'montant_total' => 0,
            'montant_reduction' => 0,
        ]);
    }
}
