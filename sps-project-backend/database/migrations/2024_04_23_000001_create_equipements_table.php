<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('equipements', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('numero_serie')->unique();
            $table->string('modele');
            $table->string('marque');
            $table->date('date_acquisition');
            $table->date('date_fin_garantie')->nullable();
            $table->string('fournisseur')->nullable();
            $table->string('localisation');
            $table->enum('statut', ['disponible', 'en_maintenance', 'hors_service'])->default('disponible');
            $table->foreignId('categorie_id')->constrained('categories_equipements')->onDelete('cascade');
            $table->decimal('prix_achat', 10, 2)->nullable();
            $table->string('document_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipements');
    }
}; 