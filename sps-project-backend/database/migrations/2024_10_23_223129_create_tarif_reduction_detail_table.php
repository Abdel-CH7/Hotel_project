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
        Schema::create('tarif_reduction_detail', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger("type_reduction");
            $table->unsignedInteger("montant");
            $table->integer("percentage");
            $table->unsignedBigInteger("tarif_reduction");
            $table->foreign('type_reduction')->references('id')->on('types_reduction')->onDelete('cascade');
            $table->foreign('tarif_reduction')->references('id')->on('tarifs_reduction')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarif_reduction_detail');
    }
};
