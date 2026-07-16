<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservationRoom extends Model
{
    use HasFactory;

    protected $table = 'details_reservation';

    protected $fillable = [
        'reservation_id',
        'chambre_id',
        'adultes',
        'enfants',
        'lits_supplementaires',
        'type_chambre_id',
        'type_chambre_nom_snapshot',
        'capacite_standard_snapshot',
        'lits_supplementaires_max_snapshot',
        'tarif_par_nuit',
        'montant_total',
    ];

    protected $casts = [
        'adultes' => 'integer',
        'enfants' => 'integer',
        'lits_supplementaires' => 'integer',
        'type_chambre_id' => 'integer',
        'capacite_standard_snapshot' => 'integer',
        'lits_supplementaires_max_snapshot' => 'integer',
        'tarif_par_nuit' => 'decimal:2',
        'montant_total' => 'decimal:2',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function chambre()
    {
        return $this->belongsTo(Chambre::class);
    }

    public function roomType()
    {
        return $this->belongsTo(TypeChambre::class, 'type_chambre_id');
    }

    public function priceSegments()
    {
        return $this->hasMany(ReservationRoomPriceSegment::class, 'reservation_room_id');
    }
}
