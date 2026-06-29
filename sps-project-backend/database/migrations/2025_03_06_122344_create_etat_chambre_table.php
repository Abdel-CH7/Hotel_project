<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEtatChambreTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('etat_chambre', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id(); // Primary key for etat_chambre
            
            // Define num_chambre as a string to match the chambres table
            $table->string('num_chambre');
            
            $table->string('status');
            $table->date('date_nettoyage')->nullable();
            $table->string('nettoyée_par')->nullable();
            $table->boolean('maintenance')->default(false);
            $table->string('maintenance_type')->nullable();
            $table->date('date_debut_maintenance')->nullable();
            $table->date('date_fin_maintenance')->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamps();
    
            // Define foreign key constraints
            $table->foreign('num_chambre')
                  ->references('num_chambre')->on('chambres')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('etat_chambre');
    }
}