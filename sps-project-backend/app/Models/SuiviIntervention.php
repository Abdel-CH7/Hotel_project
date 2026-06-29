<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuiviIntervention extends Model
{
    use HasFactory;

    protected $fillable = [
        'intervention',
        'prestataire',
        'equipement',
    ];

    public function intervention()
    {
        return $this->belongsTo(Intervention::class, 'intervention');
    }

    public function prestataire()
    {
        return $this->belongsTo(Agent::class, 'prestataire');
    }

    public function equipement()
    {
        return $this->belongsTo(Equipement::class, 'equipement');
    }
}
