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
        Schema::table('clients_particulier', function (Blueprint $table): void {
            $table->string('type_piece')->nullable()->after('prenom');
            $table->string('pays_code', 2)->nullable()->after('nationalite');
            $table->string('region_nom')->nullable()->after('pays_code');
            $table->string('civilite')->nullable()->change();
            $table->string('adresse')->nullable()->change();
        });

        DB::table('clients_particulier')
            ->whereNull('type_piece')
            ->whereNotNull('cin')
            ->where('cin', '<>', '')
            ->update(['type_piece' => 'CIN']);

        $configuredRegions = collect(config('client_locations.morocco_regions', []))
            ->keyBy(fn (array $region): string => $this->normalize($region['name']));

        DB::table('clients_particulier as client')
            ->join('regions as region', 'region.id', '=', 'client.region_id')
            ->select('client.id', 'client.region_nom', 'client.pays_code', 'region.region')
            ->orderBy('client.id')
            ->each(function (object $client) use ($configuredRegions): void {
                $configuredRegion = $configuredRegions->get($this->normalize($client->region));
                $updates = [];

                if ($client->region_nom === null) {
                    $updates['region_nom'] = $configuredRegion['name'] ?? $client->region;
                }
                if ($client->pays_code === null && $configuredRegion) {
                    $updates['pays_code'] = 'MA';
                }

                if ($updates !== []) {
                    DB::table('clients_particulier')->where('id', $client->id)->update($updates);
                }
            });
    }

    public function down(): void
    {
        Schema::table('clients_particulier', function (Blueprint $table): void {
            $table->dropColumn(['type_piece', 'pays_code', 'region_nom']);
            $table->string('civilite')->nullable(false)->change();
            $table->string('adresse')->nullable(false)->change();
        });
    }

    private function normalize(?string $value): string
    {
        return Str::lower(Str::ascii(str_replace(['–', '—', '’'], ['-', '-', "'"], trim((string) $value))));
    }
};
