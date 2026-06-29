<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('reclamation_historique', function (Blueprint $table) {
            $table->id();  // Auto-increment primary key
            $table->foreignId('reclamation_id')
            ->constrained()
            ->onDelete('cascade');  // ✅ Ensure this is correct  // Foreign key linking to reclamation
            $table->date('date');  // Date when the history entry was made
            $table->text('description');  // Description of what happened in the history entry (e.g., "Réclamation reçue", "Problème résolu")
            $table->timestamps();  // Automatically created_at and updated_at columns
        });
    }
    
    public function down()
    {
        Schema::dropIfExists('reclamation_historique');
    }
    
}; 