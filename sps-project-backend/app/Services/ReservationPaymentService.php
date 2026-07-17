<?php

namespace App\Services;

use App\Exceptions\ReservationDomainException;
use App\Models\ModePaimant;
use App\Models\Reservation;
use App\Models\ReservationPaiement;
use App\Support\DecimalMoney;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservationPaymentService
{
    public function create(Reservation $reservation, array $data, ?int $userId): array
    {
        return DB::transaction(function () use ($reservation, $data, $userId): array {
            $locked = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);
            $this->assertPaymentCanBeCreated($locked, $data);
            if (!ModePaimant::query()->lockForUpdate()->whereKey($data['mode_paiement_id'])->exists()) {
                throw new ReservationDomainException(
                    'reservation_payment_mode_missing',
                    'Le mode de paiement sélectionné est introuvable.',
                    'mode_paiement_id'
                );
            }

            $paidCents = $this->validPaidCentsLocked($locked);
            $totalCents = DecimalMoney::toCents($locked->montant_total);
            $remainingCents = $totalCents - $paidCents;
            $amountCents = DecimalMoney::toCents($data['montant']);

            if ($amountCents > $remainingCents) {
                throw new ReservationDomainException(
                    'reservation_payment_overpayment',
                    'Le montant dépasse le reste à payer de '.DecimalMoney::format(max($remainingCents, 0)).' DH.',
                    'montant',
                    422,
                    ['reste_a_payer' => DecimalMoney::format(max($remainingCents, 0))]
                );
            }

            $paymentType = match (true) {
                $amountCents === $remainingCents => ReservationPaiement::TYPE_SOLDE,
                $paidCents === 0 => ReservationPaiement::TYPE_ACOMPTE,
                default => ReservationPaiement::TYPE_PAIEMENT_PARTIEL,
            };

            $payment = $this->createWithUniqueNumber([
                'reservation_id' => $locked->id,
                'mode_paiement_id' => (int) $data['mode_paiement_id'],
                'type_paiement' => $paymentType,
                'montant' => DecimalMoney::format($amountCents),
                'date_paiement' => $data['date_paiement'],
                'reference' => $data['reference'] ?? null,
                'commentaire' => $data['commentaire'] ?? null,
                'statut' => ReservationPaiement::STATUS_VALIDE,
                'user_id' => $userId,
            ]);

            return [
                'paiement' => $payment->load(['modePaiement:id,mode_paimants', 'createdBy:id,name']),
                'reservation' => $this->loadPaymentContext($locked),
            ];
        }, 3);
    }

    public function cancel(
        Reservation $reservation,
        ReservationPaiement $payment,
        string $reason,
        ?int $userId
    ): array {
        return DB::transaction(function () use ($reservation, $payment, $reason, $userId): array {
            $lockedReservation = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);
            $lockedPayment = ReservationPaiement::query()
                ->lockForUpdate()
                ->findOrFail($payment->id);

            if ((int) $lockedPayment->reservation_id !== (int) $lockedReservation->id) {
                throw new ReservationDomainException(
                    'reservation_payment_mismatch',
                    'Ce paiement n’appartient pas à la réservation indiquée.',
                    null,
                    404
                );
            }

            if ($lockedPayment->statut === ReservationPaiement::STATUS_ANNULE) {
                throw new ReservationDomainException(
                    'reservation_payment_already_cancelled',
                    'Cette saisie de paiement est déjà annulée.',
                    null,
                    409
                );
            }

            $lockedPayment->update([
                'statut' => ReservationPaiement::STATUS_ANNULE,
                'annule_at' => now(),
                'annule_par_id' => $userId,
                'motif_annulation' => trim($reason),
            ]);

            return [
                'paiement' => $lockedPayment->fresh()->load([
                    'modePaiement:id,mode_paimants',
                    'createdBy:id,name',
                    'cancelledBy:id,name',
                ]),
                'reservation' => $this->loadPaymentContext($lockedReservation),
            ];
        }, 3);
    }

    public function assertProposedTotalCoversPayments(Reservation $reservation, string $proposedTotal): void
    {
        $paidCents = $this->validPaidCentsLocked($reservation);
        if (DecimalMoney::toCents($proposedTotal) < $paidCents) {
            throw new ReservationDomainException(
                'reservation_total_below_paid_amount',
                'Le nouveau total de la réservation est inférieur au montant déjà payé. Annulez une saisie de paiement incorrecte ou ajustez la réservation.',
                'montant_total',
                409,
                ['montant_paye' => DecimalMoney::format($paidCents)]
            );
        }
    }

    private function assertPaymentCanBeCreated(Reservation $reservation, array $data): void
    {
        if ($reservation->status === 'annulé') {
            throw new ReservationDomainException(
                'cancelled_reservation_payment',
                'Aucun nouveau paiement ne peut être ajouté à une réservation annulée.',
                null,
                409
            );
        }

        if ($reservation->montant_total === null || DecimalMoney::toCents($reservation->montant_total) <= 0) {
            throw new ReservationDomainException(
                'reservation_total_unavailable',
                'Le total de cette réservation est nul ou indisponible. Aucun paiement ne peut être enregistré.',
                'montant',
                409
            );
        }

        $amountCents = DecimalMoney::toCents($data['montant']);
        if ($amountCents <= 0) {
            throw new ReservationDomainException(
                'invalid_reservation_payment_amount',
                'Le montant doit être supérieur à zéro.',
                'montant'
            );
        }

        $paymentDate = CarbonImmutable::createFromFormat('Y-m-d', $data['date_paiement'])->startOfDay();
        if ($paymentDate->isAfter(CarbonImmutable::today())) {
            throw new ReservationDomainException(
                'future_reservation_payment_date',
                'La date du paiement ne peut pas être future.',
                'date_paiement'
            );
        }
        if ($reservation->reservation_date && $paymentDate->isBefore($reservation->reservation_date->startOfDay())) {
            throw new ReservationDomainException(
                'early_reservation_payment_date',
                'La date du paiement ne peut pas précéder la date de la réservation.',
                'date_paiement'
            );
        }
    }

    private function validPaidCentsLocked(Reservation $reservation): int
    {
        return $reservation->paiementsValides()
            ->lockForUpdate()
            ->get(['id', 'montant'])
            ->sum(fn (ReservationPaiement $payment): int => DecimalMoney::toCents($payment->montant));
    }

    private function createWithUniqueNumber(array $attributes): ReservationPaiement
    {
        for ($attempt = 0; $attempt < 20; $attempt++) {
            try {
                return ReservationPaiement::create(array_merge($attributes, [
                    'paiement_num' => 'PAY-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
                ]));
            } catch (QueryException $exception) {
                if (!str_contains(strtolower($exception->getMessage()), 'paiement_num')) {
                    throw $exception;
                }
            }
        }

        throw new \RuntimeException('Unable to generate a unique payment number.');
    }

    private function loadPaymentContext(Reservation $reservation): Reservation
    {
        return $reservation->fresh()->load([
            'paiements.modePaiement:id,mode_paimants',
            'paiements.createdBy:id,name',
            'paiements.cancelledBy:id,name',
        ]);
    }
}
