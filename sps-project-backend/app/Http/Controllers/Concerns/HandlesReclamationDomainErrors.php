<?php

namespace App\Http\Controllers\Concerns;

use App\Exceptions\ReclamationDomainException;
use Illuminate\Http\JsonResponse;

trait HandlesReclamationDomainErrors
{
    protected function domainError(ReclamationDomainException $exception): JsonResponse
    {
        $payload = $exception->toArray();
        if ($exception->field) {
            $payload['errors'] = [$exception->field => [$exception->getMessage()]];
        }

        return response()->json($payload, $exception->recommendedStatus);
    }
}
