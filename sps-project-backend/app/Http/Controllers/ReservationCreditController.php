<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Services\ReservationPolicyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationCreditController extends Controller
{
    public function __construct(private readonly ReservationPolicyService $policyService)
    {
    }

    public function show(Request $request, Client $client): JsonResponse
    {
        $validated = $request->validate([
            'exclude_reservation_id' => ['nullable', 'integer', 'exists:reservations,id'],
        ]);

        return response()->json(['data' => $this->policyService->companyCreditSummary(
            $client,
            isset($validated['exclude_reservation_id'])
                ? (int) $validated['exclude_reservation_id']
                : null
        )]);
    }
}
