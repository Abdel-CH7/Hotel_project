<?php

use App\Support\EquipmentLocationBackfill;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emplacements', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->unique();
            $table->string('type')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('equipements', function (Blueprint $table) {
            $table->foreignId('chambre_id')
                ->nullable()
                ->after('localisation')
                ->constrained('chambres')
                ->restrictOnDelete();
            $table->foreignId('emplacement_id')
                ->nullable()
                ->after('chambre_id')
                ->constrained('emplacements')
                ->restrictOnDelete();
            $table->string('localisation')->nullable()->change();
        });

        app(EquipmentLocationBackfill::class)->run();
    }

    public function down(): void
    {
        DB::table('equipements')
            ->whereNull('localisation')
            ->orderBy('id')
            ->get(['id', 'chambre_id', 'emplacement_id'])
            ->each(function ($equipment) {
                $location = null;

                if ($equipment->chambre_id) {
                    $roomNumber = DB::table('chambres')
                        ->where('id', $equipment->chambre_id)
                        ->value('num_chambre');
                    $location = $roomNumber ? "Chambre {$roomNumber}" : null;
                } elseif ($equipment->emplacement_id) {
                    $location = DB::table('emplacements')
                        ->where('id', $equipment->emplacement_id)
                        ->value('nom');
                }

                DB::table('equipements')
                    ->where('id', $equipment->id)
                    ->update(['localisation' => $location ?: 'Non affecté']);
            });

        Schema::table('equipements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('chambre_id');
            $table->dropConstrainedForeignId('emplacement_id');
            $table->string('localisation')->nullable(false)->change();
        });

        Schema::dropIfExists('emplacements');
    }
};
