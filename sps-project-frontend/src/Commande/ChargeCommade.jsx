import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button } from "react-bootstrap";
import "../style.css";
import Navigation from "../Acceuil/Navigation";
import Search from "../Acceuil/Search";
import TablePagination from "@mui/material/TablePagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";

// import { DatePicker } from "@mui/x-date-pickers";
import Select from "react-dropdown-select";
import {
  faTrash,
  faFilePdf,
  faFileExcel,
  faPrint,
  faFilter,
  faPlus,
  faMinus,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import {  CardContent, Fab, Toolbar, Typography } from "@mui/material";
// import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import {  Card } from "react-bootstrap";

import TextField from "@mui/material/TextField";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import ExportPdfButton from "./exportToPdf";
import PrintList from "./PrintList";
import { useOpen } from "../Acceuil/OpenProvider";
import { width } from "@mui/system";
const ChargeCommande = () => {
  const [vehicule_livreurs, setVehicule_livreurs] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRealDate, setFilterRealDate] = useState(false);
  const [filterPlannedDate, setFilterPlannedDate] = useState(false);
  //   const [filteredChargementCommandes, setFilteredChargementCommandes] =
  // useState([]);
  // const [existingChargementCommande, setExistingChargementCommande] = useState([]);
  //   const [livreurs, setLivreurs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [chargementCommandes, setChargementCommandes] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dateLivraisonReeleFilter, setDateLivraisonReeleFilter] = useState("");
  const [vehiculeFilter, setVehiculeFilter] = useState("");
  //-------------------edit-----------------------//
  const [editingChargementCommande, setEditingChargementCommande] =
    useState(null); // State to hold the chargementCommande being edited
  const [editingChargementCommandeId, setEditingChargementCommandeId] =
    useState(null);
    const { open } = useOpen();
    const { dynamicStyles } = useOpen();
  //---------------form-------------------//
  const [showForm, setShowForm] = useState(false);
  const [ShowFilterModal, setShowFilterModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicule_id: "",
    livreur_id: "",
    conforme: "",
    remarque: "",
    statusChargemant:'En Attente',
    commande_id: "",
    dateLivraisonPrevue: "",
    dateLivraisonReelle: "",
  });
  //   const [filterFormData, setFilterFormData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isFilte, setIsFilte] = useState(false);
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });

  const [expandedRows, setExpandedRows] = useState([]);

  const toggleRow = (id) => {
    const currentIndex = expandedRows.indexOf(id);
    const newExpandedRows = [...expandedRows];

    if (currentIndex === -1) {
      newExpandedRows.push(id);
    } else {
      newExpandedRows.splice(currentIndex, 1);
    }

    setExpandedRows(newExpandedRows);
  };

  const fetchChargementCommandes = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/getAllDataChargement");
  
      console.log("API Response:", response.data);
  const commande =response.data.commandes
  const filtrecomde = commande.filter((commande)=>commande.latest_preparation !== null    )

  const commandeFiltreByStatuspreparation=filtrecomde.filter((commande)=>commande.latest_preparation
  .
  status_preparation==='Préparer' )
      setProduits(response.data.produits);
      setCommandes(commandeFiltreByStatuspreparation);
      console.log('setCommandes',commandes)
      setVehicule_livreurs(response.data.vehiculeLivreurs);
      setChargementCommandes(response.data.chargementCommandes); // Now includes 'livreur', 'vehicule', and 'produit' data
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  

  useEffect(() => {
    fetchChargementCommandes();
  }, []);

  const [filterFormData, setFilterFormData] = useState({
    startDate: "",
    endDate: "",
    livreur_id: "",
    vehicule_id: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterFormData({ ...filterFormData, [name]: value });
  };
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleCheckboxChange = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  //------------------------- chargementCommande Delete Selected ---------------------//

  const handleDeleteSelected = () => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ?",
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: "Oui",
      denyButtonText: "Non",
      customClass: {
        actions: "my-actions",
        cancelButton: "order-1 right-gap",
        confirmButton: "order-2",
        denyButton: "order-3",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        selectedItems.forEach((id) => {
          axios
            .delete(`http://localhost:8000/api/chargementCommandes/${id}`)
            .then((response) => {
              fetchChargementCommandes();
              Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "chargementCommande supprimé avec succès.",
              });
            })
            .catch((error) => {
              console.error(
                "Erreur lors de la suppression du chargementCommande:",
                error
              );
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la suppression du chargementCommande.",
              });
            });
        });
      }
    });

    setSelectedItems([]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(
        chargementCommandes.map((chargementCommande) => chargementCommande.id)
      );
    }
  };
  //------------------------- chargementCommande print ---------------------//

  const printList = (tableId, title, stockList) => {
    const printWindow = window.open(" ", "_blank", " ");

    if (printWindow) {
      const tableToPrint = document.getElementById(tableId);

      if (tableToPrint) {
        const newWindowDocument = printWindow.document;
        newWindowDocument.write(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <h1 class="h1"> Gestion Commandes </h1>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
              <style>
  
                body {
                  font-family: 'Arial', sans-serif;
                  margin-bottom: 60px;
                }
  
                .page-header {
                  text-align: center;
                  font-size: 24px;
                  margin-bottom: 20px;
                }
  
                .h1 {
                  text-align: center;
                }
  
                .list-title {
                  font-size: 18px;
                  margin-bottom: 10px;
                }
  
                .header {
                  font-size: 16px;
                  margin-bottom: 10px;
                }
  
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                }
  
                th, td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
  
                .footer {
                  position: fixed;
                  bottom: 0;
                  width: 100%;
                  text-align: center;
                  font-size: 14px;
                  margin-top: 30px;
                  background-color: #fff;
                }
  
                @media print {
                  .footer {
                    position: fixed;
                    bottom: 0;
                  }
  
                  body {
                    margin-bottom: 0;
                  }
                  .no-print {
                    display: none;
                  }
                }
  
                .content-wrapper {
                  margin-bottom: 100px;
                }
  
                .extra-space {
                  margin-bottom: 30px;
                }
              </style>
            </head>
            <body>
              <div class="page-header print-no-date">${title}</div>
              <ul>
                ${
                  Array.isArray(stockList)
                    ? stockList.map((item) => `<li>${item}</li>`).join("")
                    : ""
                }
              </ul>
              <div class="content-wrapper">
                ${tableToPrint.outerHTML}
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
        console.error(`Table with ID '${tableId}' not found.`);
      }
    } else {
      console.error("Error opening print window.");
    }
  };
  //------------------------- chargementCommande export to pdf ---------------------//

  const exportToPdf = () => {
    const pdf = new jsPDF();

    // Define the columns and rows for the table
    const columns = [
      "ID",
      "Raison Sociale",
      "Adresse",
      "Téléphone",
      "Ville",
      "Abréviation",
      "ice",
      "User",
    ];
    const selectedChargementCommandes = chargementCommandes.filter(
      (chargementCommande) => selectedItems.includes(chargementCommande.id)
    );
    const rows = selectedChargementCommandes.map((chargementCommande) => [
      chargementCommande.id,
      chargementCommande.raison_sociale,
      chargementCommande.adresse,
      chargementCommande.tele,
      chargementCommande.ville,
      chargementCommande.abreviation,
      chargementCommande.ice,
      chargementCommande.user_id,
    ]);

    // Set the margin and padding
    const margin = 10;
    const padding = 5;

    // Calculate the width of the columns
    const columnWidths = columns.map(
      (col) => pdf.getStringUnitWidth(col) * 5 + padding * 2
    );
    const tableWidth = columnWidths.reduce((total, width) => total + width, 0);

    // Calculate the height of the rows
    const rowHeight = 10;
    const tableHeight = rows.length * rowHeight;

    // Set the table position
    const startX = (pdf.internal.pageSize.width - tableWidth) / 2;
    const startY = margin;

    // Add the table headers
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(200, 220, 255);
    pdf.rect(startX, startY, tableWidth, rowHeight, "F");
    pdf.autoTable({
      head: [columns],
      startY: startY + padding,
      styles: {
        fillColor: [200, 220, 255],
        textColor: [0, 0, 0],
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: columnWidths[0] },
        1: { cellWidth: columnWidths[1] },
        2: { cellWidth: columnWidths[2] },
        3: { cellWidth: columnWidths[3] },
        4: { cellWidth: columnWidths[4] },
        5: { cellWidth: columnWidths[5] },
        6: { cellWidth: columnWidths[6] },
        7: { cellWidth: columnWidths[7] },
      },
    });

    // Add the table rows
    pdf.setFont("helvetica", "");
    pdf.autoTable({
      body: rows,
      startY: startY + rowHeight + padding * 2,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: columnWidths[0] },
        1: { cellWidth: columnWidths[1] },
        2: { cellWidth: columnWidths[2] },
        3: { cellWidth: columnWidths[3] },
        4: { cellWidth: columnWidths[4] },
        5: { cellWidth: columnWidths[5] },
        6: { cellWidth: columnWidths[6] },
        7: { cellWidth: columnWidths[7] },
      },
    });

    // Save the PDF
    pdf.save("chargementCommandes.pdf");
  };
  //------------------------- chargementCommande export to excel ---------------------//

  const exportToExcel = () => {
    const selectedChargementCommandes = chargementCommandes.filter(
      (chargementCommande) => selectedItems.includes(chargementCommande.id)
    );
    const ws = XLSX.utils.json_to_sheet(selectedChargementCommandes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ChargementCommandes");
    XLSX.writeFile(wb, "chargementCommandes.xlsx");
  };

  //------------------------- chargementCommande Delete---------------------//
  const handleDelete = async (chargement) => {
    console.log('chargement', chargement);
  
    // Confirm deletion
    const { value: confirmation } = await Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce chargementCommande ?",
      showDenyButton: true,
      confirmButtonText: "Oui",
      denyButtonText: "Non",
      customClass: {
        actions: "my-actions",
        cancelButton: "order-1 right-gap",
        confirmButton: "order-2",
        denyButton: "order-3",
      },
    });
  
    if (!confirmation) {
      console.log("Suppression annulée");
      return;
    }
  
    try {
      // Helper function to update preparation status
      const updatePreparation = async () => {
        return await axios.put(
          `http://localhost:8000/api/PreparationCommandes/${chargement.latest_preparation.id}`,
          {
            commande_id: chargement.latest_preparation.commande_id,
            datePreparationCommande: chargement.latest_preparation.datePreparationCommande,
            status_preparation: 'Annuler',
            CodePreparation: chargement.latest_preparation.CodePreparation,
          }
        );
      };
  
      // Helper function to delete chargementCommande and livraison
      const deleteChargementCommande = async () => {
        if(chargement.livraison){
                  await axios.delete(`http://localhost:8000/api/livraisons/${chargement.livraison.id}`);

        }
        if(
          chargement.chargement_commandes.length
        )
        {
                  await axios.delete(`http://localhost:8000/api/chargementCommandes/${chargement.chargement_commandes[0].id}`);
        }

      };
  
      // Call the preparation update first
      await updatePreparation();
  
      // Then delete chargementCommande and livraison
      await deleteChargementCommande();
  
      fetchChargementCommandes(); // Fetch the updated list
  
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "chargementCommande supprimé avec succès",
      });
      
    } catch (error) {
      // Rollback preparation status on failure
      await axios.put(
        `http://localhost:8000/api/PreparationCommandes/${chargement.latest_preparation.id}`,
        {
          commande_id: chargement.latest_preparation.commande_id,
          datePreparationCommande: chargement.latest_preparation.datePreparationCommande,
          status_preparation: chargement.latest_preparation.status_preparation,
          CodePreparation: chargement.latest_preparation.CodePreparation,
        }
      );

      // Enhanced error handling
      if (error.response) {
        // Server error
        if (
          error.response.data.error &&
          error.response.data.error.includes(
            "Impossible de supprimer ou de mettre à jour une ligne parent : une contrainte de clé étrangère échoue"
          )
        ) {
          Swal.fire({
            icon: "error",
            title: "Erreur!",
            text: "Impossible de supprimer le chargementCommande car il a des produits associés.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Erreur de serveur!",
            text: `Code: ${error.response.status}. Message: ${error.response.data.message || error.message}.`,
          });
        }
      } else if (error.request) {
        // Network error
        Swal.fire({
          icon: "error",
          title: "Erreur de réseau!",
          text: "Le serveur ne répond pas. Veuillez vérifier votre connexion réseau.",
        });
      } else {
        // Other errors
        Swal.fire({
          icon: "error",
          title: "Erreur!",
          text: `Une erreur est survenue: ${error.message}.`,
        });
      }
    }
  };
  
  //------------------------- chargementCommande EDIT---------------------//

  const handleEdit = (order) => {
    console.log('chargemant',order)
    setEditingChargementCommande(order);
     // Set the chargementCommandes to be edited
    // Populate form data with chargementCommandes details
    const chargementCommandes = order.chargement_commandes[0]
    setFormData({
      
      vehicule_id: chargementCommandes.vehicule_id,
      livreur_id: chargementCommandes.livreur_id,
      remarque: chargementCommandes.remarque,
      conforme: chargementCommandes.conforme,
      statusChargemant:chargementCommandes.statusChargemant,
      commande_id: chargementCommandes.commande_id,
      dateLivraisonPrevue: chargementCommandes.dateLivraisonPrevue,
      dateLivraisonReelle: chargementCommandes.dateLivraisonReelle,
    });
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "38%" });
    } else {
      closeForm();
    }
    // Show form
    // setShowForm(true);
  };
  useEffect(() => {
    if (editingChargementCommandeId !== null) {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "38%" });
    }
  }, [editingChargementCommandeId]);

  const handleShowLigneCommandes = async (chargementCommandes) => {
    setExpandedRows((prevRows) =>
      prevRows.includes(chargementCommandes)
        ? prevRows.filter((row) => row !== chargementCommandes)
        : [...prevRows, chargementCommandes]
    );
  };
  //------------------------- chargementCommande SUBMIT---------------------//

  // Update notifications state

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('editingChargementCommande', editingChargementCommande);
  
    try {
      // Étape 1 : Vérifier s'il s'agit d'une modification de chargement et qu'une livraison doit être ajoutée
      if (editingChargementCommande) {
        const currentStatus = editingChargementCommande.chargement_commandes[0].statusChargemant;
        if ((currentStatus === 'Annuler' || currentStatus === 'En Attente') && formData.statusChargemant === 'Charger') {
          try {
            // Tentative de création d'une livraison avant de modifier le chargement
            await axios.post("http://localhost:8000/api/livraisons", {
              CodeLivraison: 'LV' + editingChargementCommande.reference.slice(3),
              commande_id: editingChargementCommande.id,
              status_Livraison: 'En Attente',
              date: editingChargementCommande.chargement_commandes[0].dateLivraisonPrevue
            });
          } catch (error) {
            // En cas d'échec lors de la création de la livraison
            console.error("Erreur lors de la création de la livraison:", error);
  
            // Afficher un message d'erreur et ne pas modifier le chargement
            Swal.fire({
              icon: "error",
              title: "Erreur!",
              text: "La livraison n'a pas pu être créée. Le chargement n'a pas été modifié.",
            });
  
            return; // Sortir de la fonction pour éviter de modifier le chargement
          }
        }else{
          if ((formData.statusChargemant === 'Annuler' || formData.statusChargemant === 'En Attente') && currentStatus === 'Charger') {
            try {
              // Tentative de création d'une livraison avant de modifier le chargement
              await axios.delete(`http://localhost:8000/api/livraisons/${editingChargementCommande.livraison.id}`);
            } catch (error) {
              // En cas d'échec lors de la création de la livraison
              console.error("Erreur lors de la création de la livraison:", error);
    
              // Afficher un message d'erreur et ne pas modifier le chargement
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "La livraison n'a pas pu être Supremer. Le chargement n'a pas été modifié.",
              });
    
              return; // Sortir de la fonction pour éviter de modifier le chargement
            }
        }
      }
    }
      // Étape 2 : Si la livraison a été ajoutée ou si aucune livraison n'est requise, modifier ou ajouter le chargementCommande
      const url = editingChargementCommande
        ? `http://localhost:8000/api/chargementCommandes/${editingChargementCommande.chargement_commandes[0].id}`
        : "http://localhost:8000/api/chargementCommandes";
      const method = editingChargementCommande ? "put" : "post";
  
      await axios({
        method: method,
        url: url,
        data: formData,
      });
  
      // Étape 3 : Si tout s'est bien passé, recharger les chargements et afficher le succès
      fetchChargementCommandes();
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: `chargementCommande ${editingChargementCommande ? "modifié" : "ajouté"} avec succès.`,
      });
  
      // Réinitialiser le formulaire
      setFormData({
        vehicule_id: "",
        livreur_id: "",
        conforme: "",
        remarque: "",
        statusChargemant: 'En Attente',
        commande_id: "",
        dateLivraisonPrevue: "",
        dateLivraisonReelle: "",
      });
      setEditingChargementCommande(null); // Effacer l'état d'édition
      closeForm();
    } catch (error) {
      // En cas d'erreur lors de l'ajout ou de la modification du chargementCommande
      console.error(`Erreur lors de ${editingChargementCommande ? "la modification" : "l'ajout"} du chargementCommande:`, error);
      Swal.fire({
        icon: "error",
        title: "Erreur!",
        text: `Échec de ${editingChargementCommande ? "la modification" : "l'ajout"} du chargementCommande.`,
      });
    }
  };
  

  //------------------------- chargementCommande FORM---------------------//

  const handleShowFormButtonClick = (idCommande) => {
    // Update formData using setFormData correctly
    setFormData({
      vehicule_id: "",
      livreur_id: "",
      conforme: "",
      remarque: "",
      statusChargemant: 'En Attente',
      commande_id: idCommande, // Set the commande_id to the passed id
      dateLivraisonPrevue: "",
      dateLivraisonReelle: "",
    });
  
    // Toggle the form container
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "38%" });
    } else {
      closeForm();
    }
  };
  

  const closeForm = () => {
    setFormContainerStyle({ right: "-100%" });
    setTableContainerStyle({ marginRight: "0" });
    setShowForm(false); // Hide the form
    setFormData({
      // Clear form data
      vehicule_id: "",
      livreur_id: "",
      commande_id: "",
    statusChargemant:'En Attente',
    remarque:"",
      dateLivraisonPrevue: "",
      dateLivraisonReelle: "",
    });
    setEditingChargementCommande(null); // Clear editing chargementCommande
  };
  const handleFilterSubmit = (e) => {
    e.preventDefault();

    const { startDate, endDate, livreur_id, vehicule_id } = filterFormData;

    const filteredVehiculeLivreurs = chargementCommandes.filter((vl) => {
      const dateLivraisonPrevue = new Date(vl.dateLivraisonPrevue);
      const dateLivraisonReelle = new Date(vl.dateLivraisonReelle);

      const isPrevueInRange =
        (!startDate || dateLivraisonPrevue >= new Date(startDate)) &&
        (!endDate || dateLivraisonPrevue <= new Date(endDate));

      const isReelleInRange =
        (!startDate || dateLivraisonReelle >= new Date(startDate)) &&
        (!endDate || dateLivraisonReelle <= new Date(endDate));

      const livreurFilter = !livreur_id || String(vl.livreur.id) === livreur_id;
      const vehiculeFilter =
        !vehicule_id || String(vl.vehicule.id) === vehicule_id;

      const isFilterFilled =
        startDate !== "" ||
        endDate !== "" ||
        livreur_id !== "" ||
        vehicule_id !== "";

      setIsFiltering(isFilterFilled);

      let passFilter = false;

      if (filterRealDate && filterPlannedDate) {
        passFilter =
          (isPrevueInRange || isReelleInRange) &&
          livreurFilter &&
          vehiculeFilter;
      } else if (filterRealDate) {
        passFilter = isReelleInRange && livreurFilter && vehiculeFilter;
      } else if (filterPlannedDate) {
        passFilter = isPrevueInRange && livreurFilter && vehiculeFilter;
      } else {
        passFilter =
          (isPrevueInRange || isReelleInRange) &&
          livreurFilter &&
          vehiculeFilter;
      }

      return passFilter;
    });

    setFilteredData(filteredVehiculeLivreurs);

    // if (filteredVehiculeLivreurs.length === 0) {
    //   Swal.fire({
    //     icon: "info",
    //     title: "Aucun résultat trouvé",
    //     text: "Veuillez ajuster vos filtres.",
    //   });

    //   setIsFiltering(false);
    //   setFilteredData(chargementCommandes);
    // }

    console.log("filterFormData:", filterFormData);
    console.log("filteredVehiculeLivreurs:", filteredVehiculeLivreurs);
    setShowFilterModal(false);
  };
