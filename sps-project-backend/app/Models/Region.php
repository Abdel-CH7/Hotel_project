<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    use HasFactory;
    protected $guarded=[];

    public function Clients() {
        return $this->hasMany(Client::class);
    }

    public function siteclients() {
        return $this->hasMany(SiteClient::class);
    }
}
