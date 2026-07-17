<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReclamationType extends Model
{
    protected $fillable = ['nom', 'departement_par_defaut_id', 'priorite_par_defaut', 'actif'];

    protected $casts = ['actif' => 'boolean'];

    public function departementParDefaut(): BelongsTo
    {
        return $this->belongsTo(Departement::class, 'departement_par_defaut_id');
    }

    public function reclamations(): HasMany
    {
        return $this->hasMany(Reclamation::class, 'reclamation_type_id');
    }
}
