<?php

namespace App\Exceptions;

use RuntimeException;

class ReclamationDomainException extends RuntimeException
{
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
            'context' => $this->context ?: null,
        ], static fn (mixed $value): bool => $value !== null);
    }
}
