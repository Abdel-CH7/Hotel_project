<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientParticulier extends Model
{
    use HasFactory;
    protected $guarded=[];
    protected $table = "clients_particulier";


    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function zone() {
        return $this->belongsTo(Zone::class, 'zone_id');
    }
    public function region() {
        return $this->belongsTo(Region::class, 'region_id');
    }
    public function site_clients() {
        return $this->hasMany(SiteClientParticulier::class, 'client_id')->with(['secteur','agent','represantant','last_represantant'])->where('type','SC');
    }
    public function info_clients()
    {
        return $this->hasMany(Enfant::class, 'idClient')->where('type', 'C');
    }

public function secteur()
{
    return $this->belongsTo(SecteurClient::class ,'secteur_id');
}
public function represantant()
{
    return $this->hasMany(Represantant::class, 'id_Client')->where('type', 'C');
}

public function last_represantant()
{
    return $this->hasOne(Represantant::class, 'id_Client')->latest('id')->where('type', 'C'); // Use the appropriate date column
}
public function lastInfo()
{
    return $this->hasOne(Enfant::class, 'idClient')->latest('id')->where('type', 'C'); // Use the appropriate date column
}
public function agent()
{
    return $this->belongsTo(Agent::class ,'agent_id');
}

}
