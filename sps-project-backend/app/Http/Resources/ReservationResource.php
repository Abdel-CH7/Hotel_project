<?php

namespace App\Http\Resources;

use App\Support\DecimalMoney;
use App\Support\ReservationClientData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_num' => $this->reservation_num,
            'pricing_version' => $this->pricing_version,
            'legacy_pricing' => (bool) $this->legacy_pricing,
            'status' => $this->status,
            'client' => ReservationClientData::reservationClient($this->resource, true),
            'dates' => [
                'reservation' => $this->reservation_date?->format('Y-m-d'),
                'debut' => $this->date_debut?->format('Y-m-d'),
                'fin' => $this->date_fin?->format('Y-m-d'),
                'nuits' => $this->date_debut && $this->date_fin
                    ? (int) $this->date_debut->diffInDays($this->date_fin)
                    : null,
            ],
            'chambres' => $this->reservationRooms->map(function ($allocation): array {
                return [
                    'allocation_id' => $allocation->id,
                    'chambre_id' => $allocation->chambre_id,
                    'num_chambre' => $allocation->chambre?->num_chambre,
                    'type_chambre' => [
                        'id' => $allocation->type_chambre_id,
                        'nom_snapshot' => $allocation->type_chambre_nom_snapshot,
                        'capacite_standard_snapshot' => $allocation->capacite_standard_snapshot,
                        'lits_supplementaires_max_snapshot' => $allocation->lits_supplementaires_max_snapshot,
                    ],
                    'adultes' => $allocation->adultes,
                    'enfants' => $allocation->enfants,
                    'lits_supplementaires' => $allocation->lits_supplementaires,
                    'tarif_par_nuit' => $allocation->tarif_par_nuit,
                    'segments' => $allocation->priceSegments->map(fn ($segment): array => [
                        'id' => $segment->id,
                        'tarif_actuel_id' => $segment->tarif_actuel_id,
                        'tarif_chambre_detail_id' => $segment->tarif_chambre_detail_id,
                        'date_debut' => $segment->segment_date_debut?->format('Y-m-d'),
                        'date_fin' => $segment->segment_date_fin?->format('Y-m-d'),
                        'nuits' => $segment->nuits,
                        'occupation_tarifee' => $segment->occupation_tarifee,
                        'prix_occupation' => $segment->prix_occupation_snapshot,
                        'lits_supplementaires' => $segment->lits_supplementaires,
                        'prix_lit_supplementaire' => $segment->prix_lit_supplementaire_snapshot,
                        'prix_par_nuit' => $segment->prix_par_nuit_snapshot,
                        'montant' => $segment->montant_segment,
                        'periode' => $segment->periode_designation_snapshot,
                        'plan' => $segment->plan_designation_snapshot,
                    ])->values(),
                    'montant_total' => $allocation->montant_total,
                ];
            })->values(),
            'repas' => $this->mealBreakdown(),
            'reduction' => $this->when($this->reduction, fn (): array => [
                'id' => $this->reduction->id,
                'tarif_actuel_id' => $this->reduction->tarif_actuel_id,
                'tarif_reduction_detail_id' => $this->reduction->tarif_reduction_detail_id,
                'type_reduction_id' => $this->reduction->type_reduction_id,
                'type_reduction' => $this->reduction->type_reduction_nom_snapshot,
                'montant_fixe' => $this->reduction->montant_fixe_snapshot,
                'pourcentage' => $this->reduction->pourcentage_snapshot,
                'sous_total_eligible' => $this->reduction->sous_total_eligible,
                'montant_applique' => $this->reduction->montant_applique,
                'formule_version' => $this->reduction->formule_version,
            ], null),
            'totals' => [
                'chambres' => $this->montant_chambres,
                'repas' => $this->montant_repas,
                'avant_reduction' => $this->sous_total_avant_reduction,
                'reduction' => $this->montant_reduction,
                'total' => $this->montant_total,
            ],
            'cancellation' => [
                'cancelled_at' => $this->cancelled_at?->toIso8601String(),
                'reason' => $this->cancellation_reason,
            ],
        ];
    }

    private function mealBreakdown(): array
    {
        return $this->meals
            ->groupBy('type_repas_id')
            ->map(function ($segments): array {
                $totalCents = $segments->sum(
                    fn ($segment): int => DecimalMoney::toCents($segment->montant_total)
                );
                $first = $segments->first();

                return [
                    'type_repas_id' => $first->type_repas_id,
                    'type_repas' => $first->type_repas_nom_snapshot,
                    'quantite_par_jour' => $first->quantite_par_jour,
                    'segments' => $segments->map(fn ($segment): array => [
                        'id' => $segment->id,
                        'tarif_actuel_id' => $segment->tarif_actuel_id,
                        'tarif_repas_detail_id' => $segment->tarif_repas_detail_id,
                        'date_debut' => $segment->segment_date_debut?->format('Y-m-d'),
                        'date_fin' => $segment->segment_date_fin?->format('Y-m-d'),
                        'prix_unitaire' => $segment->prix_unitaire_snapshot,
                        'quantite_par_jour' => $segment->quantite_par_jour,
                        'jours_factures' => $segment->jours_factures,
                        'montant_total' => $segment->montant_total,
                    ])->values(),
                    'montant_total' => DecimalMoney::format($totalCents),
                ];
            })
            ->values()
            ->all();
    }
}
