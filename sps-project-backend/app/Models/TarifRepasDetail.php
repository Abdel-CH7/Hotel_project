<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarifRepasDetail extends Model
{
    use HasFactory;

    protected $table = 'tarif_repas_detail';

    protected $fillable = ['tarif_repas_id', 'type_repas_id', 'prix_par_personne'];

    protected $casts = ['prix_par_personne' => 'decimal:2'];

    protected $appends = ['montant', 'tarif_repas', 'type_repas'];

    public function mealRateGrid()
    {
        return $this->belongsTo(TarifRepas::class, 'tarif_repas_id');
    }

    public function mealType()
    {
        return $this->belongsTo(TypeRepas::class, 'type_repas_id');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'tarif_repas_id');
    }

    public function getMontantAttribute(): string
    {
        return $this->prix_par_personne;
    }

    public function getTarifRepasAttribute(): ?TarifRepas
    {
        return $this->mealRateGrid;
    }

    public function getTypeRepasAttribute(): ?TypeRepas
    {
        return $this->mealType;
    }
}
