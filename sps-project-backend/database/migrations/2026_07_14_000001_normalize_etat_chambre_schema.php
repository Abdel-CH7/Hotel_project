<?php

use App\Support\RoomStateBackfill;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $backfill = app(RoomStateBackfill::class);
        $backfill->assertNoDuplicates();

        Schema::table('etat_chambre', function (Blueprint $table) {
            $table->foreignId('maintenance_type_id')
                ->nullable()
                ->after('maintenance_type')
                ->constrained('types_maintenance')
                ->restrictOnDelete();
            $table->foreignId('nettoyee_par_id')
                ->nullable()
                ->after('nettoyée_par')
                ->constrained('employes')
                ->restrictOnDelete();
        });

        $this->backfillMaintenanceTypeIds();
        $backfill->run();

        Schema::table('etat_chambre', function (Blueprint $table) {
            $table->unique('num_chambre', 'etat_chambre_num_chambre_unique');
            $table->dropForeign(['num_chambre']);
            $table->foreign('num_chambre')
                ->references('num_chambre')
                ->on('chambres')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('etat_chambre', function (Blueprint $table) {
            $table->dropForeign(['num_chambre']);
            $table->foreign('num_chambre')
                ->references('num_chambre')
                ->on('chambres')
                ->cascadeOnDelete();
            $table->dropUnique('etat_chambre_num_chambre_unique');
            $table->dropConstrainedForeignId('maintenance_type_id');
            $table->dropConstrainedForeignId('nettoyee_par_id');
        });
    }

    private function backfillMaintenanceTypeIds(): void
    {
        DB::table('etat_chambre')
            ->whereNull('maintenance_type_id')
            ->whereNotNull('maintenance_type')
            ->where('maintenance_type', '<>', '')
            ->orderBy('id')
            ->get(['id', 'maintenance_type'])
            ->each(function ($state) {
                $legacyValue = trim((string) $state->maintenance_type);
                $maintenanceTypeId = DB::table('types_maintenance')
                    ->whereRaw('LOWER(TRIM(code)) = ?', [mb_strtolower($legacyValue, 'UTF-8')])
                    ->orWhereRaw('LOWER(TRIM(types_maintenance)) = ?', [mb_strtolower($legacyValue, 'UTF-8')])
                    ->value('id');

                if ($maintenanceTypeId) {
                    DB::table('etat_chambre')
                        ->where('id', $state->id)
                        ->update(['maintenance_type_id' => $maintenanceTypeId]);
                }
            });
    }
};
