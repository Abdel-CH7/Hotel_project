<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipements', function (Blueprint $table) {
            $table->string('impact_chambre', 40)->default('aucun')->after('statut');
            $table->index(
                ['chambre_id', 'statut', 'impact_chambre'],
                'equipements_room_status_impact_index'
            );
        });

        Schema::table('categories_equipements', function (Blueprint $table) {
            $table->foreignId('maintenance_type_id')
                ->nullable()
                ->after('description')
                ->constrained('types_maintenance')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('categories_equipements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('maintenance_type_id');
        });

        Schema::table('equipements', function (Blueprint $table) {
            $table->dropIndex('equipements_room_status_impact_index');
            $table->dropColumn('impact_chambre');
        });
    }
};
