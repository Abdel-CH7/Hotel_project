<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservationPaiement extends Model
{
    use HasFactory;

    public const TYPE_ACOMPTE = 'acompte';
    public const TYPE_PAIEMENT_PARTIEL = 'paiement_partiel';
    public const TYPE_SOLDE = 'solde';
    /** @deprecated Historical value retained for existing payment rows. */
    public const TYPE_REGLEMENT = 'reglement';
    public const STATUS_VALIDE = 'valide';
    public const STATUS_ANNULE = 'annule';

    public static function typeLabel(?string $type): string
    {
        return match ($type) {
            self::TYPE_ACOMPTE => 'Acompte',
            self::TYPE_PAIEMENT_PARTIEL => 'Paiement partiel',
            self::TYPE_SOLDE => 'Solde',
            self::TYPE_REGLEMENT => 'Règlement',
            default => 'Type inconnu',
        };
    }

    protected $table = 'reservation_paiements';

    protected $fillable = [
        'paiement_num',
        'reservation_id',
        'mode_paiement_id',
        'type_paiement',
        'montant',
        'date_paiement',
        'reference',
        'commentaire',
        'statut',
        'user_id',
        'annule_at',
        'annule_par_id',
        'motif_annulation',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'date:Y-m-d',
        'annule_at' => 'datetime',
        'user_id' => 'integer',
        'annule_par_id' => 'integer',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class, 'reservation_id');
    }

    public function modePaiement()
    {
        return $this->belongsTo(ModePaimant::class, 'mode_paiement_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'annule_par_id');
    }

    public function scopeValide(Builder $query): Builder
    {
        return $query->where('statut', self::STATUS_VALIDE);
    }

    public function scopeAnnule(Builder $query): Builder
    {
        return $query->where('statut', self::STATUS_ANNULE);
    }
}
