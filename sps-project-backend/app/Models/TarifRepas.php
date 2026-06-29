<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class TarifRepas extends Model
{
    use HasFactory;
    protected $table = "tarifs_repas";
    protected $fillable = [
        'designation',
        'photo'
    ];
    public function tarif_actuel() {
        return $this->hasMany(TarifActuel::class, "tarif_repas_code");
    }
    public function detail() {
        return $this->hasMany(TarifRepasDetail::class, 'tarif_repas');
    }

}
