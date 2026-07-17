<?php

namespace App\Support;

use App\Models\Reservation;
use Carbon\CarbonImmutable;

final class ReservationPolicyData
{
    public const DEADLINE_NON_APPLICABLE = 'non_applicable';
    public const DEADLINE_A_JOUR = 'a_jour';
    public const DEADLINE_DU_AUJOURDHUI = 'du_aujourdhui';
    public const DEADLINE_EN_RETARD = 'en_retard';
    public const DEADLINE_SOLDE_REGLE = 'solde_regle';

    public static function policy(Reservation $reservation): array
    {
        return [
            'code' => $reservation->politique_paiement,
            'label' => Reservation::paymentPolicyLabel($reservation->politique_paiement),
            'montant_acompte_requis' => $reservation->montant_acompte_requis,
            'date_limite_paiement' => $reservation->date_limite_paiement?->format('Y-m-d'),
        ];
    }

    public static function deadline(Reservation $reservation, array $paymentSummary): array
    {
        if ($reservation->status === 'annulé') {
            return self::deadlineResult(self::DEADLINE_NON_APPLICABLE, null, 0, 0);
        }

        $remainingCents = self::moneyCents($paymentSummary['reste_a_payer'] ?? null);
        if (($paymentSummary['statut'] ?? null) === ReservationPaymentData::STATUS_PAYEE
            || $remainingCents === 0) {
            return self::deadlineResult(self::DEADLINE_SOLDE_REGLE, null, 0, 0);
        }

        $paidCents = self::moneyCents($paymentSummary['montant_paye'] ?? '0.00');
        $deadline = null;
        $dueCents = $remainingCents;
        $missingCents = $remainingCents;

        switch ($reservation->politique_paiement) {
            case Reservation::POLICY_PAIEMENT_SUR_PLACE:
                $deadline = $reservation->date_debut;
                break;

            case Reservation::POLICY_ACOMPTE_REQUIS:
                $depositCents = self::moneyCents($reservation->montant_acompte_requis);
                if ($paidCents < $depositCents) {
                    $deadline = $reservation->date_limite_paiement;
                    $dueCents = $depositCents;
                    $missingCents = $depositCents - $paidCents;
                } else {
                    $deadline = $reservation->date_debut;
                }
                break;

            case Reservation::POLICY_PAIEMENT_INTEGRAL:
            case Reservation::POLICY_CREDIT_SOCIETE:
                $deadline = $reservation->date_limite_paiement;
                break;

            default:
                return self::deadlineResult(self::DEADLINE_NON_APPLICABLE, null, 0, 0);
        }

        if (! $deadline) {
            return self::deadlineResult(self::DEADLINE_NON_APPLICABLE, null, $dueCents, $missingCents);
        }

        $deadlineDate = CarbonImmutable::parse($deadline->format('Y-m-d'));
        $today = CarbonImmutable::today();
        $status = match (true) {
            $today->lt($deadlineDate) => self::DEADLINE_A_JOUR,
            $today->equalTo($deadlineDate) => self::DEADLINE_DU_AUJOURDHUI,
            default => self::DEADLINE_EN_RETARD,
        };

        return self::deadlineResult(
            $status,
            $deadlineDate->format('Y-m-d'),
            $dueCents,
            $missingCents
        );
    }

    public static function confirmation(
        Reservation $reservation,
        array $paymentSummary,
        ?array $credit = null
    ): array {
        $paidCents = self::moneyCents($paymentSummary['montant_paye'] ?? '0.00');
        $totalCents = self::moneyCents($paymentSummary['total'] ?? null);
        $remainingCents = self::moneyCents($paymentSummary['reste_a_payer'] ?? null);

        if ($reservation->status === 'annulé') {
            return self::confirmationResult(
                false,
                'reservation_annulee',
                'Une réservation annulée ne peut pas être confirmée.',
                0,
                $paidCents,
                0
            );
        }

        return match ($reservation->politique_paiement) {
            Reservation::POLICY_PAIEMENT_SUR_PLACE => self::confirmationResult(
                true,
                'paiement_sur_place',
                'La confirmation est autorisée avec un paiement sur place.',
                0,
                $paidCents,
                0
            ),
            Reservation::POLICY_ACOMPTE_REQUIS => self::depositConfirmation(
                $paidCents,
                self::moneyCents($reservation->montant_acompte_requis)
            ),
            Reservation::POLICY_PAIEMENT_INTEGRAL => self::fullPaymentConfirmation(
                $paidCents,
                $totalCents,
                $remainingCents
            ),
            Reservation::POLICY_CREDIT_SOCIETE => self::creditConfirmation($paidCents, $credit),
            default => self::confirmationResult(
                false,
                'politique_invalide',
                'La politique de paiement de cette réservation est invalide.',
                0,
                $paidCents,
                0
            ),
        };
    }

