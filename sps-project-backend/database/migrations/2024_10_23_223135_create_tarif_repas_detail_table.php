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
        Schema::create('tarif_repas_detail', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger("type_repas");
            $table->unsignedInteger("montant");
            $table->unsignedBigInteger("tarif_repas");
            $table->foreign('type_repas')->references('id')->on('types_repas')->onDelete('cascade');
            $table->foreign('tarif_repas')->references('id')->on('tarifs_repas')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarif_repas_detail');
    }
};
