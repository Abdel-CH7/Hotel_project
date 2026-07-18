<?php

namespace App\Http\Controllers;

use App\Exceptions\ReservationDomainException;
use App\Http\Requests\AvailableReservationRoomsRequest;
use App\Http\Requests\CalculateReservationPriceRequest;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Requests\UpdateReservationRequest;
use App\Http\Requests\UpdateReservationStatusRequest;
use App\Http\Resources\AvailableRoomResource;
use App\Http\Resources\ReservationResource;
use App\Http\Resources\ReservationSummaryResource;
use App\Models\Reservation;
use App\Models\ReservationPaiement;
use App\Services\ReservationApplicationService;
use App\Services\ReservationAvailabilityService;
use App\Services\ReservationPricingService;
use App\Services\ReservationPolicyService;
use App\Services\ReservationTariffPeriodResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

class ReservationController extends Controller
{
    public function __construct(
        private readonly ReservationApplicationService $reservationService,
        private readonly ReservationAvailabilityService $availabilityService,
        private readonly ReservationTariffPeriodResolver $periodResolver,
        private readonly ReservationPricingService $pricingService,
        private readonly ReservationPolicyService $policyService
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'chambre_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $reservations = Reservation::query()
            ->with('client')
            ->when(isset($validated['chambre_id']), function ($query) use ($validated): void {
                $query->whereHas('reservationRooms', function ($roomQuery) use ($validated): void {
                    $roomQuery->where('chambre_id', $validated['chambre_id']);
                });
            })
            ->withCount('reservationRooms')
            ->withSum([
                'paiements as valid_paid_amount' => fn ($query) => $query
                    ->where('statut', ReservationPaiement::STATUS_VALIDE),
            ], 'montant')
            ->withCount([
                'paiements as valid_payments_count' => fn ($query) => $query
                    ->where('statut', ReservationPaiement::STATUS_VALIDE),
            ])
            ->latest('id')
            ->get();
        $this->policyService->attachCreditContexts($reservations);

        return ReservationSummaryResource::collection($reservations);
    }

    public function show(Reservation $reservation): ReservationResource
    {
        return new ReservationResource($this->reservationService->loadComplete($reservation));
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        try {
            $reservation = $this->reservationService->create($request->validated());

            return (new ReservationResource($reservation))->response()->setStatusCode(201);
        } catch (ReservationDomainException $exception) {
            return $this->domainError($exception);
        } catch (\Throwable $exception) {
            return $this->unexpectedError('reservation create', $exception);
        }
    }

    public function update(
        UpdateReservationRequest $request,
        Reservation $reservation
    ): ReservationResource|JsonResponse {
        try {
            return new ReservationResource(
                $this->reservationService->update($reservation, $request->validated())
            );
        } catch (ReservationDomainException $exception) {
            return $this->domainError($exception);
        } catch (\Throwable $exception) {
            return $this->unexpectedError('reservation update', $exception);
        }
    }

    public function updateStatus(
        UpdateReservationStatusRequest $request,
        Reservation $reservation
    ): ReservationResource|JsonResponse {
        try {
            $validated = $request->validated();

            return new ReservationResource($this->reservationService->changeStatus(
                $reservation,
                $validated['status'],
                $validated['cancellation_reason'] ?? null
            ));
        } catch (ReservationDomainException $exception) {
            return $this->domainError($exception);
        } catch (\Throwable $exception) {
            return $this->unexpectedError('reservation status update', $exception);
        }
    }

    public function availableRooms(AvailableReservationRoomsRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $reservationId = $validated['reservation_id'] ?? null;
            if (!$reservationId && !empty($validated['reservation_num'])) {
                $reservationId = Reservation::query()
                    ->where('reservation_num', $validated['reservation_num'])
                    ->value('id');
                if (!$reservationId) {
                    throw new ReservationDomainException(
                        'reservation_not_found',
                        'La réservation indiquée est introuvable.',
                        'reservation_num'
                    );
                }
            }

            $selectedRoomIds = $reservationId
                ? Reservation::query()->findOrFail($reservationId)->reservationRooms()->pluck('chambre_id')->all()
                : [];
            $periods = $this->periodResolver->resolve(
                $validated['date_debut'],
                $validated['date_fin']
            );
            $rooms = $this->availabilityService->availableRooms(
                $validated['date_debut'],
                $validated['date_fin'],
                $reservationId ? (int) $reservationId : null,
                $selectedRoomIds
            );

            return response()->json(['data' => [
                'date_debut' => $periods['date_debut'],
                'date_fin' => $periods['date_fin'],
                'nuits' => $periods['nuits'],
                'periodes' => array_map(fn (array $segment): array => [
                    'id' => $segment['tarif_actuel_id'],
                    'designation' => $segment['period']->designation,
                    'date_debut' => $segment['segment_date_debut'],
                    'date_fin' => $segment['segment_date_fin'],
                    'nuits' => $segment['nuits'],
                ], $periods['segments']),
                'chambres' => AvailableRoomResource::collection(collect($rooms))->resolve($request),
            ]]);
        } catch (ReservationDomainException $exception) {
            return $this->domainError($exception);
        } catch (\Throwable $exception) {
            return $this->unexpectedError('available reservation rooms', $exception);
        }
    }

    public function calculatePrice(CalculateReservationPriceRequest $request): JsonResponse
    {
        try {
            $pricing = $this->pricingService->calculate($request->validated());

            return response()->json(['data' => [
                'date_debut' => $pricing['date_debut'],
                'date_fin' => $pricing['date_fin'],
                'nuits' => $pricing['nuits'],
                'occupants_total' => $pricing['total_occupants'],
                'periodes' => $pricing['tariff_period_segments'],
                'chambres' => $pricing['chambres'],
                'repas' => $pricing['repas'],
                'montant_chambres' => $pricing['montant_chambres'],
                'montant_repas' => $pricing['montant_repas'],
                'sous_total_avant_reduction' => $pricing['sous_total_avant_reduction'],
                'reduction' => $pricing['reduction'],
                'montant_reduction' => $pricing['montant_reduction'],
                'montant_total' => $pricing['montant_total'],
            ]]);
        } catch (ReservationDomainException $exception) {
            return $this->domainError($exception);
        } catch (\Throwable $exception) {
            return $this->unexpectedError('reservation price calculation', $exception);
        }
    }

    /** @deprecated Remove after Phase 3C migrates reservation-number URLs. */
    public function showByNumber(string $reservationReference): ReservationResource
    {
        $reservation = Reservation::query()
            ->where('reservation_num', $reservationReference)
            ->firstOrFail();

        return $this->show($reservation);
    }

    /** @deprecated Remove after Phase 3C migrates reservation-number URLs. */
    public function updateByNumber(
        UpdateReservationRequest $request,
        string $reservationReference
    ): ReservationResource|JsonResponse {
        $reservation = Reservation::query()
            ->where('reservation_num', $reservationReference)
            ->firstOrFail();

        return $this->update($request, $reservation);
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
