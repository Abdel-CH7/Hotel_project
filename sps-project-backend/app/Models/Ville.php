<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Ville extends Model
{
    use HasFactory;

    protected $fillable = [
        'ville', 'region_id',
    ];

    // Define a relationship with the Region model (assuming Region exists).
    public function region()
    {
        return $this->belongsTo(Region::class);
    }
}
