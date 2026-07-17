<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reclamation_historique', function (Blueprint $table): void {
            $table->string('type_evenement', 40)->nullable()->after('reclamation_id');
            $table->string('ancien_statut', 30)->nullable()->after('type_evenement');
            $table->string('nouveau_statut', 30)->nullable()->after('ancien_statut');
            $table->foreignId('user_id')->nullable()->after('description')
                ->constrained('users')->nullOnDelete();
            $table->index(
                ['reclamation_id', 'created_at', 'id'],
                'reclamation_history_order_index'
            );
        });

        DB::table('reclamations')->orderBy('id')->pluck('id')->each(function ($complaintId): void {
            $rows = DB::table('reclamation_historique')
                ->where('reclamation_id', $complaintId)
                ->orderBy('created_at')
                ->orderBy('id')
                ->get();
            foreach ($rows as $index => $row) {
                DB::table('reclamation_historique')->where('id', $row->id)->update([
                    'type_evenement' => $index === 0 ? 'creation' : 'modification',
                    'created_at' => $row->created_at ?: ($row->date.' 00:00:00'),
                    'updated_at' => $row->updated_at ?: ($row->date.' 00:00:00'),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('reclamation_historique', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->dropIndex('reclamation_history_order_index');
            $table->dropColumn(['type_evenement', 'ancien_statut', 'nouveau_statut', 'user_id']);
        });
    }
};
