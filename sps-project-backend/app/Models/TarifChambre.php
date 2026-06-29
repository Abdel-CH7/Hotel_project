<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class TarifChambre extends Model
{
    protected $table = "tarifs_chambre";
    protected $fillable = [
        'designation',
        'photo'
    ];

    public function tarif_actuel() {
        return $this->hasMany(TarifActuel::class, "tarif_chambre_code");
    }

    public function tarif_chambre() {
        return $this->hasMany(TarifChambreDetail::class, 'tarif_chambre');
    }

    use HasFactory;
}
