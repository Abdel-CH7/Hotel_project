<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ContactClient;
use App\Models\ModePaimant;
use App\Models\Reservation;
use App\Models\SecteurClient;
use App\Models\SiteClient;
use App\Support\GeneratedRecordCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Validator;

class ClientController extends Controller
{
    private const PAYMENT_DELAYS = [15, 30, 45, 60, 90];

    public function statsByVille()
    {
        return response()->json(
            Client::select('ville', DB::raw('COUNT(*) as count'))
                ->groupBy('ville')
                ->orderBy('ville')
                ->get()
        );
    }

    public function statsBySecteur()
    {
        return response()->json(
            Client::join('secteur_clients', 'clients.secteur_id', '=', 'secteur_clients.id')
                ->select('secteur_clients.secteurClient as secteur', DB::raw('COUNT(*) as count'))
                ->groupBy('secteur_clients.secteurClient')
                ->get()
        );
    }

    public function index()
    {
        $clients = $this->companyQuery()->latest('created_at')->get();

        return response()->json([
            'message' => 'Liste des clients société récupérée avec succès.',
            'client' => $clients,
            'count' => $clients->count(),
        ]);
    }

    public function getAllDataDachborde()
    {
        return response()->json(['clients' => Client::count()]);
    }

    public function getAllData()
    {
        return response()->json([
            'clients' => $this->companyQuery()->get(),
            'secteurClients' => SecteurClient::orderBy('secteurClient')->get(),
            'modpai' => ModePaimant::orderBy('mode_paimants')->get(),
        ]);
    }

    public function formOptions()
    {
        $countries = collect(config('client_locations.countries', []));
        $morocco = ['code' => 'MA', 'name' => $countries->get('MA', 'Maroc')];
        $otherCountries = $countries
            ->except('MA')
            ->map(fn (string $name, string $code): array => ['code' => $code, 'name' => $name])
            ->sortBy(fn (array $country): string => Str::lower(Str::ascii($country['name'])))
            ->values();

        return response()->json([
            'countries' => collect([$morocco])->concat($otherCountries)->values(),
            'moroccoRegions' => config('client_locations.morocco_regions', []),
            'organizationTypes' => collect(Client::ORGANIZATION_TYPES)
                ->map(fn (string $label, string $value): array => compact('value', 'label'))
                ->values(),
            'paymentDelays' => collect(self::PAYMENT_DELAYS)
                ->map(fn (int $value): array => ['value' => $value, 'label' => "{$value} jours"]),
        ]);
    }

    public function siteclients($clientId)
    {
        return response()->json([
            'message' => 'Site clients récupérés avec succès.',
            'siteClients' => SiteClient::where('client_id', $clientId)->with('zone', 'region')->get(),
        ]);
    }

    public function store(Request $request)
    {
        [$companyData, $contacts] = $this->validateCompany($request);

        $client = DB::transaction(function () use ($companyData, $contacts): Client {
            $companyData['user_id'] = Auth::id();
            $companyData['CodeClient'] = GeneratedRecordCode::temporary('CS');
            $client = Client::create($companyData);
            $client->forceFill([
                'CodeClient' => GeneratedRecordCode::fromId('CS', $client->id),
            ])->save();
            $this->persistContacts($client, $contacts);

            return $client->load('secteur', 'contact_clients');
        });

        return response()->json([
            'message' => 'Client société ajouté avec succès.',
            'client' => $client,
        ], 201);
    }

    public function show($id)
    {
        return response()->json([
            'client' => $this->companyQuery()->findOrFail($id),
        ]);
    }

    public function update(Request $request, $id)
    {
        $existingClient = Client::findOrFail($id);
        [$companyData, $contacts] = $this->validateCompany($request, $existingClient);

        $client = DB::transaction(function () use ($id, $companyData, $contacts): Client {
            $client = Client::query()->lockForUpdate()->findOrFail($id);
            $client->update($companyData);
            $this->persistContacts($client, $contacts);

            return $client->fresh()->load('secteur', 'contact_clients');
        });

        return response()->json([
            'message' => 'Client société modifié avec succès.',
            'client' => $client,
        ]);
    }

    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            $client = Client::query()->lockForUpdate()->findOrFail($id);

            if (Reservation::query()
                ->where('client_type', 'societe')
                ->where('client_id', $client->id)
                ->exists()) {
                return response()->json([
                    'message' => 'Ce client ne peut pas être supprimé car il est utilisé par des réservations.',
                ], 409);
            }

            if (SiteClient::query()->where('client_id', $client->id)->exists()) {
                return response()->json([
                    'message' => 'Ce client ne peut pas être supprimé car des sites historiques lui sont rattachés.',
                ], 409);
            }

