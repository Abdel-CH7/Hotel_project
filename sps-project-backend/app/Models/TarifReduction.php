<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class TarifReduction extends Model
{
    protected $table = "tarifs_reduction";
    protected $fillable = [
            'designation',
            'photo'
    ];

    public function tarif_actuel() {
        return $this->hasMany(TarifActuel::class, "tarif_reduction_code");
    }
    public function detail() {
        return $this->hasMany(TarifReductionDetail::class, 'tarif_reduction');
    }

    use HasFactory;
}
