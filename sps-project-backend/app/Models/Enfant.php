<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enfant extends Model
{
    use HasFactory;

    protected $fillable = [
        'idClient',
        'type',
        'name',
        'prenom',
        'age',
    ];
    public function client()
{
    return $this->belongsTo(ClientParticulier::class, 'idClient');
}

}
