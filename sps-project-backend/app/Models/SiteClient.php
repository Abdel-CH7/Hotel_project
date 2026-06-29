<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class SiteClient extends Model
{
    use HasFactory;

    protected $guarded=[];

    public function zone() {
        return $this->belongsTo(Zone::class, 'zone_id');
    }
    public function region() {
        return $this->belongsTo(Region::class, 'region_id');
    }
    public function client() {
        return $this->belongsTo(Client::class, 'client_id' );
    }
    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function contact_site_clients()
    {
        return $this->hasMany(ContactClient::class, 'idClient')->where('type', 'SC');
    }

    public function contactSiteFournisseur()
    {
        return $this->hasMany(ContactClient::class, 'idClient')->where('type', 'SF');
    }
    public function secteur()
{
    return $this->belongsTo(SecteurClient::class ,'secteur_id');
}
public function represantant()
{
    return $this->hasMany(Represantant::class, 'id_SiteClient')->where('type', 'SC');
}

public function last_represantant()
{
    return $this->hasOne(Represantant::class, 'id_SiteClient')->latest('id')->where('type', 'SC'); // Use the appropriate date column
}
public function agent()
{
    return $this->belongsTo(Agent::class ,'agent_id');
}
}
