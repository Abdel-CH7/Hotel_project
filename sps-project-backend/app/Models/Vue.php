<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Vue extends Model
{
    use HasFactory;

    protected $fillable = [
        "vue",
        "photo"
    ];

    public function chambres() {
        return $this->hasMany(Chambre::class, "vue_id");
    }
}
