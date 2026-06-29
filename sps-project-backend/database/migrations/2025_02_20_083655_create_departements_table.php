<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('departements', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->unique();
            $table->timestamps();
        });

        // Ajouter la clé étrangère dans la table des réclamations
        Schema::table('reclamations', function (Blueprint $table) {
            $table->foreignId('departement_id')->nullable()->constrained('departements')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('reclamations', function (Blueprint $table) {
            $table->dropForeign(['departement_id']);
            $table->dropColumn('departement_id');
        });

        Schema::dropIfExists('departements');
    }
}; 