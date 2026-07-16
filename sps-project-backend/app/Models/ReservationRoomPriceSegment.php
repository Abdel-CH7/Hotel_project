<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservationRoomPriceSegment extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_room_id',
        'tarif_actuel_id',
        'tarif_chambre_detail_id',
        'segment_date_debut',
        'segment_date_fin',
        'nuits',
        'occupation_tarifee',
        'prix_occupation_snapshot',
        'lits_supplementaires',
        'prix_lit_supplementaire_snapshot',
        'prix_par_nuit_snapshot',
        'montant_segment',
        'periode_designation_snapshot',
        'plan_designation_snapshot',
    ];

    protected $casts = [
        'segment_date_debut' => 'date:Y-m-d',
        'segment_date_fin' => 'date:Y-m-d',
        'nuits' => 'integer',
        'occupation_tarifee' => 'integer',
        'lits_supplementaires' => 'integer',
        'prix_occupation_snapshot' => 'decimal:2',
        'prix_lit_supplementaire_snapshot' => 'decimal:2',
        'prix_par_nuit_snapshot' => 'decimal:2',
        'montant_segment' => 'decimal:2',
    ];

    public function reservationRoom()
    {
        return $this->belongsTo(ReservationRoom::class, 'reservation_room_id');
    }

    public function tariffPeriod()
    {
        return $this->belongsTo(TarifActuel::class, 'tarif_actuel_id');
    }

    public function roomRateDetail()
    {
        return $this->belongsTo(TarifChambreDetail::class, 'tarif_chambre_detail_id');
    }
}
