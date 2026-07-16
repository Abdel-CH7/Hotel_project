<?php

namespace App\Http\Controllers;

use App\Models\Employe;
use App\Models\EtatChambre;
use App\Models\MaintenanceType;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use DateTimeInterface;

class EtatChambreController extends Controller
{
    private const RELATIONS = ['chambre', 'maintenanceType', 'nettoyeePar'];

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
            'etat_chambre' => $etatChambre,
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate($this->rules($request));
        $validatedData = $this->normalizeMaintenance($validatedData);
        $etatChambre = EtatChambre::create($validatedData);

        return response()->json([
            'success' => true,
            'etat_chambre' => $etatChambre->load(self::RELATIONS),
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

        return response()->json([
            'success' => true,
            'etat_chambre' => $etatChambre->fresh(self::RELATIONS),
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
        return [
            'success' => true,
            'etat_chambres' => EtatChambre::with(self::RELATIONS)
                ->orderByDesc('created_at')
                ->get(),
            'maintenance_types' => MaintenanceType::orderBy('code')->get(),
            'employes' => Employe::where('actif', true)
                ->whereIn('fonction', ['nettoyage', 'supervision'])
                ->orderBy('nom')
                ->orderBy('prenom')
                ->get(),
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
