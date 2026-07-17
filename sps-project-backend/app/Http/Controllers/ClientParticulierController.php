<?php

namespace App\Http\Controllers;

use App\Models\ClientParticulier;
use App\Models\Enfant;
use App\Models\Reservation;
use App\Models\SiteClientParticulier;
use App\Support\GeneratedRecordCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;

class ClientParticulierController extends Controller
{
    public function statsByVille()
    {
        return response()->json(
            ClientParticulier::select('ville', DB::raw('COUNT(*) as count'))
                ->groupBy('ville')
                ->orderBy('ville')
                ->get()
        );
    }

    public function statsBySecteur()
    {
        $data = ClientParticulier::join('secteur_clients', 'clients_particulier.secteur_id', '=', 'secteur_clients.id')
            ->select('secteur_clients.secteurClient as secteur', DB::raw('COUNT(*) as count'))
            ->groupBy('secteur_clients.secteurClient')
            ->get();

        return response()->json($data);
    }

    public function index()
    {
        $clients = ClientParticulier::with('info_clients')->get();

        return response()->json([
            'message' => 'Liste des clients récupérée avec succès',
            'client' => $clients,
            'count' => $clients->count(),
        ]);
    }

    public function getAllDataDachborde()
    {
        return response()->json(['clients' => ClientParticulier::count()]);
    }

    public function getAllData()
    {
        return response()->json([
            'clients' => ClientParticulier::with('info_clients')->get(),
        ]);
    }

    public function locationOptions()
    {
        $countries = collect(config('client_locations.countries', []));
        $morocco = [
            'code' => 'MA',
            'name' => $countries->get('MA', 'Maroc'),
        ];

        $otherCountries = $countries
            ->except('MA')
            ->map(fn (string $name, string $code): array => ['code' => $code, 'name' => $name])
            ->sortBy(fn (array $country): string => Str::lower(Str::ascii($country['name'])))
            ->values();

        return response()->json([
            'countries' => collect([$morocco])->concat($otherCountries)->values(),
            'moroccoRegions' => config('client_locations.morocco_regions', []),
        ]);
    }

