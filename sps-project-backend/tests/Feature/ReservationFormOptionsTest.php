<?php

namespace Tests\Feature;

use App\Models\TarifRepasDetail;
use App\Models\TypeRepas;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationFormOptionsTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_meal_options_are_valid_for_the_requested_period(): void
    {
        $roomType = $this->createRoomType(1, 0);
        [$roomGrid] = $this->createRoomGridDetail($roomType);
        [$mealGrid, , $mealType] = $this->createMealGridDetail(null, '25.00');
        $this->createPeriod('2097-01-01', '2097-01-31', $roomGrid, $mealGrid);

        $this->getJson('/api/reservations/form-options?date_debut=2097-01-10&date_fin=2097-01-12')
            ->assertOk()
            ->assertJsonPath('data.repas.0.type_repas_id', $mealType->id)
            ->assertJsonPath('data.repas.0.nom', $mealType->type_repas)
            ->assertJsonMissingPath('data.repas.0.prix_par_personne');
    }

    public function test_cross_period_meals_are_the_intersection_of_usable_types(): void
    {
        $roomType = $this->createRoomType(1, 0);
        [$januaryRoomGrid] = $this->createRoomGridDetail($roomType);
        [$februaryRoomGrid] = $this->createRoomGridDetail($roomType);
        [$januaryMealGrid, , $commonType] = $this->createMealGridDetail(null, '20.00');
        [$februaryMealGrid] = $this->createMealGridDetail($commonType, '22.00');
        $januaryOnlyType = TypeRepas::create([
            'code' => 'JAN-'.uniqid(),
            'type_repas' => 'Repas janvier '.uniqid(),
        ]);
        TarifRepasDetail::create([
            'tarif_repas_id' => $januaryMealGrid->id,
            'type_repas_id' => $januaryOnlyType->id,
            'prix_par_personne' => '18.00',
        ]);
        $this->createPeriod('2097-01-01', '2097-01-31', $januaryRoomGrid, $januaryMealGrid);
        $this->createPeriod('2097-02-01', '2097-02-28', $februaryRoomGrid, $februaryMealGrid);

        $response = $this->getJson(
            '/api/reservations/form-options?date_debut=2097-01-31&date_fin=2097-02-03'
        )->assertOk();

        $this->assertSame([$commonType->id], collect($response->json('data.repas'))->pluck('type_repas_id')->all());
    }

    public function test_reduction_options_come_only_from_the_arrival_period(): void
    {
        $roomType = $this->createRoomType(1, 0);
        [$firstRoomGrid] = $this->createRoomGridDetail($roomType);
        [$secondRoomGrid] = $this->createRoomGridDetail($roomType);
        [$firstReductionGrid, , $arrivalReduction] = $this->createReductionGridDetail();
        [$secondReductionGrid, , $laterReduction] = $this->createReductionGridDetail();
        $this->createPeriod('2097-03-01', '2097-03-31', $firstRoomGrid, null, $firstReductionGrid);
        $this->createPeriod('2097-04-01', '2097-04-30', $secondRoomGrid, null, $secondReductionGrid);

        $response = $this->getJson(
            '/api/reservations/form-options?date_debut=2097-03-31&date_fin=2097-04-03'
        )->assertOk();

        $ids = collect($response->json('data.reductions'))->pluck('type_reduction_id')->all();
        $this->assertSame([$arrivalReduction->id], $ids);
        $this->assertNotContains($laterReduction->id, $ids);
    }

    public function test_form_options_endpoint_is_read_only(): void
    {
        $roomType = $this->createRoomType(1, 0);
        [$roomGrid] = $this->createRoomGridDetail($roomType);
        [$mealGrid] = $this->createMealGridDetail();
        [$reductionGrid] = $this->createReductionGridDetail();
        $this->createPeriod('2097-05-01', '2097-05-31', $roomGrid, $mealGrid, $reductionGrid);
        $tables = [
            'tarifs_actuel',
            'tarif_chambre_detail',
            'tarif_repas_detail',
            'tarif_reduction_detail',
            'reservations',
        ];
        $before = collect($tables)->mapWithKeys(fn (string $table): array => [
            $table => DB::table($table)->count(),
        ])->all();

        $this->getJson('/api/reservations/form-options?date_debut=2097-05-10&date_fin=2097-05-12')
            ->assertOk();

        $after = collect($tables)->mapWithKeys(fn (string $table): array => [
            $table => DB::table($table)->count(),
        ])->all();
        $this->assertSame($before, $after);
    }
}
