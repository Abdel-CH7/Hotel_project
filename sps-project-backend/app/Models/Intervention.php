<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Intervention extends Model
{
    use HasFactory;

    // Nom de la table associée au modèle (optionnel si le nom suit la convention)
    protected $table = 'interventions';

    // Les attributs qui peuvent être remplis en masse
    protected $fillable = [
        'code_intervention',
        'type_intervention',
        'duree_intervention',
        'intervenant_id',
        'equipement_id',
        'cout_prestation',
        'frequence',
        'prestation',
        'prestataire_id', // Ajoutez ce champ ici
        'commentaire',
        'status',
        'date_interventions',
    ];

    // Les attributs qui devraient être castés à des types natifs
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        // 'duree_intervention' => 'integer', // si vous souhaitez le cast à un type natif
        // 'cout_prestation' => 'decimal:2', // si vous souhaitez le cast à un type décimal
    ];

    // Relation avec le modèle Intervenant
    public function intervenant()
    {
        return $this->belongsTo(Intervenant::class, 'intervenant_id');
    }

    // Relation avec le modèle Equipement
    public function equipement()
    {
        return $this->belongsTo(Equipement::class, 'equipement_id');
    }

    // Relation avec le modèle Agent pour le prestataire
    public function prestataire()
    {
        return $this->belongsTo(Agent::class, 'prestataire_id');
    }

    public function maintenance_record() {
        return $this->hasMany(MaintenanceRecord::class, 'intervention');
    }

    public function suivi_intervention() {
        return $this->hasMany(SuiviIntervention::class, 'intervention');
    }
}
