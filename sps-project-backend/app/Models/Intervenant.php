<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Intervenant extends Model
{
    use HasFactory;
    use SoftDeletes;
    protected $fillable = [
        'NomAgent',
        'PrenomAgent',
        'SexeAgent',
        'EmailAgent',
        'TelAgent',
        'AdresseAgent',
        'VilleAgent',
        'CodePostalAgent',
    ];
    protected $table = "intervenants";

    public function intervention()
    {
        return $this->hasMany(Intervention::class, 'intervenant_id');
    }

}
