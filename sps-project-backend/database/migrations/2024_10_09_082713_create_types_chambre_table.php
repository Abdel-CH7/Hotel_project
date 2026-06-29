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
        Schema::create('types_chambre', function (Blueprint $table) {
            $table->id();
            $table->string('code');
            $table->string("type_chambre");
            $table->unsignedBigInteger("nb_lit");
            $table->unsignedBigInteger("nb_salle");
            $table->text("commentaire")->nullable();
            $table->timestamps();
        });
    }

    /*
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chambres');
    }
};
