<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarif_reduction_detail', function (Blueprint $table): void {
            $table->dropForeign('tarif_reduction_detail_tarif_reduction_foreign');
            $table->dropForeign('tarif_reduction_detail_type_reduction_foreign');
        });
        Schema::table('tarif_reduction_detail', function (Blueprint $table): void {
            $table->renameColumn('tarif_reduction', 'tarif_reduction_id');
            $table->renameColumn('type_reduction', 'type_reduction_id');
            $table->renameColumn('montant', 'montant_fixe');
            $table->renameColumn('percentage', 'pourcentage');
        });
        Schema::table('tarif_reduction_detail', function (Blueprint $table): void {
            $table->decimal('montant_fixe', 10, 2)->default(0)->change();
            $table->decimal('pourcentage', 5, 2)->default(0)->change();
            $table->foreign('tarif_reduction_id')->references('id')->on('tarifs_reduction')->cascadeOnDelete();
            $table->foreign('type_reduction_id')->references('id')->on('types_reduction')->restrictOnDelete();
            $table->unique(
                ['tarif_reduction_id', 'type_reduction_id'],
                'tarif_reduction_detail_grid_type_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('tarif_reduction_detail', function (Blueprint $table): void {
            $table->dropUnique('tarif_reduction_detail_grid_type_unique');
            $table->dropForeign(['tarif_reduction_id']);
            $table->dropForeign(['type_reduction_id']);
        });
        Schema::table('tarif_reduction_detail', function (Blueprint $table): void {
            $table->renameColumn('tarif_reduction_id', 'tarif_reduction');
            $table->renameColumn('type_reduction_id', 'type_reduction');
            $table->renameColumn('montant_fixe', 'montant');
            $table->renameColumn('pourcentage', 'percentage');
        });
        Schema::table('tarif_reduction_detail', function (Blueprint $table): void {
            $table->foreign('tarif_reduction')->references('id')->on('tarifs_reduction')->cascadeOnDelete();
            $table->foreign('type_reduction')->references('id')->on('types_reduction')->restrictOnDelete();
        });
    }
};
