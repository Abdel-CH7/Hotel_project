<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactClient extends Model
{
    use HasFactory;

    protected $fillable = [
        'idClient',
        'type',
        'name',
        'prenom',
        'telephone',
        'email',
    ];
    public function client()
{
    return $this->belongsTo(Client::class, 'idClient');
}

}
