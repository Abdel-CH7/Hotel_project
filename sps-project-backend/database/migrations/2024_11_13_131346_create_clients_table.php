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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('CodeClient')->unique();
            $table->string('raison_sociale');
            $table->index('raison_sociale');
            $table->string('adresse');
            $table->string('type_client')->nullable();
            $table->string('categorie')->nullable();
            $table->string('tele')->nullable();
            $table->string('ville')->nullable();
            $table->string('jour')->nullable();
            $table->string('abreviation')->nullable();
            $table->string('code_postal')->nullable();
            $table->string('logoC')->nullable();
            $table->string('seince')->nullable();
            $table->string('montant_plafond')->nullable();
            $table->string('ice', 80)->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('mod_id')->nullable();
            $table->foreign('mod_id')->references('id')->on('mode_paimants')->onDelete('cascade');
            $table->unsignedBigInteger('zone_id')->nullable();
            $table->foreign('zone_id')->references('id')->on('zones')->onDelete('cascade');
            $table->unsignedBigInteger('region_id')->nullable();
            $table->foreign('region_id')->references('id')->on('regions')->onDelete('cascade');
            $table->unsignedBigInteger('secteur_id')->nullable();
            $table->foreign('secteur_id')->references('id')->on('secteur_clients')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
