<?php

namespace App\Http\Resources;

use App\Support\ReservationClientData;
use App\Support\ReservationPaymentData;
use App\Support\ReservationPolicyData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $paymentSummary = ReservationPaymentData::summary($this->resource);
        $credit = ReservationPolicyData::credit($this->resource);

        return [
            'id' => $this->id,
            'reservation_num' => $this->reservation_num,
            'client' => ReservationClientData::reservationClient($this->resource),
            'dates' => [
                'reservation' => $this->reservation_date?->format('Y-m-d'),
                'debut' => $this->date_debut?->format('Y-m-d'),
                'fin' => $this->date_fin?->format('Y-m-d'),
            ],
            'status' => $this->status,
            'legacy_pricing' => (bool) $this->legacy_pricing,
            'total' => $this->montant_total,
            'room_count' => (int) ($this->reservation_rooms_count ?? 0),
            'reglement' => $paymentSummary,
            'politique_paiement' => ReservationPolicyData::policy($this->resource),
            'echeance' => ReservationPolicyData::deadline($this->resource, $paymentSummary),
            'confirmation' => ReservationPolicyData::confirmation($this->resource, $paymentSummary, $credit),
            'credit' => $credit,
            'cancellation' => [
                'cancelled_at' => $this->cancelled_at?->toIso8601String(),
                'reason' => $this->cancellation_reason,
            ],
        ];
    }
}
