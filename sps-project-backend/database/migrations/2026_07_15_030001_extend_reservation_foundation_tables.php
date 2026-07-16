<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->assertSafeReservationData();

        Schema::table('reservations', function (Blueprint $table): void {
            $table->unsignedSmallInteger('pricing_version')->nullable()->after('tarif_repas_id');
            $table->boolean('legacy_pricing')->default(false)->after('pricing_version');
            $table->string('client_name_snapshot')->nullable()->after('legacy_pricing');
            $table->decimal('montant_chambres', 12, 2)->nullable()->after('client_name_snapshot');
            $table->decimal('montant_repas', 12, 2)->nullable()->after('montant_chambres');
            $table->decimal('sous_total_avant_reduction', 12, 2)->nullable()->after('montant_repas');
            $table->timestamp('cancelled_at')->nullable()->after('sous_total_avant_reduction');
            $table->text('cancellation_reason')->nullable()->after('cancelled_at');

            $table->index('status', 'reservations_status_index');
            $table->index(['date_debut', 'date_fin', 'status'], 'reservations_stay_status_index');
            $table->index(['client_type', 'client_id'], 'reservations_client_index');
        });

        Schema::table('details_reservation', function (Blueprint $table): void {
            $table->decimal('tarif_par_nuit', 10, 2)->nullable()->default(null)->change();
            $table->unsignedSmallInteger('adultes')->nullable()->after('chambre_id');
            $table->unsignedSmallInteger('enfants')->nullable()->after('adultes');
            $table->unsignedSmallInteger('lits_supplementaires')->nullable()->after('enfants');
            $table->unsignedBigInteger('type_chambre_id')->nullable()->after('lits_supplementaires');
            $table->string('type_chambre_nom_snapshot')->nullable()->after('type_chambre_id');
            $table->unsignedTinyInteger('capacite_standard_snapshot')->nullable()->after('type_chambre_nom_snapshot');
            $table->unsignedTinyInteger('lits_supplementaires_max_snapshot')->nullable()->after('capacite_standard_snapshot');

            $table->unique(['reservation_id', 'chambre_id'], 'details_reservation_room_unique');
            $table->foreign('type_chambre_id', 'details_reservation_type_chambre_fk')
                ->references('id')
                ->on('types_chambre')
                ->nullOnDelete();
        });

        Schema::table('details_reservation', function (Blueprint $table): void {
            $table->dropForeign(['chambre_id']);
            $table->foreign('chambre_id', 'details_reservation_chambre_id_foreign')
                ->references('id')
                ->on('chambres')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        if (DB::table('details_reservation')->whereNull('tarif_par_nuit')->exists()) {
            throw new \RuntimeException(
                'Reservation foundation rollback refused: null nightly prices cannot be restored safely.'
            );
        }

        Schema::table('details_reservation', function (Blueprint $table): void {
            $table->dropForeign(['chambre_id']);
            $table->foreign('chambre_id', 'details_reservation_chambre_id_foreign')
                ->references('id')
                ->on('chambres')
                ->cascadeOnDelete();
        });

        Schema::table('details_reservation', function (Blueprint $table): void {
            $table->dropForeign('details_reservation_type_chambre_fk');
            $table->dropUnique('details_reservation_room_unique');
            $table->dropColumn([
                'adultes',
                'enfants',
                'lits_supplementaires',
                'type_chambre_id',
                'type_chambre_nom_snapshot',
                'capacite_standard_snapshot',
                'lits_supplementaires_max_snapshot',
            ]);
            $table->decimal('tarif_par_nuit', 10, 2)->default(0)->nullable(false)->change();
        });

        Schema::table('reservations', function (Blueprint $table): void {
            $table->dropIndex('reservations_status_index');
            $table->dropIndex('reservations_stay_status_index');
            $table->dropIndex('reservations_client_index');
            $table->dropColumn([
                'pricing_version',
                'legacy_pricing',
                'client_name_snapshot',
                'montant_chambres',
                'montant_repas',
                'sous_total_avant_reduction',
                'cancelled_at',
                'cancellation_reason',
            ]);
        });
    }

    private function assertSafeReservationData(): void
    {
        $duplicates = DB::table('details_reservation')
            ->select('reservation_id', 'chambre_id', DB::raw('COUNT(*) as duplicate_count'))
            ->groupBy('reservation_id', 'chambre_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();
        $this->abortWhenFound(
            $duplicates,
            'duplicate reservation_id + chambre_id pairs',
            ['reservation_id', 'chambre_id', 'duplicate_count']
        );

        $orphanReservations = DB::table('details_reservation as detail')
            ->leftJoin('reservations as reservation', 'reservation.id', '=', 'detail.reservation_id')
            ->whereNull('reservation.id')
            ->select('detail.id', 'detail.reservation_id')
            ->get();
        $this->abortWhenFound(
            $orphanReservations,
            'orphaned details_reservation.reservation_id values',
            ['id', 'reservation_id']
        );

        $orphanRooms = DB::table('details_reservation as detail')
            ->leftJoin('chambres as room', 'room.id', '=', 'detail.chambre_id')
            ->whereNull('room.id')
            ->select('detail.id', 'detail.chambre_id')
            ->get();
        $this->abortWhenFound(
            $orphanRooms,
            'orphaned details_reservation.chambre_id values',
            ['id', 'chambre_id']
        );

        $invalidDates = DB::table('reservations')
            ->whereColumn('date_fin', '<=', 'date_debut')
            ->select('id', 'reservation_num', 'date_debut', 'date_fin')
            ->get();
        $this->abortWhenFound(
            $invalidDates,
            'invalid reservation date ranges',
            ['id', 'reservation_num', 'date_debut', 'date_fin']
        );

        $unknownClientTypes = DB::table('reservations')
            ->where(function ($query): void {
                $query->whereNull('client_type')
                    ->orWhereNotIn('client_type', ['societe', 'particulier']);
            })
            ->select('id', 'reservation_num', 'client_type')
            ->get();
        $this->abortWhenFound(
            $unknownClientTypes,
            'unknown reservation client_type values',
            ['id', 'reservation_num', 'client_type']
        );
    }

    private function abortWhenFound(Collection $rows, string $problem, array $fields): void
    {
        if ($rows->isEmpty()) {
            return;
        }

        $sample = $rows->take(10)->map(function (object $row) use ($fields): array {
            $result = [];
            foreach ($fields as $field) {
                $result[$field] = $row->{$field} ?? null;
            }

            return $result;
        })->values()->all();

        throw new \RuntimeException(
            'Reservation foundation preflight failed: '.$problem.'. Sample: '.json_encode($sample)
        );
    }
};
