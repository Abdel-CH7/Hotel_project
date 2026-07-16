<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            $knownRows = DB::table('tarif_repas_detail')->whereIn('id', [1, 7])->get()->keyBy('id');

            if ($knownRows->has(1) && $knownRows->has(7)) {
                foreach ([1, 7] as $id) {
                    $row = $knownRows->get($id);
                    if ((int) $row->tarif_repas !== 1 || (int) $row->type_repas !== 1) {
                        throw new RuntimeException("Le detail repas ID {$id} ne correspond plus au doublon attendu.");
                    }
                }

                $foreignKeys = DB::select(
                    "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE "
                    ."WHERE REFERENCED_TABLE_SCHEMA = DATABASE() "
                    ."AND REFERENCED_TABLE_NAME = 'tarif_repas_detail' "
                    ."AND REFERENCED_COLUMN_NAME = 'id'"
                );
                $references = [];

                foreach ($foreignKeys as $foreignKey) {
                    $count = DB::table($foreignKey->TABLE_NAME)
                        ->whereIn($foreignKey->COLUMN_NAME, [1, 7])
                        ->count();

                    if ($count > 0) {
                        $references[] = "{$foreignKey->TABLE_NAME}.{$foreignKey->COLUMN_NAME}: {$count}";
                    }
                }

                if ($references !== []) {
                    throw new RuntimeException(
                        'Nettoyage du doublon repas interrompu; references externes: '.implode(', ', $references)
                    );
                }

                DB::table('tarif_repas_detail')->where('id', 1)->delete();
            }

            $unexpectedDuplicate = DB::table('tarif_repas_detail')
                ->selectRaw('tarif_repas, type_repas, GROUP_CONCAT(id ORDER BY id) AS ids')
                ->groupBy('tarif_repas', 'type_repas')
                ->havingRaw('COUNT(*) > 1')
                ->first();

            if ($unexpectedDuplicate) {
                throw new RuntimeException(
                    "Doublon repas inattendu pour grille {$unexpectedDuplicate->tarif_repas}, "
                    ."type {$unexpectedDuplicate->type_repas}: {$unexpectedDuplicate->ids}."
                );
            }
        });

        Schema::table('tarif_repas_detail', function (Blueprint $table): void {
            $table->dropForeign('tarif_repas_detail_tarif_repas_foreign');
            $table->dropForeign('tarif_repas_detail_type_repas_foreign');
        });
        Schema::table('tarif_repas_detail', function (Blueprint $table): void {
            $table->renameColumn('tarif_repas', 'tarif_repas_id');
            $table->renameColumn('type_repas', 'type_repas_id');
            $table->renameColumn('montant', 'prix_par_personne');
        });
        Schema::table('tarif_repas_detail', function (Blueprint $table): void {
            $table->decimal('prix_par_personne', 10, 2)->change();
            $table->foreign('tarif_repas_id')->references('id')->on('tarifs_repas')->cascadeOnDelete();
            $table->foreign('type_repas_id')->references('id')->on('types_repas')->restrictOnDelete();
            $table->unique(['tarif_repas_id', 'type_repas_id'], 'tarif_repas_detail_grid_type_unique');
        });
    }

    public function down(): void
    {
        Schema::table('tarif_repas_detail', function (Blueprint $table): void {
            $table->dropUnique('tarif_repas_detail_grid_type_unique');
            $table->dropForeign(['tarif_repas_id']);
            $table->dropForeign(['type_repas_id']);
        });
        Schema::table('tarif_repas_detail', function (Blueprint $table): void {
            $table->renameColumn('tarif_repas_id', 'tarif_repas');
            $table->renameColumn('type_repas_id', 'type_repas');
            $table->renameColumn('prix_par_personne', 'montant');
        });
        Schema::table('tarif_repas_detail', function (Blueprint $table): void {
            $table->foreign('tarif_repas')->references('id')->on('tarifs_repas')->cascadeOnDelete();
            $table->foreign('type_repas')->references('id')->on('types_repas')->restrictOnDelete();
        });
    }
};
