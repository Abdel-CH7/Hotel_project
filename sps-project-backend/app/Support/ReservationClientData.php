<?php

namespace App\Support;

use App\Models\Client;
use App\Models\ClientParticulier;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Model;

final class ReservationClientData
{
    public static function companyOption(Client $client): array
    {
        $displayName = self::firstNonEmpty($client->raison_sociale, $client->CodeClient);
        $organizationLabel = Client::ORGANIZATION_TYPES[$client->type_organisation] ?? null;
        $selectParts = array_filter([
            $client->CodeClient,
            $displayName,
            $client->ice ? 'ICE '.$client->ice : null,
            $organizationLabel,
        ], self::isPresent(...));

        return [
            'id' => (int) $client->id,
            'type' => 'societe',
            'code' => self::nullable($client->CodeClient),
            'display_name' => $displayName,
            'select_label' => implode(' — ', $selectParts),
            'ice' => self::nullable($client->ice),
            'type_organisation' => self::nullable($client->type_organisation),
            'type_organisation_label' => $organizationLabel,
            'telephone' => self::nullable($client->tele),
            'email' => self::nullable($client->email),
            'secteur' => $client->secteur ? [
                'id' => (int) $client->secteur->id,
                'label' => self::nullable($client->secteur->secteurClient),
            ] : null,
            'commercial' => [
                'mode_reglement_id' => $client->mod_id ? (int) $client->mod_id : null,
                'mode_reglement_label' => self::nullable($client->modeReglement?->mode_paimants),
                'credit_autorise' => (bool) $client->credit_autorise,
                'delai_paiement_jours' => $client->delai_paiement_jours !== null
                    ? (int) $client->delai_paiement_jours
                    : null,
                'plafond_credit' => $client->plafond_credit,
            ],
        ];
    }

    public static function individualOption(ClientParticulier $client): array
    {
        $displayName = self::firstNonEmpty(
            trim(trim((string) $client->name).' '.trim((string) $client->prenom)),
            $client->CodeClient
        );
        $document = trim(implode(' ', array_filter([
            self::nullable($client->type_piece),
            self::nullable($client->cin),
        ], self::isPresent(...))));
        $selectParts = array_filter([
            $client->CodeClient,
            $displayName,
            $document !== '' ? $document : null,
            $client->tele,
        ], self::isPresent(...));
        $children = $client->relationLoaded('info_clients')
            ? $client->info_clients
            : collect();

        return [
            'id' => (int) $client->id,
            'type' => 'particulier',
            'code' => self::nullable($client->CodeClient),
            'display_name' => $displayName,
            'select_label' => implode(' — ', $selectParts),
            'type_piece' => self::nullable($client->type_piece),
            'numero_piece' => self::nullable($client->cin),
            'telephone' => self::nullable($client->tele),
            'nationalite' => self::nullable($client->nationalite),
            'pays' => self::nullable(config('client_locations.countries.'.$client->pays_code)),
            'region' => self::nullable($client->region_nom),
            'ville' => self::nullable($client->ville),
            'enfants_enregistres' => $children->map(fn ($child): array => [
                'id' => (int) $child->id,
                'nom' => self::nullable($child->name),
                'prenom' => self::nullable($child->prenom),
                'age' => $child->age === null ? null : (int) $child->age,
            ])->values()->all(),
        ];
    }

    public static function reservationClient(Reservation $reservation, bool $includeContext = false): array
    {
        $current = $reservation->relationLoaded('client')
            ? $reservation->getRelation('client')
            : null;
        $option = $includeContext
            ? self::optionFor($current)
            : self::basicOptionFor($current);
        $currentName = $option['display_name'] ?? null;
        $snapshot = self::nullable($reservation->client_name_snapshot);

        $normalized = [
            'type' => $reservation->client_type,
            'type_label' => $reservation->client_type === 'societe' ? 'Société' : 'Particulier',
            'id' => (int) $reservation->client_id,
            'code' => $option['code'] ?? null,
            'display_name' => $snapshot ?? $currentName ?? 'Client indisponible',
            'current_display_name' => $currentName,
            'exists' => $current instanceof Model,
        ];

        if ($includeContext && $option) {
            $normalized = array_merge($normalized, array_diff_key($option, array_flip([
                'id',
                'type',
                'code',
                'display_name',
            ])));
        }

        return $normalized;
    }

    public static function currentDisplayName(string $clientType, Model $client): string
    {
        if ($clientType === 'societe' && $client instanceof Client) {
            return self::firstNonEmpty($client->raison_sociale, $client->CodeClient);
        }

        if ($clientType === 'particulier' && $client instanceof ClientParticulier) {
            return self::firstNonEmpty(
                trim(trim((string) $client->name).' '.trim((string) $client->prenom)),
                $client->CodeClient
            );
        }

        return '';
    }

    private static function optionFor(?Model $client): ?array
    {
        return match (true) {
            $client instanceof Client => self::companyOption($client),
            $client instanceof ClientParticulier => self::individualOption($client),
            default => null,
        };
    }

    private static function basicOptionFor(?Model $client): ?array
    {
        return match (true) {
            $client instanceof Client => [
                'code' => self::nullable($client->CodeClient),
                'display_name' => self::firstNonEmpty($client->raison_sociale, $client->CodeClient),
            ],
            $client instanceof ClientParticulier => [
                'code' => self::nullable($client->CodeClient),
                'display_name' => self::firstNonEmpty(
                    trim(trim((string) $client->name).' '.trim((string) $client->prenom)),
                    $client->CodeClient
                ),
            ],
            default => null,
        };
    }

    private static function firstNonEmpty(?string ...$values): string
    {
        foreach ($values as $value) {
            $trimmed = trim((string) $value);
            if ($trimmed !== '') {
                return $trimmed;
            }
        }

        return '';
    }

    private static function nullable(mixed $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $trimmed;
    }

    private static function isPresent(mixed $value): bool
    {
        return self::nullable($value) !== null;
    }
}
