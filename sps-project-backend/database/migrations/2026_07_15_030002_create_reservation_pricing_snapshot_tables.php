<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_room_price_segments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('reservation_room_id');
            $table->unsignedBigInteger('tarif_actuel_id')->nullable();
            $table->unsignedBigInteger('tarif_chambre_detail_id')->nullable();
            $table->date('segment_date_debut');
            $table->date('segment_date_fin');
            $table->unsignedInteger('nuits');
            $table->unsignedTinyInteger('occupation_tarifee');
            $table->decimal('prix_occupation_snapshot', 12, 2);
            $table->unsignedSmallInteger('lits_supplementaires')->default(0);
            $table->decimal('prix_lit_supplementaire_snapshot', 12, 2)->default(0);
            $table->decimal('prix_par_nuit_snapshot', 12, 2);
            $table->decimal('montant_segment', 12, 2);
            $table->string('periode_designation_snapshot')->nullable();
            $table->string('plan_designation_snapshot')->nullable();
            $table->timestamps();

            $table->foreign('reservation_room_id', 'rrps_reservation_room_fk')
                ->references('id')->on('details_reservation')->cascadeOnDelete();
            $table->foreign('tarif_actuel_id', 'rrps_tarif_actuel_fk')
                ->references('id')->on('tarifs_actuel')->restrictOnDelete();
            $table->foreign('tarif_chambre_detail_id', 'rrps_room_rate_detail_fk')
                ->references('id')->on('tarif_chambre_detail')->restrictOnDelete();

            $table->index('reservation_room_id', 'rrps_reservation_room_index');
            $table->index('tarif_actuel_id', 'rrps_tarif_actuel_index');
            $table->index(['segment_date_debut', 'segment_date_fin'], 'rrps_segment_dates_index');
            $table->unique(['reservation_room_id', 'segment_date_debut'], 'rrps_room_start_unique');
        });

        Schema::create('reservation_meals', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('reservation_id');
            $table->unsignedBigInteger('tarif_actuel_id')->nullable();
            $table->unsignedBigInteger('tarif_repas_detail_id')->nullable();
            $table->unsignedBigInteger('type_repas_id')->nullable();
            $table->string('type_repas_nom_snapshot');
            $table->date('segment_date_debut');
            $table->date('segment_date_fin');
            $table->decimal('prix_unitaire_snapshot', 12, 2);
            $table->unsignedSmallInteger('quantite_par_jour');
            $table->unsignedInteger('jours_factures');
            $table->decimal('montant_total', 12, 2);
            $table->timestamps();

            $table->foreign('reservation_id', 'reservation_meals_reservation_fk')
                ->references('id')->on('reservations')->cascadeOnDelete();
            $table->foreign('tarif_actuel_id', 'reservation_meals_tarif_actuel_fk')
                ->references('id')->on('tarifs_actuel')->restrictOnDelete();
            $table->foreign('tarif_repas_detail_id', 'reservation_meals_rate_detail_fk')
                ->references('id')->on('tarif_repas_detail')->restrictOnDelete();
            $table->foreign('type_repas_id', 'reservation_meals_type_repas_fk')
                ->references('id')->on('types_repas')->restrictOnDelete();

            $table->index('reservation_id', 'reservation_meals_reservation_index');
            $table->index('tarif_actuel_id', 'reservation_meals_tarif_actuel_index');
            $table->index('type_repas_id', 'reservation_meals_type_repas_index');
            $table->index(['segment_date_debut', 'segment_date_fin'], 'reservation_meals_segment_dates_index');
            $table->unique(
                ['reservation_id', 'type_repas_id', 'segment_date_debut'],
                'reservation_meals_type_start_unique'
            );
        });

        Schema::create('reservation_reductions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('reservation_id');
            $table->unsignedBigInteger('tarif_actuel_id')->nullable();
            $table->unsignedBigInteger('tarif_reduction_detail_id')->nullable();
            $table->unsignedBigInteger('type_reduction_id')->nullable();
            $table->string('type_reduction_nom_snapshot');
            $table->decimal('montant_fixe_snapshot', 12, 2)->default(0);
            $table->decimal('pourcentage_snapshot', 5, 2)->default(0);
            $table->decimal('sous_total_eligible', 12, 2);
            $table->decimal('montant_applique', 12, 2);
            $table->string('formule_version')->default('percentage_plus_fixed_v1');
            $table->timestamps();

            $table->unique('reservation_id', 'reservation_reductions_reservation_unique');
            $table->foreign('reservation_id', 'reservation_reductions_reservation_fk')
                ->references('id')->on('reservations')->cascadeOnDelete();
            $table->foreign('tarif_actuel_id', 'reservation_reductions_tarif_actuel_fk')
                ->references('id')->on('tarifs_actuel')->restrictOnDelete();
            $table->foreign('tarif_reduction_detail_id', 'reservation_reductions_detail_fk')
                ->references('id')->on('tarif_reduction_detail')->restrictOnDelete();
            $table->foreign('type_reduction_id', 'reservation_reductions_type_fk')
                ->references('id')->on('types_reduction')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_reductions');
        Schema::dropIfExists('reservation_meals');
        Schema::dropIfExists('reservation_room_price_segments');
    }
};
