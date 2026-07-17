<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const CLIENT_TABLES = [
        'clients_particulier',
        'clients',
        'site_clients',
        'site_clients_particulier',
    ];

    private const LOOKUP_COLUMNS = [
        'zone_id' => 'zones',
        'region_id' => 'regions',
        'secteur_id' => 'secteur_clients',
        'mod_id' => 'mode_paimants',
    ];

    public function up(): void
    {
        $this->replaceConstraints('restrict');
    }

    public function down(): void
    {
        $this->replaceConstraints('set null');
    }

    private function replaceConstraints(string $onDelete): void
    {
        foreach (self::CLIENT_TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                foreach (array_keys(self::LOOKUP_COLUMNS) as $column) {
                    $table->dropForeign([$column]);
                }
            });

            Schema::table($tableName, function (Blueprint $table) use ($onDelete): void {
                foreach (self::LOOKUP_COLUMNS as $column => $referencedTable) {
                    $foreign = $table->foreign($column)
                        ->references('id')
                        ->on($referencedTable);

                    if ($onDelete === 'restrict') {
                        $foreign->restrictOnDelete();
                    } else {
                        $foreign->nullOnDelete();
                    }
                }
            });
        }
    }
};
