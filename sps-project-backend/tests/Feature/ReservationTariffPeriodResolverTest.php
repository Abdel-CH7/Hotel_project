<?php

namespace Tests\Feature;

use App\Exceptions\ReservationDomainException;
use App\Services\ReservationTariffPeriodResolver;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationTariffPeriodResolverTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_one_active_period_covers_the_complete_half_open_stay(): void
    {
        $type = $this->createRoomType();
        [$grid] = $this->createRoomGridDetail($type);
        $period = $this->createPeriod('2090-07-01', '2090-07-31', $grid);

        $result = app(ReservationTariffPeriodResolver::class)
            ->resolve('2090-07-15', '2090-07-18');

        $this->assertSame(3, $result['nuits']);
        $this->assertCount(1, $result['segments']);
        $this->assertSame($period->id, $result['segments'][0]['tarif_actuel_id']);
        $this->assertSame('2090-07-18', $result['segments'][0]['segment_date_fin']);
    }

    public function test_cross_period_stay_produces_two_contiguous_segments(): void
    {
        $type = $this->createRoomType();
        [$julyGrid] = $this->createRoomGridDetail($type);
        [$augustGrid] = $this->createRoomGridDetail($type);
        $july = $this->createPeriod('2090-07-01', '2090-07-31', $julyGrid);
        $august = $this->createPeriod('2090-08-01', '2090-08-31', $augustGrid);

        $segments = app(ReservationTariffPeriodResolver::class)
            ->resolve('2090-07-31', '2090-08-03')['segments'];

        $this->assertCount(2, $segments);
        $this->assertSame([$july->id, $august->id], array_column($segments, 'tarif_actuel_id'));
        $this->assertSame([1, 2], array_column($segments, 'nuits'));
        $this->assertSame('2090-08-01', $segments[0]['segment_date_fin']);
        $this->assertSame('2090-08-03', $segments[1]['segment_date_fin']);
    }

    public function test_missing_service_night_fails_clearly(): void
    {
        $type = $this->createRoomType();
        [$grid] = $this->createRoomGridDetail($type);
        $this->createPeriod('2090-07-01', '2090-07-30', $grid);

        $this->assertDomainError(
            fn () => app(ReservationTariffPeriodResolver::class)->resolve('2090-07-30', '2090-08-01'),
            'tariff_period_missing'
        );
    }

    public function test_multiple_active_periods_for_one_night_fail_clearly(): void
    {
        $type = $this->createRoomType();
        [$firstGrid] = $this->createRoomGridDetail($type);
        [$secondGrid] = $this->createRoomGridDetail($type);
        $this->createPeriod('2090-07-01', '2090-07-31', $firstGrid);
        $this->createPeriod('2090-07-15', '2090-08-15', $secondGrid);

        $this->assertDomainError(
            fn () => app(ReservationTariffPeriodResolver::class)->resolve('2090-07-20', '2090-07-21'),
            'tariff_period_overlap'
        );
    }

    public function test_checkout_date_is_not_charged(): void
    {
        $type = $this->createRoomType();
        [$grid] = $this->createRoomGridDetail($type);
        $this->createPeriod('2090-09-01', '2090-09-10', $grid);

        $result = app(ReservationTariffPeriodResolver::class)
            ->resolve('2090-09-10', '2090-09-11');

        $this->assertSame(1, $result['nuits']);
        $this->assertSame('2090-09-11', $result['segments'][0]['segment_date_fin']);
    }

    public function test_tariff_period_end_date_is_an_inclusive_service_night(): void
    {
        $type = $this->createRoomType();
        [$grid] = $this->createRoomGridDetail($type);
        $period = $this->createPeriod('2090-08-01', '2090-08-31', $grid);

        $segment = app(ReservationTariffPeriodResolver::class)
            ->resolve('2090-08-31', '2090-09-01')['segments'][0];

        $this->assertSame($period->id, $segment['tarif_actuel_id']);
        $this->assertSame(1, $segment['nuits']);
    }

    private function assertDomainError(callable $callback, string $code): void
    {
        try {
            $callback();
            $this->fail("Expected reservation domain error {$code}.");
        } catch (ReservationDomainException $exception) {
            $this->assertSame($code, $exception->errorCode);
            $this->assertSame(422, $exception->recommendedStatus);
        }
    }
}
