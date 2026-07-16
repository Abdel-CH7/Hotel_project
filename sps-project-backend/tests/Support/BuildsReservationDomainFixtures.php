<?php

namespace Tests\Support;

use App\Models\Chambre;
use App\Models\Reservation;
use App\Models\ReservationRoom;
use App\Models\TarifActuel;
use App\Models\TarifChambre;
use App\Models\TarifChambreDetail;
use App\Models\TarifReduction;
use App\Models\TarifReductionDetail;
use App\Models\TarifRepas;
use App\Models\TarifRepasDetail;
use App\Models\TypeChambre;
use App\Models\TypeReduction;
use App\Models\TypeRepas;
use Illuminate\Support\Facades\DB;

trait BuildsReservationDomainFixtures
{
    protected function createCompanyClient(?string $name = null): object
    {
        $suffix = uniqid();
        $id = DB::table('clients')->insertGetId([
            'CodeClient' => "SOC-{$suffix}",
            'raison_sociale' => $name ?? "Société {$suffix}",
            'adresse' => 'Adresse test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('clients')->find($id);
    }

    protected function createIndividualClient(string $name = 'Amine', string $firstName = 'Test'): object
    {
        $suffix = uniqid();
        $id = DB::table('clients_particulier')->insertGetId([
            'CodeClient' => "PAR-{$suffix}",
            'name' => $name,
            'prenom' => $firstName,
            'cin' => "CIN-{$suffix}",
            'civilite' => 'M.',
            'nationalite' => 'Marocaine',
            'adresse' => 'Adresse test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('clients_particulier')->find($id);
    }

    protected function createRoomType(?int $capacity = 3, ?int $extraBeds = 0): TypeChambre
    {
        $suffix = uniqid();

        return TypeChambre::create([
            'code' => "RT-{$suffix}",
            'type_chambre' => "Type chambre {$suffix}",
            'nb_lit' => 2,
            'nb_salle' => 1,
            'capacite_standard' => $capacity,
            'lits_supplementaires_max' => $extraBeds,
            'commentaire' => null,
        ]);
    }

    protected function createRoom(?TypeChambre $type = null, ?string $number = null): Chambre
    {
        $suffix = uniqid();
        $type ??= $this->createRoomType();
        $viewId = DB::table('vues')->insertGetId([
            'vue' => "Vue {$suffix}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $floorId = DB::table('etages')->insertGetId([
            'etage' => "Etage {$suffix}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return Chambre::create([
            'num_chambre' => $number ?? "ROOM-{$suffix}",
            'type_chambre_id' => $type->id,
            'etage_id' => $floorId,
            'vue_id' => $viewId,
            'climat' => true,
            'wifi' => true,
        ]);
    }

    protected function createRoomGridDetail(TypeChambre $type, array $prices = []): array
    {
        $grid = TarifChambre::create(['designation' => 'Plan chambre '.uniqid()]);
        $detail = TarifChambreDetail::create(array_merge([
            'code' => 'PRICE-'.uniqid(),
            'tarif_chambre_id' => $grid->id,
            'type_chambre_id' => $type->id,
            'prix_1_personne' => '100.00',
            'prix_2_personnes' => '150.00',
            'prix_3_personnes' => '200.00',
            'prix_lit_supplementaire' => '25.00',
        ], $prices));

        return [$grid, $detail];
    }

    protected function createMealGridDetail(?TypeRepas $type = null, string $price = '20.00'): array
    {
        $type ??= TypeRepas::create([
            'code' => 'MEAL-'.uniqid(),
            'type_repas' => 'Repas '.uniqid(),
        ]);
        $grid = TarifRepas::create(['designation' => 'Plan repas '.uniqid()]);
        $detail = TarifRepasDetail::create([
            'tarif_repas_id' => $grid->id,
            'type_repas_id' => $type->id,
            'prix_par_personne' => $price,
        ]);

        return [$grid, $detail, $type];
    }

    protected function createReductionGridDetail(
        ?TypeReduction $type = null,
        string $fixed = '0.00',
        string $percentage = '10.00'
    ): array {
        $type ??= TypeReduction::create([
            'code' => 'RED-'.uniqid(),
            'type_reduction' => 'Réduction '.uniqid(),
        ]);
        $grid = TarifReduction::create(['designation' => 'Plan réduction '.uniqid()]);
        $detail = TarifReductionDetail::create([
            'tarif_reduction_id' => $grid->id,
            'type_reduction_id' => $type->id,
            'montant_fixe' => $fixed,
            'pourcentage' => $percentage,
        ]);

        return [$grid, $detail, $type];
    }

    protected function createPeriod(
        string $start,
        string $end,
        TarifChambre $roomGrid,
        ?TarifRepas $mealGrid = null,
        ?TarifReduction $reductionGrid = null,
        string $status = 'actif'
    ): TarifActuel {
        return TarifActuel::create([
            'designation' => 'Période '.uniqid(),
            'date_debut' => $start,
            'date_fin' => $end,
            'statut' => $status,
            'tarif_chambre_id' => $roomGrid->id,
            'tarif_repas_id' => $mealGrid?->id,
            'tarif_reduction_id' => $reductionGrid?->id,
        ]);
    }

    protected function createBlockingReservation(
        Chambre $room,
        string $start,
        string $end,
        string $status = 'en attente'
    ): Reservation {
        $reservation = Reservation::create([
            'reservation_num' => 'BLOCK-'.uniqid(),
            'client_id' => 999999,
            'client_type' => 'societe',
            'reservation_date' => $start,
            'date_debut' => $start,
            'date_fin' => $end,
            'status' => $status,
            'montant_total' => 0,
            'montant_reduction' => 0,
            'pricing_version' => 2,
            'legacy_pricing' => false,
        ]);
        ReservationRoom::create([
            'reservation_id' => $reservation->id,
            'chambre_id' => $room->id,
            'tarif_par_nuit' => null,
            'montant_total' => 0,
        ]);

        return $reservation;
    }

    protected function pricingInput(
        Chambre $room,
        string $start,
        string $end,
        int $adults = 1,
        int $children = 0,
        array $meals = [],
        ?int $reductionTypeId = null
    ): array {
        return [
            'date_debut' => $start,
            'date_fin' => $end,
            'chambres' => [[
                'chambre_id' => $room->id,
                'adultes' => $adults,
                'enfants' => $children,
            ]],
            'repas' => $meals,
            'type_reduction_id' => $reductionTypeId,
        ];
    }
}
