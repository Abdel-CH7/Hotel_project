<?php

use App\Http\Controllers\AgentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AutorisationController;
use App\Http\Controllers\Bon_EntreController;
use App\Http\Controllers\Bon_SourtieController;
use App\Http\Controllers\BonCommandeController;
use App\Http\Controllers\BonLivraisonController;
use App\Http\Controllers\CalibreController;
use App\Http\Controllers\CasseController;
use App\Http\Controllers\CategorieController;
use App\Http\Controllers\ChargementCommandeController;
use App\Http\Controllers\ChiffreAffaireController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\ComptesController;
use App\Http\Controllers\ContactClientController;
use App\Http\Controllers\DevisController;
use App\Http\Controllers\EncaissementController;
use App\Http\Controllers\EntrerBanqueController;
use App\Http\Controllers\EtatRecouvrementController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\FichierDactualiteController;
use App\Http\Controllers\FournisseurController;
use App\Http\Controllers\ligne_Bon_EntreController;
use App\Http\Controllers\Ligne_Bon_SourtieController;
use App\Http\Controllers\LigneBonCommandeController;
use App\Http\Controllers\LigneBonEntreUniteController;
use App\Http\Controllers\LigneBonSortieUniteController;
use App\Http\Controllers\LigneCommandeController;
use App\Http\Controllers\LigneDevisController;
use App\Http\Controllers\LigneencaissementController;
use App\Http\Controllers\LigneentrercompteController;
use App\Http\Controllers\LigneFactureController;
use App\Http\Controllers\LigneLivraisonController;
use App\Http\Controllers\LivraisonController;
use App\Http\Controllers\LivreurController;
use App\Http\Controllers\ModePaimantController;
use App\Http\Controllers\ObjectifController;
use App\Http\Controllers\OeuffinisemifiniController;
use App\Http\Controllers\PermisController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PreparationCommandeController;
use App\Http\Controllers\PreparationLigneCommandeController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\ReclamationController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SecteurClientController;
use App\Http\Controllers\SiteClientController;
use App\Http\Controllers\StatusCommandeController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\StockMagasinController;
use App\Http\Controllers\StockProductionController;
use App\Http\Controllers\VehiculeController;
use App\Http\Controllers\VehiculeLivreurController;
use App\Http\Controllers\VilleController;
use App\Http\Controllers\VisiteController;
use App\Http\Controllers\ZoneController;
use App\Models\Role;
use Brick\Math\Exception\NegativeNumberException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Mee
use App\Http\Controllers\EquipementController;
use App\Http\Controllers\InterventionController;

Route::middleware(['auth:sanctum'])->group(function () {

  Route::get('/chambres', [ChambreController::class, 'index']);
  Route::post('/chambres', [ChambreController::class, 'store']);
});



//yassin
use App\Http\Controllers\OffreController;
use App\Http\Controllers\OffreDetailController;

use App\Http\Controllers\GroupeClientController; //new

use App\Http\Controllers\ClientGroupeClientController;  //new
use App\Http\Controllers\NomberGController;
use App\Http\Controllers\OffreGroupeController;  //new
use App\Http\Controllers\RepresantantController;
use App\Models\Bon_Sourtie;
use App\Models\ligneBonEntreUnite;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });
// Public routes (No authentication required)
Route::post("/login", [AuthController::class, 'login']);
Route::post("/logout", [AuthController::class, 'logout']);

// Protected routes (Require authentication)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post("/register", [AuthController::class, 'register']);
    Route::get("/user", [AuthController::class, 'user']);

    // Example: Protected API Routes
    Route::get('produits', [ProduitController::class, 'index']);
    Route::get('produits/{produit}', [ProduitController::class, 'show']);
});

    //logout
     Route::post("/logout", [AuthController::class, 'logout']);

     Route::post('/produit/{id}/update-logo', [ProduitController::class, 'updateLogo']);
     Route::post('client/{id}/update-logo', [ClientController::class, 'updateLogo']); // Add middleware as necessary
     Route::post('Siteclient/{id}/update-logo', [SiteClientController::class, 'updateLogo']); // Add middleware as necessary
     Route::post('fournisseur/{id}/update-logo', [FournisseurController::class, 'updateLogo']); // Add middleware as necessary



