<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReclamationCanal extends Model
{
    protected $table = 'reclamation_canaux';

    protected $fillable = ['nom', 'est_autre', 'actif'];

    protected $casts = ['est_autre' => 'boolean', 'actif' => 'boolean'];

    public function reclamations(): HasMany
    {
        return $this->hasMany(Reclamation::class, 'reclamation_canal_id');
    }
}
