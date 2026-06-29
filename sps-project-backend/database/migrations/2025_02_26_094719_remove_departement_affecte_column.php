<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('reclamations', function (Blueprint $table) {
            $table->dropColumn('departement_affecte'); // ✅ Remove the old column
        });
    }

    public function down()
    {
        Schema::table('reclamations', function (Blueprint $table) {
            $table->string('departement_affecte')->nullable(); // Rollback option
        });
    }
}; 