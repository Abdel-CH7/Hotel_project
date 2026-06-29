<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departement extends Model
{
    use HasFactory;

    protected $fillable = ['nom'];

    // One Departement has many Reclamations
    public function reclamations()
    {
        return $this->hasMany(Reclamation::class, 'departement_id');
    }
}