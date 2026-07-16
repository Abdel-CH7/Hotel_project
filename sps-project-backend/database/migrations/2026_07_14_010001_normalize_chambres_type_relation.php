<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $orphanedRooms = DB::table('chambres as c')
            ->leftJoin('types_chambre as t', 't.id', '=', 'c.type_chambre')
            ->whereNull('t.id')
            ->pluck('c.id');

        if ($orphanedRooms->isNotEmpty()) {
            throw new RuntimeException(
                'Chambres sans TypeChambre valide (IDs: '.$orphanedRooms->implode(', ').'); migration interrompue.'
            );
        }

        Schema::table('chambres', function (Blueprint $table): void {
            $table->dropForeign('chambres_type_chambre_foreign');
        });

        Schema::table('chambres', function (Blueprint $table): void {
            $table->renameColumn('type_chambre', 'type_chambre_id');
        });

        Schema::table('chambres', function (Blueprint $table): void {
            $table->foreign('type_chambre_id', 'chambres_type_chambre_id_foreign')
                ->references('id')
                ->on('types_chambre')
                ->restrictOnDelete();
            $table->dropColumn(['nb_lit', 'nb_salle']);
        });
    }

    public function down(): void
    {
        Schema::table('chambres', function (Blueprint $table): void {
            $table->unsignedInteger('nb_lit')->nullable()->after('type_chambre_id');
            $table->unsignedInteger('nb_salle')->nullable()->after('nb_lit');
        });

        DB::statement(
            'UPDATE chambres c JOIN types_chambre t ON t.id = c.type_chambre_id '
            .'SET c.nb_lit = t.nb_lit, c.nb_salle = t.nb_salle'
        );

        Schema::table('chambres', function (Blueprint $table): void {
            $table->unsignedInteger('nb_lit')->nullable(false)->change();
            $table->unsignedInteger('nb_salle')->nullable(false)->change();
            $table->dropForeign('chambres_type_chambre_id_foreign');
        });

        Schema::table('chambres', function (Blueprint $table): void {
            $table->renameColumn('type_chambre_id', 'type_chambre');
        });

        Schema::table('chambres', function (Blueprint $table): void {
            $table->foreign('type_chambre', 'chambres_type_chambre_foreign')
                ->references('id')
                ->on('types_chambre')
                ->restrictOnDelete();
        });
    }
};