            ContactClient::query()
                ->where('type', 'C')
                ->where('idClient', $client->id)
                ->delete();
            $client->delete();

            return response()->json(['message' => 'Client société supprimé avec succès.']);
        });
    }

    private function companyQuery()
    {
        return Client::query()->with('secteur', 'contact_clients');
    }

    private function validateCompany(Request $request, ?Client $client = null): array
    {
        $contacts = collect($request->input('contacts', []))
            ->filter(fn ($contact): bool => is_array($contact) && collect([
                $contact['name'] ?? null,
                $contact['prenom'] ?? null,
                $contact['telephone'] ?? null,
                $contact['email'] ?? null,
            ])->contains(fn ($value): bool => trim((string) $value) !== ''))
            ->map(fn (array $contact): array => [
                'id' => isset($contact['id']) && $contact['id'] !== '' ? $contact['id'] : null,
                'name' => trim((string) ($contact['name'] ?? '')),
                'prenom' => $this->nullableTrim($contact['prenom'] ?? null),
                'telephone' => $this->nullableTrim($contact['telephone'] ?? null),
                'email' => $this->nullableTrim($contact['email'] ?? null),
            ])
            ->values()
            ->all();

        $request->merge([
            'raison_sociale' => trim((string) $request->input('raison_sociale')),
            'ice' => trim((string) $request->input('ice')),
            'tele' => trim((string) $request->input('tele')),
            'email' => trim((string) $request->input('email')),
            'pays_code' => Str::upper(trim((string) $request->input('pays_code'))),
            'region_nom' => $this->nullableTrim($request->input('region_nom')),
            'ville' => trim((string) $request->input('ville')),
            'ville_autre' => $this->nullableTrim($request->input('ville_autre')),
            'credit_autorise' => $request->boolean('credit_autorise'),
            'contacts' => $contacts,
        ]);

        $validator = Validator::make($request->all(), [
            'raison_sociale' => ['required', 'string', 'max:255'],
            'ice' => ['required', 'string', 'max:80', Rule::unique('clients', 'ice')->ignore($client?->id)],
            'type_organisation' => ['required', 'string', Rule::in(array_keys(Client::ORGANIZATION_TYPES))],
            'abreviation' => ['nullable', 'string', 'max:100'],
            'secteur_id' => ['nullable', 'integer', 'exists:secteur_clients,id'],
            'tele' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255'],
            'pays_code' => ['required', 'string', 'size:2', Rule::in(array_keys(config('client_locations.countries', [])))],
            'region_nom' => ['nullable', 'string', 'max:255'],
            'ville' => ['required', 'string', 'max:255'],
            'ville_autre' => ['nullable', 'string', 'max:255'],
            'adresse' => ['required', 'string', 'max:500'],
            'code_postal' => ['nullable', 'string', 'max:30'],
            'mod_id' => ['nullable', 'integer', 'exists:mode_paimants,id'],
            'credit_autorise' => ['required', 'boolean'],
            'delai_paiement_jours' => [Rule::requiredIf($request->boolean('credit_autorise')), 'nullable', 'integer', Rule::in(self::PAYMENT_DELAYS)],
            'plafond_credit' => [Rule::requiredIf($request->boolean('credit_autorise')), 'nullable', 'numeric', 'gt:0', 'max:9999999999.99'],
            'contacts' => ['nullable', 'array'],
            'contacts.*.id' => ['nullable', 'integer'],
            'contacts.*.name' => ['required', 'string', 'max:255'],
            'contacts.*.prenom' => ['nullable', 'string', 'max:255'],
            'contacts.*.telephone' => ['nullable', 'string', 'max:30'],
            'contacts.*.email' => ['nullable', 'email', 'max:255'],
        ], [
            'raison_sociale.required' => 'La raison sociale est obligatoire.',
            'ice.required' => 'L’ICE / identifiant fiscal est obligatoire.',
            'ice.unique' => 'Cet ICE / identifiant fiscal existe déjà.',
            'type_organisation.required' => 'Le type d’organisation est obligatoire.',
            'type_organisation.in' => 'Le type d’organisation sélectionné est invalide.',
            'tele.required' => 'Le téléphone est obligatoire.',
            'tele.max' => 'Le téléphone ne doit pas dépasser 30 caractères.',
            'email.required' => 'L’email général est obligatoire.',
            'email.email' => 'L’email général doit être une adresse valide.',
            'pays_code.required' => 'Le pays est obligatoire.',
            'pays_code.in' => 'Le pays sélectionné est invalide.',
            'ville.required' => 'La ville est obligatoire.',
            'adresse.required' => 'L’adresse est obligatoire.',
            'delai_paiement_jours.required' => 'Le délai de paiement est obligatoire lorsque le crédit est autorisé.',
            'delai_paiement_jours.in' => 'Le délai de paiement sélectionné est invalide.',
            'plafond_credit.required' => 'Le plafond de crédit est obligatoire lorsque le crédit est autorisé.',
            'plafond_credit.gt' => 'Le plafond de crédit doit être supérieur à zéro.',
            'contacts.*.name.required' => 'Le nom du contact est obligatoire.',
            'contacts.*.telephone.max' => 'Le téléphone du contact ne doit pas dépasser 30 caractères.',
            'contacts.*.email.email' => 'L’email du contact doit être une adresse valide.',
        ]);

        $validator->after(function ($validator) use ($request, $client): void {
            if ($request->input('pays_code') === 'MA') {
                if (! preg_match('/^\d{15}$/', (string) $request->input('ice'))) {
                    $validator->errors()->add('ice', 'L’ICE doit contenir exactement 15 chiffres.');
                }

                $regions = collect(config('client_locations.morocco_regions', []));
                $regionName = $request->input('region_nom');
                if (! $regionName) {
                    $validator->errors()->add('region_nom', 'La région est obligatoire pour une adresse au Maroc.');
                } else {
                    $region = $regions->firstWhere('name', $regionName);
                    if (! $region) {
                        $validator->errors()->add('region_nom', 'La région sélectionnée ne fait pas partie des régions marocaines configurées.');
                    } else {
                        $city = $request->input('ville');
                        $otherCityLabel = config('client_locations.other_city_label', 'Autre ville');
                        if ($city === $otherCityLabel) {
                            if (! $request->input('ville_autre')) {
                                $validator->errors()->add('ville_autre', 'La ville est obligatoire.');
                            }
                        } elseif ($city && ! in_array($city, $region['cities'], true)) {
                            $validator->errors()->add('ville', 'La ville sélectionnée ne correspond pas à la région marocaine choisie.');
                        }
                    }
                }
            } elseif ($request->filled('ice') && ! preg_match('/^[\pL\pN][\pL\pN .\-\/]*$/u', (string) $request->input('ice'))) {
                $validator->errors()->add('ice', 'L’identifiant fiscal doit contenir uniquement des lettres, chiffres, espaces, tirets, points ou barres obliques.');
            }

            foreach ($request->input('contacts', []) as $index => $contact) {
                if (empty($contact['telephone']) && empty($contact['email'])) {
                    $validator->errors()->add("contacts.{$index}.telephone", 'Renseignez au moins un téléphone ou un email.');
                }

                if (! empty($contact['id']) && $client && ! ContactClient::query()
                    ->whereKey($contact['id'])
                    ->where('idClient', $client->id)
                    ->where('type', 'C')
                    ->exists()) {
                    $validator->errors()->add("contacts.{$index}.id", 'Ce contact n’appartient pas à cette société.');
                }
            }
        });

        $validated = $validator->validate();
        $validatedContacts = $validated['contacts'] ?? [];
        unset($validated['contacts'], $validated['ville_autre']);

        if ($validated['pays_code'] === 'MA' && $validated['ville'] === config('client_locations.other_city_label')) {
            $validated['ville'] = $request->input('ville_autre');
        }
        if (! $validated['credit_autorise']) {
            $validated['delai_paiement_jours'] = null;
            $validated['plafond_credit'] = null;
        }

        return [$validated, $validatedContacts];
    }

    private function persistContacts(Client $client, array $contacts): void
    {
        $retainedIds = [];

        foreach ($contacts as $index => $contactData) {
            $id = $contactData['id'] ?? null;
            unset($contactData['id']);

            if ($id) {
                $contact = ContactClient::query()
                    ->whereKey($id)
                    ->where('idClient', $client->id)
                    ->where('type', 'C')
                    ->lockForUpdate()
                    ->first();

                if (! $contact) {
                    throw ValidationException::withMessages([
                        "contacts.{$index}.id" => 'Ce contact n’appartient pas à cette société.',
                    ]);
                }

                $contact->update($contactData);
                $retainedIds[] = $contact->id;
            } else {
                $contact = ContactClient::create(array_merge($contactData, [
                    'idClient' => $client->id,
                    'type' => 'C',
                ]));
                $retainedIds[] = $contact->id;
            }
        }

        $removedContacts = ContactClient::query()
            ->where('idClient', $client->id)
            ->where('type', 'C');

        if ($retainedIds !== []) {
            $removedContacts->whereNotIn('id', $retainedIds);
        }

        $removedContacts->delete();
    }

    private function nullableTrim(mixed $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $trimmed;
    }
}
