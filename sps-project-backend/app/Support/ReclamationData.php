<?php

namespace App\Support;

use App\Models\Client;
use App\Models\ClientParticulier;
use App\Models\Reclamation;
use Illuminate\Database\Eloquent\Model;

final class ReclamationData
{
    public static function client(Reclamation $reclamation): ?array
    {
        if (! $reclamation->client_type || ! $reclamation->client_id) {
            return null;
        }

        $current = $reclamation->relationLoaded('client')
            ? $reclamation->getRelation('client')
            : null;
        $currentName = $current instanceof Model
            ? ReservationClientData::currentDisplayName($reclamation->client_type, $current)
            : null;
        $snapshot = self::nullable($reclamation->client_name_snapshot);

        return [
            'type' => $reclamation->client_type,
            'type_label' => $reclamation->client_type === 'societe' ? 'Société' : 'Particulier',
            'id' => (int) $reclamation->client_id,
            'code' => self::nullable($current?->CodeClient),
            'display_name' => $snapshot ?? self::nullable($currentName) ?? 'Client indisponible',
            'current_display_name' => self::nullable($currentName),
            'exists' => $current instanceof Model,
        ];
    }

    public static function clientContext(Reclamation $reclamation): ?array
    {
        $basic = self::client($reclamation);
        if (! $basic) {
            return null;
        }

        $current = $reclamation->relationLoaded('client')
            ? $reclamation->getRelation('client')
            : null;

        if ($current instanceof Client) {
            return array_merge($basic, [
                'telephone' => self::nullable($current->tele),
                'email' => self::nullable($current->email),
                'ice' => self::nullable($current->ice),
                'type_organisation' => self::nullable($current->type_organisation),
                'type_organisation_label' => Client::ORGANIZATION_TYPES[$current->type_organisation] ?? null,
            ]);
        }

        if ($current instanceof ClientParticulier) {
            return array_merge($basic, [
                'telephone' => self::nullable($current->tele),
                'type_piece' => self::nullable($current->type_piece),
                'numero_piece' => self::nullable($current->cin),
                'nationalite' => self::nullable($current->nationalite),
                'pays' => self::nullable(config('client_locations.countries.'.$current->pays_code)),
                'region' => self::nullable($current->region_nom),
                'ville' => self::nullable($current->ville),
            ]);
        }

        return $basic;
    }

    public static function room(Reclamation $reclamation): ?array
    {
        if (! $reclamation->chambre_id) {
            return null;
        }

        return [
            'id' => (int) $reclamation->chambre_id,
            'numero' => self::nullable($reclamation->chambre?->num_chambre),
            'type' => self::nullable($reclamation->chambre?->typeChambre?->type_chambre),
            'etage' => self::nullable($reclamation->chambre?->etage?->etage),
            'vue' => self::nullable($reclamation->chambre?->vue?->vue),
        ];
    }

    public static function transitions(Reclamation $reclamation): array
    {
        return match ($reclamation->suivi) {
            Reclamation::STATUS_PENDING => [Reclamation::STATUS_IN_PROGRESS],
            Reclamation::STATUS_IN_PROGRESS => [Reclamation::STATUS_TREATED],
            Reclamation::STATUS_TREATED => [Reclamation::STATUS_RESOLVED, Reclamation::STATUS_IN_PROGRESS],
            default => [],
        };
    }

    private static function nullable(mixed $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $trimmed;
    }
}
