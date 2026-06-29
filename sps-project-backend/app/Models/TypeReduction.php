<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class TypeReduction extends Model
{
    use HasFactory;

    protected $fillable = [
        "code",
        "type_reduction"
    ];
    protected $table = "types_reduction";

    public function tarif_reduction_detail() {
        return $this->belongsTo(TarifReductionDetail::class, "type_reduction");
    }
}
