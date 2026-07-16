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
        "capacite_standard",
        "lits_supplementaires_max",
        "commentaire",
    ];

    protected $casts = [
        'nb_lit' => 'integer',
        'nb_salle' => 'integer',
        'capacite_standard' => 'integer',
        'lits_supplementaires_max' => 'integer',
    ];

    public function chambres()
    {
        return $this->hasMany(Chambre::class, 'type_chambre_id');
    }

    public function tarifChambreDetails()
    {
        return $this->hasMany(TarifChambreDetail::class, 'type_chambre_id');
    }
}
