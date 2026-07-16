<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarifReductionDetail extends Model
{
    use HasFactory;

    protected $table = 'tarif_reduction_detail';

    protected $fillable = [
        'tarif_reduction_id',
        'type_reduction_id',
        'montant_fixe',
        'pourcentage',
    ];

    protected $casts = [
        'montant_fixe' => 'decimal:2',
        'pourcentage' => 'decimal:2',
    ];

    protected $appends = ['montant', 'percentage', 'tarif_reduction', 'type_reduction'];

    public function reductionGrid()
    {
        return $this->belongsTo(TarifReduction::class, 'tarif_reduction_id');
    }

    public function reductionType()
    {
        return $this->belongsTo(TypeReduction::class, 'type_reduction_id');
    }

    public function getMontantAttribute(): string
    {
        return $this->montant_fixe;
    }

    public function getPercentageAttribute(): string
    {
        return $this->pourcentage;
    }

    public function getTarifReductionAttribute(): ?TarifReduction
    {
        return $this->reductionGrid;
    }

    public function getTypeReductionAttribute(): ?TypeReduction
    {
        return $this->reductionType;
    }
}
