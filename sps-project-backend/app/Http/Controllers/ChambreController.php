<?php

namespace App\Http\Controllers;

use App\Models\Chambre;
use App\Models\Etage;
use App\Models\EtatChambre;
use App\Models\TypeChambre;
use App\Models\Vue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ChambreController extends Controller
{
    private const RELATIONS = ['typeChambre', 'vue', 'etage'];

    public function index()
    {
        return $this->getAll();
    }

    public function getAll()
    {
        try {
            $chambres = Chambre::with(self::RELATIONS)
                ->orderBy('num_chambre')
                ->get()
                ->map(fn (Chambre $chambre): array => $this->roomResponse($chambre));

            return response()->json([
                'chambres' => $chambres,
                'types' => TypeChambre::orderBy('type_chambre')->get(),
                'vues' => Vue::all(),
                'etages' => Etage::all(),
            ]);
        } catch (\Throwable $exception) {
            Log::error('Error in ChambreController@getAll', [
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'Erreur lors de la recuperation des chambres.',
            ], 500);
        }
    }

    public function ajouterChambre(Request $request)
    {
        $validatedData = $this->validateRoom($request);

        try {
            $chambre = DB::transaction(fn (): Chambre => Chambre::create($validatedData));

            return response()->json([
                'message' => 'Chambre ajoutee avec succes.',
                'chambre' => $this->roomResponse($chambre),
            ], 201);
        } catch (\Throwable $exception) {
            Log::error('Error creating chambre', ['exception' => $exception]);

            return response()->json([
                'message' => "Erreur lors de l'ajout de la chambre.",
            ], 500);
        }
    }

    public function afficherChambre(Chambre $chambre)
    {
        return response()->json($this->roomResponse($chambre));
    }

    public function updateChambre(Request $request, Chambre $chambre)
    {
        $validatedData = $this->validateRoom($request, $chambre);

        try {
            DB::transaction(function () use ($chambre, $validatedData): void {
                $oldRoomNumber = $chambre->num_chambre;
                $roomState = EtatChambre::where('num_chambre', $oldRoomNumber)
                    ->lockForUpdate()
                    ->first();

                $chambre->update($validatedData);

                if (! $roomState) {
                    EtatChambre::create([
                        'num_chambre' => $chambre->num_chambre,
                        'status' => 'non nettoyée',
                        'maintenance' => false,
                    ]);

                    Log::warning('Missing room state repaired during room update.', [
                        'chambre_id' => $chambre->id,
                        'old_num_chambre' => $oldRoomNumber,
                        'new_num_chambre' => $chambre->num_chambre,
                    ]);

                    return;
                }

                if ($oldRoomNumber !== $chambre->num_chambre) {
                    $roomState->update(['num_chambre' => $chambre->num_chambre]);
                }
            });

            return response()->json([
                'message' => 'Chambre mise a jour avec succes.',
                'chambre' => $this->roomResponse($chambre->refresh()),
            ]);
        } catch (\Throwable $exception) {
            Log::error('Error updating chambre', [
                'chambre_id' => $chambre->id,
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise a jour de la chambre.',
            ], 500);
        }
    }

    public function supprimerChambre(Chambre $chambre)
    {
        if ($chambre->equipements()->withTrashed()->exists()) {
            return response()->json([
                'message' => 'Cette chambre ne peut pas etre supprimee car des equipements y sont affectes.',
            ], 409);
        }

        if ($chambre->reservations()->exists()) {
            return response()->json([
                'message' => 'Cette chambre ne peut pas etre supprimee car elle est utilisee par des reservations.',
            ], 409);
        }

        try {
            $chambre->delete();

            return response()->json([
                'message' => 'Chambre supprimee avec succes.',
            ]);
        } catch (\Throwable $exception) {
            Log::error('Error deleting chambre', [
                'chambre_id' => $chambre->id,
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression de la chambre.',
            ], 500);
        }
    }

    private function validateRoom(Request $request, ?Chambre $chambre = null): array
    {
        $input = $request->only([
            'num_chambre',
            'type_chambre_id',
            'etage_id',
            'vue_id',
            'climat',
            'wifi',
        ]);

        if (array_key_exists('num_chambre', $input)) {
            $input['num_chambre'] = trim((string) $input['num_chambre']);
        }

        foreach (['climat', 'wifi'] as $field) {
            if (array_key_exists($field, $input)) {
                $input[$field] = $this->normalizeBoolean($input[$field]);
            }
        }

        return Validator::make($input, [
            'num_chambre' => [
                'required',
                'string',
                'max:50',
                Rule::unique('chambres', 'num_chambre')->ignore($chambre?->id),
            ],
            'type_chambre_id' => ['required', 'integer', 'exists:types_chambre,id'],
            'etage_id' => ['required', 'integer', 'exists:etages,id'],
            'vue_id' => ['required', 'integer', 'exists:vues,id'],
            'climat' => ['required', 'boolean'],
            'wifi' => ['required', 'boolean'],
        ])->validate();
    }

    private function normalizeBoolean(mixed $value): mixed
    {
        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower(trim((string) $value));

        if (in_array($normalized, ['1', 'true', 'yes', 'on', 'oui'], true)) {
            return true;
        }

        if (in_array($normalized, ['0', 'false', 'no', 'off', 'non'], true)) {
            return false;
        }

        return $value;
    }

    private function roomResponse(Chambre $chambre): array
    {
        $chambre->loadMissing(self::RELATIONS);
        $type = $chambre->typeChambre;

        return [
            'id' => $chambre->id,
            'num_chambre' => $chambre->num_chambre,
            'type_chambre_id' => $chambre->type_chambre_id,
            'type_chambre' => $type ? [
                'id' => $type->id,
                'code' => $type->code,
                'type_chambre' => $type->type_chambre,
                'nb_lit' => $type->nb_lit,
                'nb_salle' => $type->nb_salle,
                'commentaire' => $type->commentaire,
            ] : null,
            'nb_lit' => $type?->nb_lit,
            'nb_salle' => $type?->nb_salle,
            'etage_id' => $chambre->etage_id,
            'etage' => $chambre->etage,
            'vue_id' => $chambre->vue_id,
            'vue' => $chambre->vue,
            'climat' => $chambre->climat,
            'wifi' => $chambre->wifi,
        ];
    }
}