    public function siteclients($clientId)
    {
        $siteClients = SiteClientParticulier::where('client_id', $clientId)
            ->with('zone', 'region')
            ->get();

        return response()->json([
            'message' => 'Site clients récupérés avec succès',
            'siteClients' => $siteClients,
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $this->validateGuest($request);

        return DB::transaction(function () use ($request, $validatedData) {
            $validatedData['user_id'] = Auth::id();
            $validatedData['CodeClient'] = GeneratedRecordCode::temporary('CP');
            $client = ClientParticulier::create($validatedData);
            $client->forceFill([
                'CodeClient' => GeneratedRecordCode::fromId('CP', $client->id),
            ])->save();
            $this->createLegacySingleChild($request, $client);

            return response()->json([
                'message' => 'Client ajouté avec succès',
                'client' => $client->load('info_clients'),
            ], 201);
        });
    }

    public function show($id)
    {
        return response()->json([
            'client' => ClientParticulier::with('info_clients')->findOrFail($id),
        ]);
    }

    public function update(Request $request, $id)
    {
        $client = ClientParticulier::findOrFail($id);
        $validatedData = $this->validateGuest($request, $client);

        return DB::transaction(function () use ($request, $client, $validatedData) {
            $client->update($validatedData);
            $this->createLegacySingleChild($request, $client);

            return response()->json([
                'message' => 'Client modifié avec succès',
                'client' => $client->fresh()->load('info_clients'),
            ]);
        });
    }

    public function destroy($id)
    {
        $client = ClientParticulier::findOrFail($id);
        if (Reservation::query()
            ->where('client_type', 'particulier')
            ->where('client_id', $client->id)
            ->exists()) {
            return response()->json([
                'message' => 'Ce client ne peut pas être supprimé car il est utilisé par des réservations.',
            ], 409);
        }

        $client->delete();

        return response()->json(['message' => 'Client supprimé avec succès']);
    }

    private function validateGuest(Request $request, ?ClientParticulier $client = null): array
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
            'prenom' => trim((string) $request->input('prenom')),
            'cin' => trim((string) $request->input('cin')),
            'pays_code' => Str::upper(trim((string) $request->input('pays_code'))),
            'region_nom' => $this->nullableTrim($request->input('region_nom')),
            'ville' => trim((string) $request->input('ville')),
            'ville_autre' => $this->nullableTrim($request->input('ville_autre')),
        ]);

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'type_piece' => ['required', 'string', Rule::in(config('client_locations.document_types', []))],
            'cin' => [
                'required', 'string', 'max:255',
                Rule::unique('clients_particulier', 'cin')->ignore($client?->id),
            ],
            'civilite' => ['nullable', 'string', 'max:50'],
            'nationalite' => ['required', 'string', 'max:100'],
            'tele' => ['required', 'string', 'max:30'],
            'pays_code' => ['required', 'string', 'size:2', Rule::in(array_keys(config('client_locations.countries', [])))],
            'region_nom' => ['nullable', 'string', 'max:255'],
            'ville' => ['required', 'string', 'max:255'],
            'ville_autre' => ['nullable', 'string', 'max:255'],
            'adresse' => ['nullable', 'string', 'max:500'],
            'code_postal' => ['nullable', 'string', 'max:30'],
            'enfantAge' => ['nullable', 'integer', 'min:0', 'max:17'],
        ], [
            'name.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'type_piece.required' => 'Le type de pièce est obligatoire.',
            'type_piece.in' => 'Le type de pièce sélectionné est invalide.',
            'cin.required' => 'Le numéro de pièce est obligatoire.',
            'cin.unique' => 'Ce numéro de pièce existe déjà.',
            'nationalite.required' => 'La nationalité est obligatoire.',
            'tele.required' => 'Le téléphone est obligatoire.',
            'tele.max' => 'Le téléphone ne doit pas dépasser 30 caractères.',
            'pays_code.required' => 'Le pays de résidence est obligatoire.',
            'pays_code.in' => 'Le pays de résidence sélectionné est invalide.',
            'ville.required' => 'La ville est obligatoire.',
            'code_postal.max' => 'Le code postal ne doit pas dépasser 30 caractères.',
            'enfantAge.integer' => 'L’âge de l’enfant doit être compris entre 0 et 17 ans.',
            'enfantAge.min' => 'L’âge de l’enfant doit être compris entre 0 et 17 ans.',
            'enfantAge.max' => 'L’âge de l’enfant doit être compris entre 0 et 17 ans.',
        ]);

        $validator->after(function ($validator) use ($request): void {
            if ($request->input('pays_code') !== 'MA') {
                return;
            }

            $regions = collect(config('client_locations.morocco_regions', []));
            $regionName = $request->input('region_nom');
            if (! $regionName) {
                $validator->errors()->add('region_nom', 'La région est obligatoire pour une adresse au Maroc.');

                return;
            }

            $region = $regions->firstWhere('name', $regionName);
            if (! $region) {
                $validator->errors()->add('region_nom', 'La région sélectionnée ne fait pas partie des régions marocaines configurées.');

                return;
            }

            $city = $request->input('ville');
            $otherCityLabel = config('client_locations.other_city_label', 'Autre ville');
            if ($city === $otherCityLabel) {
                if (! $request->input('ville_autre')) {
                    $validator->errors()->add('ville_autre', 'La ville est obligatoire.');
                }

                return;
            }

            if ($city && ! in_array($city, $region['cities'], true)) {
                $validator->errors()->add('ville', 'La ville sélectionnée ne correspond pas à la région marocaine choisie.');
            }
        });

        $validated = $validator->validate();
        if ($validated['pays_code'] === 'MA' && $validated['ville'] === config('client_locations.other_city_label')) {
            $validated['ville'] = $validated['ville_autre'];
        }
        unset($validated['ville_autre']);

        return $validated;
    }

    private function nullableTrim(mixed $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function createLegacySingleChild(Request $request, ClientParticulier $client): void
    {
        if (! $request->filled('enfantPrenom') && ! $request->filled('enfantAge')) {
            return;
        }

        Enfant::create([
            'idClient' => $client->id,
            'name' => $client->name,
            'prenom' => $request->input('enfantPrenom'),
            'age' => $request->input('enfantAge'),
            'type' => 'C',
        ]);
    }
}
