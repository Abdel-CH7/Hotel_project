<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $table = 'reservations';

    protected $fillable = [
        'reservation_num',
        'client_id',
        'client_type',
        'reservation_date',
        'date_debut',
        'date_fin',
        'status',
        'montant_total',
        'montant_reduction',
        'tarif_actuel_id',
        'tarif_repas_id',
    ];

    protected $appends = ['client_data'];
    protected $with = ['chambres'];

    public function getClientDataAttribute()
    {
        if ($this->client_type === 'societe') {
            return \App\Models\Client::find($this->client_id);
        }

        return \App\Models\ClientParticulier::find($this->client_id);
    }

    public function chambres()
    {
        return $this->belongsToMany(Chambre::class, 'details_reservation', 'reservation_id', 'chambre_id')
            ->withPivot(['tarif_par_nuit', 'montant_total'])
            ->withTimestamps();
    }

    public function tarifActuel()
    {
        return $this->belongsTo(TarifActuel::class, 'tarif_actuel_id');
    }

    public function getDetailsAttribute()
    {
        return [
            'rooms' => $this->chambres,
            'total' => $this->montant_total,
            'reduction' => $this->montant_reduction,
        ];
    }
}