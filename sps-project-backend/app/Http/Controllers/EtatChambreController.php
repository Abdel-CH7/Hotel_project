<?php

namespace App\Http\Controllers;

use App\Models\Employe;
use App\Models\Equipement;
use App\Models\EtatChambre;
use App\Models\MaintenanceType;
use App\Models\Reservation;
use App\Support\ReservationClientData;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use DateTimeInterface;

class EtatChambreController extends Controller
{
    private const RELATIONS = ['chambre', 'maintenanceType', 'nettoyeePar'];
    private const OCCUPYING_RESERVATION_STATUSES = ['en attente', 'confirmé'];

    public function index()
    {
        return response()->json($this->indexPayload());
    }

    public function show($num_chambre)
    {
        $etatChambre = EtatChambre::with(self::RELATIONS)
            ->where('num_chambre', $num_chambre)
            ->first();

        if (! $etatChambre) {
            return response()->json([
                'success' => false,
                'message' => 'État de chambre non trouvé.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'etat_chambre' => $this->withCurrentOccupation(collect([$etatChambre]))->first(),
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate($this->rules($request));
        $validatedData = $this->normalizeMaintenance($validatedData);
        $etatChambre = EtatChambre::create($validatedData);

        $etatChambre = $etatChambre->load(self::RELATIONS);

        return response()->json([
            'success' => true,
            'etat_chambre' => $this->withCurrentOccupation(collect([$etatChambre]))->first(),
        ], 201);
    }

    public function update(Request $request, $num_chambre)
    {
        $etatChambre = EtatChambre::where('num_chambre', $num_chambre)->first();

        if (! $etatChambre) {
            return response()->json([
                'success' => false,
                'message' => 'État de chambre non trouvé.',
            ], 404);
        }

        $this->mergeCurrentValues($request, $etatChambre);
        $validatedData = $request->validate($this->rules($request, $etatChambre));
        $validatedData = $this->normalizeMaintenance($validatedData);
        $etatChambre->update($validatedData);

        $etatChambre = $etatChambre->fresh(self::RELATIONS);

        return response()->json([
            'success' => true,
            'etat_chambre' => $this->withCurrentOccupation(collect([$etatChambre]))->first(),
        ]);
    }

    public function destroy($num_chambre)
    {
        if (! EtatChambre::where('num_chambre', $num_chambre)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'État de chambre non trouvé.',
            ], 404);
        }

        return response()->json([
            'success' => false,
            'message' => "L'état courant ne peut pas être supprimé tant que la chambre existe.",
        ], 409);
    }

    public function getMaintenanceTypes()
    {
        return response()->json([
            'success' => true,
            'maintenance_types' => MaintenanceType::orderBy('code')->get(),
        ]);
    }

    public function getChambresWithEtat()
    {
        return response()->json($this->indexPayload());
    }

    private function indexPayload(): array
    {
        $roomStates = EtatChambre::with(self::RELATIONS)
            ->orderByDesc('created_at')
            ->get();

        return [
            'success' => true,
            'etat_chambres' => $this->withCurrentOccupation($roomStates),
            'maintenance_types' => MaintenanceType::orderBy('code')->get(),
            'employes' => Employe::where('actif', true)
                ->whereIn('fonction', ['nettoyage', 'supervision'])
                ->orderBy('nom')
                ->orderBy('prenom')
                ->get(),
        ];
    }

    private function withCurrentOccupation(Collection $roomStates): Collection
    {
        $roomIds = $roomStates
            ->pluck('chambre.id')
            ->filter()
            ->map(fn ($id): int => (int) $id)
            ->unique()
            ->values();
        $reservationsByRoom = collect();
        $equipmentByRoom = collect();

        if ($roomIds->isNotEmpty()) {
            $today = today()->toDateString();
            $reservations = Reservation::query()
                ->with([
                    'client',
                    'reservationRooms' => fn ($query) => $query
                        ->whereIn('chambre_id', $roomIds)
                        ->select(['id', 'reservation_id', 'chambre_id']),
                ])
                ->whereIn('status', self::OCCUPYING_RESERVATION_STATUSES)
                ->whereDate('date_debut', '<=', $today)
                ->whereDate('date_fin', '>', $today)
                ->whereHas(
                    'reservationRooms',
                    fn ($query) => $query->whereIn('chambre_id', $roomIds)
                )
                ->orderByRaw("CASE WHEN status = 'confirmé' THEN 0 ELSE 1 END")
                ->orderBy('date_debut')
                ->orderBy('id')
                ->get([
                    'id',
                    'reservation_num',
                    'client_id',
                    'client_type',
                    'client_name_snapshot',
                    'status',
                    'date_debut',
                    'date_fin',
                ]);

            foreach ($reservations as $reservation) {
                foreach ($reservation->reservationRooms as $allocation) {
                    $roomId = (int) $allocation->chambre_id;
                    if ($reservationsByRoom->has($roomId)) {
                        $selected = $reservationsByRoom->get($roomId);
                        Log::warning('Multiple current reservations found for room.', [
                            'chambre_id' => $roomId,
                            'selected_reservation_id' => $selected->id,
                            'ignored_reservation_id' => $reservation->id,
                        ]);

                        continue;
                    }

                    $reservationsByRoom->put($roomId, $reservation);
                }
            }

            $equipmentByRoom = Equipement::query()
                ->whereIn('chambre_id', $roomIds)
                ->whereIn('statut', ['en_maintenance', 'hors_service'])
                ->orderBy('id')
                ->get(['id', 'chambre_id', 'nom', 'statut', 'impact_chambre'])
                ->groupBy(fn (Equipement $equipment) => (int) $equipment->chambre_id);
        }

        return $roomStates->each(function (EtatChambre $roomState) use (
            $reservationsByRoom,
            $equipmentByRoom
        ): void {
            $roomId = $roomState->chambre?->id;
            $reservation = $roomId
                ? $reservationsByRoom->get((int) $roomId)
                : null;

            $roomState->setAttribute('occupation', $this->occupationPayload($reservation));
            $roomState->setAttribute(
                'equipements',
                $this->equipmentPayload($roomId ? $equipmentByRoom->get((int) $roomId, collect()) : collect())
            );
        });
    }

    private function equipmentPayload(Collection $equipment): array
    {
        return [
            'total_problematiques' => $equipment->count(),
            'service_degrade' => $equipment
                ->where('impact_chambre', 'service_degrade')
                ->count(),
            'bloquants' => $equipment
                ->where('impact_chambre', 'chambre_indisponible')
                ->count(),
            'items' => $equipment->map(fn (Equipement $item): array => [
                'id' => (int) $item->id,
                'nom' => $item->nom,
                'statut' => $item->statut,
                'impact_chambre' => $item->impact_chambre,
            ])->values()->all(),
        ];
    }

    private function occupationPayload(?Reservation $reservation): array
    {
        if (! $reservation) {
            return [
                'statut' => 'libre',
                'occupee' => false,
                'reservation' => null,
            ];
        }

        $client = ReservationClientData::reservationClient($reservation);

        return [
            'statut' => 'occupée',
            'occupee' => true,
            'reservation' => [
                'id' => (int) $reservation->id,
                'numero' => $reservation->reservation_num,
                'statut' => $reservation->status,
                'date_debut' => $reservation->date_debut?->format('Y-m-d'),
                'date_fin' => $reservation->date_fin?->format('Y-m-d'),
                'client' => $client['display_name'],
            ],
        ];
    }

    private function rules(Request $request, ?EtatChambre $etatChambre = null): array
    {
        $isCleaningComplete = $request->input('status') === 'nettoyée';
        $isUnderMaintenance = $request->boolean('maintenance');

        $rules = [
            'status' => ['required', Rule::in(['nettoyée', 'non nettoyée'])],
            'date_nettoyage' => [Rule::requiredIf($isCleaningComplete), 'nullable', 'date'],
            'nettoyee_par_id' => [
                Rule::requiredIf($isCleaningComplete),
                'nullable',
                'integer',
                Rule::exists('employes', 'id')->where(function (Builder $query) {
                    $query->where('actif', true)
                        ->whereIn('fonction', ['nettoyage', 'supervision']);
                }),
            ],
            'maintenance' => 'required|boolean',
            'maintenance_type_id' => [
                Rule::requiredIf($isUnderMaintenance),
                'nullable',
                'integer',
                'exists:types_maintenance,id',
            ],
            'date_debut_maintenance' => [
                Rule::requiredIf($isUnderMaintenance),
                'nullable',
                'date',
            ],
            'date_fin_maintenance' => [
                Rule::requiredIf($isUnderMaintenance),
                'nullable',
                'date',
                'after_or_equal:date_debut_maintenance',
            ],
            'commentaire' => 'nullable|string',
        ];

        if (! $etatChambre) {
            $rules['num_chambre'] = [
                'required',
                'string',
                'exists:chambres,num_chambre',
                'unique:etat_chambre,num_chambre',
            ];
        }

        return $rules;
    }

    private function mergeCurrentValues(Request $request, EtatChambre $etatChambre): void
    {
        foreach ([
            'status',
            'date_nettoyage',
            'nettoyee_par_id',
            'maintenance',
            'maintenance_type_id',
            'date_debut_maintenance',
            'date_fin_maintenance',
            'commentaire',
        ] as $field) {
            if (! $request->exists($field)) {
                $value = $etatChambre->{$field};
                $request->merge([
                    $field => $value instanceof DateTimeInterface
                        ? $value->format('Y-m-d')
                        : $value,
                ]);
            }
        }
    }

    private function normalizeMaintenance(array $validatedData): array
    {
        if (! $validatedData['maintenance']) {
            $validatedData['maintenance_type_id'] = null;
            $validatedData['date_debut_maintenance'] = null;
            $validatedData['date_fin_maintenance'] = null;
        }

        return $validatedData;
    }
}
