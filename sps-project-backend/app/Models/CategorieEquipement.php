<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CategorieEquipement extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'categories_equipements';

    protected $fillable = [
        'nom',
        'description',
        'maintenance_type_id',
    ];

    public function equipements()
    {
        return $this->hasMany(Equipement::class, 'categorie_id');
    }

    public function maintenanceType()
    {
        return $this->belongsTo(MaintenanceType::class, 'maintenance_type_id');
    }
}



