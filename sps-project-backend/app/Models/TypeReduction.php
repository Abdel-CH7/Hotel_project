<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeReduction extends Model
{
    use HasFactory;

    protected $table = 'types_reduction';

    protected $fillable = ['code', 'type_reduction'];

    public function tariffDetails()
    {
        return $this->hasMany(TarifReductionDetail::class, 'type_reduction_id');
    }
}
