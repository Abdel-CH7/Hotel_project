<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarif_chambre_detail', function (Blueprint $table): void {
            $table->dropForeign('tarif_chambre_detail_type_chambre_foreign');
            $table->foreign('type_chambre', 'tarif_chambre_detail_type_chambre_foreign')
                ->references('id')
                ->on('types_chambre')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tarif_chambre_detail', function (Blueprint $table): void {
            $table->dropForeign('tarif_chambre_detail_type_chambre_foreign');
            $table->foreign('type_chambre', 'tarif_chambre_detail_type_chambre_foreign')
                ->references('id')
                ->on('types_chambre')
                ->cascadeOnDelete();
        });
    }
};
