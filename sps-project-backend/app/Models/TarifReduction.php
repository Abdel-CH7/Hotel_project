<?php

namespace App\Models;

use App\Models\Concerns\HasTariffPlanUsage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarifReduction extends Model
{
    use HasFactory, HasTariffPlanUsage;

    protected $table = 'tarifs_reduction';

    protected $fillable = ['designation', 'photo'];

    protected $appends = ['usage'];

    public function details()
    {
        return $this->hasMany(TarifReductionDetail::class, 'tarif_reduction_id');
    }

    public function tariffPeriods()
    {
        return $this->hasMany(TarifActuel::class, 'tarif_reduction_id');
    }
}
