<?php

namespace App\Http\Controllers;

use App\Services\ReservationReadinessService;
use Illuminate\Http\JsonResponse;

class ReservationReadinessController extends Controller
{
    public function __invoke(ReservationReadinessService $readiness): JsonResponse
    {
        return response()->json([
            'data' => $readiness->diagnose(),
        ]);
    }
}
