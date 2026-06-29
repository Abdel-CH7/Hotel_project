<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Add all tariff-related columns
            $table->decimal('montant_total', 10, 2)->default(0)->after('status');
            $table->decimal('montant_reduction', 10, 2)->default(0)->after('montant_total');
            $table->unsignedBigInteger('tarif_actuel_id')->nullable()->after('montant_reduction');
            $table->unsignedBigInteger('tarif_repas_id')->nullable()->after('tarif_actuel_id');

            // Add foreign key constraints
            $table->foreign('tarif_actuel_id')
                  ->references('id')
                  ->on('tarifs_actuel')
                  ->onDelete('set null');
                  
            $table->foreign('tarif_repas_id')
                  ->references('id')
                  ->on('tarif_repas_detail')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Remove foreign keys first
            $table->dropForeign(['tarif_actuel_id']);
            $table->dropForeign(['tarif_repas_id']);
            
            // Then remove columns
            $table->dropColumn([
                'montant_total',
                'montant_reduction',
                'tarif_actuel_id',
                'tarif_repas_id'
            ]);
        });
    }
};