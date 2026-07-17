<?php

namespace App\Support;

use App\Models\Reservation;
use App\Models\ReservationPaiement;
use Illuminate\Support\Collection;

final class ReservationPaymentData
{
    public const STATUS_NON_PAYEE = 'non_payee';
    public const STATUS_PARTIELLEMENT_PAYEE = 'partiellement_payee';
    public const STATUS_PAYEE = 'payee';

    public static function summary(Reservation $reservation): array
    {
        $total = $reservation->montant_total;
        $totalCents = $total === null ? null : DecimalMoney::toCents($total);

        if ($reservation->relationLoaded('paiements')) {
            $validPayments = $reservation->paiements
                ->where('statut', ReservationPaiement::STATUS_VALIDE);
            $paidCents = self::sumPayments($validPayments);
            $paymentCount = $validPayments->count();
        } else {
            $paidCents = DecimalMoney::toCents($reservation->valid_paid_amount ?? '0.00');
            $paymentCount = (int) ($reservation->valid_payments_count ?? 0);
        }

        $remainingCents = $totalCents === null ? null : max($totalCents - $paidCents, 0);
        $status = match (true) {
            $paidCents <= 0 => self::STATUS_NON_PAYEE,
            $totalCents !== null && $paidCents >= $totalCents => self::STATUS_PAYEE,
            default => self::STATUS_PARTIELLEMENT_PAYEE,
        };

        return [
            'total' => $totalCents === null ? null : DecimalMoney::format($totalCents),
            'montant_paye' => DecimalMoney::format($paidCents),
            'reste_a_payer' => $remainingCents === null ? null : DecimalMoney::format($remainingCents),
            'statut' => $status,
            'statut_label' => self::statusLabel($status),
            'nombre_paiements' => $paymentCount,
        ];
    }

    public static function payment(ReservationPaiement $payment): array
    {
        $mode = $payment->relationLoaded('modePaiement') ? $payment->modePaiement : null;
        $creator = $payment->relationLoaded('createdBy') ? $payment->createdBy : null;
        $canceller = $payment->relationLoaded('cancelledBy') ? $payment->cancelledBy : null;

        return [
            'id' => (int) $payment->id,
            'numero' => $payment->paiement_num,
            'type' => $payment->type_paiement,
            'type_label' => ReservationPaiement::typeLabel($payment->type_paiement),
            'montant' => $payment->montant,
            'date' => $payment->date_paiement?->format('Y-m-d'),
            'mode' => $mode ? [
                'id' => (int) $mode->id,
                'label' => $mode->mode_paimants,
            ] : null,
            'reference' => $payment->reference,
            'commentaire' => $payment->commentaire,
            'statut' => $payment->statut,
            'statut_label' => $payment->statut === ReservationPaiement::STATUS_VALIDE
                ? 'Validé'
                : 'Annulé',
            'created_by' => $creator ? [
                'id' => (int) $creator->id,
                'name' => $creator->name,
            ] : null,
            'created_at' => $payment->created_at?->toIso8601String(),
            'annulation' => $payment->statut === ReservationPaiement::STATUS_ANNULE ? [
                'at' => $payment->annule_at?->toIso8601String(),
                'motif' => $payment->motif_annulation,
                'par' => $canceller ? [
                    'id' => (int) $canceller->id,
                    'name' => $canceller->name,
                ] : null,
            ] : null,
        ];
    }

    private static function sumPayments(Collection $payments): int
    {
        return $payments->sum(
            fn (ReservationPaiement $payment): int => DecimalMoney::toCents($payment->montant)
        );
    }

    private static function statusLabel(string $status): string
    {
        return match ($status) {
            self::STATUS_PAYEE => 'Payée',
            self::STATUS_PARTIELLEMENT_PAYEE => 'Partiellement payée',
            default => 'Non payée',
        };
    }
}
