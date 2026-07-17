<?php

namespace Tests\Feature;

use App\Models\CategorieEquipement;
use App\Models\Departement;
use App\Models\Equipement;
use App\Models\Reclamation;
use App\Models\ReclamationCanal;
use App\Models\ReclamationType;
use App\Models\Reservation;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    protected bool $authenticateApiRequests = false;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_dashboard_summary_requires_authentication(): void
    {
        $this->getJson('/api/dashboard/summary')->assertUnauthorized();
    }

    public function test_dashboard_summary_returns_all_hotel_counts(): void
    {
        CarbonImmutable::setTestNow('2026-07-17 10:00:00');
        Sanctum::actingAs(User::factory()->create());

        $baseline = $this->getJson('/api/dashboard/summary')
            ->assertOk()
            ->json('data');

        $this->createCompanyClient('Société tableau de bord');
        $individual = $this->createIndividualClient('Client', 'Tableau de bord');
        $this->createRoom(number: 'DASH-ROOM-'.uniqid());

        Reservation::create($this->reservationData(
            $individual->id,
            'DASH-ARRIVAL-'.uniqid(),
            '2026-07-17',
            '2026-07-19',
            'confirmé'
        ));
        Reservation::create($this->reservationData(
            $individual->id,
            'DASH-DEPARTURE-'.uniqid(),
            '2026-07-15',
            '2026-07-17',
            'confirmé'
        ));
        Reservation::create($this->reservationData(
            $individual->id,
            'DASH-CANCELLED-'.uniqid(),
            '2026-07-17',
            '2026-07-17',
            'annulé'
        ));

        $department = Departement::create([
            'nom' => 'Département tableau de bord '.uniqid(),
            'actif' => true,
        ]);
        $type = ReclamationType::create([
            'nom' => 'Type tableau de bord '.uniqid(),
            'actif' => true,
        ]);
        $channel = ReclamationCanal::create([
            'nom' => 'Canal tableau de bord '.uniqid(),
            'est_autre' => false,
            'actif' => true,
        ]);

        foreach (Reclamation::STATUSES as $index => $status) {
            Reclamation::create([
                'reclamation_num' => 'DASH-REC-'.uniqid().'-'.$index,
                'reclamation_type_id' => $type->id,
                'description' => 'Réclamation de test du tableau de bord',
                'reclamation_canal_id' => $channel->id,
                'date_reclamation' => '2026-07-17',
                'departement_id' => $department->id,
                'priorite' => 'normale',
                'suivi' => $status,
            ]);
        }

        $category = CategorieEquipement::create([
            'nom' => 'Catégorie tableau de bord '.uniqid(),
        ]);
        Equipement::create([
            'nom' => 'Équipement tableau de bord',
            'numero_serie' => 'DASH-EQ-'.uniqid(),
            'modele' => 'Test',
            'marque' => 'Test',
            'date_acquisition' => '2026-07-01',
            'localisation' => 'Réception',
            'statut' => 'en_maintenance',
            'categorie_id' => $category->id,
        ]);

        $expected = [
            'total_clients' => $baseline['total_clients'] + 2,
            'total_chambres' => $baseline['total_chambres'] + 1,
            'reservations_confirmees' => $baseline['reservations_confirmees'] + 2,
            'arrivees_aujourdhui' => $baseline['arrivees_aujourdhui'] + 1,
            'departs_aujourdhui' => $baseline['departs_aujourdhui'] + 1,
            'chambres_non_nettoyees' => $baseline['chambres_non_nettoyees'] + 1,
            'reclamations_ouvertes' => $baseline['reclamations_ouvertes'] + 3,
            'equipements_en_maintenance' => $baseline['equipements_en_maintenance'] + 1,
        ];

        $this->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertExactJson(['data' => $expected]);
    }

    private function reservationData(
        int $clientId,
        string $number,
        string $arrival,
        string $departure,
        string $status
    ): array {
        return [
            'reservation_num' => $number,
            'client_id' => $clientId,
            'client_type' => 'particulier',
            'client_name_snapshot' => 'Client Tableau de bord',
            'reservation_date' => '2026-07-16',
            'date_debut' => $arrival,
            'date_fin' => $departure,
            'status' => $status,
            'montant_total' => 0,
            'montant_reduction' => 0,
            'pricing_version' => 2,
            'legacy_pricing' => false,
        ];
    }
}
