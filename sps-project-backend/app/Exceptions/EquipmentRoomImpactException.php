<?php

namespace App\Exceptions;

use RuntimeException;

class EquipmentRoomImpactException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly array $context = [],
        public readonly int $status = 409
    ) {
        parent::__construct($message);
    }
}
