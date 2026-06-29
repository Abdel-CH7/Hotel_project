<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class DropIntervenantsTable extends Migration
{
    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('intervenants');
    }

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        // La méthode "up" reste vide ici
    }
}
