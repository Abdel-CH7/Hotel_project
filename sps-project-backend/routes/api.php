<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VueController;
use App\Http\Controllers\InfoController;
use App\Http\Controllers\ZoneController;
use App\Http\Controllers\EtageController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\EnfantController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\SuiviInterventionController;
use App\Http\Controllers\SecteurController;
use App\Http\Controllers\TypeRepasController;
use App\Http\Controllers\EquipementController;
use App\Http\Controllers\EmplacementController;
use App\Http\Controllers\SiteClientController;
use App\Http\Controllers\TarifRepasController;
use App\Http\Controllers\IntervenantController;
use App\Http\Controllers\ModePaimantController;
use App\Http\Controllers\ReservationPaymentController;
use App\Http\Controllers\ReservationCreditController;
use App\Http\Controllers\TarifActuelController;
use App\Http\Controllers\TypeChambreController;
use App\Http\Controllers\InterventionController;
use App\Http\Controllers\ModePaiementController;
use App\Http\Controllers\RepresantantController;
use App\Http\Controllers\RepresentantController;
use App\Http\Controllers\TarifChambreController;
use App\Http\Controllers\ClientSocieteController;
use App\Http\Controllers\ContactClientController;
use App\Http\Controllers\SecteurClientController;
use App\Http\Controllers\TypeReductionController;
use App\Http\Controllers\TarifReductionController;
use App\Http\Controllers\TarifRepasDetailController;
use App\Http\Controllers\ClientParticulierController;
use App\Http\Controllers\MaintenanceRecordController;
use App\Http\Controllers\TarifChambreDetailController;
use App\Http\Controllers\TarifReductionDetailController;
use App\Http\Controllers\SiteClientParticulierController;
use App\Http\Controllers\SecteurClientParticulierController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\ChambreController;
use App\Http\Controllers\ClientGrpController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\EtatChambreController;
use App\Http\Controllers\MaintenanceTypeController;
use App\Http\Controllers\EmployeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReclamationController;
use App\Http\Controllers\ReclamationCanalController;
use App\Http\Controllers\ReclamationDepartmentController;
use App\Http\Controllers\ReclamationOptionsController;
use App\Http\Controllers\ReclamationReservationContextController;
use App\Http\Controllers\ReclamationStatusController;
use App\Http\Controllers\ReclamationTypeController;
use App\Http\Controllers\DashboardController;

