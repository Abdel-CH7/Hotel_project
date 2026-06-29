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
        Schema::create('tarifs_actuel', function (Blueprint $table) {
            $table->id();
            $table->dateTime("date_debut");
            $table->dateTime("date_fin");
            $table->unsignedBigInteger("tarif_chambre");
            $table->unsignedBigInteger("tarif_repas");
            $table->unsignedBigInteger("tarif_reduction");
            $table->foreign('tarif_chambre')->references('id')->on('tarifs_chambre')->onDelete('cascade');
            $table->foreign('tarif_repas')->references('id')->on('tarifs_repas')->onDelete('cascade');
            $table->foreign('tarif_reduction')->references('id')->on('tarifs_reduction')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarifs_actuel');
    }
};
