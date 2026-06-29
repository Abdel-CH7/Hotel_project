<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class TypeChambre extends Model
{
    use HasFactory;


    protected $table = 'types_chambre';

    protected $fillable = [
        "code",
        "type_chambre",
        "nb_lit",
        "nb_salle",
        "commentaire",
    ];
    public function chambres() {
        return $this->hasMany(Chambre::class, 'type_chambres');
    }
    

    public function tarif_chambre_detail() {
        return $this->hasMany(TarifChambreDetail::class, "type_chambre");
    }
}
