<?php

namespace App\Services;

use App\Exceptions\ReservationDomainException;
use App\Models\Client;
use App\Models\Reservation;
use App\Models\ReservationPaiement;
use App\Support\DecimalMoney;
use App\Support\ReservationPaymentData;
use App\Support\ReservationPolicyData;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReservationPolicyService
{
    public function normalize(
        array $data,
        array $resolvedClient,
        string $proposedTotal,
        string $reservationDate
    ): array {
        $policy = (string) ($data['politique_paiement'] ?? '');
        if (! in_array($policy, Reservation::paymentPolicyCodes(), true)) {
            $this->fail(
                'invalid_payment_policy',
                'La politique de paiement sélectionnée est invalide.',
                'politique_paiement'
            );
        }

        $normalized = [
            'politique_paiement' => $policy,
            'montant_acompte_requis' => null,
            'date_limite_paiement' => null,
        ];

        if ($policy === Reservation::POLICY_PAIEMENT_SUR_PLACE) {
            return $normalized;
        }

        if ($policy === Reservation::POLICY_ACOMPTE_REQUIS) {
            $amount = $data['montant_acompte_requis'] ?? null;
            if ($amount === null || $amount === '') {
                $this->fail(
                    'required_deposit_missing',
                    'Le montant de l’acompte requis est obligatoire.',
                    'montant_acompte_requis'
                );
            }

            $amountCents = DecimalMoney::toCents($amount);
            $totalCents = DecimalMoney::toCents($proposedTotal);
            if ($amountCents <= 0) {
                $this->fail(
                    'required_deposit_invalid',
                    'Le montant de l’acompte requis doit être supérieur à zéro.',
                    'montant_acompte_requis'
                );
            }
            if ($amountCents > $totalCents) {
                $this->fail(
                    'required_deposit_above_total',
                    'Le montant de l’acompte requis ne peut pas dépasser le total de la réservation.',
                    'montant_acompte_requis'
                );
            }

            $normalized['montant_acompte_requis'] = DecimalMoney::format($amountCents);
            $normalized['date_limite_paiement'] = $this->validatedDeadline($data, $reservationDate);

            return $normalized;
        }

        if ($policy === Reservation::POLICY_PAIEMENT_INTEGRAL) {
            $normalized['date_limite_paiement'] = $this->validatedDeadline($data, $reservationDate);

            return $normalized;
        }

        if (($resolvedClient['client_type'] ?? null) !== 'societe'
            || ! ($resolvedClient['client'] ?? null) instanceof Client) {
            $this->fail(
                'company_credit_individual_forbidden',
                'Le crédit Société est réservé aux clients Société.',
                'politique_paiement'
            );
        }

        /** @var Client $company */
        $company = $resolvedClient['client'];
        $this->assertCreditConfiguration($company);
        $normalized['date_limite_paiement'] = CarbonImmutable::parse($data['date_fin'])
            ->addDays((int) $company->delai_paiement_jours)
            ->format('Y-m-d');

        return $normalized;
    }

    public function assertConfirmationAllowed(Reservation $reservation): array
    {
        $paidCents = $this->validPaidCents($reservation, true);
        $paymentSummary = $this->paymentSummary($reservation, $paidCents);
        $credit = null;

        if ($reservation->politique_paiement === Reservation::POLICY_CREDIT_SOCIETE) {
            if ($reservation->client_type !== 'societe') {
                $this->fail(
                    'company_credit_individual_forbidden',
                    'Le crédit Société est réservé aux clients Société.',
                    'politique_paiement',
                    409
                );
            }
            $company = Client::query()->lockForUpdate()->find($reservation->client_id);
            if (! $company) {
                $this->fail(
                    'company_credit_client_missing',
                    'La société associée à cette réservation est introuvable.',
                    'client_id',
                    409
                );
            }
            $credit = $this->creditContext(
                $company,
                $this->confirmedCreditExposureCents($company->id, $reservation->id),
                DecimalMoney::toCents($paymentSummary['reste_a_payer'] ?? '0.00')
            );
            $reservation->setRelation('creditContext', $credit);
        }

        $confirmation = ReservationPolicyData::confirmation($reservation, $paymentSummary, $credit);
        if (! $confirmation['autorisee']) {
            throw new ReservationDomainException(
                'reservation_confirmation_payment_policy',
                $confirmation['message'],
                'status',
                409,
                ['confirmation' => $confirmation]
            );
        }

        return $confirmation;
    }

    public function assertConfirmedCreditUpdateAllowed(
        Reservation $reservation,
        array $resolvedClient,
        array $normalizedPolicy,
        string $proposedTotal
    ): void {
        if ($reservation->status !== 'confirmé'
            || $normalizedPolicy['politique_paiement'] !== Reservation::POLICY_CREDIT_SOCIETE) {
            return;
        }

        $company = Client::query()->lockForUpdate()->find($resolvedClient['client_id']);
        if (! $company) {
            $this->fail(
                'company_credit_client_missing',
                'La société sélectionnée est introuvable.',
                'client_id',
                409
            );
        }
        $this->assertCreditConfiguration($company, 409);

        $paidCents = $this->validPaidCents($reservation, true);
        $remainingCents = max(DecimalMoney::toCents($proposedTotal) - $paidCents, 0);
        $credit = $this->creditContext(
            $company,
            $this->confirmedCreditExposureCents($company->id, $reservation->id),
            $remainingCents
        );

        if ($credit['depassement']) {
            $this->fail(
                'company_credit_limit_exceeded',
                'Le plafond de crédit de cette société serait dépassé de '
                    .$credit['depassement_montant'].' DH.',
                'politique_paiement',
                409,
                ['credit' => $credit]
            );
        }
    }

    public function attachCreditContexts(Collection $reservations): void
    {
        $creditReservations = $reservations->filter(fn (Reservation $reservation): bool =>
            $reservation->politique_paiement === Reservation::POLICY_CREDIT_SOCIETE
            && $reservation->client_type === 'societe'
        );
        if ($creditReservations->isEmpty()) {
            return;
        }

        $companyIds = $creditReservations->pluck('client_id')->map(fn ($id): int => (int) $id)->unique();
        $exposures = $this->confirmedCreditExposureByCompany($companyIds->all());

        foreach ($creditReservations as $reservation) {
            $company = $reservation->relationLoaded('client') ? $reservation->client : null;
            if (! $company instanceof Client) {
                continue;
            }

            $remainingCents = DecimalMoney::toCents(
                ReservationPaymentData::summary($reservation)['reste_a_payer'] ?? '0.00'
            );
            $companyExposure = $exposures[(int) $company->id] ?? 0;
            $currentIsIncluded = $reservation->status === 'confirmé';
            $outsideCents = max($companyExposure - ($currentIsIncluded ? $remainingCents : 0), 0);
            $reservation->setRelation(
                'creditContext',
                $this->creditContext($company, $outsideCents, $remainingCents)
            );
        }
    }

    public function companyCreditSummary(Client $company, ?int $excludeReservationId = null): array
    {
        $exposureCents = $this->confirmedCreditExposureCents($company->id, $excludeReservationId);
        $ceilingCents = $this->positiveMoneyCents($company->plafond_credit);
        $configurationComplete = $this->creditConfigurationComplete($company);

        return [
            'societe_id' => (int) $company->id,
            'autorise' => (bool) $company->credit_autorise,
            'plafond' => $ceilingCents > 0 ? DecimalMoney::format($ceilingCents) : null,
            'delai_paiement_jours' => $company->delai_paiement_jours !== null
                ? (int) $company->delai_paiement_jours
                : null,
            'exposition_actuelle' => DecimalMoney::format($exposureCents),
            'credit_disponible' => $ceilingCents > 0
                ? DecimalMoney::format(max($ceilingCents - $exposureCents, 0))
                : null,
            'configuration_complete' => $configurationComplete,
        ];
    }

    private function validatedDeadline(array $data, string $reservationDate): string
    {
        $deadlineValue = $data['date_limite_paiement'] ?? null;
        if (! $deadlineValue) {
            $this->fail(
                'payment_deadline_missing',
                'La date limite de paiement est obligatoire.',
                'date_limite_paiement'
            );
        }

        $deadline = CarbonImmutable::parse($deadlineValue)->startOfDay();
        if ($deadline->lt(CarbonImmutable::parse($reservationDate)->startOfDay())) {
            $this->fail(
                'payment_deadline_before_reservation',
                'La date limite de paiement ne peut pas précéder la date de la réservation.',
                'date_limite_paiement'
            );
        }
        if ($deadline->gt(CarbonImmutable::parse($data['date_debut'])->startOfDay())) {
            $this->fail(
                'payment_deadline_after_arrival',
                'La date limite de paiement ne peut pas être postérieure à la date d’arrivée.',
                'date_limite_paiement'
            );
        }

        return $deadline->format('Y-m-d');
    }

    private function assertCreditConfiguration(Client $company, int $status = 422): void
    {
        if (! $company->credit_autorise) {
            $this->fail(
                'company_credit_not_authorized',
                'Le paiement à crédit n’est pas autorisé pour cette société.',
                'politique_paiement',
                $status
            );
        }
        if ($this->positiveMoneyCents($company->plafond_credit) <= 0) {
            $this->fail(
                'company_credit_limit_missing',
                'Le plafond de crédit de cette société doit être configuré et supérieur à zéro.',
                'politique_paiement',
                $status
            );
        }
        if ($company->delai_paiement_jours === null || (int) $company->delai_paiement_jours < 0) {
            $this->fail(
                'company_credit_delay_missing',
                'Le délai de paiement de cette société doit être configuré.',
                'politique_paiement',
                $status
            );
        }
    }

    private function creditConfigurationComplete(Client $company): bool
    {
        return (bool) $company->credit_autorise
            && $this->positiveMoneyCents($company->plafond_credit) > 0
            && $company->delai_paiement_jours !== null
            && (int) $company->delai_paiement_jours >= 0;
    }

    private function creditContext(Client $company, int $outsideCents, int $remainingCents): array
    {
        $ceilingCents = $this->positiveMoneyCents($company->plafond_credit);
        $projectedCents = $outsideCents + $remainingCents;
        $excessCents = max($projectedCents - $ceilingCents, 0);

        return [
            'autorise' => (bool) $company->credit_autorise,
            'configuration_complete' => $this->creditConfigurationComplete($company),
            'plafond' => $ceilingCents > 0 ? DecimalMoney::format($ceilingCents) : null,
            'delai_paiement_jours' => $company->delai_paiement_jours !== null
                ? (int) $company->delai_paiement_jours
                : null,
            'exposition_hors_reservation' => DecimalMoney::format($outsideCents),
            'reste_reservation' => DecimalMoney::format($remainingCents),
            'exposition_projetee' => DecimalMoney::format($projectedCents),
            'credit_disponible_apres' => $ceilingCents > 0
                ? DecimalMoney::format(max($ceilingCents - $projectedCents, 0))
                : null,
            'depassement' => $excessCents > 0,
            'depassement_montant' => DecimalMoney::format($excessCents),
        ];
    }

    private function validPaidCents(Reservation $reservation, bool $lock): int
    {
        $query = $reservation->paiementsValides();
        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->get(['id', 'montant'])->sum(
            fn (ReservationPaiement $payment): int => DecimalMoney::toCents($payment->montant)
        );
    }

    private function paymentSummary(Reservation $reservation, int $paidCents): array
    {
        $totalCents = $reservation->montant_total === null
            ? null
            : DecimalMoney::toCents($reservation->montant_total);
        $remainingCents = $totalCents === null ? null : max($totalCents - $paidCents, 0);
        $status = match (true) {
            $paidCents <= 0 => ReservationPaymentData::STATUS_NON_PAYEE,
            $totalCents !== null && $paidCents >= $totalCents => ReservationPaymentData::STATUS_PAYEE,
            default => ReservationPaymentData::STATUS_PARTIELLEMENT_PAYEE,
        };

        return [
            'total' => $totalCents === null ? null : DecimalMoney::format($totalCents),
            'montant_paye' => DecimalMoney::format($paidCents),
            'reste_a_payer' => $remainingCents === null ? null : DecimalMoney::format($remainingCents),
            'statut' => $status,
        ];
    }

    private function confirmedCreditExposureCents(int $companyId, ?int $excludeReservationId = null): int
    {
        return $this->confirmedCreditExposureByCompany([$companyId], $excludeReservationId)[$companyId] ?? 0;
    }

    private function confirmedCreditExposureByCompany(
        array $companyIds,
        ?int $excludeReservationId = null
    ): array {
        if ($companyIds === []) {
            return [];
        }

        $validPayments = DB::table('reservation_paiements')
            ->select('reservation_id')
            ->selectRaw('SUM(montant) AS valid_paid')
            ->where('statut', ReservationPaiement::STATUS_VALIDE)
            ->groupBy('reservation_id');

        $rows = DB::table('reservations')
            ->leftJoinSub($validPayments, 'valid_payments', function ($join): void {
                $join->on('valid_payments.reservation_id', '=', 'reservations.id');
            })
            ->where('reservations.client_type', 'societe')
            ->whereIn('reservations.client_id', $companyIds)
            ->where('reservations.politique_paiement', Reservation::POLICY_CREDIT_SOCIETE)
            ->where('reservations.status', 'confirmé')
            ->when($excludeReservationId, fn ($query) => $query->where('reservations.id', '<>', $excludeReservationId))
            ->groupBy('reservations.client_id')
            ->select('reservations.client_id')
            ->selectRaw(
                'COALESCE(SUM(CASE '
                .'WHEN reservations.montant_total > COALESCE(valid_payments.valid_paid, 0) '
                .'THEN reservations.montant_total - COALESCE(valid_payments.valid_paid, 0) '
                .'ELSE 0 END), 0) AS exposure'
            )
            ->get();

        return $rows->mapWithKeys(fn ($row): array => [
            (int) $row->client_id => DecimalMoney::toCents((string) $row->exposure),
        ])->all();
    }

    private function positiveMoneyCents(mixed $amount): int
    {
        if ($amount === null || $amount === '') {
            return 0;
        }

        return max(DecimalMoney::toCents($amount), 0);
    }

    private function fail(
        string $code,
        string $message,
        ?string $field,
        int $status = 422,
        array $context = []
    ): never {
        throw new ReservationDomainException($code, $message, $field, $status, $context);
    }
}
