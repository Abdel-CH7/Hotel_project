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
        Schema::create('enfants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idClient');
            $table->string('name')->nullable();
            $table->string('prenom')->nullable();
            $table->string('type')->nullable();
            $table->integer('age')->nullable();
            $table->foreign('idClient')->references('id')->on('clients_particulier')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enfants');
    }
};
