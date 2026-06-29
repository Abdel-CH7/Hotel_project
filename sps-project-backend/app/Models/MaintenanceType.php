<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceType extends Model
{
    use HasFactory;

    protected $table = 'types_maintenance';

    protected $fillable = [
        'code',
        'types_maintenance',
        'description'
    ];

    public function etatChambres()
    {
        return $this->hasMany(EtatChambre::class, 'maintenance_type_id');
    }
} 