<?php

namespace App\Models;

use App\Models\Concerns\HasTariffPlanUsage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarifChambre extends Model
{
    use HasFactory, HasTariffPlanUsage;

    protected $table = 'tarifs_chambre';

    protected $fillable = ['designation', 'photo'];

    protected $appends = ['usage'];

    public function details()
    {
        return $this->hasMany(TarifChambreDetail::class, 'tarif_chambre_id');
    }

    public function tariffPeriods()
    {
        return $this->hasMany(TarifActuel::class, 'tarif_chambre_id');
    }
}
