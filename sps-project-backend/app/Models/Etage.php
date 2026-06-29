<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Etage extends Model
{
    protected $fillable = [
        "etage",
        "photo"
    ];

    public function chambres() {
        return $this->hasMany(Chambre::class, "etage_id");
    }
    use HasFactory;
}
