<?php

namespace Tests\Feature;

use App\Exceptions\ReservationDomainException;
use App\Services\ReservationClientResolver;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\Support\BuildsReservationDomainFixtures;
use Tests\TestCase;

class ReservationClientResolverTest extends TestCase
{
    use BuildsReservationDomainFixtures;
    use DatabaseTransactions;

    public function test_company_client_is_resolved_with_normalized_name(): void
    {
        $client = $this->createCompanyClient('  Hôtel Atlas  ');

        $resolved = app(ReservationClientResolver::class)->resolve('societe', $client->id);

        $this->assertSame('societe', $resolved['client_type']);
        $this->assertSame($client->id, $resolved['client_id']);
        $this->assertSame('Hôtel Atlas', $resolved['display_name']);
    }

    public function test_individual_client_is_resolved_with_normalized_full_name(): void
    {
        $client = $this->createIndividualClient('  Alaoui ', ' Sara  ');

        $resolved = app(ReservationClientResolver::class)->resolve('particulier', $client->id);

        $this->assertSame('Alaoui Sara', $resolved['display_name']);
    }

    public function test_invalid_type_nonexistent_client_and_mismatched_type_fail(): void
    {
        $company = $this->createCompanyClient();

        $this->assertDomainError(
            fn () => app(ReservationClientResolver::class)->resolve('agent', $company->id),
            'invalid_client_type'
        );
        $this->assertDomainError(
            fn () => app(ReservationClientResolver::class)->resolve('societe', 999999999),
            'client_not_found'
        );
        $this->assertDomainError(
            fn () => app(ReservationClientResolver::class)->resolve('particulier', $company->id),
            'client_not_found'
        );
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
