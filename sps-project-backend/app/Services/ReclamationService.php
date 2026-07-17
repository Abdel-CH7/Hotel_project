<?php

namespace App\Services;

use App\Exceptions\ReclamationDomainException;
use App\Models\Client;
use App\Models\ClientParticulier;
use App\Models\Departement;
use App\Models\Reclamation;
use App\Models\ReclamationCanal;
use App\Models\ReclamationType;
use App\Models\Reservation;
use App\Support\ReservationClientData;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReclamationService
{
    public function __construct(private readonly ReclamationHistoryService $history)
    {
    }

    public function create(array $data, ?int $userId): Reclamation
    {
        return DB::transaction(function () use ($data, $userId): Reclamation {
            $normalized = $this->normalize($data, null);
            $reclamation = $this->createWithUniqueNumber(array_merge($normalized, [
                'suivi' => Reclamation::STATUS_PENDING,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]));
            $this->history->record(
                $reclamation,
                'creation',
                'Réclamation enregistrée avec le statut En attente.',
                $userId,
                null,
                Reclamation::STATUS_PENDING
            );

            return $this->loadDetail($reclamation);
        }, 3);
    }

    public function update(Reclamation $reclamation, array $data, ?int $userId): Reclamation
    {
        return DB::transaction(function () use ($reclamation, $data, $userId): Reclamation {
            $locked = Reclamation::query()->lockForUpdate()->findOrFail($reclamation->id);
            $this->assertEditable($locked);
            $normalized = $this->normalize($data, $locked);
            $original = $locked->getAttributes();
            $locked->fill(array_merge($normalized, ['updated_by' => $userId]));
            $changes = array_keys($locked->getDirty());
            $auditedChanges = array_values(array_diff($changes, ['updated_by', 'updated_at']));
            if ($auditedChanges === []) {
                return $this->loadDetail($locked);
            }

            $locked->save();
            $departmentChanged = in_array('departement_id', $auditedChanges, true);
            $linkFields = ['reservation_id', 'client_type', 'client_id', 'client_name_snapshot', 'chambre_id'];
            $linkChanged = array_intersect($linkFields, $auditedChanges) !== [];
            $ordinary = array_diff($auditedChanges, array_merge(['departement_id'], $linkFields));

            if ($ordinary !== []) {
                $this->history->record(
                    $locked,
                    'modification',
                    'Informations modifiées : '.$this->fieldLabels($ordinary).'.',
                    $userId
                );
            }
            if ($departmentChanged) {
                $oldName = Departement::query()->find($original['departement_id'] ?? null)?->nom ?: '—';
                $newName = $locked->departement()->value('nom') ?: '—';
                $this->history->record($locked, 'affectation', "Département modifié : {$oldName} → {$newName}.", $userId);
            }
            if ($linkChanged) {
                $this->history->record(
                    $locked,
                    'liaison_reservation',
                    'La liaison avec le séjour, le client ou la chambre a été modifiée.',
                    $userId
                );
            }

            return $this->loadDetail($locked);
        }, 3);
    }

    public function changeStatus(Reclamation $reclamation, array $data, ?int $userId): Reclamation
    {
        return DB::transaction(function () use ($reclamation, $data, $userId): Reclamation {
            $locked = Reclamation::query()->lockForUpdate()->findOrFail($reclamation->id);
            $this->assertEditable($locked);
            $old = $locked->suivi;
            $new = $data['statut'];
            if ($new === Reclamation::STATUS_CANCELLED) {
                $this->fail('use_cancel_endpoint', 'Utilisez l’action d’annulation avec un motif.', 'statut', 409);
            }

            $allowed = [
                Reclamation::STATUS_PENDING => [Reclamation::STATUS_IN_PROGRESS],
                Reclamation::STATUS_IN_PROGRESS => [Reclamation::STATUS_TREATED],
                Reclamation::STATUS_TREATED => [Reclamation::STATUS_RESOLVED, Reclamation::STATUS_IN_PROGRESS],
            ];
            if (! in_array($new, $allowed[$old] ?? [], true)) {
                $this->fail('invalid_reclamation_transition', "La transition {$old} → {$new} n’est pas autorisée.", 'statut', 409);
            }

            if ($old === Reclamation::STATUS_IN_PROGRESS && $new === Reclamation::STATUS_TREATED) {
                $response = trim((string) ($data['reponse'] ?? ''));
                if ($response === '') {
                    $this->fail('response_required', 'Une réponse est obligatoire avant de marquer la réclamation comme traitée.', 'reponse');
                }
                if ($response !== trim((string) $locked->reponse)) {
                    $locked->reponse = $response;
                    $this->history->record($locked, 'reponse', 'Une réponse de traitement a été enregistrée.', $userId);
                }
            }

            if ($old === Reclamation::STATUS_TREATED && $new === Reclamation::STATUS_RESOLVED
                && trim((string) $locked->reponse) === '') {
                $this->fail('response_required', 'Une réponse existante est obligatoire avant la résolution.', 'reponse');
            }

            $description = "Statut modifié : {$old} → {$new}.";
            if ($old === Reclamation::STATUS_TREATED && $new === Reclamation::STATUS_IN_PROGRESS) {
                $note = trim((string) ($data['note'] ?? ''));
                if (mb_strlen($note) < 3) {
                    $this->fail('reopen_note_required', 'Une note de réouverture est obligatoire.', 'note');
                }
                $description .= ' Motif : '.$note;
            }

            $locked->suivi = $new;
            $locked->updated_by = $userId;
            if ($new === Reclamation::STATUS_RESOLVED) {
                $locked->resolved_at = now();
            }
            $locked->save();
            $this->history->record($locked, 'changement_statut', $description, $userId, $old, $new);

            return $this->loadDetail($locked);
        }, 3);
    }

    public function cancel(Reclamation $reclamation, string $reason, ?int $userId): Reclamation
    {
        return DB::transaction(function () use ($reclamation, $reason, $userId): Reclamation {
            $locked = Reclamation::query()->lockForUpdate()->findOrFail($reclamation->id);
            if (! in_array($locked->suivi, [
                Reclamation::STATUS_PENDING,
                Reclamation::STATUS_IN_PROGRESS,
                Reclamation::STATUS_TREATED,
            ], true)) {
                $this->fail('invalid_reclamation_cancellation', 'Cette réclamation ne peut plus être annulée.', 'motif', 409);
            }
            $old = $locked->suivi;
            $locked->update([
                'suivi' => Reclamation::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancellation_reason' => trim($reason),
                'updated_by' => $userId,
            ]);
            $this->history->record(
                $locked,
                'annulation',
                'Réclamation annulée. Motif : '.trim($reason),
                $userId,
                $old,
                Reclamation::STATUS_CANCELLED
            );

            return $this->loadDetail($locked);
        }, 3);
    }

    public function loadDetail(Reclamation $reclamation): Reclamation
    {
        return $reclamation->fresh()->load([
            'type', 'canal', 'departement', 'reservation.client',
            'chambre.etage', 'chambre.vue', 'chambre.typeChambre',
            'client', 'historique.user:id,name',
        ]);
    }

    private function normalize(array $data, ?Reclamation $current): array
    {
        $type = ReclamationType::query()->findOrFail($data['reclamation_type_id']);
        $channel = ReclamationCanal::query()->findOrFail($data['reclamation_canal_id']);
        $department = Departement::query()->findOrFail($data['departement_id']);
        $this->assertSelectable($type->actif, $current?->reclamation_type_id, $type->id, 'reclamation_type_id', 'Ce type de réclamation est inactif.');
        $this->assertSelectable($channel->actif, $current?->reclamation_canal_id, $channel->id, 'reclamation_canal_id', 'Ce canal de réception est inactif.');
        $this->assertSelectable($department->actif, $current?->departement_id, $department->id, 'departement_id', 'Ce département est inactif.');

        $precision = trim((string) ($data['canal_precision'] ?? ''));
        if ($channel->est_autre && $precision === '') {
            $this->fail('channel_precision_required', 'Veuillez préciser le canal de réception.', 'canal_precision');
        }

        $context = $this->resolveContext($data, $current);

        return array_merge($context, [
            'reclamation_type_id' => $type->id,
            'description' => trim($data['description']),
            'reclamation_canal_id' => $channel->id,
            'canal_precision' => $channel->est_autre ? $precision : null,
            'date_reclamation' => $data['date_reclamation'],
            'departement_id' => $department->id,
            'priorite' => $data['priorite'],
        ]);
    }

    private function resolveContext(array $data, ?Reclamation $current): array
    {
        $reservationId = $data['reservation_id'] ?? null;
        $roomId = $data['chambre_id'] ?? null;
        if ($reservationId) {
            $reservation = Reservation::query()->with('client')->findOrFail($reservationId);
            if ($roomId && ! $reservation->reservationRooms()->where('chambre_id', $roomId)->exists()) {
                $this->fail('room_not_in_reservation', 'La chambre sélectionnée n’appartient pas à cette réservation.', 'chambre_id');
            }
            $snapshot = trim((string) $reservation->client_name_snapshot);
            if ($snapshot === '' && $reservation->client) {
                $snapshot = ReservationClientData::currentDisplayName($reservation->client_type, $reservation->client);
            }

            return [
                'reservation_id' => $reservation->id,
                'client_type' => $reservation->client_type,
                'client_id' => $reservation->client_id,
                'client_name_snapshot' => $snapshot ?: null,
                'chambre_id' => $roomId ?: null,
            ];
        }

        if ($roomId) {
            $this->fail('room_requires_reservation', 'Une chambre ne peut être sélectionnée qu’avec une réservation.', 'chambre_id');
        }
        $clientType = $data['client_type'] ?? null;
        $clientId = $data['client_id'] ?? null;
        if (! $clientType && ! $clientId) {
            return [
                'reservation_id' => null, 'client_type' => null, 'client_id' => null,
                'client_name_snapshot' => null, 'chambre_id' => null,
            ];
        }
        if (! in_array($clientType, ['societe', 'particulier'], true) || ! $clientId) {
            $this->fail('invalid_client_reference', 'Le type et le client doivent être sélectionnés ensemble.', 'client_id');
        }
        $client = $clientType === 'societe'
            ? Client::query()->find($clientId)
            : ClientParticulier::query()->find($clientId);
        if (! $client) {
            $this->fail('client_not_found', 'Le client sélectionné est introuvable pour ce type.', 'client_id');
        }
        $snapshot = ($current
            && ! $current->reservation_id
            && $current->client_type === $clientType
            && (int) $current->client_id === (int) $clientId
            && trim((string) $current->client_name_snapshot) !== '')
            ? $current->client_name_snapshot
            : ReservationClientData::currentDisplayName($clientType, $client);

        return [
            'reservation_id' => null,
            'client_type' => $clientType,
            'client_id' => (int) $clientId,
            'client_name_snapshot' => $snapshot ?: null,
            'chambre_id' => null,
        ];
    }

    private function createWithUniqueNumber(array $attributes): Reclamation
    {
        for ($attempt = 0; $attempt < 20; $attempt++) {
            try {
                return Reclamation::create(array_merge($attributes, [
                    'reclamation_num' => 'REC-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
                ]));
            } catch (QueryException $exception) {
                $driverCode = (int) ($exception->errorInfo[1] ?? 0);
                if ($driverCode !== 1062
                    || ! str_contains(strtolower($exception->getMessage()), 'reclamations_num_unique')) {
                    throw $exception;
                }
            }
        }

        throw new \RuntimeException('Unable to generate a unique complaint number.');
    }

    private function assertEditable(Reclamation $reclamation): void
    {
        if ($reclamation->isReadOnly()) {
            $this->fail('reclamation_read_only', 'Une réclamation résolue ou annulée est en lecture seule.', null, 409);
        }
    }

    private function assertSelectable(bool $active, ?int $currentId, int $selectedId, string $field, string $message): void
    {
        if (! $active && (int) $currentId !== $selectedId) {
            $this->fail('inactive_reference', $message, $field);
        }
    }

    private function fieldLabels(array $fields): string
    {
        $labels = [
            'reclamation_type_id' => 'type', 'description' => 'description',
            'reclamation_canal_id' => 'canal', 'canal_precision' => 'précision du canal',
            'date_reclamation' => 'date', 'priorite' => 'priorité',
        ];

        return implode(', ', array_map(fn ($field) => $labels[$field] ?? $field, $fields));
    }

    private function fail(string $code, string $message, ?string $field, int $status = 422): never
    {
        throw new ReclamationDomainException($code, $message, $field, $status);
    }
}
