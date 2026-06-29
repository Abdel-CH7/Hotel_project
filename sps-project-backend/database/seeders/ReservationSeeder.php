<?php

namespace Database\Seeders;

use App\Models\Reservation;
use App\Models\Client;
use App\Models\Chambre;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ReservationSeeder extends Seeder
{
    public function run()
    {
        // Assuming you have a client and a chambre created already
        //$client = Client::first(); // Or use a specific client ID

        // Create a sample reservation
        \App\Models\Reservation::create([
            'reservation_num' => 'R12345',
            'client_id' => 1,
            'client_type' => 'societe',
            'reservation_date' => '2025-02-28',
            'date_debut' => '2025-03-01',
            'date_fin' => '2025-03-05',
            'status' => 'en attente',
            'montant_total' => 1000.00,
    
        ]);
    }
}
