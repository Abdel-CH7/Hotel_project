<?php

namespace App\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReservationLegacyBackfill
{
    public function run(): int
    {
        $updated = 0;

        DB::transaction(function () use (&$updated): void {
            DB::table('reservations')
                ->whereNull('pricing_version')
                ->orderBy('id')
                ->chunkById(100, function (Collection $reservations) use (&$updated): void {
                    $companyClients = $this->companyClients($reservations);
                    $individualClients = $this->individualClients($reservations);

                    foreach ($reservations as $reservation) {
                        DB::table('reservations')->where('id', $reservation->id)->update([
                            'pricing_version' => 1,
                            'legacy_pricing' => true,
                            'client_name_snapshot' => $this->clientName(
                                $reservation,
                                $companyClients,
                                $individualClients
                            ),
                        ]);
                        $updated++;
                    }
                });
        });

        return $updated;
    }

    private function companyClients(Collection $reservations): Collection
    {
        $ids = $reservations->where('client_type', 'societe')->pluck('client_id')->unique();

        return $ids->isEmpty()
            ? collect()
            : DB::table('clients')
                ->whereIn('id', $ids)
                ->get(['id', 'raison_sociale', 'CodeClient'])
                ->keyBy('id');
    }

    private function individualClients(Collection $reservations): Collection
    {
        $ids = $reservations->where('client_type', 'particulier')->pluck('client_id')->unique();

        return $ids->isEmpty()
            ? collect()
            : DB::table('clients_particulier')
                ->whereIn('id', $ids)
                ->get(['id', 'name', 'prenom', 'CodeClient'])
                ->keyBy('id');
    }

    private function clientName(
        object $reservation,
        Collection $companyClients,
        Collection $individualClients
    ): ?string {
        if ($reservation->client_type === 'societe') {
            $client = $companyClients->get($reservation->client_id);

            return $client
                ? $this->firstNonEmpty($client->raison_sociale, $client->CodeClient)
                : null;
        }

        $client = $individualClients->get($reservation->client_id);
        if (!$client) {
            return null;
        }

        return $this->firstNonEmpty(
            trim(trim((string) $client->name).' '.trim((string) $client->prenom)),
            $client->CodeClient
        );
    }

    private function firstNonEmpty(?string ...$values): ?string
    {
        foreach ($values as $value) {
            $trimmed = trim((string) $value);
            if ($trimmed !== '') {
                return $trimmed;
            }
        }

        return null;
    }
}
