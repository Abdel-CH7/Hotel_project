<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class TarifReductionDetail extends Model
{

    protected $fillable = [
        "type_reduction",
        "montant",
        "percentage",
        "tarif_reduction"
    ];
    public function tarif_reduction() {
        return $this->belongsTo(TarifReduction::class, 'tarif_reduction');
    }
    public function tarif_actuel() {
        return $this->hasMany(TarifActuel::class, "tarif_reduction");
    }
    public function type_reduction() {
        return $this->belongsTo(TypeReduction::class, "type_reduction");
    }

    protected $table = "tarif_reduction_detail";

    use HasFactory;
}
