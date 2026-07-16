<?php

use App\Support\ReservationLegacyBackfill;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        (new ReservationLegacyBackfill())->run();
    }

    public function down(): void
    {
        // Historical markers and snapshots are intentionally preserved.
    }
};