Route::get('/equipements', [EquipementController::class, 'index']);
Route::post('/equipements', [EquipementController::class, 'store']);
Route::get('/equipements/{id}', [EquipementController::class, 'show']);
Route::put('/equipements/{id}', [EquipementController::class, 'update']);
Route::delete('/equipements/{id}', [EquipementController::class, 'destroy']);
Route::get('/interventions', [InterventionController::class, 'index']);
Route::post('/interventions', [InterventionController::class, 'store']);
Route::get('/interventions/{id}', [InterventionController::class, 'show']);
Route::put('/interventions/{id}', [InterventionController::class, 'update']);
Route::delete('/interventions/{id}', [InterventionController::class, 'destroy']);




Route::middleware('auth:sanctum')->group(function () {
    Route::post("/register", [AuthController::class, 'register']);
    Route::get("/user", [AuthController::class, 'user']);

    //produits
    Route::get('produits', [ProduitController::class, 'index']);
    Route::get('produits/{produit}', [ProduitController::class, 'show']);
    Route::put('produits/{produit}', [ProduitController::class, 'update']);
    Route::delete('produits/{produit}', [ProduitController::class, 'destroy']);
    Route::post('produits', [ProduitController::class, 'store']);

    // Fournisseurs
    Route::get('getAllDataFournisseur', [FournisseurController::class, 'getAllDataFournisseur']);
    Route::post('fournisseurs', [FournisseurController::class, 'store']);
    Route::get('fournisseurs/{fournisseur}', [FournisseurController::class, 'show']);
    Route::put('fournisseurs/{fournisseur}', [FournisseurController::class, 'update']);
    Route::delete('fournisseurs/{fournisseur}', [FournisseurController::class, 'destroy']);



    //user
    Route::get('/users/{id}/edit', [AuthController::class, 'edit']);
    Route::put('/users/{id}',  [AuthController::class, 'update']);
    Route::delete('/users/{id}',   [AuthController::class, 'destroy']);
    Route::get('/users', [AuthController::class, 'index']);



    Route::apiResource('/roles', RoleController::class);
    Route::apiResource('/categories', CategorieController::class);

    //zone
    Route::get('zones', [ZoneController::class, 'index']);
    Route::post('zones', [ZoneController::class, 'store']);
    Route::get('zones/{zone}', [ZoneController::class, 'show']);
    Route::put('zones/{zone}', [ZoneController::class, 'update']);
    Route::delete('zones/{zone}', [ZoneController::class, 'destroy']);

    Route::get('/objectifs', [ObjectifController::class, 'index']);
    Route::post('/objectifs', [ObjectifController::class, 'store']);
    Route::get('/objectifs/{id}', [ObjectifController::class, 'show']);
    Route::put('/objectifs/{id}', [ObjectifController::class, 'update']);
    Route::delete('/objectifs/{id}', [ObjectifController::class, 'destroy']);


    // Routes pour Livreurs
    Route::get('/livreurs', [LivreurController::class, 'index']);
    Route::post('/livreurs', [LivreurController::class, 'store']);
    Route::get('/livreurs/{id}', [LivreurController::class, 'show']);
    Route::put('/livreurs/{id}', [LivreurController::class, 'update']);
    Route::delete('/livreurs/{id}', [LivreurController::class, 'destroy']);


    // Routes pour Vehicules
    Route::get('/vehicules', [VehiculeController::class, 'index']);
    Route::post('/vehicules', [VehiculeController::class, 'store']);
    Route::get('/vehicules/{id}', [VehiculeController::class, 'show']);
    Route::put('/vehicules/{id}', [VehiculeController::class, 'update']);
    Route::delete('/vehicules/{id}', [VehiculeController::class, 'destroy']);

    Route::get('/vehicule-livreurs', [VehiculeLivreurController::class, 'index']);
    Route::post('/vehicule-livreurs', [VehiculeLivreurController::class, 'store']);
    Route::get('/vehicule-livreurs/{id}', [VehiculeLivreurController::class, 'show']);
    Route::put('/vehicule-livreurs/{id}', [VehiculeLivreurController::class, 'update']);
    Route::delete('/vehicule-livreurs/{id}', [VehiculeLivreurController::class, 'destroy']);


    // Définition des routes pour les site clients
    Route::get('siteclients', [SiteClientController::class, 'index']); // Route pour obtenir tous les site clients
    Route::get('siteclients/{siteclient}', [SiteClientController::class, 'show']);
    Route::put('siteclients/{siteclient}', [SiteClientController::class, 'update']);
    Route::post('siteclients', [SiteClientController::class, 'store']);
    Route::delete('siteclients/{siteclient}', [SiteClientController::class, 'destroy']);
    // Route pour obtenir les site clients associés à un client spécifique
    Route::get('clients/{clientId}/siteclients', [ClientController::class, 'siteclients']);

    Route::get('clients/{clientId}/bonslivraison', [ClientController::class, 'bonsLivraisonClient']);

    Route::apiResource('/devises', DevisController::class);
    Route::apiResource('/lignedevis', LigneDevisController::class);
    // Route pour obtenir les lignedevis associés à un devis spécifique
    Route::get('devises/{devisId}/lignedevis', [DevisController::class, 'lignedevis']);
    //Factures
    Route::apiResource('/factures', FactureController::class);
    Route::apiResource('/lignefactures', LigneFactureController::class);
    //stock
    Route::get('stock', [StockController::class, 'index']);
    Route::post('stock', [StockController::class, 'store']);
    Route::get('stock/{stock}', [StockController::class, 'show']);
    Route::put('stock/{stock}', [StockController::class, 'update']);
    Route::delete('stock/{stck}', [StockController::class, 'destroy']);
    //permis
    Route::get('/permis', [PermisController::class, 'index']);
    Route::post('/permis', [PermisController::class, 'store']);
    Route::get('/permis/{id}', [PermisController::class, 'show']);
    Route::put('/permis/{id}', [PermisController::class, 'update']);
    Route::delete('/permis/{id}', [PermisController::class, 'destroy']);
    //Calibre
    Route::apiResource('/calibres', CalibreController::class);


    //region
    Route::get('regions', [RegionController::class, 'index']);
    Route::post('regions', [RegionController::class, 'store']);
    Route::get('regions/{region}', [RegionController::class, 'show']);
    Route::put('regions/{region}', [RegionController::class, 'update']);
    Route::delete('regions/{region}', [RegionController::class, 'destroy']);

    //clients
    Route::get('clients', [ClientController::class, 'index']);
    Route::post('clients', [ClientController::class, 'store']);
    Route::get('clients/{client}', [ClientController::class, 'show']);
    Route::put('clients/{client}', [ClientController::class, 'update']);
    Route::delete('clients/{client}', [ClientController::class, 'destroy']);
    Route::get('DachbordeData', [ClientController::class, 'getAllDataDachborde']);

      //Commandes
      Route::get('commandes', [CommandeController::class, 'index']);
      Route::post('commandes', [CommandeController::class, 'store']);
      Route::get('commandes/{commande}', [CommandeController::class, 'show']);
      Route::put('commandes/{commande}', [CommandeController::class, 'update']);
      Route::delete('commandes/{commande}', [CommandeController::class, 'destroy']);
      Route::delete('commandesId/{commande}', [PreparationCommandeController::class, 'destroyCommandeId']);

      Route::get('/clients/{clientId}/commandes', [CommandeController::class, 'getOrdersByClientId']);
      Route::get('/getAllDataComande', [CommandeController::class, 'getAllDataComande']);

      Route::apiResource('/chargementCommandes', ChargementCommandeController::class);
      Route::get('chargementCommandes/{commandeId}/commandes', [ChargementCommandeController::class, 'getByCommandeId']);
      Route::get('getAllDataChargement', [ChargementCommandeController::class, 'getAllDataChargemant']);

      Route::apiResource('/ligneCommandes', LigneCommandeController::class);
      Route::apiResource('/statusCommande', StatusCommandeController::class);
      Route::apiResource('/statusCommande', StatusCommandeController::class);
      Route::apiResource('/lignePreparationCommandes', PreparationLigneCommandeController::class);
      Route::apiResource('/PreparationCommandes', PreparationCommandeController::class);
      Route::get('PreparationCommandes/{preparationCommande}/lignePreparationCommandes', [PreparationCommandeController::class, 'getLignesPreparationByPreparation']);
      Route::apiResource('/livraisons', BonLivraisonController::class);

      //autorisation onsa
      Route::apiResource('/autorisation', AutorisationController::class);
      Route::apiResource('/vis/store', VisiteController::class);
      Route::apiResource('/oeuffinisemifini', OeuffinisemifiniController::class);
      Route::apiResource('/oeufcasses', CasseController::class);
//les api de amine
Route::get('/chiffre-affaire', [ChiffreAffaireController::class, 'index']);
Route::post('/chiffre-affaire', [ChiffreAffaireController::class, 'store']);
Route::get('/chiffre-affaire/{id}', [ChiffreAffaireController::class, 'show']);
Route::put('/chiffre-affaire/{id}', [ChiffreAffaireController::class, 'update']);
Route::delete('/chiffre-affaire/{id}', [ChiffreAffaireController::class, 'destroy']);
Route::get('/chiffre-affaire', [ChiffreAffaireController::class, 'getAllDataChefreDaffer']);


Route::apiResource('/devises', DevisController::class);
Route::apiResource('/ligneDevis', LigneDevisController::class);
Route::get('/getAllDataDevisAchat', [DevisController::class, 'getAllDataAchat']);
Route::get('/getAllDataDevisVante', [DevisController::class, 'getAllDataVante']);


// Route pour obtenir les lignedevis associés à un devis spécifique
Route::get('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
Route::post('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
Route::put('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
Route::delete('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
Route::post('/devis-combinee', [DevisController::class, 'createCombinedDevis']);


//Ligneentrercompte
Route::apiResource('/ligneentrercompte',LigneentrercompteController::class);
//Route for EntrerBanque
Route::get('/banques', [EntrerBanqueController::class, 'index']);
Route::get('/AllDataBonque', [EntrerBanqueController::class, 'getAllDataBonque']);

Route::post('/banques', [EntrerBanqueController::class, 'store']);
Route::get('/banques/{id}', [EntrerBanqueController::class, 'show']);
Route::put('/banques/{id}', [EntrerBanqueController::class, 'update']);
Route::delete('/banques/{id}', [EntrerBanqueController::class, 'destroy']);
Route::apiResource('/etat-recouvrements', EtatRecouvrementController::class,);

Route::get('/reclamations', [ReclamationController::class, 'index']);
Route::post('/reclamations', [ReclamationController::class, 'store']);
Route::get('/reclamations/{id}', [ReclamationController::class, 'show']);
Route::put('/reclamations/{id}', [ReclamationController::class, 'update']);
Route::delete('/reclamations/{id}', [ReclamationController::class, 'destroy']);

Route::apiResource('/encaissements', EncaissementController::class,);


Route::apiResource('/ligneencaissement', LigneencaissementController::class,);

//compte
Route::apiResource('/comptes', ComptesController::class,);
//Factures
Route::apiResource('/factures', FactureController::class);
Route::get('/getAllDataFactureAchat', [FactureController::class, 'getAllDataAchat']);
Route::get('/getAllDataFactureVente', [FactureController::class, 'getAllDataVante']);

Route::apiResource('/ligneFacture', LigneFactureController::class);
// Route pour obtenir les lignedevis associés à un devis spécifique
Route::get('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
Route::post('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
Route::put('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
Route::delete('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
Route::post('/facture-combinee', [FactureController::class, 'createCombinedFacture']);


//bon livresan
Route::apiResource('/livraisons', BonLivraisonController::class);
Route::apiResource('/lignelivraisons', LigneLivraisonController::class);
// Route pour obtenir les lignedevis associés à un devis spécifique
Route::get('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
Route::post('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
Route::put('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
Route::delete('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
Route::get('/getAllDataBonLIvraisanAchat', [BonLivraisonController::class, 'getAllDataBonLIvraisanAchat']);
Route::get('/getAllDataBonLIvraisanVante', [BonLivraisonController::class, 'getAllDataBonLIvraisanVente']);
Route::post('/BL-combinee', [BonLivraisonController::class, 'createCombinedBL']);

//api agent
Route::apiResource('/agents',AgentController::class);

//stock magasin
Route::apiResource('stock_magasin', StockMagasinController::class);
//stock Production
Route::apiResource('stock_production', StockProductionController::class);

//bon Entre
Route::apiResource('/bonEntre', Bon_EntreController::class);
Route::apiResource('/ligneBonEntre', ligne_Bon_EntreController::class);
Route::get('/getAllDataBonEntre', [Bon_EntreController::class, 'getAllDataBonEntre']);
Route::apiResource('ligneBonEntreUnite', LigneBonEntreUniteController::class);

//Bon Sortie
Route::apiResource('/BonSortie', Bon_SourtieController::class);
Route::apiResource('/LigneBonSortie', Ligne_Bon_SourtieController::class);
Route::get('/getAllDataBonSortie', [Bon_SourtieController::class, 'getAllDataBonSortie']);
Route::apiResource('ligne-bon-sortie-unites', LigneBonSortieUniteController::class);
Route::get('/bon-sortie-unites', [Bon_SourtieController::class , 'getAllDataBonSortieUnit']);




//yassin
//offers goup  client

Route::get('/groupes', [GroupeClientController::class, 'index']);
Route::post('/groupes', [GroupeClientController::class, 'store']);
Route::get('/groupes/{Id_groupe}', [GroupeClientController::class, 'show']);
Route::put('/groupes/{Id_groupe}', [GroupeClientController::class, 'update']);
Route::delete('/groupes/{Id_groupe}', [GroupeClientController::class, 'destroy']);

Route::get('/client-groupe-relations', [GroupeClientController::class, 'getRelations']);
Route::get('/clients-groupe', [ClientGroupeClientController::class, 'index']);
Route::post('/clients-groupe', [ClientGroupeClientController::class, 'store']);
Route::get('/clients-groupe/{id}', [ClientGroupeClientController::class, 'show']);
Route::put('/clients-groupe/{id}', [ClientGroupeClientController::class, 'update']);
Route::delete('/clients-groupe/{id}', [ClientGroupeClientController::class, 'destroy']);
Route::delete('/clients-groupe/{id}', [ClientGroupeClientController::class, 'removeClientFromGroup']);


Route::get('/offres-groupe', [OffreGroupeController::class, 'index']);
Route::post('/offres-groupe', [OffreGroupeController::class, 'store']);
Route::get('/offres-groupe/{id}', [OffreGroupeController::class, 'show']);
Route::put('/offres-groupe/{id}', [OffreGroupeController::class, 'update']);
Route::delete('/offres-groupe/{id}', [OffreGroupeController::class, 'destroy']);
Route::delete('/offres-groupe/{id}', [OffreGroupeController::class, 'removeOffreFromGroup']);
Route::put('offres/{id}/update-groupes', [OffreController::class, 'updateGroupes']);
Route::put('/offres/{id}/update-groupes', [OffreController::class, 'updateGroupes']);
Route::apiResource('/offres', OffreController::class);
// Resource routes for OffreDetailController
Route::apiResource('/offre_details', OffreDetailController::class);
// Route to get OffreDetails associated with a specific Offre
Route::get('offres/{offreId}/offre_details', [OffreController::class, 'offreDetails']);
//Contact client
Route::post('/contactClient', [ContactClientController::class, 'store']);
Route::put('/contactClient', [ContactClientController::class, 'update']);
Route::delete('/contactClient/{id}', [ContactClientController::class, 'destroy']);
//fichier d actualite
Route::get('/FicheDactulate', [FichierDactualiteController::class, 'getLatestCommandeAndPreparation']);
//livraison
Route::apiResource('livraisonsomande', LivraisonController::class);
//ligneBonEntreUnite
//secteurClinet
Route::apiResource('secteur_clients', SecteurClientController::class);
//all data of client
Route::get('all-data-client', [ClientController::class, 'getAllData']);
//Represantant
Route::apiResource('representant', RepresantantController::class);

//mode de paimant
Route::apiResource('mode-paimants', ModePaimantController::class);
//ville api
Route::apiResource('/villes', VilleController::class);          // Get all villes
//numbre de generet
Route::apiResource('/numbreG',NomberGController::class);
//bonCommand
Route::apiResource('bons_commande', BonCommandeController::class);
Route::apiResource('ligne_bon_commande', LigneBonCommandeController::class);
Route::get('/getAllDataBonCommandeAchat', [BonCommandeController::class, 'getAllDataAchat']);
Route::get('/getAllDataBonCommandeVante', [BonCommandeController::class, 'getAllDataVante']);
Route::post('/bc-combinee', [BonCommandeController::class, 'createCombinedBoncommande']);

// mes api

// Route::get('/equipements', [EquipementController::class, 'index']);
// Route::post('/equipements', [EquipementController::class, 'store']);
// Route::get('/equipements/{id}', [EquipementController::class, 'show']);
// Route::put('/equipements/{id}', [EquipementController::class, 'update']);
// Route::delete('/equipements/{id}', [EquipementController::class, 'destroy']);


});
