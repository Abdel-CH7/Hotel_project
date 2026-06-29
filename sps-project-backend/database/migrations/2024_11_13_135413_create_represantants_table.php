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
        Schema::create('represantants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_agent');
            $table->foreign('id_agent')->references( 'id')->on('agents')->onDelete('cascade');
            $table->integer('id_Client')->nullable();
            $table->unsignedBigInteger('id_SiteClientParticulier')->nullable();
            $table->unsignedBigInteger('id_SiteClient')->nullable();
            $table->foreign('id_SiteClientParticulier')->references( 'id')->on('site_clients_particulier')->onDelete('cascade');
            $table->foreign('id_SiteClient')->references( 'id')->on('site_clients')->onDelete('cascade');
            $table->string('type')->nullable();
            $table->date('date_debut')->nullable(); // Start date
            $table->date('date_fin')->nullable(); // End date
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('represantants');
    }
};
