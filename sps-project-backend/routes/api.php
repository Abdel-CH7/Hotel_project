<?php

use Illuminate\Http\Request;
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
use App\Http\Controllers\SiteClientController;
use App\Http\Controllers\TarifRepasController;
use App\Http\Controllers\IntervenantController;
use App\Http\Controllers\ModePaimantController;
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
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReclamationController;

use App\Http\Controllers\ReservationController;


Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

// Client Particulier routes: Tested
Route::get('/clients-particulier', [ClientParticulierController::class, 'getAll']);
Route::post('/clients-particulier', [ClientParticulierController::class, 'ajouterClient']);
Route::get('/clients-particulier/{code}', [ClientParticulierController::class, 'afficherClient']);
Route::put('/clients-particulier/{code}', [ClientParticulierController::class, 'updateClient']);
Route::delete('/clients-particulier/{code}', [ClientParticulierController::class, 'supprimerClient']);

// Tarifs Chambre routes :Tested
Route::get('/tarifs-chambre', [TarifChambreDetailController::class, 'getAll']);
Route::post('/tarifs-chambre', [TarifChambreDetailController::class, 'ajouterTarifChambreDetail']);
Route::get('/tarifs-chambre/{tarif_chambre_code}', [TarifChambreDetailController::class, 'afficherTarifChambreDetail']);
Route::put('/tarifs-chambre/{tarif_chambre_code}', [TarifChambreDetailController::class, 'updateTarifChambreDetail']);
Route::delete( '/tarifs-chambre/{tarif_chambre_code}', [TarifChambreDetailController::class, 'supprimerTarifChambreDetail']);

// Tarifs Repas routes: Tested
Route::get('/tarifs-repas', [TarifRepasDetailController::class, 'getAll']);
Route::middleware('throttle:60,1')->post('/tarifs-repas', [TarifRepasDetailController::class, 'ajouterTarifRepasDetail']);
Route::get('/tarifs-repas/{tarif_repas_code}', [TarifRepasDetailController::class, 'afficherTarifRepasDetail']);
Route::put('/tarifs-repas/{tarif_repas_code}', [TarifRepasDetailController::class, 'updateTarifRepasDetail']);
Route::delete('/tarifs-repas/{tarif_repas_code}', [TarifRepasDetailController::class, 'supprimerTarifRepasDetail']);

// Tarifs Reduction routes: Tested
Route::get('/tarifs-reduction', [TarifReductionDetailController::class, 'getAll']);
Route::post('/tarifs-reduction', [TarifReductionDetailController::class, 'ajouterTarifReductionDetail']);
Route::get('/tarifs-reduction/{tarif_reduction_code}', [TarifReductionDetailController::class, 'afficherTarifReductionDetail']);
Route::put('/tarifs-reduction/{tarif_reduction_code}', [TarifReductionDetailController::class, 'updateTarifReductionDetail']);
Route::delete('/tarifs-reduction/{tarif_reduction_code}', [TarifReductionDetailController::class, 'supprimerTarifReductionDetail']);

// Tarifs Actuel routes: Tested
Route::get('/tarifs-actuel', [TarifActuelController::class, 'getAll']);
Route::post('/tarifs-actuel', [TarifActuelController::class, 'ajouterTarifActuel']);
Route::get('/tarifs-actuel/{tarif_actuel_code}', [TarifActuelController::class, 'afficherTarifActuel']);
Route::put('/tarifs-actuel/{tarif_actuel_code}', [TarifActuelController::class, 'updateTarifActuel']);
Route::delete('/tarifs-actuel/{tarif_actuel_code}', [TarifActuelController::class, 'supprimerTarifActuel']);

// Types Chambre routes :Tested
Route::get('/types-chambre', [TypeChambreController::class, 'getAll']);
Route::post('/types-chambre', [TypeChambreController::class, 'ajouterTypeChambre']);
Route::get('/types-chambre/{type_chambre_code}', [TypeChambreController::class, 'afficherTypeChambre']);
Route::put('/types-chambre/{type_chambre_code}', [TypeChambreController::class, 'updateTypeChambre']);
Route::delete('/types-chambre/{type_chambre_code}', [TypeChambreController::class, 'supprimerClient']);

// Types Reduction routes :Tested
Route::get('/types-reduction', [TypeReductionController::class, 'getAll']);
Route::post('/types-reduction', [TypeReductionController::class, 'ajouterTypeReduction']);
Route::get('/types-reduction/{type_reduction_code}', [TypeReductionController::class, 'afficherTypeReduction']);
Route::put('/types-reduction/{type_reduction_code}', [TypeReductionController::class, 'updateTypeReduction']);
Route::delete('/types-reduction/{type_reduction_code}', [TypeReductionController::class, 'supprimerClient']);

// Types Repas routes :Tested
Route::get('/types-repas', [TypeRepasController::class, 'getAll']);
Route::post('/types-repas', [TypeRepasController::class, 'ajouterTypeRepas']);
Route::get('/types-repas/{type_repas_code}', [TypeRepasController::class, 'afficherTypeRepas']);
Route::put('/types-repas/{type_repas_code}', [TypeRepasController::class, 'updateTypeRepas']);
Route::delete('/types-repas/{type_repas_code}', [TypeRepasController::class, 'supprimerClient']);

