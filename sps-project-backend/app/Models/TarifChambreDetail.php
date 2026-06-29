<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class TarifChambreDetail extends Model
{
    protected $fillable = [
        'code',
        "tarif_chambre",
        "type_chambre",
        "single",
        "double",
        "triple",
        "lit_supp"
    ];

    public function tarif_chambre() {
        return $this->belongsTo(TarifChambre::class, 'tarif_chambre');
    }

    public function tarif_actuel() {
        return $this->hasMany(TarifActuel::class, "tarif_chambre");
    }
    public function type_chambre() {
        return $this->belongsTo(TypeChambre::class, "type_chambre");
    }

    protected $table = "tarif_chambre_detail";

    use HasFactory;
}
