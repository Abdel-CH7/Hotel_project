<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservationMeal extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'tarif_actuel_id',
        'tarif_repas_detail_id',
        'type_repas_id',
        'type_repas_nom_snapshot',
        'segment_date_debut',
        'segment_date_fin',
        'prix_unitaire_snapshot',
        'quantite_par_jour',
        'jours_factures',
        'montant_total',
    ];

    protected $casts = [
        'segment_date_debut' => 'date:Y-m-d',
        'segment_date_fin' => 'date:Y-m-d',
        'prix_unitaire_snapshot' => 'decimal:2',
        'quantite_par_jour' => 'integer',
        'jours_factures' => 'integer',
        'montant_total' => 'decimal:2',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function tariffPeriod()
    {
        return $this->belongsTo(TarifActuel::class, 'tarif_actuel_id');
    }

    public function mealRateDetail()
    {
        return $this->belongsTo(TarifRepasDetail::class, 'tarif_repas_detail_id');
    }

    public function mealType()
    {
        return $this->belongsTo(TypeRepas::class, 'type_repas_id');
    }
}
