<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_paiements', function (Blueprint $table): void {
            $table->id();
            $table->string('paiement_num')->unique();
            $table->foreignId('reservation_id')->constrained('reservations')->restrictOnDelete();
            $table->foreignId('mode_paiement_id')->constrained('mode_paimants')->restrictOnDelete();
            $table->string('type_paiement', 30);
            $table->decimal('montant', 12, 2);
            $table->date('date_paiement');
            $table->string('reference', 120)->nullable();
            $table->text('commentaire')->nullable();
            $table->string('statut', 20)->default('valide');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('annule_at')->nullable();
            $table->foreignId('annule_par_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('motif_annulation')->nullable();
            $table->timestamps();

            $table->index(['reservation_id', 'statut']);
            $table->index('date_paiement');
            $table->index('mode_paiement_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_paiements');
    }
};
