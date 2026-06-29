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
import { CardContent, Fab, Toolbar, Typography } from "@mui/material";
import {  Card } from "react-bootstrap";

// import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";

import TextField from "@mui/material/TextField";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import ExportPdfButton from "./exportToPdf";
import PrintList from "./PrintList";
import { useOpen } from "../Acceuil/OpenProvider";
import { width } from "@mui/system";
const Livraison = () => {
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
    CodeLivraison: "",
    commande_id: "",
    status_Livraison: "",
    date: "",
    remarque:""

    
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
  const filtrecomde = commande.filter((commande)=>commande.
  chargement_commandes.length
   !== 0  )
console.log('filtrecomde',filtrecomde)
  const commandeFiltreByStatuspreparation=filtrecomde.filter((commande)=>commande.chargement_commandes[0]
  .statusChargemant==="Charger")
  console.log('filtrecomde',commandeFiltreByStatuspreparation)

      setProduits(response.data.produits);
      setCommandes(commandeFiltreByStatuspreparation);
      setVehicule_livreurs(response.data.vehiculeLivreurs);
      setChargementCommandes(response.data.chargementCommandes); // Now includes 'livreur', 'vehicule', and 'produit' data
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  
  console.log('setCommandes',commandes)

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
  const handleDelete = async (order) => {
    console.log('chargement', order);
  
    const { chargement_commandes, livraison } = order;
    const chargementCommande = chargement_commandes[0]; // Assuming there's always at least one.
  
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce chargementCommande ?",
      showDenyButton: true,
      confirmButtonText: "Oui",
      denyButtonText: "Non",
      customClass: {
        actions: "my-actions",
        confirmButton: "order-2",
        denyButton: "order-3",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Update the status to 'Annuler' for the 'chargementCommande'
          await axios.put(
            `http://localhost:8000/api/chargementCommandes/${chargementCommande.id}`,
            {
              vehicule_id: chargementCommande.vehicule_id,
              livreur_id: chargementCommande.livreur_id,
              remarque: chargementCommande.remarque,
              conforme: chargementCommande.conforme,
              statusChargemant:'Annuler',
              commande_id: chargementCommande.commande_id,
              dateLivraisonPrevue: chargementCommande.dateLivraisonPrevue,
              dateLivraisonReelle: chargementCommande.dateLivraisonReelle,
            }
          );
  
          // Delete the livraison
          const response = await axios.delete(`http://localhost:8000/api/livraisons/${livraison.id}`);
          
          if (response.data.message) {
            // If deletion was successful, reload the chargementCommandes
            fetchChargementCommandes();
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Livraison supprimée avec succès.",
            });
          } else if (response.data.error) {
            // Handle foreign key constraint error
            await axios.put(
                `http://localhost:8000/api/chargementCommandes/${chargementCommande.id}`,
                {
                    vehicule_id: chargementCommande.vehicule_id,
                    livreur_id: chargementCommande.livreur_id,
                    remarque: chargementCommande.remarque,
                    conforme: chargementCommande.conforme,
                    statusChargemant:chargementCommande.statusChargemant,
                    commande_id: chargementCommande.commande_id,
                    dateLivraisonPrevue: chargementCommande.dateLivraisonPrevue,
                    dateLivraisonReelle: chargementCommande.dateLivraisonReelle,
                }
              );
            if (response.data.error.includes("Impossible de supprimer ou de mettre à jour une ligne parent")) {
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Impossible de supprimer le livraison car il a des produits associés.",
              });
            }
          }
          Swal.fire({
            icon: "success",
            title: "Succès!",
            text: "Livraison supprimée avec succès.",
          });
        } catch (error) {
          // Handle error in any of the requests
          console.error("Erreur lors de la suppression du chargementCommande:", error);
          Swal.fire({
            icon: "error",
            title: "Erreur!",
            text: "Échec de la suppression du chargementCommande. Veuillez consulter la console pour plus d'informations.",
          });
        }
        fetchChargementCommandes();

      } else {
        console.log("Suppression annulée");
      }
    });
  };
  
  //------------------------- chargementCommande EDIT---------------------//

  const handleEdit = (order) => {
    console.log('chargemant',order)
    setEditingChargementCommande(order);
     // Set the chargementCommandes to be edited
    // Populate form data with chargementCommandes details
    setFormData({
      reference: order.reference,
      commande_id:order.id,
      client: order.client.raison_sociale,
      Livreur: order.chargement_commandes?.[0]?.livreur?.nom ,
      codeLivraison:order.livraison.CodeLivraison,
      date:order.livraison.date,
      status_Livraison:order.livraison.
      status_Livraison,
      remarque:order.livraison.remarque
      


    });
    console.log('formdata',formData)
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('editingChargementCommande',editingChargementCommande)
    const url = editingChargementCommande
      ? `http://localhost:8000/api/livraisons/${editingChargementCommande.livraison.id}`
      : "http://localhost:8000/api/livraisons";
    const method = editingChargementCommande ? "put" : "post";
    console.log('sdfg',
        formData.commande_id,
        formData.
        codeLivraison,
        formData.status_Livraison,
        formData.date,
    )
    axios({
      method: method,
      url: url,
      data: {
        commande_id:formData.commande_id,
        CodeLivraison:formData.
        codeLivraison,
        status_Livraison:formData.status_Livraison,
        date:formData.date,
        remarque:formData.remarque
      },
      
    })
      .then(() => {
        fetchChargementCommandes();
        Swal.fire({
          icon: "success",
          title: "Succès!",
          text: `Livraison ${
            editingChargementCommande ? "modifié" : "ajouté"
          } avec succès.`,
        });

        setFormData({
           CodeLivraison: "",
    commande_id: "",
    status_Livraison: "",
    date: "",
        });
        setEditingChargementCommande(null); // Clear editing chargementCommande
        closeForm();
      })
      .catch((error) => {
        console.error(
          `Erreur lors de ${
            editingChargementCommande ? "la modification" : "l'ajout"
          } du Livraison:`,
          error
        );
        Swal.fire({
          icon: "error",
          title: "Erreur!",
          text: `Échec de ${
            editingChargementCommande ? "la modification" : "l'ajout"
          } du Livraison.`,
        });
      });
  };

  //------------------------- chargementCommande FORM---------------------//

  const handleShowFormButtonClick = (idCommande) => {
    // Update formData using setFormData correctly
    setFormData({
      CodeLivraison: "",
    commande_id: "",
    status_Livraison: "",
    date: "",
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
      case "En Cours":
        return "rgb(249 115 22)";
      case "Annuler":
        return "#ff0000";
        case "Livrée":
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

  const filteredOrders = commandes.filter((order) =>
    order.Livraison!== null &&
    order.livraison
    .status_Livraison
    === status
)
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
              Livraison
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
      {["Annuler","En Attente", "En Cours", "Livrée"].map((status) => {
  
    const filteredOrders = commandes.filter((order) =>
      order.Livraison!== null &&
    order.Livraison!== null?
      order.livraison
      .status_Livraison
      === status:[]
)
  
        
        const orderCount = filteredOrders.length;
        const color = getColorByStatus(status);

        return (
          <div
            key={status}
            style={{ marginLeft: "40px", width: "22%" }}
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
                    marginLeft: "300px",
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
  <Form
    className="row"
    style={{
      position: 'fixed',
      top: '260px',
      zIndex: '1000',
      maxHeight: '800px',
      overflowY: 'auto',
      overflowX: 'hidden',
      backgroundColor: '#fff',
      padding: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      
    }}
    onSubmit={handleSubmit}
  >
    <Form.Label className="text-center w-100 m-2">
      <h4
        style={{
          fontSize: '24px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          color: '#333',
          borderBottom: '2px solid #333',
          paddingBottom: '10px',
        }}
      >
        { 'Mise à jour Livraison' }
      </h4>
    </Form.Label>

    <h5
      style={{
        fontSize: '20px',
        color: '#ffff',
        backgroundColor: '#0b4d54',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}
    >
      Information Commande :
    </h5>

    <div className="col-md-12">
      <div className="row mb-3">
        <div className="col-sm-6">
          <label htmlFor="client_id" className="col-form-label">
          reference:
          </label>
        </div>
        <div className="col-sm-6">
          <input
            type="text"
            className="form-control"
            id="client_id"
            name="reference"
            value={formData.reference}
            readOnly
            style={{ backgroundColor: '#e9ecef' }}
          />
        </div>
      </div>
    </div>
    <div className="col-md-12">
      <div className="row mb-3">
        <div className="col-sm-6">
          <label htmlFor="client_id" className="col-form-label">
            Client:
          </label>
        </div>
        <div className="col-sm-6">
          <input
            type="text"
            className="form-control"
            id="client_id"
            name="client_id"
            value={formData.client}
            readOnly
            style={{ backgroundColor: '#e9ecef' }}
          />
        </div>
      </div>
    </div>





    <div className="col-md-12">
      <div className="row mb-3">
        <div className="col-sm-6">
          <label htmlFor="dateCommande" className="col-form-label">
            Livreur 
          </label>
        </div>
        <div className="col-sm-6">
          <input
            type="text"
            className="form-control"
            id="dateCommande"
            name="Livreur"
            value={formData.Livreur}
            readOnly
            style={{ backgroundColor: '#e9ecef' }}
          />
        </div>
      </div>
    </div>

    <h5
      style={{
        fontSize: '20px',
        color: '#ffff',
        backgroundColor: '#0b4d54',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}
    >
      Information Preparation :
    </h5>

    <div className="col-md-12">
      <div className="row mb-3">
        <div className="col-sm-6">
          <label htmlFor="codePreparation" className="col-form-label">
            Code de Livraison:
          </label>
        </div>
        <div className="col-sm-6">
          <input
            type="text"
            className="form-control"
            id="CodePreparation"
            name="CodeLivraison"
            value={formData.
                codeLivraison
                }
                style={{ backgroundColor: '#e9ecef' }}

            readOnly
            onChange={handleChange}
          />
        </div>
      </div>
    </div>



<div className="col-md-12">
  <div className="row mb-3">
    <div className="col-sm-6">
      <label htmlFor="status_preparation" className="col-form-label">
        Status de Livraison:
      </label>
    </div>
    <div className="col-sm-6">
      <select
        className="form-control"
        id="status_preparation"
        name="status_Livraison"
        value={formData.status_Livraison
        ||''}
        onChange={handleChange}
      >
        <option value="En Attente">En Attente</option>
        <option value="En Cours">En Cours</option>
        <option value="Annuler">Annuler</option>
        <option value="Livrée">Livrée</option>
      </select>
    </div>
  </div>
</div>

<div className="col-md-12">
      <div className="row mb-3">
        <div className="col-sm-6">
          <label htmlFor="codePreparation" className="col-form-label">
            Code de Livraison:
          </label>
        </div>
        <div className="col-sm-6">
          <input
            type="date"
            className="form-control"
            id="CodePreparation"
            name="date"
            value={formData.
                date||''
                }
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
    <div className="col-md-12">
      <div className="row mb-3">
        <div className="col-sm-6">
          <label htmlFor="codePreparation" className="col-form-label">
            Remarque:
          </label>
        </div>
        <div className="col-sm-6">
          <input
            type="text"
            className="form-control"
            id="CodePreparation"
            name="remarque"
            value={formData.
                remarque||''
                }
            onChange={handleChange}
            placeholder="Remarque"
          />
        </div>
      </div>
    </div>


    <Form.Group className="mt-5 d-flex justify-content-center" style={{marginBottom:'100px'}}>
        
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
                  
          <th className="tableHead">Référence Commande</th>
          <th className="tableHead">Client</th>
          <th className="tableHead">Date Commande</th>
          
          <th className="tableHead">Status</th>
                  <th className="tableHead">Livreur</th>
                  <th className="tableHead">Vehicule</th>
                  <th className="tableHead">remarque</th>
                  <th className="tableHead">Date Prevue</th>
                  <th className="tableHead">Code livraison</th>
                  <th className="tableHead">Status Livraison</th>

                  
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
                {order.reference}
                
              </td>
              <td>{order.client.
raison_sociale
 || 'N/A'}</td>
              
              <td>{order.dateCommande}</td>
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
  {order.chargement_commandes?.[0]?.remarque || ''}
</td>
<td style={{ backgroundColor: "white" }}>
  {order.chargement_commandes?.[0]?.dateLivraisonPrevue || ''}
</td>

<td style={{ backgroundColor: "white" }}>
  {order.livraison.
CodeLivraison
 || ''}
</td>
<td style={{ backgroundColor: "white" }}>
  {order.livraison.
status_Livraison
 || ''}
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

export default Livraison;
