import React, { useState, useEffect } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/system";
import Navigation from "../Acceuil/Navigation";
import { Toolbar } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faFilePdf,
  faPrint,
  faPlus,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";

const BonLivraisonInfo = () => {
  const [bonLivraison, setBonLivraison] = useState([]);
  const [clients, setClients] = useState([]);
  const [siteclients, setSiteclients] = useState([]);
  const [commandes, setCommandes] = useState([]);

  const { clientId } = useParams();
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  useEffect(() => {
    const fetchBonLivraison = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/clients/${clientId}/bonslivraison`
        );
        setBonLivraison(response.data.bonsLivraison);
        console.log(response.data.bonsLivraison);
        const clientResponse = await axios.get(
          "http://localhost:8000/api/clients"
        );
        setClients(clientResponse.data.client);
        const SiteclientResponse = await axios.get(
          "http://localhost:8000/api/siteclients"
        );

        setSiteclients(SiteclientResponse.data.siteclient);
        console.log("API Response:", SiteclientResponse.data);
        const commandeResponse = await axios.get(
          "http://localhost:8000/api/commandes"
        );
        setCommandes(commandeResponse.data.commandes);
        console.log("COMMANDE:", commandeResponse.data);
      } catch (error) {
        console.error("Error fetching bon de livraison:", error);
      }
    };

    fetchBonLivraison();
  }, [clientId]);

  const getSiteClientInfo = (siteId) => {
    return siteId ? siteclients.find((site) => site.id === siteId) : null;
  };

  // const handlePrint = async (livraisonId) => {
  //   const selectedLivraison = bonLivraison.find(
  //     (livraison) => livraison.id === livraisonId
  //   );

  //   if (selectedLivraison && selectedLivraison.client_id) {
  //     try {
  //       const clientResponse = await axios.get(
  //         `http://localhost:8000/api/clients/${selectedLivraison.client_id}`
  //       );

  //       if (clientResponse.data) {
  //         const clientInfo = clientResponse.data;

  //         const chargementCommandeResponse = await axios.get(
  //           `http://localhost:8000/api/chargementCommandes/${selectedLivraison.commande_id}/commandes`
  //         );

  //         if (chargementCommandeResponse.data) {
  //           const chargementCommandeInfo =
  //             chargementCommandeResponse.data.chargementCommandes[0];
  //           let clientOrSiteClientInfo;
  //           if (selectedLivraison.commande.site_id) {
  //             const siteClientResponse = await axios.get(
  //               `http://localhost:8000/api/siteclients/${selectedLivraison.commande.site_id}`
  //             );

  //             if (siteClientResponse.data) {
  //               clientOrSiteClientInfo = siteClientResponse.data.siteclient;
  //             }
  //           } else {
  //             clientOrSiteClientInfo = clientInfo.client;
  //           }
  //           const preparationResponse = await axios.get(
  //             `http://localhost:8000/api/lignePreparationCommandes/${selectedLivraison.commande_id}`
  //           );
  //           // console.log(preparationResponse);
  //           if (preparationResponse.data) {
  //             const preparationCommandeInfo = preparationResponse.data.lignePreparationCommandes;
  //             const doc = new jsPDF();
  //             let startY = 20;

  //             // Styles
  //             const margin = 10;

  //             // Client details table
  //             const clientDetails = [
  //               {
  //                 label: "Raison sociale Client:",
  //                 value: clientInfo.client.raison_sociale,
  //               },
  //               {
  //                 label: "Raison sociale:",
  //                 value: clientOrSiteClientInfo.raison_sociale,
  //               },
  //               { label: "Adresse:", value: clientOrSiteClientInfo.adresse },
  //               { label: "Téléphone:", value: clientOrSiteClientInfo.tele },
  //               { label: "Ville:", value: clientOrSiteClientInfo.ville },
  //             ];
  //             doc.setFontSize(10);
  //             clientDetails.forEach((info, index) => {
  //               doc.text(`${info.label}`, 10, startY + index * 10);
  //               doc.text(`${info.value}`, 80, startY + index * 10);
  //             });

  //             // Add margin
  //             startY += clientDetails.length * 10 + margin;
  //             // Chargement commande details table
  //             const chargementCommandeDetails = [
  //               {
  //                 label: "Véhicule:",
  //                 value: `${chargementCommandeInfo.vehicule.marque} ${chargementCommandeInfo.vehicule.matricule}`,
  //               },
  //               {
  //                 label: "Livreur:",
  //                 value: `${chargementCommandeInfo.livreur.prenom} ${chargementCommandeInfo.livreur.nom}`,
  //               },
  //               {
  //                 label: "Date de livraison prévue:",
  //                 value: chargementCommandeInfo.dateLivraisonPrevue,
  //               },
  //               {
  //                 label: "Date de livraison réelle:",
  //                 value: chargementCommandeInfo.dateLivraisonReelle,
  //               },
  //             ];
  //             const headersChargementCommande = [
  //               "Véhicule",
  //               "Livreur",
  //               "Date de livraison prévue",
  //               "Date de livraison réelle",
  //             ];
  //             const rowsChargementCommande = [
  //               chargementCommandeDetails.map((info) => info.value),
  //             ];

  //             doc.autoTable({
  //               head: [headersChargementCommande],
  //               body: rowsChargementCommande,
  //               startY: startY + 20,
  //               margin: { top: margin },
  //               styles: { lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 8 },
  //               columnStyles: {
  //                 0: { cellWidth: 40 },
  //                 1: { cellWidth: 60 },
  //                 2: { cellWidth: 20 },
  //                 3: { cellWidth: 40 },
  //               },
  //             });

  //             startY += chargementCommandeDetails.length * 10 + margin;
  //             // Livraison details table
  //             const livraisonInfo = [
  //               { label: "Référence:", value: selectedLivraison.reference },
  //               { label: "Date:", value: selectedLivraison.date },
  //               {
  //                 label: "Référence BC:",
  //                 value: selectedLivraison.commande.reference,
  //               },
  //             ];
  //             const headersLivraison = ["Référence BL", "Date", "Référence BC"];
  //             const rowsLivraison = [livraisonInfo.map((info) => info.value)];

  //             doc.autoTable({
  //               head: [headersLivraison],
  //               body: rowsLivraison,
  //               startY: startY + 20,
  //               margin: { top: margin },
  //               styles: { lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 8 },
  //               columnStyles: {
  //                 0: { cellWidth: 40 },
  //                 1: { cellWidth: 60 },
  //                 2: { cellWidth: 20 },
  //               },
  //             });

  //             // Add margin
  //             startY += livraisonInfo.length * 10 + margin;
  //             // startY += chargementCommandeDetails.length * 10 + margin;
  //             if (preparationCommandeInfo.length > 0) {
  //               const preparationCommandeDetails = preparationCommandeInfo.map(preparation => ({
  //                   label: "Produit:",
  //                   value: preparation.produit_id,
  //               }));
  //               preparationCommandeInfo.forEach(preparation => {
  //                   preparationCommandeDetails.push(
  //                       { label: "Produit:", value: preparation.produit_id },
  //                       { label: "prix_unitaire:", value: preparation.prix_unitaire },
  //                       { label: "Lot:", value: preparation.lot },
  //                       { label: "quantite:", value: preparation.quantite }
  //                   );
  //               });

  //               const headersPreparationCommande = [
  //                   "Produit",
  //                   "prix_unitaire",
  //                   "Lot",
  //                   "quantite",
  //               ];

  //               const rowsPreparationCommande = preparationCommandeDetails.map(info => [info.value]);

  //               doc.autoTable({
  //                   head: [headersPreparationCommande],
  //                   body: rowsPreparationCommande,
  //                   startY: startY + 20,
  //                   margin: { top: margin },
  //                   styles: { lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 8 },
  //                   columnStyles: {
  //                       0: { cellWidth: 40 },
  //                       1: { cellWidth: 60 },
  //                       2: { cellWidth: 20 },
  //                       3: { cellWidth: 40 },
  //                   },
  //               });
  //             } else {
  //               console.log(
  //                 "Aucune information de préparation de commande disponible.",
  //                 10
  //               );
  //             }

  //             // startY += chargementCommandeInfo.length * 10 + margin;
  //             // Prepration details table

  //             // Save PDF
  //             doc.save("bonlivraison.pdf");
  //           } else {
  //             console.error(
  //               "Impossible de récupérer les informations de chargement de commande."
  //             );
  //           }
  //         } else {
  //           console.error(
  //             "Impossible de récupérer les informations sur le client."
  //           );
  //         }
  //       }
  //     } catch (error) {
  //       console.error(
  //         "Erreur lors de la récupération des informations :",
  //         error
  //       );
  //     }
  //   } else {
  //     console.error("ID du client indisponible.");
  //   }
  // };

  // const handlePrint = async (livraisonId) => {
  //   const selectedLivraison = bonLivraison.find(
  //     (livraison) => livraison.id === livraisonId
  //   );

  //   if (selectedLivraison && selectedLivraison.client_id) {
  //     try {
  //       const clientResponse = await axios.get(
  //         `http://localhost:8000/api/clients/${selectedLivraison.client_id}`
  //       );

  //       if (clientResponse.data) {
  //         const clientInfo = clientResponse.data;

  //         const chargementCommandeResponse = await axios.get(
  //           `http://localhost:8000/api/chargementCommandes/${selectedLivraison.commande_id}/commandes`
  //         );

  //         if (chargementCommandeResponse.data) {
  //           const chargementCommandeInfo =
  //             chargementCommandeResponse.data.chargementCommandes[0];
  //           let clientOrSiteClientInfo;
  //           if (selectedLivraison.commande.site_id) {
  //             const siteClientResponse = await axios.get(
  //               `http://localhost:8000/api/siteclients/${selectedLivraison.commande.site_id}`
  //             );

  //             if (siteClientResponse.data) {
  //               clientOrSiteClientInfo = siteClientResponse.data.siteclient;
  //             }
  //           } else {
  //             clientOrSiteClientInfo = clientInfo.client;
  //           }
  //           const preparationResponse = await axios.get(
  //             `http://localhost:8000/api/lignePreparationCommandes/${selectedLivraison.commande_id}`
  //           );
  //           if (preparationResponse.data) {
  //             const preparationCommandeInfo =
  //               preparationResponse.data.lignePreparationCommandes;
  //             const doc = new jsPDF();
  //             let startY = 20;

  //             // Styles
  //             const margin = 10;

  //             // Client details table
  //             const clientDetails = [
  //               {
  //                 label: "Raison sociale Client:",
  //                 value: clientInfo.client.raison_sociale,
  //               },
  //               {
  //                 label: "Raison sociale:",
  //                 value: clientOrSiteClientInfo.raison_sociale,
  //               },
  //               { label: "Adresse:", value: clientOrSiteClientInfo.adresse },
  //               { label: "Téléphone:", value: clientOrSiteClientInfo.tele },
  //               { label: "Ville:", value: clientOrSiteClientInfo.ville },
  //             ];
  //             doc.setFontSize(10);
  //             clientDetails.forEach((info, index) => {
  //               doc.text(`${info.label}`, 10, startY + index * 10);
  //               doc.text(`${info.value}`, 80, startY + index * 10);
  //             });

  //             // Add margin
  //             startY += clientDetails.length * 10 + margin;

  //             // Chargement commande details table
  //             const chargementCommandeDetails = [
  //               {
  //                 label: "Véhicule:",
  //                 value: `${chargementCommandeInfo.vehicule.marque} ${chargementCommandeInfo.vehicule.matricule}`,
  //               },
  //               {
  //                 label: "Livreur:",
  //                 value: `${chargementCommandeInfo.livreur.prenom} ${chargementCommandeInfo.livreur.nom}`,
  //               },
  //               {
  //                 label: "Date de livraison prévue:",
  //                 value: chargementCommandeInfo.dateLivraisonPrevue,
  //               },
  //               {
  //                 label: "Date de livraison réelle:",
  //                 value: chargementCommandeInfo.dateLivraisonReelle,
  //               },
  //             ];

  //             const headersChargementCommande = [
  //               "Véhicule",
  //               "Livreur",
  //               "Date de livraison prévue",
  //               "Date de livraison réelle",
  //             ];

  //             if (chargementCommandeDetails.length > 0) {
  //               const rowsChargementCommande = [
  //                 chargementCommandeDetails.map((info) => info.value),
  //               ];
  //               doc.autoTable({
  //                 head: [headersChargementCommande],
  //                 body: rowsChargementCommande,
  //                 startY: startY + 20,
  //                 margin: { top: margin },
  //                 styles: { lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 8 },
  //                 columnStyles: {
  //                   0: { cellWidth: 40 },
  //                   1: { cellWidth: 60 },
  //                   2: { cellWidth: 20 },
  //                   3: { cellWidth: 40 },
  //                 },
  //               });
  //             } else {
  //               console.log("Aucune donnée disponible pour afficher le tableau.");
  //             }

  //             startY += chargementCommandeDetails.length * 10 + margin;

  //             // Livraison details table
  //             const livraisonInfo = [
  //               { label: "Référence:", value: selectedLivraison.reference },
  //               { label: "Date:", value: selectedLivraison.date },
  //               {
  //                 label: "Référence BC:",
  //                 value: selectedLivraison.commande.reference,
  //               },
  //             ];
  //             const headersLivraison = ["Référence BL", "Date", "Référence BC"];
  //             const rowsLivraison = [livraisonInfo.map((info) => info.value)];

  //             doc.autoTable({
  //               head: [headersLivraison],
  //               body: rowsLivraison,
  //               startY: startY + 20,
  //               margin: { top: margin },
  //               styles: { lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 8 },
  //               columnStyles: {
  //                 0: { cellWidth: 40 },
  //                 1: { cellWidth: 60 },
  //                 2: { cellWidth: 20 },
  //               },
  //             });

  //             // Add margin
  //             startY += livraisonInfo.length * 10 + margin;

  //             if (preparationCommandeInfo.length > 0) {
  //               const rowsPreparationCommande = preparationCommandeInfo.map(
  //                 async (preparation) => {
  //                   // Ajoutez une requête pour récupérer les informations du produit
  //                   const productResponse = await axios.get(
  //                     `http://localhost:8000/api/produits/${preparation.produit_id}`
  //                   );
  //                   console.log(productResponse.data)
  //                   if (productResponse.data) {
  //                     const productInfo = productResponse.data;
  //                     return [
  //                       productInfo.produit.Code_produit,
  //                       productInfo.produit.designation,
  //                       productInfo.produit.calibre.calibre,
  //                       preparation.prix_unitaire,
  //                       preparation.lot,
  //                       preparation.quantite,
  //                     ];
  //                   }
  //                 }
  //               );

  //               const headersPreparationCommande = [
  //                 "Code Produit",
  //                 "Designation",
  //                 "Calibre",
  //                 "Prix unitaire",
  //                 "Lot",
  //                 "Quantite",
  //               ];

  //               // Attendre que toutes les requêtes axios soient terminées
  //               const resolvedRows = await Promise.all(rowsPreparationCommande);

  //               doc.autoTable({
  //                 head: [headersPreparationCommande],
  //                 body: resolvedRows,
  //                 startY: startY + 20,
  //                 margin: { top: margin },
  //                 styles: { lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 8 },
  //                 columnStyles: {
  //                   0: { cellWidth: 25 },
  //                   1: { cellWidth: 25 },
  //                   2: { cellWidth: 25 },
  //                   3: { cellWidth: 25 },
  //                   4: { cellWidth: 25 },
  //                   5: { cellWidth: 25 },
  //                 },
  //               });
  //             } else {
  //               console.log(
  //                 "Aucune information de préparation de commande disponible."
  //               );
  //             }
  //             // Save PDF
  //             doc.save("bonlivraison.pdf");
  //           } else {
  //             console.error(
  //               "Impossible de récupérer les informations de préparation de commande."
  //             );
  //           }
  //         } else {
  //           console.error(
  //             "Impossible de récupérer les informations sur le chargement de commande."
  //           );
  //         }
  //       }
  //     } catch (error) {
  //       console.error(
  //         "Erreur lors de la récupération des informations :",
  //         error
  //       );
  //     }
  //   } else {
  //     console.error("ID du client indisponible.");
  //   }
  // };
  // const handlePrint = async (livraisonId) => {
  //   const selectedLivraison = bonLivraison.find(
  //     (livraison) => livraison.id === livraisonId
  //   );

  //   if (selectedLivraison && selectedLivraison.client_id) {
  //     try {
  //       const clientResponse = await axios.get(
  //         `http://localhost:8000/api/clients/${selectedLivraison.client_id}`
  //       );
  //       let clientInfo = {};

  //       if (clientResponse.data) {
  //         clientInfo = clientResponse.data;
  //       }

  //       const commandeResponse = await axios.get(
  //         `http://localhost:8000/api/commandes/${selectedLivraison.commande_id}`
  //       );
  //       let commandeInfo = {};

  //       if (commandeResponse.data) {
  //         commandeInfo = commandeResponse.data;
  //       }

  //       const produitsInfo = commandeInfo.commande.ligne_commandes.map((ligne) => ({
  //         produit_id: ligne.produit_id,
  //         quantite: ligne.quantite
  //     }));

  //       // Création du contenu HTML pour impression
  //       const printWindow = window.open("", "_blank", "");

  //       if (printWindow) {
  //         const newWindowDocument = printWindow.document;
  //         const title = `Bon de Livraison N° ${selectedLivraison.reference}`;

  //         // Début du contenu HTML
  //         newWindowDocument.write(`
  //                   <!DOCTYPE html>
  //                   <html lang="fr">
  //                   <head>
  //                       <meta charset="UTF-8">
  //                       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //                       <title>${title}</title>
  //                       <style>
  //                           body {
  //                               font-family: Arial, sans-serif;
  //                               margin: 20px;
  //                           }
  //                           .client-info {
  //                               float: right;
  //                               width: 50%;
  //                               border: 2px solid #000;
  //                               padding: 10px;
  //                               margin-left: 20px;
  //                           }
  //                           h1, h2 {
  //                               text-align: center;
  //                               margin-top: 30px;
  //                           }
  //                           table {
  //                               width: 100%;
  //                               border-collapse: collapse;
  //                               margin-top: 200px;
  //                           }
  //                           th, td {
  //                               border: 1px solid #000;
  //                               padding: 8px;
  //                               text-align: left;
  //                           }
  //                           .commande{
  //                             margin-top: 10px;
  //                           }
  //                       </style>
  //                   </head>
  //                   <body>
  //                       <div>
  //                           <h1>${title}</h1>
  //                       </div>
  //                       <div class="client-info">
  //                           <h2>Informations du Client :</h2>
  //                           <p style="text-align: center; font-weight: bold;">${
  //                             clientInfo.client.raison_sociale
  //                           }</p>
  //                           <p style="text-align: center; font-weight: bold;">${
  //                             clientInfo.client.adresse
  //                           }</p>
  //                           <p style="text-align: center; font-weight: bold;">${
  //                             clientInfo.client.tele
  //                           }</p>
  //                           <p style="text-align: center; font-weight: bold;">${
  //                             clientInfo.client.ice
  //                           }</p>
  //                       </div>

  //                       <div style="clear:both;"></div>
  //                       <h3>Détails de la livraison :</h3>
  //                       <table>
  //                           <thead>
  //                               <tr>
  //                                   <th>Référence BL</th>
  //                                   <th>Date</th>
  //                                   <th>Référence BC</th>
  //                               </tr>
  //                           </thead>
  //                           <tbody>
  //                               <tr>
  //                                   <td>${selectedLivraison.reference}</td>
  //                                   <td>${selectedLivraison.date}</td>
  //                                   <td>${
  //                                     selectedLivraison.commande.reference
  //                                   }</td>
  //                               </tr>
  //                           </tbody>
  //                       </table>
  //                       <table class="commande">
  //                           <thead>
  //                               <tr>
  //                                   <th>Désignation</th>
  //                                   <th>Quantité</th>

  //                               </tr>
  //                           </thead>
  //                           <tbody>
  //                               ${produitsInfo
  //                                 .map(
  //                                   (produit) => `
  //                                   <tr>
  //                                   <td>${produit.produit_id}</td>
  //                                       <td>${produit.quantite}</td>
  //                                   </tr>
  //                               `
  //                                 )
  //                                 .join("")}
  //                           </tbody>
  //                       </table>

  //                       <script>
  //                           setTimeout(() => {
  //                               window.print();
  //                               window.onafterprint = function () {
  //                                   window.close();
  //                               };
  //                           }, 1000);
  //                       </script>
  //                   </body>
  //                   </html>
  //               `);

  //         newWindowDocument.close();
  //       } else {
  //         console.error(
  //           "Erreur lors de l'ouverture de la fenêtre d'impression."
  //         );
  //       }
  //     } catch (error) {
  //       console.error(
  //         "Erreur lors de la récupération des informations :",
  //         error
  //       );
  //     }
  //   } else {
  //     console.error("ID du client indisponible.");
  //   }
  // };
  const handlePrint = async (livraisonId) => {
    const selectedLivraison = bonLivraison.find(
      (livraison) => livraison.id === livraisonId
    );

    if (selectedLivraison && selectedLivraison.client_id) {
      try {
        const clientResponse = await axios.get(
          `http://localhost:8000/api/clients/${selectedLivraison.client_id}`
        );
        let clientInfo = {};

        if (clientResponse.data) {
          clientInfo = clientResponse.data;
        }

        const commandeResponse = await axios.get(
          `http://localhost:8000/api/commandes/${selectedLivraison.commande_id}`
        );
        let commandeInfo = {};

        if (commandeResponse.data) {
          commandeInfo = commandeResponse.data;
        }

        // Récupérer les détails des produits associés à chaque ligne de commande
        const produitsInfo = await Promise.all(
          commandeInfo.commande.ligne_commandes.map(async (ligne) => {
            const produitResponse = await axios.get(
              `http://localhost:8000/api/produits/${ligne.produit_id}`
            );
            const produitInfo = produitResponse.data;
            return {
              Code_produit: produitInfo.produit.Code_produit,
              designation: produitInfo.produit.designation,
              quantite: ligne.quantite,
            };
          })
        );

        // Création du contenu HTML pour impression
        const printWindow = window.open("", "_blank", "");

        if (printWindow) {
          const newWindowDocument = printWindow.document;
          const title = `Bon de Livraison N° ${selectedLivraison.reference}`;

          // Début du contenu HTML
          newWindowDocument.write(`
                    <!DOCTYPE html>
                    <html lang="fr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${title}</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                margin: 20px;
                            }
                            .client-info {
                                float: right;
                                width: 50%;
                                border: 2px solid #000;
                                padding: 10px;
                                margin-left: 20px;
                            }
                            h1, h2 {
                                text-align: center;
                                margin-top: 30px;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-top: 100px;
                            }
                            th, td {
                                border: 1px solid #000;
                                padding: 8px;
                                text-align: left;
                            }
                            .commande {
                                margin-top: 15px;
                            }
                            .empty-box p {
                              margin: 0;
                              text-align: center;
                              font-weight: bold;
                          }
                          .empty-box {
                            width: 40%;
                            height: 100px;
                            border: 2px solid #000;
                            float: left;
                            clear: both;
                        }
                        </style>
                    </head>
                    <body>
                        <div>
                            <h1>${title}</h1>
                        </div>
                        <div class="client-info">
                            <h2>Informations du Client :</h2>
                            <p style="text-align: center; font-weight: bold;">${
                              clientInfo.client.raison_sociale
                            }</p>
                            <p style="text-align: center; font-weight: bold;">${
                              clientInfo.client.adresse
                            }</p>
                            <p style="text-align: center; font-weight: bold;">${
                              clientInfo.client.tele
                            }</p>
                            <p style="text-align: center; font-weight: bold;">${
                              clientInfo.client.ice
                            }</p>
                        </div>

                        <div style="clear:both;"></div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Référence BL</th>
                                    <th>Date</th>
                                    <th>Référence BC</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${selectedLivraison.reference}</td>
                                    <td>${selectedLivraison.date}</td>
                                    <td>${
                                      selectedLivraison.commande.reference
                                    }</td>
                                </tr>
                            </tbody>
                        </table>
                        <table class="commande">
                            <thead>
                                <tr>
                                    <th>Code de Produit</th>
                                    <th>Désignation</th>
                                    <th>Quantité</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${produitsInfo
                                  .map(
                                    (produit) => `
                                            <tr>
                                                <td>${produit.Code_produit}</td>
                                                <td>${produit.designation}</td>
                                                <td>${produit.quantite}</td>
                                            </tr>
                                        `
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                        <div style="display: flex; justify-content: space-between; margin-top: 180px;">
                        <div style="margin-left: 20px;" class="empty-box">
                            <p>Vise Expéditeur</p>
                        </div>
                        <div style="margin-right: 20px;" class="empty-box">
                            <p>Vise Client</p>
                        </div>
                    </div>
                    
                       
                        <script>
                            setTimeout(() => {
                                window.print();
                                window.onafterprint = function () {
                                    window.close();
                                };
                            }, 1000);
                        </script>
                    </body>
                    </html>
                `);

          newWindowDocument.close();
        } else {
          console.error(
            "Erreur lors de l'ouverture de la fenêtre d'impression."
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des informations :",
          error
        );
      }
    } else {
      console.error("ID du client indisponible.");
    }
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{
        position:'absolute',
        top:'0px',
        left:'220px',
        width:'90%'
      }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
          <Toolbar />
          <h3 className="text-left" style={{ color: "grey" }}>
            <EditNoteIcon style={{ fontSize: "24px", marginRight: "8px" }} />
            Liste des bon de livraison
          </h3>
          <div
            id="tableContainer"
            className="table-responsive-sm"
            style={tableContainerStyle}
          >
            <table className="table table-bordered" id="clientsTable">
              <thead
                className="text-center"
                style={{ backgroundColor: "#adb5bd" }}
              >
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Référence BC</th>
                  <th>Client</th>
                  <th>Site Client</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {bonLivraison &&
                  bonLivraison.map((livraison) => {
                    // Récupérer les informations du site client
                    const siteClient = getSiteClientInfo(
                      livraison.commande.site_id
                    );
                    return (
                      <tr key={livraison.id}>
                        <td>{livraison.reference}</td>
                        <td>{livraison.date}</td>
                        <td>{livraison.commande.reference}</td>
                        <td>{livraison.client.raison_sociale}</td>
                        <td>
                          {siteClient
                            ? siteClient.raison_sociale
                            : "aucun site"}
                        </td>
                        <td>
                          {" "}
                          <Button
                            className="col-3 btn btn-sm m-2"
                            onClick={() => handlePrint(livraison.id)}
                          >
                            <FontAwesomeIcon icon={faFilePdf} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}{" "}
              </tbody>
            </table>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default BonLivraisonInfo;
