<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    protected bool $authenticateApiRequests = true;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->authenticateApiRequests) {
            Sanctum::actingAs(User::factory()->create());
        }
    }
}
