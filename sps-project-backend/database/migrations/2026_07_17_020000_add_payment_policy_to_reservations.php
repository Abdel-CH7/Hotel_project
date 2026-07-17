<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table): void {
            $table->string('politique_paiement', 50)
                ->default('paiement_sur_place')
                ->after('montant_total');
            $table->decimal('montant_acompte_requis', 12, 2)
                ->nullable()
                ->after('politique_paiement');
            $table->date('date_limite_paiement')
                ->nullable()
                ->after('montant_acompte_requis');
            $table->index(
                ['client_type', 'client_id', 'politique_paiement', 'status'],
                'reservations_credit_exposure_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table): void {
            $table->dropIndex('reservations_credit_exposure_index');
            $table->dropColumn([
                'politique_paiement',
                'montant_acompte_requis',
                'date_limite_paiement',
            ]);
        });
    }
};
