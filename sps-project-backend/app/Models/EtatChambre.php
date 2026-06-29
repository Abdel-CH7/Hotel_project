<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EtatChambre extends Model
{
    use HasFactory;

    protected $table = 'etat_chambre'; // if your table name is exactly "etat_chambre"

    // Make sure this matches your actual columns
    protected $fillable = [
        'num_chambre',
        'status',
        'date_nettoyage',
        'nettoyée_par',
        'maintenance',
        'maintenance_type_id',
        'date_debut_maintenance',
        'date_fin_maintenance',
        'commentaire',
    ];

    protected $casts = [
        'maintenance' => 'boolean',
        'date_nettoyage' => 'date',
        'date_debut_maintenance' => 'date',
        'date_fin_maintenance' => 'date',
    ];

    public $timestamps = true; // or false if you don't have created_at / updated_at

    /**
     * Relationship to the Chambre model.
     * 'num_chambre' is a foreign key referencing 'chambres.num_chambre'.
     */
    public function chambre()
    {
        return $this->belongsTo(Chambre::class, 'num_chambre', 'num_chambre');
    }

    /**
     * Relationship to the MaintenanceType model.
     * 'maintenance_type_id' references 'types_maintenance.id'.
     */
    public function maintenanceType()
    {
        return $this->belongsTo(MaintenanceType::class, 'maintenance_type_id');
    }
}