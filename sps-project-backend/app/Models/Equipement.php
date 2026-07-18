<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Equipement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'numero_serie',
        'modele',
        'marque',
        'date_acquisition',
        'date_fin_garantie',
        'fournisseur',
        'localisation',
        'chambre_id',
        'emplacement_id',
        'statut',
        'impact_chambre',
        'categorie_id',
        'prix_achat',
        'document_path',
        'notes'
    ];

    protected $casts = [
        'date_acquisition' => 'date',
        'date_fin_garantie' => 'date',
        'prix_achat' => 'decimal:2'
    ];

    public function categorie()
    {
        return $this->belongsTo(CategorieEquipement::class, 'categorie_id');
    }

    public function chambre()
    {
        return $this->belongsTo(Chambre::class);
    }

    public function emplacement()
    {
        return $this->belongsTo(Emplacement::class);
    }

    public function scopeDisponible($query)
    {
        return $query->where('statut', 'disponible');
    }

    public function scopeEnMaintenance($query)
    {
        return $query->where('statut', 'en_maintenance');
    }

    public function scopeHorsService($query)
    {
        return $query->where('statut', 'hors_service');
    }
}
