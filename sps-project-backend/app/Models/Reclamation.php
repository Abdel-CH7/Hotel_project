<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;

class Reclamation extends Model
{
    protected $table = 'reclamations';  // Table name
    protected $fillable = ['type_reclamation', 'reclamer_a_travers', 'departement_id', 'suivi', 'reponse', 'date'];

    // One Reclamation belongs to one Departement
    public function departement()
    {
        return $this->belongsTo(Departement::class, 'departement_id');
    }

    // One Reclamation has many Historique records
    public function historique(): HasMany
    {
        return $this->hasMany(Historique::class, 'reclamation_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::updated(function ($reclamation) {
            if ($reclamation->isDirty('suivi')) {
                // Déterminer la description en fonction du nouveau statut `suivi`
                $description = match ($reclamation->suivi) {
                    'En cours' => 'Réclamation reçue et en cours de traitement',
                    'En attente' => 'Réclamation en attente de validation',
                    'Traité' => 'Réclamation traitée par le service concerné',
                    'Résolu' => 'Réclamation résolue et clôturée',
                    default => 'Mise à jour du statut de la réclamation'
                };

                // Créer une entrée dans l'historique
                $reclamation->historique()->create([
                    'date' => now()->format('Y-m-d'),
                    'description' => $description,
                ]);

                Log::info("📌 Historique ajouté pour la réclamation ID: {$reclamation->id} | Suivi: {$reclamation->suivi}");
            }
        });
    }
} 