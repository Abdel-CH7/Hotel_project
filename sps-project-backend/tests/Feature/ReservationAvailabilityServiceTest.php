<?php

namespace Tests\Feature;

use App\Exceptions\ReservationDomainException;
use App\Models\CategorieEquipement;
use App\Models\Departement;
use App\Models\Equipement;
use App\Models\Reclamation;
use App\Models\ReclamationCanal;
use App\Models\ReclamationType;
use App\Services\ReservationAvailabilityService;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationAvailabilityServiceTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_non_overlapping_stays_and_checkout_checkin_boundary_are_available(): void
    {
        $room = $this->createRoom();
        $this->createBlockingReservation($room, '2091-01-10', '2091-01-12');
        $service = app(ReservationAvailabilityService::class);

        $this->assertCount(1, $service->assertRoomsAvailable([$room->id], '2091-01-08', '2091-01-10'));
        $this->assertCount(1, $service->assertRoomsAvailable([$room->id], '2091-01-12', '2091-01-14'));
    }

    public function test_pending_and_confirmed_reservations_block_overlapping_stays(): void
    {
        foreach (['en attente', 'confirmé'] as $status) {
            $room = $this->createRoom();
            $this->createBlockingReservation($room, '2091-02-10', '2091-02-15', $status);

            $this->assertDomainError(
                fn () => app(ReservationAvailabilityService::class)
                    ->assertRoomsAvailable([$room->id], '2091-02-12', '2091-02-14'),
                'room_unavailable',
                409
            );
        }
    }

    public function test_cancelled_reservation_does_not_block(): void
    {
        $room = $this->createRoom();
        $this->createBlockingReservation($room, '2091-03-10', '2091-03-15', 'annulé');

        $rooms = app(ReservationAvailabilityService::class)
            ->assertRoomsAvailable([$room->id], '2091-03-12', '2091-03-14');

        $this->assertTrue($rooms->contains('id', $room->id));
    }

    public function test_edit_excludes_current_reservation_but_another_reservation_still_blocks(): void
    {
        $room = $this->createRoom();
        $current = $this->createBlockingReservation($room, '2091-04-10', '2091-04-15');
        $service = app(ReservationAvailabilityService::class);

        $this->assertCount(1, $service->assertRoomsAvailable(
            [$room->id],
            '2091-04-11',
            '2091-04-14',
            $current->id
        ));

        $other = $this->createBlockingReservation($room, '2091-04-12', '2091-04-13', 'confirmé');
        $this->assertNotSame($current->id, $other->id);
        $this->assertDomainError(
            fn () => $service->assertRoomsAvailable(
                [$room->id],
                '2091-04-11',
                '2091-04-14',
                $current->id
            ),
            'room_unavailable',
            409
        );
    }

    public function test_overlapping_and_open_ended_maintenance_block(): void
    {
        $room = $this->createRoom();
        DB::table('etat_chambre')->where('num_chambre', $room->num_chambre)->update([
            'maintenance' => true,
            'date_debut_maintenance' => '2091-05-11',
            'date_fin_maintenance' => '2091-05-13',
        ]);

        $this->assertDomainError(
            fn () => app(ReservationAvailabilityService::class)
                ->assertRoomsAvailable([$room->id], '2091-05-10', '2091-05-12'),
            'maintenance_overlap',
            409
        );

        DB::table('etat_chambre')->where('num_chambre', $room->num_chambre)->update([
            'date_fin_maintenance' => null,
        ]);
        $this->assertDomainError(
            fn () => app(ReservationAvailabilityService::class)
                ->assertRoomsAvailable([$room->id], '2091-06-01', '2091-06-02'),
            'maintenance_overlap',
            409
        );
    }

    public function test_room_level_maintenance_controls_available_room_results(): void
    {
        $room = $this->createRoom();
        $service = app(ReservationAvailabilityService::class);
        $start = '2091-05-20';
        $end = '2091-05-22';

        $this->assertContains($room->id, collect($service->availableRooms($start, $end))->pluck('id'));

        DB::table('etat_chambre')->where('num_chambre', $room->num_chambre)->update([
            'maintenance' => true,
            'date_debut_maintenance' => null,
            'date_fin_maintenance' => null,
        ]);
        $this->assertNotContains($room->id, collect($service->availableRooms($start, $end))->pluck('id'));

        DB::table('etat_chambre')->where('num_chambre', $room->num_chambre)->update([
            'maintenance' => false,
        ]);
        $this->assertContains($room->id, collect($service->availableRooms($start, $end))->pluck('id'));
    }

    public function test_complaints_and_equipment_maintenance_do_not_block_a_room(): void
    {
        $room = $this->createRoom();
        $department = Departement::create([
            'nom' => 'Département disponibilité '.uniqid(),
            'actif' => true,
        ]);
        $type = ReclamationType::create([
            'nom' => 'Type disponibilité '.uniqid(),
            'actif' => true,
        ]);
        $channel = ReclamationCanal::create([
            'nom' => 'Canal disponibilité '.uniqid(),
            'est_autre' => false,
            'actif' => true,
        ]);
        Reclamation::create([
            'reclamation_num' => 'AVAIL-REC-'.uniqid(),
            'chambre_id' => $room->id,
            'reclamation_type_id' => $type->id,
            'description' => 'Réclamation liée à une chambre disponible.',
            'reclamation_canal_id' => $channel->id,
            'date_reclamation' => '2091-05-20',
            'departement_id' => $department->id,
            'priorite' => 'urgente',
            'suivi' => Reclamation::STATUS_IN_PROGRESS,
        ]);

        $category = CategorieEquipement::create([
            'nom' => 'Catégorie disponibilité '.uniqid(),
        ]);
        Equipement::create([
            'nom' => 'Équipement de chambre en maintenance',
            'numero_serie' => 'AVAIL-EQ-'.uniqid(),
            'modele' => 'Test',
            'marque' => 'Test',
            'date_acquisition' => '2091-05-01',
            'localisation' => (string) $room->num_chambre,
            'chambre_id' => $room->id,
            'statut' => 'en_maintenance',
            'categorie_id' => $category->id,
        ]);

        $availableIds = collect(app(ReservationAvailabilityService::class)
            ->availableRooms('2091-05-20', '2091-05-22'))
            ->pluck('id');

        $this->assertContains($room->id, $availableIds);
        $this->assertDatabaseHas('etat_chambre', [
            'num_chambre' => $room->num_chambre,
            'maintenance' => false,
        ]);
    }

    public function test_maintenance_outside_half_open_stay_does_not_block(): void
    {
        $room = $this->createRoom();
        $service = app(ReservationAvailabilityService::class);

        DB::table('etat_chambre')->where('num_chambre', $room->num_chambre)->update([
            'maintenance' => true,
            'date_debut_maintenance' => '2091-06-01',
            'date_fin_maintenance' => '2091-06-03',
        ]);
        $this->assertCount(1, $service->assertRoomsAvailable([$room->id], '2091-06-04', '2091-06-06'));

        DB::table('etat_chambre')->where('num_chambre', $room->num_chambre)->update([
            'date_debut_maintenance' => '2091-06-10',
            'date_fin_maintenance' => '2091-06-12',
        ]);
        $this->assertCount(1, $service->assertRoomsAvailable([$room->id], '2091-06-08', '2091-06-10'));
    }

    public function test_cleaning_status_does_not_affect_booking_availability(): void
    {
        $room = $this->createRoom();
        DB::table('etat_chambre')->where('num_chambre', $room->num_chambre)->update([
            'status' => 'non nettoyée',
            'maintenance' => false,
        ]);

        $available = app(ReservationAvailabilityService::class)
            ->availableRooms('2091-07-01', '2091-07-03', null, [$room->id]);
        $metadata = collect($available)->firstWhere('id', $room->id);

        $this->assertNotNull($metadata);
        $this->assertTrue($metadata['selected']);
        $this->assertArrayHasKey('capacite_standard', $metadata);
    }

    public function test_duplicate_room_ids_and_invalid_date_ranges_fail(): void
    {
        $room = $this->createRoom();
        $service = app(ReservationAvailabilityService::class);

        $this->assertDomainError(
            fn () => $service->assertRoomsAvailable([$room->id, $room->id], '2091-08-01', '2091-08-02'),
            'duplicate_room',
            422
        );
        $this->assertDomainError(
            fn () => $service->assertRoomsAvailable([$room->id], '2091-08-02', '2091-08-02'),
            'invalid_date_range',
            422
        );
    }

    public function test_transaction_facing_method_locks_then_rechecks_overlap(): void
    {
        $room = $this->createRoom();
        $this->createBlockingReservation($room, '2091-09-10', '2091-09-12');
        $queries = [];
        DB::listen(function (QueryExecuted $query) use (&$queries): void {
            $queries[] = strtolower($query->sql);
        });

        $this->assertDomainError(
            fn () => DB::transaction(fn () => app(ReservationAvailabilityService::class)
                ->lockAndAssertRoomsAvailable([$room->id], '2091-09-10', '2091-09-11')),
            'room_unavailable',
            409
        );

        $lockIndex = collect($queries)->search(fn (string $sql): bool => str_contains($sql, 'for update'));
        $recheckIndex = collect($queries)->search(
            fn (string $sql): bool => str_contains($sql, 'details_reservation')
                && str_contains($sql, 'reservations')
                && str_contains($sql, 'date_debut')
        );
        $this->assertNotFalse($lockIndex);
        $this->assertNotFalse($recheckIndex);
        $this->assertLessThan($recheckIndex, $lockIndex);
    }

    private function assertDomainError(
        callable $callback,
        string $code,
        int $status
    ): void {
        try {
            $callback();
            $this->fail("Expected reservation domain error {$code}.");
        } catch (ReservationDomainException $exception) {
            $this->assertSame($code, $exception->errorCode);
            $this->assertSame($status, $exception->recommendedStatus);
            $this->assertNotSame('', $exception->getMessage());
        }
    }
}
