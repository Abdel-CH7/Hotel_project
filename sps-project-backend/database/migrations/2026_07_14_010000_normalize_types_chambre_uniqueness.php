<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const CANONICAL_TYPE_ID = 1;

    private const DUPLICATE_TYPE_IDS = [4, 5, 6];

    public function up(): void
    {
        DB::transaction(function (): void {
            $canonical = DB::table('types_chambre')
                ->where('id', self::CANONICAL_TYPE_ID)
                ->first();

            if (! $canonical) {
                throw new RuntimeException('TypeChambre canonique ID 1 introuvable; normalisation interrompue.');
            }

            $canonicalName = mb_strtolower(trim((string) $canonical->type_chambre));

            foreach (self::DUPLICATE_TYPE_IDS as $duplicateId) {
                $duplicate = DB::table('types_chambre')->where('id', $duplicateId)->first();

                if (! $duplicate) {
                    continue;
                }

                if (mb_strtolower(trim((string) $duplicate->type_chambre)) !== $canonicalName) {
                    throw new RuntimeException(
                        "TypeChambre ID {$duplicateId} n'est plus un doublon de l'ID 1; normalisation interrompue."
                    );
                }

                $roomReferences = DB::table('chambres')
                    ->where('type_chambre', $duplicateId)
                    ->count();
                $tariffReferences = DB::table('tarif_chambre_detail')
                    ->where('type_chambre', $duplicateId)
                    ->count();

                if ($roomReferences > 0 || $tariffReferences > 0) {
                    throw new RuntimeException(
                        "TypeChambre ID {$duplicateId} est reference par {$roomReferences} chambre(s) "
                        ."et {$tariffReferences} tarif(s); normalisation interrompue."
                    );
                }
            }

            DB::table('types_chambre')->whereIn('id', self::DUPLICATE_TYPE_IDS)->delete();

            DB::statement(
                'UPDATE types_chambre SET code = TRIM(code), type_chambre = TRIM(type_chambre)'
            );

            $duplicateCode = DB::table('types_chambre')
                ->selectRaw('LOWER(TRIM(code)) AS normalized, GROUP_CONCAT(id ORDER BY id) AS ids')
                ->groupByRaw('LOWER(TRIM(code))')
                ->havingRaw('COUNT(*) > 1')
                ->first();

            if ($duplicateCode) {
                throw new RuntimeException(
                    "Codes TypeChambre dupliques ({$duplicateCode->normalized}: {$duplicateCode->ids}); "
                    .'normalisation interrompue.'
                );
            }

            $duplicateName = DB::table('types_chambre')
                ->selectRaw('LOWER(TRIM(type_chambre)) AS normalized, GROUP_CONCAT(id ORDER BY id) AS ids')
                ->groupByRaw('LOWER(TRIM(type_chambre))')
                ->havingRaw('COUNT(*) > 1')
                ->first();

            if ($duplicateName) {
                throw new RuntimeException(
                    "Noms TypeChambre dupliques ({$duplicateName->normalized}: {$duplicateName->ids}); "
                    .'normalisation interrompue.'
                );
            }
        });

        Schema::table('types_chambre', function (Blueprint $table): void {
            $table->unique('code', 'types_chambre_code_unique');
            $table->unique('type_chambre', 'types_chambre_name_unique');
        });
    }

    public function down(): void
    {
        Schema::table('types_chambre', function (Blueprint $table): void {
            $table->dropUnique('types_chambre_code_unique');
            $table->dropUnique('types_chambre_name_unique');
        });
    }
};
