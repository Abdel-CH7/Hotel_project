<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Reclamation extends Model
{
    public const STATUS_PENDING = 'En attente';
    public const STATUS_IN_PROGRESS = 'En cours';
    public const STATUS_TREATED = 'Traité';
    public const STATUS_RESOLVED = 'Résolu';
    public const STATUS_CANCELLED = 'Annulé';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_IN_PROGRESS,
        self::STATUS_TREATED,
        self::STATUS_RESOLVED,
        self::STATUS_CANCELLED,
    ];

    public const PRIORITIES = [
        'faible' => 'Faible',
        'normale' => 'Normale',
        'elevee' => 'Élevée',
        'urgente' => 'Urgente',
    ];

    protected $table = 'reclamations';

    protected $fillable = [
        'reclamation_num', 'reservation_id', 'client_type', 'client_id',
        'client_name_snapshot', 'chambre_id', 'reclamation_type_id',
        'description', 'reclamation_canal_id', 'canal_precision',
        'date_reclamation', 'departement_id', 'priorite', 'suivi', 'reponse',
        'resolved_at', 'cancelled_at', 'cancellation_reason',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'date_reclamation' => 'date:Y-m-d',
        'resolved_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(ReclamationType::class, 'reclamation_type_id');
    }

    public function canal(): BelongsTo
    {
        return $this->belongsTo(ReclamationCanal::class, 'reclamation_canal_id');
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class, 'departement_id');
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function chambre(): BelongsTo
    {
        return $this->belongsTo(Chambre::class);
    }

    public function client(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'client_type', 'client_id');
    }

    public function historique(): HasMany
    {
        return $this->hasMany(Historique::class, 'reclamation_id')
            ->orderBy('created_at')
            ->orderBy('id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function isReadOnly(): bool
    {
        return in_array($this->suivi, [self::STATUS_RESOLVED, self::STATUS_CANCELLED], true);
    }
}
