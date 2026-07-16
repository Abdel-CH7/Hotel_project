<?php

namespace App\Services;

use App\Exceptions\ReservationDomainException;
use App\Models\Client;
use App\Models\ClientParticulier;

class ReservationClientResolver
{
    public function resolve(string $clientType, int $clientId): array
    {
        if (!in_array($clientType, ['societe', 'particulier'], true)) {
            throw new ReservationDomainException(
                'invalid_client_type',
                'Le type de client doit être « societe » ou « particulier ».',
                'client_type'
            );
        }

        $client = $clientType === 'societe'
            ? Client::query()->find($clientId)
            : ClientParticulier::query()->find($clientId);

        if (!$client) {
            throw new ReservationDomainException(
                'client_not_found',
                'Le client sélectionné n’existe pas pour ce type de client.',
                'client_id'
            );
        }

        return [
            'client_type' => $clientType,
            'client_id' => $client->id,
            'display_name' => $this->displayName($clientType, $client),
            'client' => $client,
        ];
    }

    private function displayName(string $clientType, object $client): string
    {
        if ($clientType === 'societe') {
            return $this->firstNonEmpty($client->raison_sociale, $client->CodeClient);
        }

        return $this->firstNonEmpty(
            trim(trim((string) $client->name).' '.trim((string) $client->prenom)),
            $client->CodeClient
        );
    }

    private function firstNonEmpty(?string ...$values): string
    {
        foreach ($values as $value) {
            $trimmed = trim((string) $value);
            if ($trimmed !== '') {
                return $trimmed;
            }
        }

        return '';
    }
}
