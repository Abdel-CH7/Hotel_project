<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarifs_actuel', function (Blueprint $table): void {
            $table->dropForeign('tarifs_actuel_tarif_chambre_foreign');
            $table->dropForeign('tarifs_actuel_tarif_repas_foreign');
            $table->dropForeign('tarifs_actuel_tarif_reduction_foreign');
        });
        Schema::table('tarifs_actuel', function (Blueprint $table): void {
            $table->renameColumn('tarif_chambre', 'tarif_chambre_id');
            $table->renameColumn('tarif_repas', 'tarif_repas_id');
            $table->renameColumn('tarif_reduction', 'tarif_reduction_id');
            $table->string('designation')->nullable()->after('id');
            $table->string('statut', 20)->default('brouillon')->after('date_fin');
        });
        Schema::table('tarifs_actuel', function (Blueprint $table): void {
            $table->date('date_debut')->change();
            $table->date('date_fin')->change();
            $table->unsignedBigInteger('tarif_repas_id')->nullable()->change();
            $table->unsignedBigInteger('tarif_reduction_id')->nullable()->change();
        });

        DB::table('tarifs_actuel')->orderBy('id')->get()->each(function (object $period): void {
            DB::table('tarifs_actuel')->where('id', $period->id)->update([
                'designation' => "Période historique {$period->id} ({$period->date_debut} - {$period->date_fin})",
                'statut' => 'archive',
            ]);
        });

        Schema::table('tarifs_actuel', function (Blueprint $table): void {
            $table->string('designation')->nullable(false)->change();
            $table->foreign('tarif_chambre_id')->references('id')->on('tarifs_chambre')->restrictOnDelete();
            $table->foreign('tarif_repas_id')->references('id')->on('tarifs_repas')->restrictOnDelete();
            $table->foreign('tarif_reduction_id')->references('id')->on('tarifs_reduction')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tarifs_actuel', function (Blueprint $table): void {
            $table->dropForeign(['tarif_chambre_id']);
            $table->dropForeign(['tarif_repas_id']);
            $table->dropForeign(['tarif_reduction_id']);
            $table->dateTime('date_debut')->change();
            $table->dateTime('date_fin')->change();
            $table->unsignedBigInteger('tarif_repas_id')->nullable(false)->change();
            $table->unsignedBigInteger('tarif_reduction_id')->nullable(false)->change();
        });
        Schema::table('tarifs_actuel', function (Blueprint $table): void {
            $table->dropColumn(['designation', 'statut']);
            $table->renameColumn('tarif_chambre_id', 'tarif_chambre');
            $table->renameColumn('tarif_repas_id', 'tarif_repas');
            $table->renameColumn('tarif_reduction_id', 'tarif_reduction');
        });
        Schema::table('tarifs_actuel', function (Blueprint $table): void {
            $table->foreign('tarif_chambre')->references('id')->on('tarifs_chambre')->cascadeOnDelete();
            $table->foreign('tarif_repas')->references('id')->on('tarifs_repas')->cascadeOnDelete();
            $table->foreign('tarif_reduction')->references('id')->on('tarifs_reduction')->cascadeOnDelete();
        });
    }
};
