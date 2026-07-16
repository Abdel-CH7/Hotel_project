<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarifActuel extends Model
{
    use HasFactory;

    protected $table = 'tarifs_actuel';

    protected $fillable = [
        'designation',
        'date_debut',
        'date_fin',
        'statut',
        'tarif_chambre_id',
        'tarif_repas_id',
        'tarif_reduction_id',
    ];

    protected $casts = [
        'date_debut' => 'date:Y-m-d',
        'date_fin' => 'date:Y-m-d',
    ];

    protected $appends = ['tarif_chambre', 'tarif_repas', 'tarif_reduction'];

    public function roomRateGrid()
    {
        return $this->belongsTo(TarifChambre::class, 'tarif_chambre_id');
    }

    public function mealRateGrid()
    {
        return $this->belongsTo(TarifRepas::class, 'tarif_repas_id');
    }

    public function reductionGrid()
    {
        return $this->belongsTo(TarifReduction::class, 'tarif_reduction_id');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'tarif_actuel_id');
    }

    public function getTarifChambreAttribute(): ?TarifChambre
    {
        return $this->roomRateGrid;
    }

    public function getTarifRepasAttribute(): ?TarifRepas
    {
        return $this->mealRateGrid;
    }

    public function getTarifReductionAttribute(): ?TarifReduction
    {
        return $this->reductionGrid;
    }
}
