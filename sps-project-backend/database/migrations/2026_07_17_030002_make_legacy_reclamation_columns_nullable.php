<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reclamations', function (Blueprint $table): void {
            $table->string('type_reclamation')->nullable()->change();
            $table->date('date')->nullable()->change();
            $table->string('reclamer_a_travers')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('reclamations')->orderBy('id')->each(function ($row): void {
            DB::table('reclamations')->where('id', $row->id)->update([
                'type_reclamation' => $row->type_reclamation
                    ?: DB::table('reclamation_types')->where('id', $row->reclamation_type_id)->value('nom')
                    ?: 'Type indisponible',
                'reclamer_a_travers' => $row->reclamer_a_travers
                    ?: DB::table('reclamation_canaux')->where('id', $row->reclamation_canal_id)->value('nom')
                    ?: 'Canal indisponible',
                'date' => $row->date ?: $row->date_reclamation ?: substr((string) $row->created_at, 0, 10),
            ]);
        });

        Schema::table('reclamations', function (Blueprint $table): void {
            $table->string('type_reclamation')->nullable(false)->change();
            $table->date('date')->nullable(false)->change();
            $table->string('reclamer_a_travers')->nullable(false)->change();
        });
    }
};
