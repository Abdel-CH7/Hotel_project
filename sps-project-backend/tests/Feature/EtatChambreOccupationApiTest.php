<?php

namespace Tests\Feature;

use App\Models\Chambre;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class EtatChambreOccupationApiTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::create(
            2026,
            7,
            18,
            12,
            0,
            0,
            config('app.timezone')
        ));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_confirmed_current_reservation_returns_occupation_details_and_snapshot_name(): void
    {
        $room = $this->createRoom(number: 'OCC-101');
        $reservation = $this->reservationForRoom(
            $room,
            '2026-07-17',
            '2026-07-21',
            'confirmé',
            'Mohamed Amine'
        );

        $state = $this->roomStateFromIndex($room);

        $this->assertSame('occupée', $state['occupation']['statut']);
        $this->assertTrue($state['occupation']['occupee']);
        $this->assertSame($reservation->id, $state['occupation']['reservation']['id']);
        $this->assertSame($reservation->reservation_num, $state['occupation']['reservation']['numero']);
        $this->assertSame('confirmé', $state['occupation']['reservation']['statut']);
        $this->assertSame('2026-07-17', $state['occupation']['reservation']['date_debut']);
        $this->assertSame('2026-07-21', $state['occupation']['reservation']['date_fin']);
        $this->assertSame('Mohamed Amine', $state['occupation']['reservation']['client']);
    }

    public function test_pending_current_reservation_marks_room_as_occupied(): void
    {
        $room = $this->createRoom(number: 'OCC-102');
        $this->reservationForRoom($room, '2026-07-18', '2026-07-19', 'en attente');

        $state = $this->roomStateFromIndex($room);

        $this->assertTrue($state['occupation']['occupee']);
        $this->assertSame('occupée', $state['occupation']['statut']);
        $this->assertSame('en attente', $state['occupation']['reservation']['statut']);
    }

    public function test_cancelled_and_future_reservations_leave_rooms_free(): void
    {
        $cancelledRoom = $this->createRoom(number: 'OCC-103');
        $futureRoom = $this->createRoom(number: 'OCC-104');
        $this->reservationForRoom($cancelledRoom, '2026-07-17', '2026-07-20', 'annulé');
        $this->reservationForRoom($futureRoom, '2026-07-19', '2026-07-21', 'confirmé');

        $states = $this->roomStatesFromIndex();

        foreach ([$cancelledRoom, $futureRoom] as $room) {
            $occupation = $states->firstWhere('num_chambre', $room->num_chambre)['occupation'];
            $this->assertFalse($occupation['occupee']);
            $this->assertSame('libre', $occupation['statut']);
            $this->assertNull($occupation['reservation']);
        }
    }

    public function test_checkout_today_is_free_but_arrival_today_is_occupied(): void
    {
        $checkoutRoom = $this->createRoom(number: 'OCC-105');
        $arrivalRoom = $this->createRoom(number: 'OCC-106');
        $this->reservationForRoom($checkoutRoom, '2026-07-16', '2026-07-18', 'confirmé');
        $this->reservationForRoom($arrivalRoom, '2026-07-18', '2026-07-19', 'confirmé');

        $states = $this->roomStatesFromIndex();
        $checkoutOccupation = $states->firstWhere(
            'num_chambre',
            $checkoutRoom->num_chambre
        )['occupation'];
        $arrivalOccupation = $states->firstWhere(
            'num_chambre',
            $arrivalRoom->num_chambre
        )['occupation'];

        $this->assertFalse($checkoutOccupation['occupee']);
        $this->assertNull($checkoutOccupation['reservation']);
        $this->assertTrue($arrivalOccupation['occupee']);
        $this->assertSame('2026-07-18', $arrivalOccupation['reservation']['date_debut']);
        $this->assertSame('2026-07-19', $arrivalOccupation['reservation']['date_fin']);
    }

    public function test_occupation_is_independent_from_cleanliness_and_maintenance(): void
    {
        $room = $this->createRoom(number: 'OCC-107');
        $room->etatChambre->update([
            'status' => 'non nettoyée',
            'maintenance' => true,
            'commentaire' => 'État opérationnel indépendant',
        ]);
        $this->reservationForRoom($room, '2026-07-17', '2026-07-20', 'confirmé');

        $state = $this->roomStateFromIndex($room);

        $this->assertSame('non nettoyée', $state['status']);
        $this->assertTrue($state['maintenance']);
        $this->assertSame('État opérationnel indépendant', $state['commentaire']);
        $this->assertTrue($state['occupation']['occupee']);
        $this->assertSame('occupée', $state['occupation']['statut']);
    }

    public function test_historical_conflicts_prefer_confirmed_then_earliest_start_then_lowest_id(): void
    {
        $room = $this->createRoom(number: 'OCC-108');
        $this->reservationForRoom($room, '2026-07-14', '2026-07-20', 'en attente');
        $laterConfirmed = $this->reservationForRoom(
            $room,
            '2026-07-16',
            '2026-07-20',
            'confirmé'
        );
        $preferred = $this->reservationForRoom(
            $room,
            '2026-07-15',
            '2026-07-20',
            'confirmé'
        );
        $sameDateHigherId = $this->reservationForRoom(
            $room,
            '2026-07-15',
            '2026-07-21',
            'confirmé'
        );

        $selected = $this->roomStateFromIndex($room)['occupation']['reservation'];

        $this->assertNotSame($laterConfirmed->id, $preferred->id);
        $this->assertGreaterThan($preferred->id, $sameDateHigherId->id);
        $this->assertSame($preferred->id, $selected['id']);
        $this->assertSame('confirmé', $selected['statut']);
        $this->assertSame('2026-07-15', $selected['date_debut']);
    }

    public function test_calculating_occupation_does_not_write_database_records(): void
    {
        $room = $this->createRoom(number: 'OCC-109');
        $this->reservationForRoom($room, '2026-07-17', '2026-07-20', 'confirmé');
        $tables = ['chambres', 'etat_chambre', 'reservations', 'details_reservation'];
        $before = collect($tables)->mapWithKeys(fn (string $table): array => [
            $table => [
                'count' => DB::table($table)->count(),
                'updated_at' => DB::table($table)->orderBy('id')->pluck('updated_at', 'id')->all(),
            ],
        ])->all();

        $this->getJson('/api/etat-chambre')->assertOk();

        $after = collect($tables)->mapWithKeys(fn (string $table): array => [
            $table => [
                'count' => DB::table($table)->count(),
                'updated_at' => DB::table($table)->orderBy('id')->pluck('updated_at', 'id')->all(),
            ],
        ])->all();

        $this->assertSame($before, $after);
    }

    private function reservationForRoom(
        Chambre $room,
        string $start,
        string $end,
        string $status,
        string $snapshot = 'Client occupation'
    ): Reservation {
        $reservation = $this->createBlockingReservation($room, $start, $end, $status);
        $reservation->update(['client_name_snapshot' => $snapshot]);

        return $reservation->refresh();
    }

    private function roomStateFromIndex(Chambre $room): array
    {
        return $this->roomStatesFromIndex()
            ->firstWhere('num_chambre', $room->num_chambre);
    }

    private function roomStatesFromIndex(): \Illuminate\Support\Collection
    {
        return collect($this->getJson('/api/etat-chambre')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->json('etat_chambres'));
    }
}
