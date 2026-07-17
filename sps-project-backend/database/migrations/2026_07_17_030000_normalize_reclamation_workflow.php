<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reclamation_types', function (Blueprint $table): void {
            $table->id();
            $table->string('nom')->unique();
            $table->foreignId('departement_par_defaut_id')->nullable()
                ->constrained('departements')->nullOnDelete();
            $table->string('priorite_par_defaut', 20)->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::create('reclamation_canaux', function (Blueprint $table): void {
            $table->id();
            $table->string('nom')->unique();
            $table->boolean('est_autre')->default(false);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::table('departements', function (Blueprint $table): void {
            $table->boolean('actif')->default(true)->after('photo');
        });

        Schema::table('reclamations', function (Blueprint $table): void {
            $table->string('reclamation_num', 32)->nullable()->after('id');
            $table->foreignId('reservation_id')->nullable()->after('reclamation_num')
                ->constrained('reservations')->nullOnDelete();
            $table->string('client_type', 20)->nullable()->after('reservation_id');
            $table->unsignedBigInteger('client_id')->nullable()->after('client_type');
            $table->string('client_name_snapshot')->nullable()->after('client_id');
            $table->foreignId('chambre_id')->nullable()->after('client_name_snapshot')
                ->constrained('chambres')->nullOnDelete();
            $table->foreignId('reclamation_type_id')->nullable()->after('chambre_id');
            $table->text('description')->nullable()->after('reclamation_type_id');
            $table->foreignId('reclamation_canal_id')->nullable()->after('description');
            $table->string('canal_precision')->nullable()->after('reclamation_canal_id');
            $table->date('date_reclamation')->nullable()->after('canal_precision');
            $table->string('priorite', 20)->default('normale')->after('departement_id');
            $table->timestamp('resolved_at')->nullable()->after('reponse');
            $table->timestamp('cancelled_at')->nullable()->after('resolved_at');
            $table->text('cancellation_reason')->nullable()->after('cancelled_at');
            $table->foreignId('created_by')->nullable()->after('cancellation_reason')
                ->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->after('created_by')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('reclamations', function (Blueprint $table): void {
            $table->string('suivi', 30)->default('En attente')->change();
        });

        $defaultTypes = [
            'Propreté', 'Maintenance', 'Climatisation', 'Bruit', 'Restauration',
            'Accueil / service', 'Facturation', 'Réservation',
            'Équipement de chambre', 'Sécurité', 'Autre',
        ];
        $legacyTypes = DB::table('reclamations')->pluck('type_reclamation')->all();
        foreach (array_merge($defaultTypes, $legacyTypes) as $name) {
            $name = trim((string) $name);
            if ($name !== '') {
                $this->firstOrCreateName('reclamation_types', $name, ['actif' => true]);
            }
        }

        $defaultChannels = [
            'Réception', 'Téléphone', 'E-mail', 'En personne', 'WhatsApp',
            'Site web / application', 'Réseaux sociaux', 'Courrier', 'Autre',
        ];
        $legacyChannels = DB::table('reclamations')->pluck('reclamer_a_travers')->all();
        foreach (array_merge($defaultChannels, $legacyChannels) as $name) {
            $name = $this->canonicalChannel((string) $name);
            if ($name !== '') {
                $this->firstOrCreateName('reclamation_canaux', $name, [
                    'actif' => true,
                    'est_autre' => Str::lower(Str::ascii($name)) === 'autre',
                ]);
            }
        }

        DB::table('reclamations')->orderBy('id')->each(function ($row): void {
            $typeId = $this->lookupId('reclamation_types', trim((string) $row->type_reclamation));
            $channelName = $this->canonicalChannel((string) $row->reclamer_a_travers);
            $channelId = $this->lookupId('reclamation_canaux', $channelName);
            $date = $row->date ?: substr((string) ($row->created_at ?: now()), 0, 10);
            $numberDate = str_replace('-', '', $date ?: now()->format('Y-m-d'));

            DB::table('reclamations')->where('id', $row->id)->update([
                'reclamation_num' => sprintf('REC-%s-%06d', $numberDate, $row->id),
                'reclamation_type_id' => $typeId,
                'description' => 'Réclamation historique : '.trim((string) $row->type_reclamation),
                'reclamation_canal_id' => $channelId,
                'date_reclamation' => $date,
                'priorite' => 'normale',
            ]);
        });

        Schema::table('reclamations', function (Blueprint $table): void {
            $table->foreign('reclamation_type_id')->references('id')
                ->on('reclamation_types')->restrictOnDelete();
            $table->foreign('reclamation_canal_id')->references('id')
                ->on('reclamation_canaux')->restrictOnDelete();
            $table->unique('reclamation_num', 'reclamations_num_unique');
            $table->index('suivi', 'reclamations_suivi_index');
            $table->index('priorite', 'reclamations_priorite_index');
            $table->index('date_reclamation', 'reclamations_date_index');
            $table->index(['client_type', 'client_id'], 'reclamations_client_index');
        });

        Schema::table('reclamations', function (Blueprint $table): void {
            $table->dropForeign(['departement_id']);
            $table->foreign('departement_id')->references('id')
                ->on('departements')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reclamations', function (Blueprint $table): void {
            $table->dropForeign(['departement_id']);
            $table->foreign('departement_id')->references('id')
                ->on('departements')->nullOnDelete();
            $table->dropForeign(['reservation_id']);
            $table->dropForeign(['chambre_id']);
            $table->dropForeign(['reclamation_type_id']);
            $table->dropForeign(['reclamation_canal_id']);
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            $table->dropUnique('reclamations_num_unique');
            $table->dropIndex('reclamations_suivi_index');
            $table->dropIndex('reclamations_priorite_index');
            $table->dropIndex('reclamations_date_index');
            $table->dropIndex('reclamations_client_index');
            $table->dropColumn([
                'reclamation_num', 'reservation_id', 'client_type', 'client_id',
                'client_name_snapshot', 'chambre_id', 'reclamation_type_id',
                'description', 'reclamation_canal_id', 'canal_precision',
                'date_reclamation', 'priorite', 'resolved_at', 'cancelled_at',
                'cancellation_reason', 'created_by', 'updated_by',
            ]);
            $table->text('suivi')->nullable()->change();
        });

        Schema::table('departements', function (Blueprint $table): void {
            $table->dropColumn('actif');
        });
        Schema::dropIfExists('reclamation_canaux');
        Schema::dropIfExists('reclamation_types');
    }

    private function firstOrCreateName(string $table, string $name, array $extra): int
    {
        $normalized = Str::lower(Str::ascii(trim($name)));
        $existing = DB::table($table)->get(['id', 'nom'])->first(
            fn ($row): bool => Str::lower(Str::ascii(trim($row->nom))) === $normalized
        );
        if ($existing) {
            return (int) $existing->id;
        }

        return (int) DB::table($table)->insertGetId(array_merge([
            'nom' => trim($name),
            'created_at' => now(),
            'updated_at' => now(),
        ], $extra));
    }

    private function lookupId(string $table, string $name): ?int
    {
        $normalized = Str::lower(Str::ascii(trim($name)));
        $row = DB::table($table)->get(['id', 'nom'])->first(
            fn ($item): bool => Str::lower(Str::ascii(trim($item->nom))) === $normalized
        );

        return $row ? (int) $row->id : null;
    }

    private function canonicalChannel(string $name): string
    {
        $trimmed = trim($name);
        $normalized = Str::lower(Str::ascii($trimmed));

        return in_array($normalized, ['tele', 'telephone', 'appel', 'appel telephonique'], true)
            ? 'Téléphone'
            : $trimmed;
    }
};
