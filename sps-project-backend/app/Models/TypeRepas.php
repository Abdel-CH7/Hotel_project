<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeRepas extends Model
{
    use HasFactory;

    protected $table = 'types_repas';

    protected $fillable = ['code', 'type_repas'];

    public function tariffDetails()
    {
        return $this->hasMany(TarifRepasDetail::class, 'type_repas_id');
    }
}
