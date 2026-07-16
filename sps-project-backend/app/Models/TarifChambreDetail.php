<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarifChambreDetail extends Model
{
    use HasFactory;

    protected $table = 'tarif_chambre_detail';

    protected $fillable = [
        'code',
        'tarif_chambre_id',
        'type_chambre_id',
        'prix_1_personne',
        'prix_2_personnes',
        'prix_3_personnes',
        'prix_lit_supplementaire',
    ];

    protected $casts = [
        'prix_1_personne' => 'decimal:2',
        'prix_2_personnes' => 'decimal:2',
        'prix_3_personnes' => 'decimal:2',
        'prix_lit_supplementaire' => 'decimal:2',
    ];

    protected $appends = [
        'single',
        'double',
        'triple',
        'lit_supp',
        'tarif_chambre',
        'type_chambre',
    ];

    public function roomRateGrid()
    {
        return $this->belongsTo(TarifChambre::class, 'tarif_chambre_id');
    }

    public function roomType()
    {
        return $this->belongsTo(TypeChambre::class, 'type_chambre_id');
    }

    public function getSingleAttribute(): ?string
    {
        return $this->prix_1_personne;
    }

    public function getDoubleAttribute(): ?string
    {
        return $this->prix_2_personnes;
    }

    public function getTripleAttribute(): ?string
    {
        return $this->prix_3_personnes;
    }

    public function getLitSuppAttribute(): string
    {
        return $this->prix_lit_supplementaire;
    }

    public function getTarifChambreAttribute(): ?TarifChambre
    {
        return $this->roomRateGrid;
    }

    public function getTypeChambreAttribute(): ?TypeChambre
    {
        return $this->roomType;
    }
}
