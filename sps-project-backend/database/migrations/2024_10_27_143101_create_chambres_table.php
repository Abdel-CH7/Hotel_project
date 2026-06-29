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
        Schema::create('chambres', function (Blueprint $table) {
            $table->id();
            $table->string(column: "num_chambre")->unique();
            $table->unsignedBigInteger("type_chambre");
            $table->unsignedInteger("nb_lit");
            $table->unsignedInteger("nb_salle");
            $table->enum("climat", ["oui", "non"]);
            $table->unsignedInteger("wifi");
            $table->unsignedBigInteger("vue_id");
            $table->unsignedBigInteger("etage_id");
            $table->foreign('type_chambre')->references('id')->on('types_chambre');
            $table->foreign('vue_id')->references('id')->on('vues');
            $table->foreign('etage_id')->references('id')->on('etages');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chambres');
    }
};
