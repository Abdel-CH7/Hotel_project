<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class TypeRepas extends Model
{
    use HasFactory;


    protected $fillable = [
        "code",
        "type_repas"
    ];
    protected $table = "types_repas";
    public function tarif_repas_detail() {
        return $this->belongsTo(TarifRepasDetail::class, "type_repas");
    }

}
