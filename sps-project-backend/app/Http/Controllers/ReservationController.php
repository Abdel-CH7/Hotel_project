<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use Illuminate\Support\Facades\Log;
use App\Models\Chambre;
use App\Models\Client;
use App\Models\ClientParticulier;
use App\Models\TarifActuel;
use App\Models\TarifChambre;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReservationController extends Controller
{
    protected function calculateTarifForChambre($chambre, $nights)
    {
        $basePrices = [
            'single' => 100,
            'double' => 150,
            'suite' => 200
        ];

        return ($basePrices[$chambre->type_chambre] ?? 100) * $nights;
    }

    protected function getTarifForChambre($chambre)
    {
        // Default base prices for each room type
        $basePrices = [
            'single' => 100,
            'double' => 150, 
            'suite' => 200
        ];

        // Return the base price for the room type, or default to 100
        return $basePrices[$chambre->type_chambre] ?? 100;
    }

    public function index()
    {
        try {
            $reservations = Reservation::with(['chambres' => function($query) {
                $query->select('chambres.id', 'num_chambre', 'type_chambre', 'etage', 'vue');
            }])->get();
    
            $formattedReservations = $reservations->map(function ($reservation) {
                return [
                    'id' => $reservation->id,
                    'reservation_num' => $reservation->reservation_num,
                    'client_id' => $reservation->client_id,
                    'client_type' => $reservation->client_type,
                    'reservation_date' => $reservation->reservation_date,
                    'date_debut' => $reservation->date_debut,
                    'date_fin' => $reservation->date_fin,
                    'status' => $reservation->status,
                    'montant_total' => $reservation->montant_total,
                    'montant_reduction' => $reservation->montant_reduction,
                    'chambres' => $reservation->chambres->map(function ($chambre) {
                        return [
                            'id' => $chambre->id,
                            'num_chambre' => $chambre->num_chambre,
                            'type_chambre' => $chambre->type_chambre,
                            'etage' => $chambre->etage,
                            'vue' => $chambre->vue,
                            'tarif_par_nuit' => $chambre->pivot->tarif_par_nuit ?? 0,
                            'montant_total' => $chambre->pivot->montant_total ?? 0
                        ];
                    })
                ];
            });
    
            return response()->json([
                'status' => 'success',
                'reservations' => $formattedReservations
            ]);
    
        } catch (\Exception $e) {
            \Log::error('Error in ReservationController@index: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
    
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching reservations: ' . $e->getMessage()
            ], 500);
        }
    }    


    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'client_id' => 'required|integer',
                'client_type' => 'required|in:societe,particulier',
                'reservation_date' => 'required|date',
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after:date_debut',
                'status' => 'required',
                'chambre_ids' => 'required|array',
                'chambre_ids.*' => 'exists:chambres,id'
            ]);

            $nights = \Carbon\Carbon::parse($validated['date_debut'])
                ->diffInDays($validated['date_fin']);

            $reservation = Reservation::create([
                'reservation_num' => 'R' . strtoupper(uniqid()),
                'client_id' => $validated['client_id'],
                'client_type' => $validated['client_type'],
                'reservation_date' => $validated['reservation_date'],
                'date_debut' => $validated['date_debut'],
                'date_fin' => $validated['date_fin'],
                'status' => $validated['status'],
                'montant_total' => 0,
                'montant_reduction' => 0
            ]);

            $totalAmount = 0;
            foreach ($validated['chambre_ids'] as $chambreId) {
                $chambre = Chambre::findOrFail($chambreId);
                $tarifParNuit = $this->calculateTarifForChambre($chambre, 1);
                $montantTotal = $tarifParNuit * $nights;
                $totalAmount += $montantTotal;

                $reservation->chambres()->attach($chambreId, [
                    'tarif_par_nuit' => $tarifParNuit,
                    'montant_total' => $montantTotal
                ]);
            }

            $reservation->update(['montant_total' => $totalAmount]);

            return response()->json([
                'status' => 'success',
                'message' => 'Reservation created successfully',
                'reservation' => $reservation->load('chambres')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error creating reservation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getAll()
    {
        try {
            $reservations = Reservation::with(['chambres.typeChambre', 'chambres.etage','chambres.vue'])->get();
    
            $transformedReservations = $reservations->map(function($reservation) {
                // Get client data
                $client = null;
                if ($reservation->client_type === 'societe') {
                    $client = Client::find($reservation->client_id);
                } else {
                    $client = ClientParticulier::find($reservation->client_id);
                }
    
                // Transform reservation data
                return [
                    'id' => $reservation->id,
                    'reservation_num' => $reservation->reservation_num,
                    'client_id' => $reservation->client_id,
                    'client_type' => $reservation->client_type,
                    'client_name' => $client ? ($client->nom ?? $client->raison_sociale) : null,
                    'reservation_date' => $reservation->reservation_date,
                    'date_debut' => $reservation->date_debut,
                    'date_fin' => $reservation->date_fin,
                    'status' => $reservation->status,
                    'montant_total' => $reservation->montant_total,
                    'montant_reduction' => $reservation->montant_reduction,
'chambres' => $reservation->chambres->map(function($chambre) {
    return [
        'id' => $chambre->id,
        'num_chambre' => $chambre->num_chambre,

        // Display labels for the reservation form
        'type_chambre' => $chambre->typeChambre
            ? $chambre->typeChambre->type_chambre
            : $chambre->type_chambre,

        'etage' => $chambre->etage
            ? $chambre->etage->etage
            : null,

        'vue' => $chambre->vue
            ? $chambre->vue->vue
            : null,

        // Optional extra data if you want it later
        'type_chambre_commentaire' => $chambre->typeChambre
            ? $chambre->typeChambre->commentaire
            : null,

        'tarif_par_nuit' => $chambre->pivot->tarif_par_nuit ?? 0,
        'montant_total' => $chambre->pivot->montant_total ?? 0
    ];
})                ];
            });
    
            return response()->json([
                'status' => 'success',
                'reservations' => $transformedReservations
            ]);
    
        } catch (\Exception $e) {
            \Log::error('Error fetching reservations: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching reservations: ' . $e->getMessage()
            ], 500);
        }
    }    
    private function calculateTariff($dateDebut, $dateFin, $chambreIds, $repasIds = [], $reductionType = null)
    {
        $nights = Carbon::parse($dateDebut)->diffInDays(Carbon::parse($dateFin));
        
        // Get active tariff for the date range
        $activeTariff = TarifActuel::where('date_debut', '<=', $dateDebut)
            ->where('date_fin', '>=', $dateFin)
            ->with(['tarif_chambre', 'tarif_repas', 'tarif_reduction'])
            ->first();
    
        if (!$activeTariff) {
            throw new \Exception('No valid tariff found for the selected dates');
        }
    
        // Calculate room costs
        $roomCosts = Chambre::whereIn('id', $chambreIds)->get()->map(function($chambre) 
            use ($activeTariff, $nights) {
            $tarifChambre = $activeTariff->tarif_chambre;
            $tarifParNuit = 0;
            
            switch ($chambre->type_chambre) {
                case 'single':
                    $tarifParNuit = $tarifChambre->single;
                    break;
                case 'double':
                    $tarifParNuit = $tarifChambre->double;
                    break;
                case 'triple':
                    $tarifParNuit = $tarifChambre->triple;
                    break;
            }
    
            $extraBedCost = $chambre->lit_supp ? $tarifChambre->lit_supp : 0;
            return [
                'chambre_id' => $chambre->id,
                'tarif_par_nuit' => $tarifParNuit,
                'extra_bed_cost' => $extraBedCost,
                'montant_total' => ($tarifParNuit + $extraBedCost) * $nights
            ];
        })->toArray();
    
        // Calculate meal costs
        $mealCosts = 0;
        if (!empty($repasIds)) {
            $mealCosts = $activeTariff->tarif_repas->whereIn('id', $repasIds)
                ->sum('montant') * $nights;
        }
    
        // Calculate reduction
        $reduction = 0;
        if ($reductionType && $activeTariff->tarif_reduction) {
            $reductionDetail = $activeTariff->tarif_reduction->detail
                ->where('type_reduction', $reductionType)
                ->first();
                
            if ($reductionDetail) {
                $subtotal = array_sum(array_column($roomCosts, 'montant_total')) + $mealCosts;
                $reduction = ($subtotal * $reductionDetail->percentage / 100) 
                    + $reductionDetail->montant;
            }
        }
    
        return [
            'tarif_actuel_id' => $activeTariff->id,
            'room_details' => $roomCosts,
            'meal_costs' => $mealCosts,
            'reduction' => $reduction,
            'total' => array_sum(array_column($roomCosts, 'montant_total')) 
                + $mealCosts - $reduction
        ];
    }

    public function calculateTarif(Request $request)
    {
        try {
            Log::info('Calculating tarif with request data:', $request->all());

            $validated = $request->validate([
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after:date_debut',
                'chambre_ids' => 'required|array',
                'repas_ids' => 'nullable|array',
                'reduction_type' => 'nullable|string'
            ]);

            // Calculate number of nights
            $nights = Carbon::parse($validated['date_debut'])
                ->diffInDays(Carbon::parse($validated['date_fin']));

            // Default prices
            $defaultPrices = [
                'type_prices' => [
                    'single' => 100,
                    'double' => 150,
                    'suite' => 200
                ],
                'meal_prices' => [
                    'breakfast' => 15,
                    'lunch' => 25,
                    'dinner' => 30
                ]
            ];

            // Calculate room costs
            $roomCosts = 0;
            foreach ($validated['chambre_ids'] as $chambreId) {
                $chambre = Chambre::findOrFail($chambreId);
                $roomPrice = $defaultPrices['type_prices'][$chambre->type_chambre] ?? 100;
                $roomCosts += $roomPrice * $nights;
            }

            // Calculate meal costs
            $mealCosts = 0;
            if (!empty($validated['repas_ids'])) {
                foreach ($validated['repas_ids'] as $meal) {
                    $mealPrice = $defaultPrices['meal_prices'][$meal] ?? 0;
                    $mealCosts += $mealPrice * $nights;
                }
            }

            // Calculate reduction
            $reduction = 0;
            if (!empty($validated['reduction_type'])) {
                $reductionRates = [
                    'senior' => 0.10, // 10% off
                    'group' => 0.15,  // 15% off
                    'fidelity' => 0.05 // 5% off
                ];
                
                $subtotal = $roomCosts + $mealCosts;
                $reduction = $subtotal * ($reductionRates[$validated['reduction_type']] ?? 0);
            }

            // Calculate total
            $total = $roomCosts + $mealCosts - $reduction;

            Log::info('Tarif calculation completed', [
                'roomCosts' => $roomCosts,
                'mealCosts' => $mealCosts,
                'reduction' => $reduction,
                'total' => $total
            ]);

            return response()->json([
                'status' => 'success',
                'tariff_details' => [
                    'roomCosts' => round($roomCosts, 2),
                    'mealCosts' => round($mealCosts, 2),
                    'reduction' => round($reduction, 2),
                    'total' => round($total, 2),
                    'nights' => $nights
                ],
                'message' => 'Using default prices as no specific tariff was found'
            ]);

        } catch (\Exception $e) {
            Log::error('Tarif calculation error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error calculating tarif: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function ajouterReservation(Request $request)
    {
        try {
            $validated = $request->validate([
                'client_id' => 'required|integer',
                'client_type' => 'required|in:societe,particulier',
                'chambre_ids' => 'required|array',
                'chambre_ids.*' => 'integer|exists:chambres,id',
                'reservation_date' => 'required|date',
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after:date_debut',
                'status' => 'required|in:en attente,confirmé,annulé',
                'repas_ids' => 'nullable|array',
                'reduction_type' => 'nullable|string'
            ]);

            // Calculate the tariff using default prices if no tariff record exists
            $defaultPrices = [
                'type_prices' => [
                    'single' => 100,
                    'double' => 150,
                    'suite' => 200
                ],
                'meal_prices' => [
                    'breakfast' => 15,
                    'lunch' => 25,
                    'dinner' => 30
                ],
                'reduction_rates' => [
                    'senior' => 0.10,
                    'group' => 0.15,
                    'fidelity' => 0.05
                ]
            ];

            // Calculate number of nights
            $nights = Carbon::parse($validated['date_debut'])
                ->diffInDays(Carbon::parse($validated['date_fin']));

            // Calculate room costs
            $roomCosts = 0;
            foreach ($validated['chambre_ids'] as $chambreId) {
                $chambre = Chambre::findOrFail($chambreId);
                $roomPrice = $defaultPrices['type_prices'][$chambre->type_chambre] ?? 100;
                $roomCosts += $roomPrice * $nights;
            }

            // Calculate meal costs
            $mealCosts = 0;
            if (!empty($validated['repas_ids'])) {
                foreach ($validated['repas_ids'] as $meal) {
                    $mealPrice = $defaultPrices['meal_prices'][$meal] ?? 0;
                    $mealCosts += $mealPrice * $nights;
                }
            }

            // Calculate reduction
            $reduction = 0;
            if (!empty($validated['reduction_type'])) {
                $reductionRate = $defaultPrices['reduction_rates'][$validated['reduction_type']] ?? 0;
                $reduction = ($roomCosts + $mealCosts) * $reductionRate;
            }

            $total = $roomCosts + $mealCosts - $reduction;

            // Create reservation
            $reservation = Reservation::create([
                'reservation_num' => $request->reservation_num ?? 'R' . strtoupper(Str::random(6)),
                'client_id' => $validated['client_id'],
                'client_type' => $validated['client_type'],
                'reservation_date' => $validated['reservation_date'],
                'date_debut' => $validated['date_debut'],
                'date_fin' => $validated['date_fin'],
                'status' => $validated['status'],
                'montant_total' => $total,
                'montant_reduction' => $reduction,
            ]);

            // Attach rooms
            $reservation->chambres()->attach($validated['chambre_ids']);

            // Return success response
            return response()->json([
                'status' => 'success',
                'message' => 'Reservation created successfully',
                'reservation' => $reservation->load('chambres'),
                'tariff_details' => [
                    'roomCosts' => $roomCosts,
                    'mealCosts' => $mealCosts,
                    'reduction' => $reduction,
                    'total' => $total,
                    'using_default_prices' => true
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating reservation: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error creating reservation: ' . $e->getMessage()
            ], 500);
        }
    }

public function afficherReservation($reservation_num)
{
    try {
        $reservation = Reservation::with(['chambres.typeChambre', 'chambres.etage', 'chambres.vue'])
            ->where('reservation_num', $reservation_num)
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'reservation' => [
                'id' => $reservation->id,
                'reservation_num' => $reservation->reservation_num,
                'client_id' => $reservation->client_id,
                'client_type' => $reservation->client_type,
                'reservation_date' => $reservation->reservation_date,
                'date_debut' => $reservation->date_debut,
                'date_fin' => $reservation->date_fin,
                'status' => $reservation->status,
                'montant_total' => $reservation->montant_total,
                'montant_reduction' => $reservation->montant_reduction,
'chambres' => $reservation->chambres->map(function ($chambre) {
    return [
        'id' => $chambre->id,
        'num_chambre' => $chambre->num_chambre,
        'type_chambre' => $chambre->typeChambre
            ? $chambre->typeChambre->type_chambre
            : $chambre->type_chambre,
        'etage' => $chambre->etage
            ? $chambre->etage->etage
            : null,
        'vue' => $chambre->vue
            ? $chambre->vue->vue
            : null,
        'type_chambre_commentaire' => $chambre->typeChambre
            ? $chambre->typeChambre->commentaire
            : null,
    ];
})            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Réservation introuvable'
        ], 404);
    }
}

    public function update(Request $request, $reservationNum)
    {
        try {
            // Find the reservation by reservation_num
            $reservation = Reservation::where('reservation_num', $reservationNum)->firstOrFail();
    
            // Validate request data
            $validatedData = $request->validate([
                'client_id'         => 'required',
                'client_type'       => 'required',
                'reservation_date'  => 'required|date',
                'date_debut'        => 'required|date',
                'date_fin'          => 'required|date',
                'status'            => 'required',
                'chambre_ids'       => 'required|array',
                'chambre_ids.*'     => 'exists:chambres,id',
                'repas_ids'         => 'nullable|array',
                'reduction_type'    => 'nullable|string'
            ]);
    
            // Calculate tariff (assume calculateTarif returns a JsonResponse)
            $tariffResponse = $this->calculateTarif($request);
            $tariffData = $tariffResponse->getData(true); // Convert to array
    
            if (!isset($tariffData['status']) || $tariffData['status'] !== 'success') {
                throw new \Exception("Tariff calculation failed: " . ($tariffData['message'] ?? 'Unknown error'));
            }
    
            // Update the reservation
            $reservation->update([
                'client_id'         => $validatedData['client_id'],
                'client_type'       => $validatedData['client_type'],
                'reservation_date'  => $validatedData['reservation_date'],
                'date_debut'        => $validatedData['date_debut'],
                'date_fin'          => $validatedData['date_fin'],
                'status'            => $validatedData['status'],
                'montant_total'     => $tariffData['tariff_details']['total'],
                'montant_reduction' => $tariffData['tariff_details']['reduction'] ?? 0,
            ]);
    
            // Sync room associations
            $reservation->chambres()->sync($validatedData['chambre_ids']);
    
            return response()->json([
                'status'  => 'success',
                'message' => 'Reservation updated successfully',
                'data'    => $reservation
            ]);
    
        } catch (\Exception $e) {
            \Log::error('Reservation update error: ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => 'Error updating reservation: ' . $e->getMessage()
            ], 500);
        }
    }    
    
    public function supprimerReservation($reservation_num)
    {
        try {
            $reservation = Reservation::where('reservation_num', $reservation_num)->first();
            
            if (!$reservation) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Reservation not found'
                ], 404);
            }
    
            $reservation->chambres()->detach();
            $reservation->delete();
    
            return response()->json([
                'status' => 'success',
                'message' => 'Reservation deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error deleting reservation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getAvailableRooms(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after_or_equal:date_debut',
                'reservation_id' => 'nullable|integer'
            ]);

            $query = Chambre::with(['etage', 'vue']);

            // Exclude rooms that are already reserved for the given dates
            $query->whereDoesntHave('reservations', function($q) use ($validatedData) {
                $q->where(function($q) use ($validatedData) {
                    $q->where('date_debut', '<', $validatedData['date_fin'])
                      ->where('date_fin', '>', $validatedData['date_debut'])
                      ->where('status', '!=', 'annulé');

                    if (isset($validatedData['reservation_id'])) {
                        $q->where('reservations.id', '!=', $validatedData['reservation_id']);
                    }
                });
            });

            $availableRooms = $query->get();

            // Get active tariff
            $activeTariff = TarifActuel::where('date_debut', '<=', $validatedData['date_debut'])
                ->where('date_fin', '>=', $validatedData['date_fin'])
                ->with('tarif_chambre')
                ->first();

            // Transform the data
            $transformedRooms = $availableRooms->map(function($room) use ($activeTariff) {
                $tariff = null;
                if ($activeTariff && $activeTariff->tarif_chambre) {
                    switch ($room->type_chambre) {
                        case 'single':
                            $tariff = $activeTariff->tarif_chambre->single;
                            break;
                        case 'double':
                            $tariff = $activeTariff->tarif_chambre->double;
                            break;
                        case 'suite':
                            $tariff = $activeTariff->tarif_chambre->suite;
                            break;
                    }
                }

                return [
                    'id' => $room->id,
                    'num_chambre' => $room->num_chambre,
                    // On va chercher le nom du type via la relation, sinon on met le chiffre par défaut
                    'type_chambre' => $room->typeChambre ? $room->typeChambre->type_chambre : $room->type_chambre,                    'etage' => $room->etage ? $room->etage->etage : null,
                    'vue' => $room->vue ? $room->vue->vue : null,
                    'tarif_par_nuit' => $tariff
                ];
            });

            return response()->json([
                'status' => 'success',
                'rooms' => $transformedRooms,
                'tarif_actuel' => $activeTariff
            ]);

        } catch (\Exception $e) {
            Log::error('Error in getAvailableRooms: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch available rooms: ' . $e->getMessage()
            ], 500);
        }
    }
}