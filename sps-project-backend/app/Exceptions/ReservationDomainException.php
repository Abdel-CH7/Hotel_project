<?php

namespace App\Exceptions;

use RuntimeException;

class ReservationDomainException extends RuntimeException
{
    public const ROOM_UNAVAILABLE = 'room_unavailable';
    public const MAINTENANCE_OVERLAP = 'maintenance_overlap';
    public const TARIFF_PERIOD_MISSING = 'tariff_period_missing';
    public const TARIFF_PERIOD_OVERLAP = 'tariff_period_overlap';
    public const CAPACITY_NOT_CONFIGURED = 'room_capacity_not_configured';
    public const CAPACITY_EXCEEDED = 'room_capacity_exceeded';
    public const ROOM_PRICE_MISSING = 'room_occupancy_price_missing';
    public const ROOM_RATE_MISSING = 'room_rate_detail_missing';
    public const MEAL_RATE_MISSING = 'meal_rate_detail_missing';
    public const MEAL_QUANTITY_EXCEEDED = 'meal_quantity_exceeded';
    public const REDUCTION_RATE_MISSING = 'reduction_rate_detail_missing';
    public const INVALID_LIFECYCLE = 'invalid_reservation_lifecycle';

    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly ?string $field = null,
        public readonly int $recommendedStatus = 422,
        public readonly array $context = []
    ) {
        parent::__construct($message);
    }

    public function toArray(): array
    {
        return array_filter([
            'code' => $this->errorCode,
            'message' => $this->getMessage(),
            'field' => $this->field,
            'status' => $this->recommendedStatus,
            'context' => $this->context ?: null,
        ], static fn (mixed $value): bool => $value !== null);
    }
}
