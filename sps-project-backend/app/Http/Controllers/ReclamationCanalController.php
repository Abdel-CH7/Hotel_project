<?php

namespace App\Http\Controllers;

use App\Models\ReclamationCanal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReclamationCanalController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => ReclamationCanal::query()->orderBy('nom')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $channel = DB::transaction(function () use ($request): ReclamationCanal {
            $data = $this->validated($request);
            $this->clearOtherFlagWhenNeeded($data);

            return ReclamationCanal::create($data);
        });

        return response()->json(['data' => $channel], 201);
    }

    public function update(Request $request, ReclamationCanal $canal): JsonResponse
    {
        DB::transaction(function () use ($request, $canal): void {
            $data = $this->validated($request, $canal);
            $this->clearOtherFlagWhenNeeded($data, $canal->id);
            $canal->update($data);
        });

        return response()->json(['data' => $canal->fresh()]);
    }

    public function active(Request $request, ReclamationCanal $canal): JsonResponse
    {
        $data = $request->validate(['actif' => ['required', 'boolean']]);
        DB::transaction(function () use ($canal, $data): void {
            if ($data['actif'] && $canal->est_autre) {
                ReclamationCanal::query()
                    ->where('id', '!=', $canal->id)
                    ->update(['est_autre' => false]);
            }
            $canal->update($data);
        });

        return response()->json(['data' => $canal->fresh()]);
    }

    private function validated(Request $request, ?ReclamationCanal $canal = null): array
    {
        return $request->validate([
            'nom' => ['required', 'string', 'max:255', Rule::unique('reclamation_canaux', 'nom')->ignore($canal?->id)],
            'est_autre' => ['required', 'boolean'],
            'actif' => ['sometimes', 'boolean'],
        ], [
            'nom.required' => 'Le nom du canal est obligatoire.',
            'nom.unique' => 'Ce canal de réception existe déjà.',
        ]);
    }

    private function clearOtherFlagWhenNeeded(array $data, ?int $exceptId = null): void
    {
        if (! ($data['est_autre'] ?? false)) {
            return;
        }

        ReclamationCanal::query()
            ->when($exceptId, fn ($query) => $query->where('id', '!=', $exceptId))
            ->update(['est_autre' => false]);
    }
}
