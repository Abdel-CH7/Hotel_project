<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('reclamations', function (Blueprint $table) {
            // Modifier `suivi` en ENUM avec des valeurs fixes
            $table->enum('suivi', ['En cours', 'En attente', 'Traité', 'Résolu'])->default('En cours')->change();
        });
    }

    public function down()
    {
        Schema::table('reclamations', function (Blueprint $table) {
            $table->text('suivi')->nullable()->change(); // Revenir au texte normal en cas de rollback
        });
    }
}; 