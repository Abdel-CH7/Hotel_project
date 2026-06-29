<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agent extends Model
{
    use HasFactory;
    protected $fillable = [
        'NomAgent',
        'PrenomAgent',
        'SexeAgent',
        'EmailAgent',
        'TelAgent',
        'AdresseAgent',
        'VilleAgent',
        'CodePostalAgent',
        'type'
    ];
    public function suivi_intervention() {
        return $this->hasMany(SuiviIntervention::class, 'prestataire');
    }

}
