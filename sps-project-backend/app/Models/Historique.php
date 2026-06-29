<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Historique extends Model
{
    protected $table = 'reclamation_historique';  // Table name
    protected $fillable = ['reclamation_id', 'date', 'description'];

    // One Historique belongs to one Reclamation
    public function reclamation()
    {
        return $this->belongsTo(Reclamation::class, 'reclamation_id');
    }
} 