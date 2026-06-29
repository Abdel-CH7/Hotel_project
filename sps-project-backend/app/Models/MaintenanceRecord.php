<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceRecord extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'maintenance_records';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'intervention',
        'desc_intervention',
        'nettoyage_outils',
        'nettoyage_ligne',
        'liberation_ligne',
        'visa_responsables',
    ];

    /**
     * Get the related intervention.
     */
    public function intervention()
    {
        return $this->belongsTo(Intervention::class, 'intervention');
    }
}
