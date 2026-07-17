<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

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
        'pricing_version',
        'legacy_pricing',
        'client_name_snapshot',
        'montant_chambres',
        'montant_repas',
        'sous_total_avant_reduction',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected $casts = [
        'reservation_date' => 'date:Y-m-d',
        'date_debut' => 'date:Y-m-d',
        'date_fin' => 'date:Y-m-d',
        'montant_total' => 'decimal:2',
        'montant_reduction' => 'decimal:2',
        'montant_chambres' => 'decimal:2',
        'montant_repas' => 'decimal:2',
        'sous_total_avant_reduction' => 'decimal:2',
        'pricing_version' => 'integer',
        'legacy_pricing' => 'boolean',
        'cancelled_at' => 'datetime',
    ];

    public function client(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'client_type', 'client_id');
    }

    public function chambres()
    {
        return $this->belongsToMany(Chambre::class, 'details_reservation', 'reservation_id', 'chambre_id')
            ->withPivot([
                'tarif_par_nuit',
                'montant_total',
                'adultes',
                'enfants',
                'lits_supplementaires',
                'type_chambre_id',
                'type_chambre_nom_snapshot',
                'capacite_standard_snapshot',
                'lits_supplementaires_max_snapshot',
            ])
            ->withTimestamps();
    }

    public function reservationRooms()
    {
        return $this->hasMany(ReservationRoom::class, 'reservation_id');
    }

    public function meals()
    {
        return $this->hasMany(ReservationMeal::class, 'reservation_id');
    }

    public function reduction()
    {
        return $this->hasOne(ReservationReduction::class, 'reservation_id');
    }

    public function tarifActuel()
    {
        return $this->belongsTo(TarifActuel::class, 'tarif_actuel_id');
    }

    public function mealRateDetail()
    {
        return $this->belongsTo(TarifRepasDetail::class, 'tarif_repas_id');
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