console.log('formData',formData)
const [status ,setStatus]=useState('En Attente');
const [comandeFiltre ,setCommnadeFiltre]=useState([])

const getColorByStatus = (status) => {
  switch (status) {
    case "En Attente":
      return " rgb(253 224 71)";
    case "Annuler":
      return "rgb(249 115 22)";
    case "Charger":
      return "rgb(34 197 94)";
    default:
      return "#ffffff"; // Default color
  }
};
const handleOrderClick = (filteredOrders) => {
  setCommnadeFiltre(filteredOrders)
}
function changeStatus(status){
  setStatus(status)
}
useEffect(() => {
  const filteredOrders = commandes.filter(
    (order) =>( order.chargement_commandes.length===0?[]:order.chargement_commandes[0].statusChargemant
    === status)
  );
  setCommnadeFiltre(filteredOrders)
  console.log('Status:', status);
  console.log('Commande Filtre:', comandeFiltre);
},[commandes]); //

console.log('Commande Filtre:', comandeFiltre);

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles}}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 6 }}>
         
       

          <div
            className="d-flex justify-content-between align-items-center"
            // style={{ marginTop: "42px" }}
          >
            <h3 className="titreColore">
              Chargement de Commandes
            </h3>
            <div className="d-flex">
              <div>
                <FontAwesomeIcon
                  id="filterButton"
                  onClick={() => {
                    if (isFilte) {
                      setIsFilte(false);
                      setFilteredData(chargementCommandes);
                      setFilterFormData({
                        vehicule_id: "",
                        livreur_id: "",
                        commande_id: "",
                        dateLivraisonPrevue: "",
                        dateLivraisonReelle: "",
                      });
                    } else {
                      setIsFilte(true);
                    }
                  }}
                  disabled={isFiltering && filteredData.length === 0}
                  icon={faFilter}
                  style={{
                    cursor: "pointer",
                    fontSize: "2rem",
                    color: "#0d6efd",
                  }}
                />{" "}
                <PrintList
                  tableId="fournisseurTable"
                  title="Liste des Fournisseurs"
                  ChargeCommande={chargementCommandes}
                  filteredChargementCommandes={chargementCommandes}
                />{" "}
                <ExportPdfButton
                  chargementCommandes={chargementCommandes}
                  selectedItems={selectedItems}
                />{" "}
                <FontAwesomeIcon
                  icon={faFileExcel}
                  onClick={exportToExcel}
                  style={{
                    cursor: "pointer",
                    color: "green",
                    fontSize: "2rem",
                    marginLeft: "15px",
                  }}
                />
              </div>
            </div>
          </div>
          <div
            className="d-flex align-items-start"
            style={{ marginLeft: "600px" }}
          >
            {isFilte && (
              <div className="filter-container">
                <Form onSubmit={handleFilterSubmit}>
                  <table className="table table-borderless">
                    <thead>
                      <tr>
                        <th>Date Debut</th>
                        <th>Date Fin</th>
                        <th>{""}</th>
                        <th>{""}</th>
                        <th>Livreurs</th>
                        <th>Véhicules</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <Form.Control
                            type="date"
                            name="startDate"
                            value={filterFormData.startDate}
                            onChange={handleFilterChange}
                            className="form-control form-control-sm"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="date"
                            name="endDate"
                            value={filterFormData.endDate}
                            onChange={handleFilterChange}
                            className="form-control form-control-sm"
                          />
                        </td>
                        <td>
                          <Form.Check
                            type="checkbox"
                            id="filterRealDate"
                            label="Date Réelle"
                            checked={filterRealDate}
                            onChange={(e) =>
                              setFilterRealDate(e.target.checked)
                            }
                          />
                        </td>
                        <td>
                          <Form.Check
                            type="checkbox"
                            id="filterPlannedDate"
                            label="Date Prévue"
                            checked={filterPlannedDate}
                            onChange={(e) =>
                              setFilterPlannedDate(e.target.checked)
                            }
                          />
                        </td>

                        <td>
                          <Form.Control
                            as="select"
                            name="livreur_id"
                            value={filterFormData.livreur_id}
                            onChange={handleFilterChange}
                            className="form-control form-control-sm"
                          >
                            <option value="">Livreur</option>
                            {(() => {
                              const seenLivreurIds = new Set(); // Créer un ensemble pour stocker les ID des livreurs déjà rencontrés
                              return vehicule_livreurs.map((item) => {
                                if (
                                  item.livreur &&
                                  !seenLivreurIds.has(item.livreur.id)
                                ) {
                                  seenLivreurIds.add(item.livreur.id); // Ajouter l'ID du livreur à l'ensemble
                                  return (
                                    <option
                                      key={item.livreur.id}
                                      value={item.livreur.id}
                                    >
                                      {item.livreur.nom}
                                    </option>
                                  );
                                }
                                return null;
                              });
                            })()}
                          </Form.Control>
                        </td>
                        <td>
                          <Form.Control
                            as="select"
                            name="vehicule_id"
                            value={filterFormData.vehicule_id}
                            onChange={handleFilterChange}
                            className="form-control form-control-sm"
                          >
                            <option value="">Sélectionner un véhicule</option>
                            {(() => {
                              const seenVehiculeIds = new Set(); // Créer un ensemble pour stocker les IDs des véhicules déjà rencontrés
                              return vehicule_livreurs.map((veh) => {
                                if (!seenVehiculeIds.has(veh.vehicule.id)) {
                                  seenVehiculeIds.add(veh.vehicule.id); // Ajouter l'ID du véhicule à l'ensemble
                                  return (
                                    <option
                                      key={veh.vehicule.id}
                                      value={veh.vehicule.id}
                                    >
                                      {veh.vehicule.model}-
                                      {veh.vehicule.matricule}
                                    </option>
                                  );
                                }
                                return null;
                              });
                            })()}
                          </Form.Control>
                        </td>

                        <td>
                          <Button
                            variant="primary"
                            type="submit"
                            className="btn-sm"
                          >
                            Appliquer les filtres
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Form>
              </div>
            )}
          </div> 




          <div style={{ width: "100%"}}>
    <div className="d-flex flex-wrap">
      {["En Attente", "Charger", "Annuler"].map((status) => {
  let filteredOrders = [];

  // Filter orders based on status
  if (status === "En Attente") {
    filteredOrders = commandes.filter((order) =>
      order.chargement_commandes.length === 0 ||
      order.chargement_commandes[0]?.statusChargemant === "En Attente"
    );
  } else {
    filteredOrders = commandes.filter((order) =>
      order.chargement_commandes.length !== 0 &&
      order.chargement_commandes[0]?.statusChargemant === status
    );
  }
        
        const orderCount = filteredOrders.length;
        const color = getColorByStatus(status);

        return (
          <div
            key={status}
            style={{ marginLeft: "40px", width: "30%" }}
          >
            <Card
              style={{
                width: "100%",
                padding: "px",
                backgroundColor: color ,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                height:'80px'
              }}
            >
              <CardContent>
              <Typography
  variant="h4" // To ensure it's large enough
  component="div"
  sx={{
    color: "#fff", // Dark color
    fontWeight: 900, // Extra bold font weight
    textTransform: "none", // Keep original case (no automatic capitalization)
    fontSize: "30px", // Font size matching the image
    fontFamily: "'Arial', sans-serif", // Use a sans-serif font
    marginTop:'-20px'
  }}
>
  {status}
</Typography>


                <Typography
                  variant="body1"
                  sx={{
                    color: "#333",
                    marginBottom: "5px",
                    marginTop: "-28px",
                    marginLeft: "440px",
                    color: "#333",
                    padding: "5px 15px", // Padding inside the border
                    border: "2px solid #333", // Border for the order count
                    boxShadow: "2px 2px 8px #333", // Subtle shadow
                    borderRadius: "8px", // Rounded corners
                    backgroundColor: "#fff", // Background to contrast with the card
                  }}
                >
                   {orderCount}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#1976d2",
                    cursor: "pointer",
                    "&:hover": { color: "#1976d2" },
                  }}
                  onClick={() => {
                    handleOrderClick(filteredOrders);
                    changeStatus(status);
                  }}
                >
                  Voir les détails
                </Typography>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  </div>

          <div className="add-Ajout-form ">
            
            <div id="formContainer" className="mt-2" style={formContainerStyle}>
              <Form className="col row" onSubmit={handleSubmit}>
                <Form.Label className="text-center m-2"
                 style={{
                  fontSize: '20px',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  color: 'black',
                  borderBottom: '2px solid black',
                  paddingBottom: '5px',
                }}>
                  <h5>
                    {editingChargementCommande
                      ? "Modifier le chargementCommande"
                      : "Charger une Commande"}
                  </h5>
                </Form.Label>
                <Form.Group  style={{ display: 'flex', alignItems: 'center' }} className="col-sm-10 m-2" controlId="vehicule_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Vehicule</Form.Label>
                  <Form.Select
                  style={{ flex: '2' }}
                    name="vehicule_id"
                    value={formData.vehicule_id}
                    onChange={handleChange}
                    className="form-select form-select-sm"
                    required
                  >
                    <option value="">vehicule</option>
                    {(() => {
                      const seenVehiculeIds = new Set();
                      return vehicule_livreurs.map((item) => {
                        if (
                          item.vehicule &&
                          !seenVehiculeIds.has(item.vehicule.id)
                        ) {
                          seenVehiculeIds.add(item.vehicule.id);
                          return (
                            <option
                              key={item.vehicule.id}
                              value={item.vehicule.id}
                            >
                              {item.vehicule.matricule} {item.vehicule.marque}
                            </option>
                          );
                        }
                        return null;
                      });
                    })()}
                  </Form.Select>
                </Form.Group>

                <Form.Group   style={{ display: 'flex', alignItems: 'center' }}className="col-sm-10 m-2" controlId="livreur_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Livreur</Form.Label>
                  <Form.Select
                  style={{ flex: '2' }}
                    name="livreur_id"
                    value={formData.livreur_id}
                    onChange={handleChange}
                    className="form-select form-select-sm"
                    disabled={!formData.vehicule_id}
                  >
                    <option value="">livreur</option>
                    {vehicule_livreurs
                      .filter(
                        (item) =>
                          item.vehicule_id === parseInt(formData.vehicule_id)
                      )
                      .map((filteredItem) => (
                        <option
                          key={filteredItem.livreur_id}
                          value={filteredItem.livreur_id}
                        >
                          {filteredItem.livreur.nom}{" "}
                          {filteredItem.livreur.prenom}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group  style={{ display: 'flex', alignItems: 'center' }} className="col-sm-10 m-2" controlId="remarque">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Remarque</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    as="textarea"
                    rows={3}
                    name="remarque"
                    value={formData.remarque}
                    onChange={handleChange}
                    placeholder="Saisissez votre remarque ici..."
                  />
                </Form.Group>
                <Form.Group  style={{ display: 'flex', alignItems: 'center' }} className="col-sm-10 m-2">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Conforme</Form.Label>
                  <div style={{ flex: '2' }}>
                    <Form.Check
                      inline
                      label="Oui"
                      type="radio"
                      id="confortOui"
                      name="conforme"
                      value="oui"
                      checked={formData.conforme === "oui"}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      label="Non"
                      type="radio"
                      id="confortNon"
                      name="conforme"
                      value="non"
                      checked={formData.conforme === "non"}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
                
                {editingChargementCommande && (
                  <Form.Group  style={{ display: 'flex', alignItems: 'center' }} className="col-sm-10 m-2" controlId="commande_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>State chargement</Form.Label>

                  <Form.Select
                  style={{ flex: '2' }}
                    name="statusChargemant"
                    value={formData.statusChargemant}
                    onChange={handleChange}
                    className="form-select form-select-sm"
                    required
                  >
                    <option value="En Attente">En Attente</option>
                        <option value="Annuler">Annuler</option>
                        <option value="Charger">Charger</option>
                  </Form.Select>
                </Form.Group>
                )}
              
                {/* <Form.Group  style={{ display: 'flex', alignItems: 'center' }} className="col-sm-10 m-2" controlId="commande_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Commande</Form.Label>

                  <Form.Control
                  style={{ flex: '2' }}
                    name="commande_id"
                    value={formData.commande_id}
                    onChange={handleChange}
                    className="form-Control form-select-sm"
                    required
                    readOnly
                  >
                    
                  </Form.Control>
                </Form.Group> */}
                <Form.Group  style={{ display: 'flex', alignItems: 'center' }} className="col-sm-10 m-2 ">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Date Livraison Prevue</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="date"
                    placeholder="dateLivraisonPrevue"
                    name="dateLivraisonPrevue"
                    value={formData.dateLivraisonPrevue}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group  style={{ display: 'flex', alignItems: 'center' }} className="col-sm-10 m-2">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Date Livraison Reelle</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="date"
                    placeholder="dateLivraisonReelle"
                    name="dateLivraisonReelle"
                    value={formData.dateLivraisonReelle}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mt-5 d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={closeForm}
  >
    Annuler
  </Fab>
      </Form.Group>
              </Form>
            </div>
          </div>
          <div
             id=""
                            className=""
            style={{...tableContainerStyle,minWidth:"300px",overflow:'auto'}}
          >
            <table className="  table table-bordered" style={{marginTop:'10px'}}>
              <thead>
                <tr>
                  <th  className="tableHead widthDetails">
                    <input type="checkbox" onChange={handleSelectAllChange} />
                  </th>
                  <th className="tableHead">Code de Préparation</th>
          <th className="tableHead">Status de Préparation</th>
          <th className="tableHead">Date de Préparation</th>
          <th className="tableHead">Référence Commande</th>
          <th className="tableHead">Client</th>
          <th className="tableHead">Date Commande</th>
          <th className="tableHead">Mode de payement</th>
          <th className="tableHead">Status</th>
                  <th className="tableHead">Commande</th>
                  <th className="tableHead">Livreur</th>
                  <th className="tableHead">Vehicule</th>
                  <th className="tableHead">conforme</th>
                  <th className="tableHead">remarque</th>
                  <th className="tableHead">Date Prevue</th>
                  <th className="tableHead">Date Reelle</th>
                  <th className="tableHead">Action</th>
                </tr>
              </thead>
              <tbody>
  {comandeFiltre
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    .map((order) => (
      <React.Fragment key={order.id}>
        <tr>
          <td style={{ backgroundColor: "white" }}>
            <input
              type="checkbox"
              onChange={() => handleCheckboxChange(order.id)}
              checked={selectedItems.includes(order.id)}
            />
          </td>
          <td>
                
                {order.
latest_preparation
.CodePreparation || ''
}
              </td>
              <td>{order.
latest_preparation
.status_preparation
}</td>
              <td>{order.latest_preparation.datePreparationCommande.slice(0, -8)}</td>
              <td>
                {order.reference}
                
              </td>
              <td>{order.client.
raison_sociale
 || 'N/A'}</td>
              
              <td>{order.dateCommande}</td>
              <td>{order.mode_payement}</td>
              <td>{order.status}</td>
          <td style={{ backgroundColor: "white" }}>
            
            {order.reference}
          </td>
          <td style={{ backgroundColor: "white" }}>
  {order.chargement_commandes?.[0]?.livreur?.nom || ''}
</td>
<td style={{ backgroundColor: "white" }}>
  {order.chargement_commandes?.[0]?.vehicule?.matricule || ''}
</td>
<td style={{ backgroundColor: "white" }}>
  {order.chargement_commandes?.[0]?.conforme || ''}
</td>
<td style={{ backgroundColor: "white" }}>
  {order.chargement_commandes?.[0]?.remarque || ''}
</td>
<td style={{ backgroundColor: "white" }}>
  {order.chargement_commandes?.[0]?.dateLivraisonPrevue || ''}
</td>
<td style={{ backgroundColor: "white" }}>
  {order.chargement_commandes?.[0]?.dateLivraisonReelle || ''}
</td>
<td style={{ backgroundColor: "white" }}>
  {
    order.chargement_commandes.length ===0?<FontAwesomeIcon
    onClick={() => handleShowFormButtonClick(order.id || {})}
    icon={faEdit}
    style={{ color: "#007bff", cursor: "pointer" }}
  />:<FontAwesomeIcon
  onClick={() => handleEdit(order || {})}
  icon={faEdit}
  style={{ color: "#007bff", cursor: "pointer" }}
/>
  }
  {/* <FontAwesomeIcon
    onClick={() => handleEdit(order.chargement_commandes?.[0] || {})}
    icon={faEdit}
    style={{ color: "#007bff", cursor: "pointer" }}
  /> */}
  <span style={{ margin: "0 8px" }}></span>
  <FontAwesomeIcon
    onClick={() => handleDelete(order || {})}
    icon={faTrash}
    style={{ color: "#ff0000", cursor: "pointer" }}
  />
</td>

        </tr>

        {expandedRows.includes(order.
chargement_commandes
.id) && (
          <tr>
            <td colSpan="9" style={{ padding: "0" }}>
              <div id="lignesCommandes">
                <table
                  className="table-bordered"
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                  }}
                >
                  <thead>
                    <tr>
                      <th className="ColoretableForm">Code Produit</th>
                      <th className="ColoretableForm">Désignation</th>
                      <th className="ColoretableForm">Quantité</th>
                      <th className="ColoretableForm">Prix Unitaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.commande.ligne_commandes.map(
                      (ligneCommande) => {
                        const produit = produits.find(
                          (prod) => prod.id === ligneCommande.produit_id
                        );
                        return (
                          <tr key={ligneCommande.id}>
                            <td>{produit?.Code_produit || 'N/A'}</td>
                            <td>{produit?.designation || 'N/A'}</td>
                            <td>{ligneCommande.quantite}</td>
                            <td>{ligneCommande.prix_unitaire}</td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    ))}
</tbody>

            </table>
            <div className="d-flex flex-row">
              <div className="btn-group col-2">
                <Button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedItems.length === 0}
                >
                  <FontAwesomeIcon
                    icon={faTrash}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Supprimer selection
                </Button>
              </div>
            </div>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={chargementCommandes && chargementCommandes.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ChargeCommande;
