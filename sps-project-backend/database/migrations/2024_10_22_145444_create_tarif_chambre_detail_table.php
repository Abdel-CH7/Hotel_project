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
        Schema::create('tarif_chambre_detail', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->unsignedBigInteger("tarif_chambre");
            $table->unsignedBigInteger("type_chambre");
            $table->double("single");
            $table->double("double");
            $table->double("triple");
            $table->unsignedInteger("lit_supp");
            $table->foreign('tarif_chambre')->references('id')->on('tarifs_chambre')->onDelete('cascade');
            $table->foreign('type_chambre')->references('id')->on('types_chambre')->onDelete('cascade');
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarif_chambre_detail');
    }
};
