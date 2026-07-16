<?php

namespace App\Models\Concerns;

trait HasTariffPlanUsage
{
    public function tariffUsageState(): string
    {
        $statuses = $this->relationLoaded('tariffPeriods')
            ? $this->tariffPeriods->pluck('statut')
            : $this->tariffPeriods()->pluck('statut');

        if ($statuses->contains('actif')) {
            return 'active';
        }

        if ($statuses->contains('archive')) {
            return 'archive';
        }

        if ($statuses->contains('brouillon')) {
            return 'draft';
        }

        return 'unused';
    }

    public function getUsageAttribute(): array
    {
        $state = $this->tariffUsageState();

        return [
            'state' => $state,
            'referenced' => $state !== 'unused',
            'locked' => in_array($state, ['active', 'archive'], true),
            'label' => match ($state) {
                'draft' => 'Utilisé dans un brouillon',
                'active' => 'Verrouillé — période active',
                'archive' => 'Verrouillé — historique',
                default => 'Libre',
            },
        ];
    }

    public function detailLockMessage(): ?string
    {
        return match ($this->tariffUsageState()) {
            'active' => 'Ce plan est verrouillé car il est utilisé par une période active.',
            'archive' => 'Ce plan est verrouillé car il appartient à l’historique tarifaire.',
            default => null,
        };
    }

    public function deletionBlockMessage(): ?string
    {
        return match ($this->tariffUsageState()) {
            'draft' => 'Ce plan est utilisé dans une période brouillon. Retirez-le de la période avant de le supprimer.',
            'active' => 'Ce plan est verrouillé car il est utilisé par une période active.',
            'archive' => 'Ce plan est verrouillé car il appartient à l’historique tarifaire.',
            default => null,
        };
    }
}
