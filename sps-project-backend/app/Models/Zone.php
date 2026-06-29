<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Zone extends Model
{
    use HasFactory;

    protected $guarded=[];

    public function Clients() {
        return $this->hasMany(Client::class);
    }

    public function siteclients() {
        return $this->hasMany(SiteClient::class);
    }

    public function equipement() {
        $this->hasMany(Equipement::class, 'zone');
    }
}
