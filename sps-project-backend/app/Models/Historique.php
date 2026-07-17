<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Historique extends Model
{
    protected $table = 'reclamation_historique';

    protected $fillable = [
        'reclamation_id', 'type_evenement', 'ancien_statut', 'nouveau_statut',
        'description', 'user_id', 'date',
    ];

    public function reclamation(): BelongsTo
    {
        return $this->belongsTo(Reclamation::class, 'reclamation_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
