<?php

namespace App\Models;

use App\Models\Concerns\HasTariffPlanUsage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarifRepas extends Model
{
    use HasFactory, HasTariffPlanUsage;

    protected $table = 'tarifs_repas';

    protected $fillable = ['designation', 'photo'];

    protected $appends = ['usage'];

    public function details()
    {
        return $this->hasMany(TarifRepasDetail::class, 'tarif_repas_id');
    }

    public function tariffPeriods()
    {
        return $this->hasMany(TarifActuel::class, 'tarif_repas_id');
    }
}
