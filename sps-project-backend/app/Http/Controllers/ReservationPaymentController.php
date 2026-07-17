<?php

namespace App\Http\Controllers;

use App\Exceptions\ReservationDomainException;
use App\Http\Requests\CancelReservationPaymentRequest;
use App\Http\Requests\StoreReservationPaymentRequest;
use App\Models\ModePaimant;
use App\Models\Reservation;
use App\Models\ReservationPaiement;
use App\Services\ReservationPaymentService;
use App\Support\ReservationPaymentData;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ReservationPaymentController extends Controller
{
    public function __construct(private readonly ReservationPaymentService $paymentService)
    {
    }

    public function options(): JsonResponse
    {
        $modes = ModePaimant::query()
            ->get(['id', 'mode_paimants'])
            ->map(fn (ModePaimant $mode): array => [
                'id' => (int) $mode->id,
                'label' => $mode->mode_paimants,
            ])
            ->sortBy(fn (array $mode): string => Str::lower(Str::ascii($mode['label'])))
            ->values();

        return response()->json(['data' => ['modes_paiement' => $modes]]);
    }

    public function store(
        StoreReservationPaymentRequest $request,
        Reservation $reservation
    ): JsonResponse {
        try {
            $result = $this->paymentService->create($reservation, $request->validated(), Auth::id());

            return response()->json(['data' => [
                'paiement' => ReservationPaymentData::payment($result['paiement']),
                'reglement' => ReservationPaymentData::summary($result['reservation']),
            ]], 201);
        } catch (ReservationDomainException $exception) {
            return $this->domainError($exception);
        } catch (\Throwable $exception) {
            return $this->unexpectedError('reservation payment creation', $exception);
        }
    }

    public function cancel(
        CancelReservationPaymentRequest $request,
        Reservation $reservation,
        ReservationPaiement $payment
    ): JsonResponse {
        try {
            $result = $this->paymentService->cancel(
                $reservation,
                $payment,
                $request->validated('motif_annulation'),
                Auth::id()
            );

            return response()->json(['data' => [
                'paiement' => ReservationPaymentData::payment($result['paiement']),
                'reglement' => ReservationPaymentData::summary($result['reservation']),
            ]]);
        } catch (ReservationDomainException $exception) {
            return $this->domainError($exception);
        } catch (\Throwable $exception) {
            return $this->unexpectedError('reservation payment cancellation', $exception);
        }
    }

    private function domainError(ReservationDomainException $exception): JsonResponse
    {
        return response()->json(array_filter([
            'message' => $exception->getMessage(),
            'code' => $exception->errorCode,
            'field' => $exception->field,
            'context' => $exception->context ?: null,
        ], static fn (mixed $value): bool => $value !== null), $exception->recommendedStatus);
    }

    private function unexpectedError(string $operation, \Throwable $exception): JsonResponse
    {
        Log::error("Unexpected {$operation} failure.", ['exception' => $exception]);

        return response()->json([
            'message' => 'Une erreur interne est survenue. Veuillez réessayer.',
            'code' => 'internal_error',
        ], 500);
    }
}
