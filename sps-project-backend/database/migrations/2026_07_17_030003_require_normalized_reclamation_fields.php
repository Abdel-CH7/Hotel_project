<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $fallbackDepartmentId = null;
        if (DB::table('reclamations')->whereNull('departement_id')->exists()) {
            $fallbackDepartmentId = DB::table('departements')
                ->where('nom', 'Département historique non affecté')
                ->value('id');
            $fallbackDepartmentId ??= DB::table('departements')->insertGetId([
                'nom' => 'Département historique non affecté',
                'photo' => null,
                'actif' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $fallbackTypeId = $this->fallbackLookup(
            'reclamation_types',
            'Type historique indisponible',
            DB::table('reclamations')->whereNull('reclamation_type_id')->exists()
        );
        $fallbackChannelId = $this->fallbackLookup(
            'reclamation_canaux',
            'Canal historique indisponible',
            DB::table('reclamations')->whereNull('reclamation_canal_id')->exists(),
            ['est_autre' => false]
        );

        if ($fallbackDepartmentId) {
            DB::table('reclamations')->whereNull('departement_id')->update([
                'departement_id' => $fallbackDepartmentId,
            ]);
        }
        if ($fallbackTypeId) {
            DB::table('reclamations')->whereNull('reclamation_type_id')->update([
                'reclamation_type_id' => $fallbackTypeId,
            ]);
        }
        if ($fallbackChannelId) {
            DB::table('reclamations')->whereNull('reclamation_canal_id')->update([
                'reclamation_canal_id' => $fallbackChannelId,
            ]);
        }
        DB::table('reclamations')->whereNull('description')->update([
            'description' => 'Réclamation historique sans description.',
        ]);
        DB::table('reclamations')->whereNull('date_reclamation')->orderBy('id')->each(
            fn ($row) => DB::table('reclamations')->where('id', $row->id)->update([
                'date_reclamation' => substr((string) ($row->created_at ?: now()), 0, 10),
            ])
        );
        DB::table('reclamation_historique')->whereNull('type_evenement')->update([
            'type_evenement' => 'modification',
        ]);

        Schema::table('reclamations', function (Blueprint $table): void {
            $table->unsignedBigInteger('reclamation_type_id')->nullable(false)->change();
            $table->text('description')->nullable(false)->change();
            $table->unsignedBigInteger('reclamation_canal_id')->nullable(false)->change();
            $table->date('date_reclamation')->nullable(false)->change();
            $table->unsignedBigInteger('departement_id')->nullable(false)->change();
        });
        Schema::table('reclamation_historique', function (Blueprint $table): void {
            $table->string('type_evenement', 40)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('reclamations', function (Blueprint $table): void {
            $table->unsignedBigInteger('reclamation_type_id')->nullable()->change();
            $table->text('description')->nullable()->change();
            $table->unsignedBigInteger('reclamation_canal_id')->nullable()->change();
            $table->date('date_reclamation')->nullable()->change();
            $table->unsignedBigInteger('departement_id')->nullable()->change();
        });
        Schema::table('reclamation_historique', function (Blueprint $table): void {
            $table->string('type_evenement', 40)->nullable()->change();
        });
    }

    private function fallbackLookup(
        string $table,
        string $name,
        bool $needed,
        array $extra = []
    ): ?int {
        if (! $needed) {
            return null;
        }

        $existing = DB::table($table)->where('nom', $name)->value('id');
        if ($existing) {
            return (int) $existing;
        }

        return (int) DB::table($table)->insertGetId(array_merge([
            'nom' => $name,
            'actif' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ], $extra));
    }
};
