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
        Schema::table('clients', function (Blueprint $table): void {
            $table->string('email')->nullable()->after('tele');
            $table->string('pays_code', 2)->nullable()->after('email');
            $table->string('region_nom')->nullable()->after('pays_code');
            $table->boolean('credit_autorise')->default(false)->after('mod_id');
            $table->unsignedSmallInteger('delai_paiement_jours')->nullable()->after('credit_autorise');
            $table->decimal('plafond_credit', 12, 2)->nullable()->after('delai_paiement_jours');
        });

        Schema::table('clients', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('contact_clients', function (Blueprint $table): void {
            $table->string('telephone', 30)->nullable()->change();
        });

        $configuredRegions = collect(config('client_locations.morocco_regions', []))
            ->keyBy(fn (array $region): string => $this->normalize($region['name']));

        DB::table('clients as client')
            ->leftJoin('regions as region', 'region.id', '=', 'client.region_id')
            ->select(
                'client.id',
                'client.seince',
                'client.montant_plafond',
                'client.region_nom',
                'client.pays_code',
                'region.region'
            )
            ->orderBy('client.id')
            ->each(function (object $client) use ($configuredRegions): void {
                $updates = [];
                $configuredRegion = $client->region
                    ? $configuredRegions->get($this->normalize($client->region))
                    : null;

                if ($configuredRegion && $client->region_nom === null) {
                    $updates['region_nom'] = $configuredRegion['name'];
                }
                if ($configuredRegion && $client->pays_code === null) {
                    $updates['pays_code'] = 'MA';
                }

                $delay = trim((string) $client->seince);
                if ($delay !== '' && ctype_digit($delay) && (int) $delay <= 65535) {
                    $updates['delai_paiement_jours'] = (int) $delay;
                }

                $limit = str_replace([' ', ','], ['', '.'], trim((string) $client->montant_plafond));
                if ($limit !== '' && is_numeric($limit) && (float) $limit >= 0 && (float) $limit <= 9999999999.99) {
                    $updates['plafond_credit'] = number_format((float) $limit, 2, '.', '');
                }

                if (isset($updates['delai_paiement_jours']) || isset($updates['plafond_credit'])) {
                    $updates['credit_autorise'] = true;
                }

                if ($updates !== []) {
                    DB::table('clients')->where('id', $client->id)->update($updates);
                }
            });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('contact_clients', function (Blueprint $table): void {
            $table->integer('telephone')->nullable()->change();
        });

        Schema::table('clients', function (Blueprint $table): void {
            $table->dropColumn([
                'email',
                'pays_code',
                'region_nom',
                'credit_autorise',
                'delai_paiement_jours',
                'plafond_credit',
            ]);
        });
    }

    private function normalize(?string $value): string
    {
        return Str::lower(Str::ascii(str_replace(['–', '—', '’'], ['-', '-', "'"], trim((string) $value))));
    }
};
