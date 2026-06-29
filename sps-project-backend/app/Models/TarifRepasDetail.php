<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class TarifRepasDetail extends Model
{
    use HasFactory;
    protected $fillable = [
        "type_repas",
        "montant",
        "tarif_repas"
    ];
    public function tarif_repas() {
        return $this->belongsTo(TarifRepas::class, 'tarif_repas');
    }
    public function tarif_actuel() {
        return $this->hasMany(TarifActuel::class, "tarif_repas");
    }
    public function type_repas() {
        return $this->belongsTo(TypeRepas::class, "type_repas");
    }

    protected $table = "tarif_repas_detail";
}