    public static function credit(Reservation $reservation): ?array
    {
        if ($reservation->politique_paiement !== Reservation::POLICY_CREDIT_SOCIETE) {
            return null;
        }

        $context = $reservation->relationLoaded('creditContext')
            ? $reservation->getRelation('creditContext')
            : null;

        return is_array($context) ? $context : null;
    }

    public static function deadlineLabel(string $status): string
    {
        return match ($status) {
            self::DEADLINE_A_JOUR => 'À jour',
            self::DEADLINE_DU_AUJOURDHUI => 'Dû aujourd’hui',
            self::DEADLINE_EN_RETARD => 'En retard',
            self::DEADLINE_SOLDE_REGLE => 'Solde réglé',
            default => 'Non applicable',
        };
    }

    private static function depositConfirmation(int $paidCents, int $requiredCents): array
    {
        $missingCents = max($requiredCents - $paidCents, 0);
        $allowed = $missingCents === 0;

        return self::confirmationResult(
            $allowed,
            $allowed ? 'acompte_atteint' : 'acompte_insuffisant',
            $allowed
                ? 'Le montant d’acompte requis a été atteint.'
                : 'Un acompte supplémentaire de '.DecimalMoney::format($missingCents).' DH est requis avant confirmation.',
            $requiredCents,
            $paidCents,
            $missingCents
        );
    }

    private static function fullPaymentConfirmation(
        int $paidCents,
        int $totalCents,
        int $remainingCents
    ): array {
        $allowed = $totalCents > 0 && $remainingCents === 0;

        return self::confirmationResult(
            $allowed,
            $allowed ? 'paiement_integral_atteint' : 'paiement_integral_requis',
            $allowed
                ? 'Le paiement intégral a été enregistré.'
                : 'Le paiement intégral est requis avant confirmation. Montant manquant : '.DecimalMoney::format($remainingCents).' DH.',
            $totalCents,
            $paidCents,
            $remainingCents
        );
    }

    private static function creditConfirmation(int $paidCents, ?array $credit): array
    {
        if (! $credit || ! ($credit['autorise'] ?? false)) {
            return self::confirmationResult(
                false,
                'credit_non_autorise',
                'Le paiement à crédit n’est pas autorisé pour cette société.',
                0,
                $paidCents,
                0
            );
        }
        if (! ($credit['configuration_complete'] ?? false)) {
            return self::confirmationResult(
                false,
                'credit_incomplet',
                'La configuration de crédit de cette société est incomplète.',
                0,
                $paidCents,
                0
            );
        }

        $excessCents = self::moneyCents($credit['depassement_montant'] ?? '0.00');
        $allowed = ! ($credit['depassement'] ?? false);

        return self::confirmationResult(
            $allowed,
            $allowed ? 'credit_disponible' : 'plafond_credit_depasse',
            $allowed
                ? 'La réservation respecte le plafond de crédit de la société.'
                : 'Le plafond de crédit de cette société serait dépassé de '.DecimalMoney::format($excessCents).' DH.',
            self::moneyCents($credit['exposition_projetee'] ?? '0.00'),
            self::moneyCents($credit['plafond'] ?? '0.00'),
            $excessCents
        );
    }

    private static function confirmationResult(
        bool $allowed,
        string $code,
        string $message,
        int $requiredCents,
        int $currentCents,
        int $missingCents
    ): array {
        return [
            'autorisee' => $allowed,
            'code' => $code,
            'message' => $message,
            'montant_requis' => DecimalMoney::format(max($requiredCents, 0)),
            'montant_actuel' => DecimalMoney::format(max($currentCents, 0)),
            'montant_manquant' => DecimalMoney::format(max($missingCents, 0)),
        ];
    }

    private static function deadlineResult(
        string $status,
        ?string $date,
        int $dueCents,
        int $missingCents
    ): array {
        return [
            'statut' => $status,
            'statut_label' => self::deadlineLabel($status),
            'date' => $date,
            'montant_exigible' => DecimalMoney::format(max($dueCents, 0)),
            'montant_manquant' => DecimalMoney::format(max($missingCents, 0)),
        ];
    }

    private static function moneyCents(mixed $amount): int
    {
        return $amount === null || $amount === '' ? 0 : DecimalMoney::toCents($amount);
    }
}
