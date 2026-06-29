<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class TarifActuel extends Model
{
    use HasFactory;

    protected $table = "tarifs_actuel";
    protected $fillable = [
        "date_debut",
        "date_fin",
        "tarif_chambre",
        "tarif_repas",
        "tarif_reduction"
    ];

    public function tarif_chambre()
    {
        return $this->belongsTo(TarifChambre::class, 'tarif_chambre');
    }

    public function tarif_repas()
    {
        return $this->belongsTo(TarifRepas::class, 'tarif_repas');
    }

    public function tarif_reduction()
    {
        return $this->belongsTo(TarifReduction::class, 'tarif_reduction');
    }


}
