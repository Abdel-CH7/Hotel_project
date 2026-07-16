<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chambre extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::created(function (Chambre $chambre) {
            $chambre->etatChambre()->firstOrCreate([], [
                'status' => 'non nettoyée',
                'maintenance' => false,
            ]);
        });
    }

    protected $table = 'chambres';
    protected $fillable = [
        'num_chambre',
        'type_chambre_id',
        'etage_id',
        'climat',
        'wifi',
        'vue_id',
    ];

    protected $casts = [
        'climat' => 'boolean',
        'wifi' => 'boolean',
    ];

    public function typeChambre()
    {
        return $this->belongsTo(TypeChambre::class, 'type_chambre_id');
    }

    public function vue()
    {
        return $this->belongsTo(Vue::class, 'vue_id'); // Matches 'vue_id' column in chambres table
    }

    public function etage()
    {
        return $this->belongsTo(Etage::class, 'etage_id'); // Matches 'etage_id' column in chambres table
    }

    public function equipements()
    {
        return $this->hasMany(Equipement::class);
    }

    public function etatChambre()
    {
        return $this->hasOne(EtatChambre::class, 'num_chambre', 'num_chambre');
    }

    /**
     * Many-to-many relation to reservations through pivot table 'details_reservation'
     */
    public function reservations()
    {
        return $this->belongsToMany(Reservation::class, 'details_reservation')
                    ->withPivot([
                        'tarif_par_nuit',
                        'montant_total',
                        'adultes',
                        'enfants',
                        'lits_supplementaires',
                        'type_chambre_id',
                        'type_chambre_nom_snapshot',
                        'capacite_standard_snapshot',
                        'lits_supplementaires_max_snapshot',
                    ])
                    ->withTimestamps();
    }

    public function reservationRooms()
    {
        return $this->hasMany(ReservationRoom::class, 'chambre_id');
    }
}
