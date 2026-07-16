<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarif_chambre_detail', function (Blueprint $table): void {
            $table->dropForeign('tarif_chambre_detail_tarif_chambre_foreign');
            $table->dropForeign('tarif_chambre_detail_type_chambre_foreign');
        });

        Schema::table('tarif_chambre_detail', function (Blueprint $table): void {
            $table->renameColumn('tarif_chambre', 'tarif_chambre_id');
            $table->renameColumn('type_chambre', 'type_chambre_id');
            $table->renameColumn('single', 'prix_1_personne');
            $table->renameColumn('double', 'prix_2_personnes');
            $table->renameColumn('triple', 'prix_3_personnes');
            $table->renameColumn('lit_supp', 'prix_lit_supplementaire');
        });

        Schema::table('tarif_chambre_detail', function (Blueprint $table): void {
            $table->decimal('prix_1_personne', 10, 2)->nullable()->change();
            $table->decimal('prix_2_personnes', 10, 2)->nullable()->change();
            $table->decimal('prix_3_personnes', 10, 2)->nullable()->change();
            $table->decimal('prix_lit_supplementaire', 10, 2)->default(0)->change();
            $table->foreign('tarif_chambre_id')->references('id')->on('tarifs_chambre')->cascadeOnDelete();
            $table->foreign('type_chambre_id')->references('id')->on('types_chambre')->restrictOnDelete();
            $table->unique(
                ['tarif_chambre_id', 'type_chambre_id'],
                'tarif_chambre_detail_grid_type_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('tarif_chambre_detail', function (Blueprint $table): void {
            $table->dropUnique('tarif_chambre_detail_grid_type_unique');
            $table->dropForeign(['tarif_chambre_id']);
            $table->dropForeign(['type_chambre_id']);
        });
        Schema::table('tarif_chambre_detail', function (Blueprint $table): void {
            $table->renameColumn('tarif_chambre_id', 'tarif_chambre');
            $table->renameColumn('type_chambre_id', 'type_chambre');
            $table->renameColumn('prix_1_personne', 'single');
            $table->renameColumn('prix_2_personnes', 'double');
            $table->renameColumn('prix_3_personnes', 'triple');
            $table->renameColumn('prix_lit_supplementaire', 'lit_supp');
        });
        Schema::table('tarif_chambre_detail', function (Blueprint $table): void {
            $table->foreign('tarif_chambre')->references('id')->on('tarifs_chambre')->cascadeOnDelete();
            $table->foreign('type_chambre')->references('id')->on('types_chambre')->restrictOnDelete();
        });
    }
};
