<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('types_chambre', function (Blueprint $table): void {
            $table->unsignedTinyInteger('capacite_standard')->nullable()->after('nb_salle');
            $table->unsignedTinyInteger('lits_supplementaires_max')->nullable()->after('capacite_standard');
        });
    }

    public function down(): void
    {
        Schema::table('types_chambre', function (Blueprint $table): void {
            $table->dropColumn(['capacite_standard', 'lits_supplementaires_max']);
        });
    }
};