// Chambres routes
Route::get('/chambres', [ChambreController::class, 'getAll']);
Route::post('/chambres', [ChambreController::class, 'ajouterChambre']);
Route::get('/chambres/{num_chambre}', [ChambreController::class, 'afficherChambre']);
Route::put('/chambres/{num_chambre}', [ChambreController::class, 'updateChambre']);
Route::delete('/chambres/{num_chambre}', [ChambreController::class, 'supprimerChambre']);
Route::delete('/all-chambres', [ChambreController::class, 'supprimerChambres']);

// Info routes: Tested
Route::get('/infos', [InfoController::class, 'getAll']);
Route::post('/infos', [InfoController::class, 'ajouterInfo']);
Route::get('/infos/{info_id}', [InfoController::class, 'afficherInfo']);
Route::put('/infos/{info_id}', [InfoController::class, 'updateInfo']);
Route::delete('/infos/{info_id}', [InfoController::class, 'supprimerInfo']);

// Info routes: Tested
Route::get('/desigs-chambre', [TarifChambreController::class, 'getAll']);
Route::post('/desigs-chambre', [TarifChambreController::class, 'ajouterDesiTarif']);
Route::get('/desigs-chambre/{desigs_id}', [TarifChambreController::class, 'afficherDesiTarif']);
Route::put('/desigs-chambre/{desigs_id}', [TarifChambreController::class, 'updateDesiTarif']);
Route::delete('/desigs-chambre/{desigs_id}', [TarifChambreController::class, 'supprimerDesiTarif']);

Route::get('/desigs-repas', [TarifRepasController::class, 'getAll']);
Route::post('/desigs-repas', [TarifRepasController::class, 'ajouterDesiTarif']);
Route::get('/desigs-repas/{desigs_id}', [TarifRepasController::class, 'afficherDesiTarif']);
Route::put('/desigs-repas/{desigs_id}', [TarifRepasController::class, 'updateDesiTarif']);
Route::delete('/desigs-repas/{desigs_id}', [TarifRepasController::class, 'supprimerDesiTarif']);

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
Route::get('/desigs-reduction/{desigs_id}', [TarifReductionController::class, 'afficherDesiTarif']);
Route::put('/desigs-reduction/{desigs_id}', [TarifReductionController::class, 'updateDesiTarif']);
Route::delete('/desigs-reduction/{desigs_id}', [TarifReductionController::class, 'supprimerDesiTarif']);

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
    Route::apiResource('equipements', EquipementController::class);
    Route::get('/equipements/stats', [EquipementController::class, 'stats']);
    Route::get('/equipements/categories', [EquipementController::class, 'categories']);

// EtatChambre routes
Route::get('/etat-chambre', [EtatChambreController::class, 'index']);
Route::post('/etat-chambre', [EtatChambreController::class, 'store']);
Route::get('/etat-chambre/{num_chambre}', [EtatChambreController::class, 'show']);
Route::put('/etat-chambre/{num_chambre}', [EtatChambreController::class, 'update']);
Route::delete('/etat-chambre/{num_chambre}', [EtatChambreController::class, 'destroy']);
Route::get('/etat-chambre/chambres-with-etat', [EtatChambreController::class, 'getChambresWithEtat']);
Route::get('/maintenance-types', [MaintenanceTypeController::class, 'index']);

// Remove the old reclamation routes and add the new grouped ones
Route::prefix('reclamations')->group(function () {
    Route::post('/', [ReclamationController::class, 'create']);
    Route::get('/', [ReclamationController::class, 'index']);
    Route::put('/{id}', [ReclamationController::class, 'update']);
    Route::delete('/{id}', [ReclamationController::class, 'destroy']);

    // Routes for departments
    Route::get('/departements', [ReclamationController::class, 'getDepartments']);
    Route::post('/departements', [ReclamationController::class, 'addDepartment']);
    Route::put('/departements/{id}', [ReclamationController::class, 'updateDepartment']);
    Route::delete('/departements/{id}', [ReclamationController::class, 'deleteDepartment']);
});


//Routes for Reservation
Route::get('/reservations', [ReservationController::class, 'getAll']); 
Route::post('/reservations', [ReservationController::class, 'ajouterReservation']); 
Route::get('/reservations/{reservation_number}', [ReservationController::class, 'afficherReservation']); 
//Route::put('/reservations/{reservation_number}', [ReservationController::class, 'updateReservation']); 
//Route::delete('/reservations/{reservation_number}', [ReservationController::class, 'supprimerReservation']);
Route::get('/available-rooms', [ReservationController::class, 'getAvailableRooms']);
Route::get('/reservations', [ReservationController::class, 'getReservationsByDateRange']);
Route::get('/reservations', [ReservationController::class, 'getAll']);
Route::post('/reservations', [ReservationController::class, 'ajouterReservation']);
//Route::put('/reservations/{id}', [ReservationController::class, 'updateReservation']);
Route::delete('/reservations/{id}', [ReservationController::class, 'supprimerReservation']);
Route::post('/reservations/calculate-tarif', [ReservationController::class, 'calculateTarif']);
//Route::delete('reservations/{reservation_num}', [ReservationController::class, 'destroy']);

// routes/api.php
Route::put('/reservations/{reservation_num}', [ReservationController::class, 'update']);
