<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employe extends Model
{
    use HasFactory;

    protected $attributes = [
        'actif' => true,
    ];

    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'fonction',
        'telephone',
        'actif',
        'user_id',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function etatChambres()
    {
        return $this->hasMany(EtatChambre::class, 'nettoyee_par_id');
    }
}
