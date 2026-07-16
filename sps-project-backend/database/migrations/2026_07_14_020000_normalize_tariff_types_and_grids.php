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
            DB::statement('UPDATE types_repas SET code = TRIM(code), type_repas = TRIM(type_repas)');
            DB::statement('UPDATE types_reduction SET code = TRIM(code), type_reduction = TRIM(type_reduction)');
            DB::statement('UPDATE tarifs_chambre SET designation = TRIM(designation)');
            DB::statement('UPDATE tarifs_repas SET designation = TRIM(designation)');
            DB::statement('UPDATE tarifs_reduction SET designation = TRIM(designation)');

            $checks = [
                ['types_repas', 'code'],
                ['types_repas', 'type_repas'],
                ['types_reduction', 'code'],
                ['types_reduction', 'type_reduction'],
                ['tarifs_chambre', 'designation'],
                ['tarifs_repas', 'designation'],
                ['tarifs_reduction', 'designation'],
            ];

            foreach ($checks as [$table, $column]) {
                $duplicate = DB::table($table)
                    ->selectRaw("LOWER(TRIM({$column})) AS normalized, GROUP_CONCAT(id ORDER BY id) AS ids")
                    ->groupByRaw("LOWER(TRIM({$column}))")
                    ->havingRaw('COUNT(*) > 1')
                    ->first();

                if ($duplicate) {
                    throw new RuntimeException(
                        "Doublon inattendu dans {$table}.{$column} ({$duplicate->normalized}: {$duplicate->ids})."
                    );
                }
            }
        });

        Schema::table('types_repas', function (Blueprint $table): void {
            $table->unique('code', 'types_repas_code_unique');
            $table->unique('type_repas', 'types_repas_name_unique');
        });
        Schema::table('types_reduction', function (Blueprint $table): void {
            $table->unique('code', 'types_reduction_code_unique');
            $table->unique('type_reduction', 'types_reduction_name_unique');
        });
        Schema::table('tarifs_chambre', function (Blueprint $table): void {
            $table->unique('designation', 'tarifs_chambre_designation_unique');
        });
        Schema::table('tarifs_repas', function (Blueprint $table): void {
            $table->unique('designation', 'tarifs_repas_designation_unique');
        });
        Schema::table('tarifs_reduction', function (Blueprint $table): void {
            $table->unique('designation', 'tarifs_reduction_designation_unique');
        });
    }

    public function down(): void
    {
        Schema::table('types_repas', function (Blueprint $table): void {
            $table->dropUnique('types_repas_code_unique');
            $table->dropUnique('types_repas_name_unique');
        });
        Schema::table('types_reduction', function (Blueprint $table): void {
            $table->dropUnique('types_reduction_code_unique');
            $table->dropUnique('types_reduction_name_unique');
        });
        Schema::table('tarifs_chambre', fn (Blueprint $table) => $table->dropUnique('tarifs_chambre_designation_unique'));
        Schema::table('tarifs_repas', fn (Blueprint $table) => $table->dropUnique('tarifs_repas_designation_unique'));
        Schema::table('tarifs_reduction', fn (Blueprint $table) => $table->dropUnique('tarifs_reduction_designation_unique'));
    }
};
