<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservationReduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'tarif_actuel_id',
        'tarif_reduction_detail_id',
        'type_reduction_id',
        'type_reduction_nom_snapshot',
        'montant_fixe_snapshot',
        'pourcentage_snapshot',
        'sous_total_eligible',
        'montant_applique',
        'formule_version',
    ];

    protected $casts = [
        'montant_fixe_snapshot' => 'decimal:2',
        'pourcentage_snapshot' => 'decimal:2',
        'sous_total_eligible' => 'decimal:2',
        'montant_applique' => 'decimal:2',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function tariffPeriod()
    {
        return $this->belongsTo(TarifActuel::class, 'tarif_actuel_id');
    }

    public function reductionRateDetail()
    {
        return $this->belongsTo(TarifReductionDetail::class, 'tarif_reduction_detail_id');
    }

    public function reductionType()
    {
        return $this->belongsTo(TypeReduction::class, 'type_reduction_id');
    }
}
