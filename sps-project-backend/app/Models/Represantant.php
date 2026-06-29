<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Represantant extends Model
{
    use HasFactory;

    protected $fillable = [
        'id_agent', // Foreign key referencing the agents table
        'id_Client', // Foreign key referencing the clients table
        'date_debut', // Start date
        'date_fin', // End date
        'type',
        'id_SiteClient',
        'id_SiteClientParticulier'
    ];

    // Define the relationships with Agent and Client models
    public function agent()
    {
        return $this->belongsTo(Agent::class, 'id_agent');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'id_client');
    }
    public function Seteclient()
    {
        return $this->belongsTo(SiteClient::class, 'id_SiteClient');
    }
    public function SeteclientParticulier()
    {
        return $this->belongsTo(SiteClient::class, 'id_SiteClientParticulier');
    }


}
