<?php

namespace App\Console\Commands;

use App\Support\EquipmentLegacyLocationRepair;
use Illuminate\Console\Command;

class RepairLegacyEquipmentLocations extends Command
{
    protected $signature = 'equipment:repair-legacy-locations
        {--dry-run : Analyse les localisations sans modifier les données}
        {--apply : Applique uniquement les correspondances exactes et sûres}';

    protected $description = 'Répare les équipements liés à des pseudo-emplacements de chambre historiques';

    public function handle(EquipmentLegacyLocationRepair $repair): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $apply = (bool) $this->option('apply');

        if ($dryRun === $apply) {
            $this->error('Utilisez exactement une option : --dry-run ou --apply.');

            return self::INVALID;
        }

        $report = $repair->run($apply);

        $this->info($apply ? 'Mode application' : 'Mode simulation (aucune écriture)');

        if ($report['exact_matches'] !== []) {
            $this->newLine();
            $this->line('Correspondances exactes :');
            $this->table(
                ['Équipement', 'Nom', 'Pseudo-emplacement', 'Chambre réelle', 'Supprimé'],
                array_map(fn (array $match) => [
                    $match['equipment_id'],
                    $match['equipment_name'],
                    $match['emplacement_name'].' (#'.$match['emplacement_id'].')',
                    'Chambre '.$match['room_number'].' (#'.$match['room_id'].')',
                    $match['soft_deleted'] ? 'Oui' : 'Non',
                ], $report['exact_matches'])
            );
        }

        if ($report['unresolved'] !== []) {
            $this->newLine();
            $this->warn('Localisations historiques non résolues :');
            $this->table(
                ['Emplacement', 'Nom', 'Équipements', 'Raison'],
                array_map(fn (array $item) => [
                    $item['emplacement_id'],
                    $item['emplacement_name'],
                    collect($item['equipment'])->map(
                        fn (array $equipment) => '#'.$equipment['id'].' '.$equipment['name']
                            .($equipment['soft_deleted'] ? ' (supprimé)' : '')
                    )->implode(', '),
                    $item['reason'],
                ], $report['unresolved'])
            );
        }

        $this->newLine();
        $this->table(['Mesure', 'Total'], [
            ['Équipements analysés', $report['scanned']],
            ['Correspondances exactes', count($report['exact_matches'])],
            ['Équipements migrés', $report['migrated']],
            ['Équipements non résolus', $report['unresolved_equipment']],
            ['Localisations non résolues', count($report['unresolved'])],
            ['Emplacements internes ignorés', $report['ignored_internal']],
            ['Pseudo-emplacements inutilisés supprimés', $report['removed_emplacements']],
        ]);

        if (! $apply && $report['exact_matches'] !== []) {
            $this->comment('Relancez avec --apply après validation de ces correspondances.');
        }

        return self::SUCCESS;
    }
}