use App\Http\Controllers\ReservationController;
use App\Http\Controllers\ReservationReadinessController;
use App\Http\Controllers\ReservationFormOptionsController;
use App\Http\Controllers\ReservationClientOptionsController;


Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
Route::get('/user', [AuthController::class, 'user']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

// Client Particulier routes: Tested
Route::get('/clients-particulier', [ClientParticulierController::class, 'getAll']);
Route::post('/clients-particulier', [ClientParticulierController::class, 'ajouterClient']);
Route::get('/clients-particulier/{code}', [ClientParticulierController::class, 'afficherClient']);
Route::put('/clients-particulier/{code}', [ClientParticulierController::class, 'updateClient']);
Route::delete('/clients-particulier/{code}', [ClientParticulierController::class, 'supprimerClient']);

// Tarifs Chambre routes :Tested
Route::get('/tarifs-chambre', [TarifChambreDetailController::class, 'getAll']);
Route::post('/tarifs-chambre', [TarifChambreDetailController::class, 'ajouterTarifChambreDetail']);
Route::get('/tarifs-chambre/{tarifChambreDetail}', [TarifChambreDetailController::class, 'afficherTarifChambreDetail'])->whereNumber('tarifChambreDetail');
Route::put('/tarifs-chambre/{tarifChambreDetail}', [TarifChambreDetailController::class, 'updateTarifChambreDetail'])->whereNumber('tarifChambreDetail');
Route::delete('/tarifs-chambre/{tarifChambreDetail}', [TarifChambreDetailController::class, 'supprimerTarifChambreDetail'])->whereNumber('tarifChambreDetail');

// Tarifs Repas routes: Tested
Route::get('/tarifs-repas', [TarifRepasDetailController::class, 'getAll']);
Route::middleware('throttle:60,1')->post('/tarifs-repas', [TarifRepasDetailController::class, 'ajouterTarifRepasDetail']);
Route::get('/tarifs-repas/{tarifRepasDetail}', [TarifRepasDetailController::class, 'afficherTarifRepasDetail'])->whereNumber('tarifRepasDetail');
Route::put('/tarifs-repas/{tarifRepasDetail}', [TarifRepasDetailController::class, 'updateTarifRepasDetail'])->whereNumber('tarifRepasDetail');
Route::delete('/tarifs-repas/{tarifRepasDetail}', [TarifRepasDetailController::class, 'supprimerTarifRepasDetail'])->whereNumber('tarifRepasDetail');

// Tarifs Reduction routes: Tested
Route::get('/tarifs-reduction', [TarifReductionDetailController::class, 'getAll']);
Route::post('/tarifs-reduction', [TarifReductionDetailController::class, 'ajouterTarifReductionDetail']);
Route::get('/tarifs-reduction/{tarifReductionDetail}', [TarifReductionDetailController::class, 'afficherTarifReductionDetail'])->whereNumber('tarifReductionDetail');
Route::put('/tarifs-reduction/{tarifReductionDetail}', [TarifReductionDetailController::class, 'updateTarifReductionDetail'])->whereNumber('tarifReductionDetail');
Route::delete('/tarifs-reduction/{tarifReductionDetail}', [TarifReductionDetailController::class, 'supprimerTarifReductionDetail'])->whereNumber('tarifReductionDetail');

// Tarifs Actuel routes: Tested
Route::get('/tarifs-actuel', [TarifActuelController::class, 'getAll']);
Route::post('/tarifs-actuel', [TarifActuelController::class, 'ajouterTarifActuel']);
Route::get('/tarifs-actuel/{tarifActuel}', [TarifActuelController::class, 'afficherTarifActuel'])->whereNumber('tarifActuel');
Route::put('/tarifs-actuel/{tarifActuel}', [TarifActuelController::class, 'updateTarifActuel'])->whereNumber('tarifActuel');
Route::delete('/tarifs-actuel/{tarifActuel}', [TarifActuelController::class, 'supprimerTarifActuel'])->whereNumber('tarifActuel');

// Types Chambre routes :Tested
Route::get('/types-chambre', [TypeChambreController::class, 'getAll']);
Route::post('/types-chambre', [TypeChambreController::class, 'ajouterTypeChambre']);
Route::get('/types-chambre/{typeChambre}', [TypeChambreController::class, 'afficherTypeChambre'])->whereNumber('typeChambre');
Route::put('/types-chambre/{typeChambre}', [TypeChambreController::class, 'updateTypeChambre'])->whereNumber('typeChambre');
Route::delete('/types-chambre/{typeChambre}', [TypeChambreController::class, 'supprimerTypeChambre'])->whereNumber('typeChambre');

// Types Reduction routes :Tested
Route::get('/types-reduction', [TypeReductionController::class, 'getAll']);
Route::post('/types-reduction', [TypeReductionController::class, 'ajouterTypeReduction']);
Route::get('/types-reduction/{typeReduction}', [TypeReductionController::class, 'afficherTypeReduction'])->whereNumber('typeReduction');
Route::put('/types-reduction/{typeReduction}', [TypeReductionController::class, 'updateTypeReduction'])->whereNumber('typeReduction');
Route::delete('/types-reduction/{typeReduction}', [TypeReductionController::class, 'supprimerTypeReduction'])->whereNumber('typeReduction');

// Types Repas routes :Tested
Route::get('/types-repas', [TypeRepasController::class, 'getAll']);
Route::post('/types-repas', [TypeRepasController::class, 'ajouterTypeRepas']);
Route::get('/types-repas/{typeRepas}', [TypeRepasController::class, 'afficherTypeRepas'])->whereNumber('typeRepas');
Route::put('/types-repas/{typeRepas}', [TypeRepasController::class, 'updateTypeRepas'])->whereNumber('typeRepas');
Route::delete('/types-repas/{typeRepas}', [TypeRepasController::class, 'supprimerTypeRepas'])->whereNumber('typeRepas');

// Chambres routes
Route::get('/chambres', [ChambreController::class, 'getAll']);
Route::post('/chambres', [ChambreController::class, 'ajouterChambre']);
Route::get('/chambres/{chambre}', [ChambreController::class, 'afficherChambre'])->whereNumber('chambre');
Route::put('/chambres/{chambre}', [ChambreController::class, 'updateChambre'])->whereNumber('chambre');
Route::delete('/chambres/{chambre}', [ChambreController::class, 'supprimerChambre'])->whereNumber('chambre');

// Info routes: Tested
Route::get('/infos', [InfoController::class, 'getAll']);
Route::post('/infos', [InfoController::class, 'ajouterInfo']);
Route::get('/infos/{info_id}', [InfoController::class, 'afficherInfo']);
Route::put('/infos/{info_id}', [InfoController::class, 'updateInfo']);
Route::delete('/infos/{info_id}', [InfoController::class, 'supprimerInfo']);

// Info routes: Tested
Route::get('/desigs-chambre', [TarifChambreController::class, 'getAll']);
Route::post('/desigs-chambre', [TarifChambreController::class, 'ajouterDesiTarif']);
Route::get('/desigs-chambre/{tarifChambre}', [TarifChambreController::class, 'afficherDesiTarif'])->whereNumber('tarifChambre');
Route::put('/desigs-chambre/{tarifChambre}', [TarifChambreController::class, 'updateDesiTarif'])->whereNumber('tarifChambre');
Route::delete('/desigs-chambre/{tarifChambre}', [TarifChambreController::class, 'supprimerDesiTarif'])->whereNumber('tarifChambre');

Route::get('/desigs-repas', [TarifRepasController::class, 'getAll']);
Route::post('/desigs-repas', [TarifRepasController::class, 'ajouterDesiTarif']);
Route::get('/desigs-repas/{tarifRepas}', [TarifRepasController::class, 'afficherDesiTarif'])->whereNumber('tarifRepas');
Route::put('/desigs-repas/{tarifRepas}', [TarifRepasController::class, 'updateDesiTarif'])->whereNumber('tarifRepas');
Route::delete('/desigs-repas/{tarifRepas}', [TarifRepasController::class, 'supprimerDesiTarif'])->whereNumber('tarifRepas');

Route::get('/vues', [VueController::class, 'getAll']);
Route::post('/vues', [VueController::class, 'ajouterVue']);
Route::get('/vues/{vue}', [VueController::class, 'afficherVue']);
Route::put('/vues/{vue}', [VueController::class, 'updateVue']);
Route::delete('/vues/{vue}', [VueController::class, 'supprimerVue']);

Route::get('/etages', [EtageController::class, 'getAll']);
Route::post('/etages', [EtageController::class, 'ajouterEtage']);
Route::get('/etages/{etage}', [EtageController::class, 'afficherEtage']);
Route::put('/etages/{etage}', [EtageController::class, 'updateEtage']);
Route::delete('/etages/{etage}', [EtageController::class, 'supprimerEtage']);

Route::get('/desigs-reduction', [TarifReductionController::class, 'getAll']);
Route::post('/desigs-reduction', [TarifReductionController::class, 'ajouterDesiTarif']);
Route::get('/desigs-reduction/{tarifReduction}', [TarifReductionController::class, 'afficherDesiTarif'])->whereNumber('tarifReduction');
Route::put('/desigs-reduction/{tarifReduction}', [TarifReductionController::class, 'updateDesiTarif'])->whereNumber('tarifReduction');
Route::delete('/desigs-reduction/{tarifReduction}', [TarifReductionController::class, 'supprimerDesiTarif'])->whereNumber('tarifReduction');

Route::get('client-particulier/location-options', [ClientParticulierController::class, 'locationOptions']);
Route::get('clients_particulier/{clientId}/siteclients', [ClientParticulierController::class, 'siteclients']);
Route::get('clients_particulier/{clientId}/bonslivraison', [ClientParticulierController::class, 'bonsLivraisonClient']);
Route::get('clients_particulier', [ClientParticulierController::class, 'index']);
Route::post('clients_particulier', [ClientParticulierController::class, 'store']);
Route::get('clients_particulier/{client}', [ClientParticulierController::class, 'show']);
Route::put('clients_particulier/{client}', [ClientParticulierController::class, 'update']);
Route::delete('clients_particulier/{client}', [ClientParticulierController::class, 'destroy']);
Route::get('DachbordeDataclients_particulier', [ClientParticulierController::class, 'getAllDataDachborde']);
Route::get('all-data-client-particulier', [ClientParticulierController::class, 'getAllData']);
Route::get('/stats/clients-particuliers/ville', [ClientParticulierController::class, 'statsByVille']);
Route::get('/stats/clients-particuliers/secteur', [ClientParticulierController::class, 'statsBySecteur']);

// Site Clients
Route::get('siteclients_particulier', [SiteClientParticulierController::class, 'index']); // Route pour obtenir tous les site clients
Route::get('siteclients_particulier/{siteclient}', [SiteClientParticulierController::class, 'show']);
Route::put('siteclients_particulier/{siteclient}', [SiteClientParticulierController::class, 'update']);
Route::post('siteclients_particulier', [SiteClientParticulierController::class, 'store']);
Route::delete('siteclients_particulier/{siteclient}', [SiteClientParticulierController::class, 'destroy']);

Route::get('clients/{clientId}/siteclients', [ClientController::class, 'siteclients']);
Route::get('clients/{clientId}/bonslivraison', [ClientController::class, 'bonsLivraisonClient']);
Route::get('client-societe/form-options', [ClientController::class, 'formOptions']);
Route::get('clients', [ClientController::class, 'index']);
Route::post('clients', [ClientController::class, 'store']);
Route::get('clients/{client}', [ClientController::class, 'show']);
Route::put('clients/{client}', [ClientController::class, 'update']);
Route::delete('clients/{client}', [ClientController::class, 'destroy']);
Route::get('DachbordeDataclients', [ClientController::class, 'getAllDataDachborde']);
Route::get('all-data-client', [ClientController::class, 'getAllData']);
Route::get('/stats/clients/ville', [ClientController::class, 'statsByVille']);
Route::get('/stats/clients/secteur', [ClientController::class, 'statsBySecteur']);

// Site Clients
Route::get('siteclients', [SiteClientController::class, 'index']); // Route pour obtenir tous les site clients
Route::get('siteclients/{siteclient}', [SiteClientController::class, 'show']);
Route::put('siteclients/{siteclient}', [SiteClientController::class, 'update']);
Route::post('siteclients', [SiteClientController::class, 'store']);
Route::delete('siteclients/{siteclient}', [SiteClientController::class, 'destroy']);

//region
Route::get('regions', [RegionController::class, 'index']);
Route::post('regions', [RegionController::class, 'store']);
Route::get('regions/{region}', [RegionController::class, 'show']);
Route::put('regions/{region}', [RegionController::class, 'update']);
Route::delete('regions/{region}', [RegionController::class, 'destroy']);

//zone
Route::get('zones', [ZoneController::class, 'index']);
Route::post('zones', [ZoneController::class, 'store']);
Route::get('zones/{zone}', [ZoneController::class, 'show']);
Route::put('zones/{zone}', [ZoneController::class, 'update']);
Route::delete('zones/{zone}', [ZoneController::class, 'destroy']);

// Secteur Clients
Route::apiResource('secteur_clients', SecteurClientController::class);

//Contact client
Route::post('/contactClient', [ContactClientController::class, 'store']);
Route::put('/contactClient', [ContactClientController::class, 'update']);
Route::delete('/contactClient/{id}', [ContactClientController::class, 'destroy']);

//Info client
Route::post('/infoClient', [EnfantController::class, 'store']);
Route::put('/infoClient', [EnfantController::class, 'update']);
Route::delete('/infoClient/{id}', [EnfantController::class, 'destroy']);

Route::apiResource('representant', RepresantantController::class);

Route::apiResource('mode-paimants', ModePaimantController::class);

/*  WARNING! - IT SHOULD BE REMOVED AFTER FINSHING THE WORK ON IT*/
// Routes d'équipements déplacées dans le middleware auth:sanctum

Route::get('/interventions', [InterventionController::class, 'index']);
Route::post('/interventions', [InterventionController::class, 'store']);
Route::get('/interventions/{id}', [InterventionController::class, 'show']);
Route::put('/interventions/{id}', [InterventionController::class, 'update']);
Route::delete('/interventions/{id}', [InterventionController::class, 'destroy']);

Route::get('/suivi_interventions', [SuiviInterventionController::class, 'index']);
Route::post('/suivi_interventions', [SuiviInterventionController::class, 'store']);
Route::get('/suivi_interventions/{id}', [SuiviInterventionController::class, 'show']);
Route::put('/suivi_interventions/{id}', [SuiviInterventionController::class, 'update']);
Route::delete('/suivi_interventions/{id}', [SuiviInterventionController::class, 'destroy']);

Route::get('/intervenants', [IntervenantController::class, 'index']);
Route::post('/intervenants', [IntervenantController::class, 'store']);
Route::get('/intervenants/{id}', [IntervenantController::class, 'show']);
Route::put('/intervenants/{id}', [IntervenantController::class, 'update']);
Route::delete('/intervenants/{id}', [IntervenantController::class, 'destroy']);

Route::get( '/agents', [AgentController::class, 'index']);
Route::post('/agents', [AgentController::class, 'store']);
Route::get('/agents/{id}', [AgentController::class, 'show']);
Route::put('/agents/{id}', [AgentController::class, 'update']);
Route::delete('/agents/{id}', [AgentController::class, 'destroy']);

Route::get('/maintenances', [MaintenanceRecordController::class, 'index']);
Route::post('/maintenances', [MaintenanceRecordController::class, 'store']);
Route::get('/maintenances/{id}', [MaintenanceRecordController::class, 'show']);
Route::put('/maintenances/{id}', [MaintenanceRecordController::class, 'update']);
Route::post('/maintenances/{id}', [MaintenanceRecordController::class, 'update']);
Route::delete('/maintenances/{id}', [MaintenanceRecordController::class, 'destroy']);

    // Routes pour les équipements
    Route::get('/equipements/stats', [EquipementController::class, 'stats']);
    Route::get('/equipements/categories', [EquipementController::class, 'categories']);
    Route::apiResource('equipements', EquipementController::class)
        ->whereNumber('equipement');
    Route::apiResource('emplacements', EmplacementController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->whereNumber('emplacement');

// EtatChambre routes
Route::get('/etat-chambre', [EtatChambreController::class, 'index']);
Route::post('/etat-chambre', [EtatChambreController::class, 'store']);
Route::get('/etat-chambre/chambres-with-etat', [EtatChambreController::class, 'getChambresWithEtat']);
Route::get('/etat-chambre/maintenance-types', [EtatChambreController::class, 'getMaintenanceTypes']);
Route::get('/etat-chambre/{num_chambre}', [EtatChambreController::class, 'show']);
Route::put('/etat-chambre/{num_chambre}', [EtatChambreController::class, 'update']);
Route::delete('/etat-chambre/{num_chambre}', [EtatChambreController::class, 'destroy']);
Route::apiResource('maintenance-types', MaintenanceTypeController::class)
    ->whereNumber('maintenance_type');
Route::apiResource('employes', EmployeController::class)
    ->whereNumber('employe');

Route::prefix('reclamations')->group(function () {
        Route::get('/form-options', ReclamationOptionsController::class);
        Route::get('/reservations/{reservation}/context', ReclamationReservationContextController::class)
            ->whereNumber('reservation');
        Route::get('/', [ReclamationController::class, 'index']);
        Route::get('/{reclamation}', [ReclamationController::class, 'show'])
            ->whereNumber('reclamation');

        Route::post('/', [ReclamationController::class, 'store']);
        Route::put('/{reclamation}', [ReclamationController::class, 'update'])
            ->whereNumber('reclamation');
        Route::patch('/{reclamation}/status', [ReclamationStatusController::class, 'update'])
            ->whereNumber('reclamation');
        Route::patch('/{reclamation}/cancel', [ReclamationStatusController::class, 'cancel'])
            ->whereNumber('reclamation');
});

    Route::get('/reclamation-types', [ReclamationTypeController::class, 'index']);
    Route::post('/reclamation-types', [ReclamationTypeController::class, 'store']);
    Route::put('/reclamation-types/{type}', [ReclamationTypeController::class, 'update'])
        ->whereNumber('type');
    Route::patch('/reclamation-types/{type}/active', [ReclamationTypeController::class, 'active'])
        ->whereNumber('type');

    Route::get('/reclamation-canaux', [ReclamationCanalController::class, 'index']);
    Route::post('/reclamation-canaux', [ReclamationCanalController::class, 'store']);
    Route::put('/reclamation-canaux/{canal}', [ReclamationCanalController::class, 'update'])
        ->whereNumber('canal');
    Route::patch('/reclamation-canaux/{canal}/active', [ReclamationCanalController::class, 'active'])
        ->whereNumber('canal');

    Route::get('/reclamation-departements', [ReclamationDepartmentController::class, 'index']);
    Route::post('/reclamation-departements', [ReclamationDepartmentController::class, 'store']);
    Route::put('/reclamation-departements/{departement}', [ReclamationDepartmentController::class, 'update'])
        ->whereNumber('departement');
    Route::patch('/reclamation-departements/{departement}/active', [ReclamationDepartmentController::class, 'active'])
        ->whereNumber('departement');
// Reservation API. Static routes must stay before identifier routes.
Route::get('/reservations/readiness', ReservationReadinessController::class);
Route::get('/reservations/client-options', ReservationClientOptionsController::class);
Route::get('/reservations/payment-options', [ReservationPaymentController::class, 'options']);
Route::get('/reservations/societes/{client}/credit-summary', [ReservationCreditController::class, 'show'])
    ->whereNumber('client');
Route::get('/reservations/form-options', ReservationFormOptionsController::class);
Route::get('/reservations/available-rooms', [ReservationController::class, 'availableRooms']);
Route::post('/reservations/calculate-price', [ReservationController::class, 'calculatePrice']);
Route::get('/reservations', [ReservationController::class, 'index']);
Route::post('/reservations', [ReservationController::class, 'store']);
Route::post('/reservations/{reservation}/payments', [ReservationPaymentController::class, 'store'])
    ->whereNumber('reservation');
Route::patch('/reservations/{reservation}/payments/{payment}/cancel', [ReservationPaymentController::class, 'cancel'])
    ->whereNumber(['reservation', 'payment']);
Route::patch('/reservations/{reservation}/status', [ReservationController::class, 'updateStatus'])
    ->whereNumber('reservation');
Route::get('/reservations/{reservation}', [ReservationController::class, 'show'])
    ->whereNumber('reservation');
Route::put('/reservations/{reservation}', [ReservationController::class, 'update'])
    ->whereNumber('reservation');

// Deprecated compatibility aliases retained until the Phase 3C frontend migration.
Route::get('/available-rooms', [ReservationController::class, 'availableRooms']);
Route::post('/reservations/calculate-tarif', [ReservationController::class, 'calculatePrice']);
Route::delete('/reservations/{reservation}', [ReservationController::class, 'cancelFromDelete'])
    ->whereNumber('reservation');
Route::get('/reservations/{reservationReference}', [ReservationController::class, 'showByNumber'])
    ->where('reservationReference', 'R[A-Za-z0-9]+');
Route::put('/reservations/{reservationReference}', [ReservationController::class, 'updateByNumber'])
    ->where('reservationReference', 'R[A-Za-z0-9]+');
Route::delete('/reservations/{reservationReference}', [ReservationController::class, 'cancelByNumberFromDelete'])
    ->where('reservationReference', 'R[A-Za-z0-9]+');
});
