<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('reclamations', function (Blueprint $table) {
            $table->id();  // Auto-increment primary key
            $table->string('type_reclamation');  // e.g., "Problème de propreté", "Problème de maintenance"
            $table->string('reclamer_a_travers');  // e.g., "Email", "Appel téléphonique"
            $table->string('departement_affecte');  // e.g., "Entretien", "Réception", "Maintenance"
            $table->text('suivi')->nullable();  // Tracking of the claim status
            $table->text('reponse')->nullable();  // The response to the claim
            $table->timestamps();  // Automatically created_at and updated_at columns
        });
    }
    
    public function down()
    {
        Schema::dropIfExists('reclamations');
    }
    
}; 