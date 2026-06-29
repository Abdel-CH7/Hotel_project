import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Navigation from "../Acceuil/Navigation";
import { Form, Button } from "react-bootstrap";
import { Toolbar } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PrintList from "./PrintList";
import ExportPdfButton from "./exportToPdf";
import TablePagination from "@mui/material/TablePagination";
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import {
  faTrash,
  faPlus,
  faMinus,
  faList,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import Select from "react-dropdown-select";
import "jspdf-autotable";
import Swal from "sweetalert2";
import Search from "../Acceuil/Search";
const CommandeList = () => {
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [commandes, setCommandes] = useState([]);
  const [warningIndexes, setWarningIndexes] = useState([]);
  const [clients, setClients] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedPrepRows, setExpandedPrepRows] = useState([]);
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [EditingLine, setEditingLine] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [modifiedLotValues, setModifiedLotValues] = useState({});
  const [modifiedQuantiteValues, setModifiedQuantiteValues] = useState({});
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfTokenMeta ? csrfTokenMeta.content : null;
  const [selectedClientId, setSelectedClientId] = useState(null);
  useState(null);
  const [formData, setFormData] = useState({
    reference: "",
    dateCommande: "",
    datePreparationCommande: "",
    client_id: "",
    site_id: "",
    mode_payement: "",
    status: "",
    user_id: "",
    produit_id: "",
    prix_unitaire: "",
    quantite: "",
    codePreparation: "",
  });
  const [
    existingLignePreparationCommandes,
    setExistingLignePreparationCommandes,
  ] = useState([]);

  const [existingLigneCommandes, setExistingLigneCommandes] = useState([]);

  const [editingCommandes, setEditingCommandes] = useState(null);
  const [editingCommandesId, setEditingCommandesId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expand_total, setExpandTotal] = useState([]);
  const [expand_status, setExpandedStatus] = useState([]);
  const calibres = produits.map((produit) => produit.calibre.calibre);
  const uniqueCalibres = [...new Set(calibres)];
  const [siteClients, setSiteClients] = useState([]);
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  useEffect(() => {
    if (editingCommandesId) {
      fetchExistingLigneCommandes(editingCommandesId);
      fetchExistingLignePreparationCommandes(editingCommandesId);
    }
  }, [editingCommandesId]);

  const fetchExistingLigneCommandes = async (commandId) => {
    axios
      .get(`http://localhost:8000/api/ligneCommandes/${commandId}`)
      .then((ligneCommandesResponse) => {
        const existingLigneCommandes =
          ligneCommandesResponse.data.ligneCommandes;

        setExistingLigneCommandes(existingLigneCommandes);
      });
  };
  const fetchExistingLignePreparationCommandes = async (commandId) => {
    axios
      .get(`http://localhost:8000/api/lignePreparationCommandes/${commandId}`)
      .then((lignePreparationCommandesResponse) => {
        const existingLignePreparationCommandes =
          lignePreparationCommandesResponse.data.lignePreparationCommandes;

        setExistingLignePreparationCommandes(existingLignePreparationCommandes);
      });
  };

  const handleShowTotalDetails = (commande) => {
    setExpandTotal((prevRows) =>
      prevRows.includes(commande)
        ? prevRows.filter((row) => row !== commande)
        : [...prevRows, commande]
    );
  };
  const handleShowLigneCommandes = async (commande) => {
    setExpandedRows((prevRows) =>
      prevRows.includes(commande)
        ? prevRows.filter((row) => row !== commande)
        : [...prevRows, commande]
    );
  };
  const handleShowLignePreparationCommandes = async (preparationId) => {
    setExpandedPrepRows((prevRows) =>
      prevRows.includes(preparationId)
        ? prevRows.filter((row) => row !== preparationId)
        : [...prevRows, preparationId]
    );
  };

  const handleShowStatusCommandes = async (commande) => {
    setExpandedStatus((prevRows) =>
      prevRows.includes(commande)
        ? prevRows.filter((row) => row !== commande)
        : [...prevRows, commande]
    );
  };

  const fetchData = async () => {
    try {
      const [
        commandesResponse,
        clientsResponse,
        siteClientResponse,
        produitsResponse,
      ] = await Promise.all([
        axios.get("http://localhost:8000/api/commandes"),
        axios.get("http://localhost:8000/api/clients"),
        axios.get("http://localhost:8000/api/siteclients"),
        axios.get("http://localhost:8000/api/produits"),
      ]);
      setCommandes(commandesResponse.data.commandes);
      setClients(clientsResponse.data.client);
      setSiteClients(siteClientResponse.data.siteclient);
      setProduits(produitsResponse.data.produit);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (editingCommandes) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        client_id: editingCommandes.client_id,
      }));
    }
  }, [editingCommandes]);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getElementValueById = (id) => {
    return document.getElementById(id)?.value || "";
  };

  const calculateTotalQuantity = (ligneCommandes) => {
    // S'assurer que ligneCommandes est un tableau
    if (!Array.isArray(ligneCommandes)) {
      console.error("Expected an array but received:", ligneCommandes);
      return 0; // Retourner 0 si ligneCommandes n'est pas un tableau
    }

    return ligneCommandes.reduce((total, ligneCommande) => {
      return total + ligneCommande.quantite;
    }, 0);
  };
  const calculateTotalPreparationQuantityForCommande = (preparations) => {
    if (!Array.isArray(preparations)) {
      console.error("Expected an array but received:", preparations);
      return 0; // Retourner 0 si les préparations ne sont pas un tableau
    }

    return preparations.reduce((total, preparation) => {
      if (!Array.isArray(preparation.lignes_preparation)) {
        console.error(
          "Expected an array but received:",
          preparation.lignes_preparation
        );
        return total; // Ignorer cette préparation si les lignes de préparation ne sont pas un tableau
      }

      return (
        total +
        preparation.lignes_preparation.reduce((subtotal, lignePreparation) => {
          return subtotal + lignePreparation.quantite;
        }, 0)
      );
    }, 0);
  };

  const getQuantity = (ligneCommandes, calibre, designation) => {
    const correspondingProduct = produits.find(
      (product) =>
        product.calibre.calibre === calibre &&
        product.designation === designation
    );

    if (!correspondingProduct) {
      return 0; // If no corresponding product is found, return 0
    }

    const correspondingLigneCommande = ligneCommandes.find(
      (ligne) => ligne.produit_id === correspondingProduct.id
    );

    return correspondingLigneCommande ? correspondingLigneCommande.quantite : 0;
  };
  const populateProductInputs = (id, inputType) => {
    console.log(
      "existing LignePreparationCommande",
      existingLignePreparationCommandes
    );
    const existingLignePreparationCommande = selectedProductsData.find(
      (data) => data.id === id
    );
    if (existingLignePreparationCommande) {
      return existingLignePreparationCommande[inputType];
    }
    return "";
  };

  const getTotalForCalibre = (lignePreparationCommandes, calibre, produits) => {
    const lignePreparationCommandesForCalibre =
      lignePreparationCommandes.filter(
        (ligne) =>
          produits.find((produit) => produit.id === ligne.produit_id)?.calibre
            .calibre === calibre
      );

    // Calculate the total quantity for the calibre
    const total = lignePreparationCommandesForCalibre.reduce(
      (acc, ligne) => acc + ligne.quantite,
      0
    );

    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userResponse = await axios.get("http://localhost:8000/api/users", {
        withCredentials: true,
        headers: {
          "X-CSRF-TOKEN": csrfToken,
        },
      });

      const authenticatedUserId = userResponse.data[0].id;
      console.log("auth user", authenticatedUserId);

      if (editingCommandes) {
        const preparationResponse = await axios.post(
          `http://localhost:8000/api/PreparationCommandes`,
          {
            commande_id: editingCommandes.id,
            datePreparationCommande: formData.datePreparationCommande,
            status: "En Attente", // Adjust the status dynamically if necessary
          }
        );
        console.log("preparation", preparationResponse.data);
        const preparationId = preparationResponse.data.id;

        const existingLignePreparationCommandesResponse = await axios.get(
          `http://localhost:8000/api/lignePreparationCommandes/${preparationId}`
        );
        const existingLignePreparationCommandes = Array.isArray(
          existingLignePreparationCommandesResponse.data
        )
          ? existingLignePreparationCommandesResponse.data
          : []; // Ensure it's always treated as an array

        const selectedPrdsData = selectedProductsData.map(
          (selectedProduct, index) => {
            const existingLignePreparationCommande =
              existingLignePreparationCommandes.find(
                (lignePreparationCommande) =>
                  lignePreparationCommande.produit_id ===
                  selectedProduct.produit_id
              );

            return {
              id: existingLignePreparationCommande
                ? existingLignePreparationCommande.id
                : undefined,
              preparation_id: preparationId,
              produit_id: selectedProduct.produit_id,
              prix_unitaire: 12,
              quantite: getElementValueById(
                `quantite_${index}_${selectedProduct.produit_id}`
              ),
              lot: getElementValueById(
                `lot_${index}_${selectedProduct.produit_id}`
              ),
            };
          }
        );

        console.log("selectedPrdsData", selectedPrdsData);
        for (const lignePreparationCommandeData of selectedPrdsData) {
          if (lignePreparationCommandeData.id) {
            await axios.put(
              `http://localhost:8000/api/lignePreparationCommandes/${lignePreparationCommandeData.id}`,
              lignePreparationCommandeData,
              {
                withCredentials: true,
                headers: {
                  "X-CSRF-TOKEN": csrfToken,
                },
              }
            );
          } else if (
            lignePreparationCommandeData.quantite &&
            lignePreparationCommandeData.lot
          ) {
            await axios.post(
              "http://localhost:8000/api/lignePreparationCommandes",
              lignePreparationCommandeData,
              {
                withCredentials: true,
                headers: {
                  "X-CSRF-TOKEN": csrfToken,
                },
              }
            );
          }
        }
      }

      fetchData();

      setFormData({
        datePreparationCommande: "",
        user_id: "",
        produit_id: "",
        prix_unitaire: "",
        quantite: "",
        lot: "",
      });

      setShowForm(false);
      Swal.fire({
        icon: "success",
        title: "Succès !",
        text: "Succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la soumission des données :", error);
      Swal.fire({
        icon: "error",
        title: "Erreur !",
        text: "Erreur lors de la soumission des données.",
      });
    }
    closeForm();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 5));
    setPage(0);
  };
  const getProduitValue = (produitId, field) => {
    const produit = produits.find((p) => p.id === produitId);
    if (produit) {
      return produit[field];
    }
    return "";
  };
  function getClassForCommande(commande, preparation) {
    const quantiteLigneCommande = calculateTotalQuantity(
      commande.ligne_commandes
    );
    const quantiteLignePreparation = preparation
      ? calculateTotalQuantity(preparation.lignes_preparation)
      : 0;

    if (quantiteLigneCommande === 0) {
      return "bg-danger"; // Color the row in red if there are no preparations
    } else if (quantiteLignePreparation === quantiteLigneCommande) {
      return "bg-success"; // Color the row in green if quantities match
    } else if (quantiteLignePreparation < quantiteLigneCommande) {
      return "bg-orange"; // Color the row in orange if preparation quantity is less
    } else {
      return ""; // No specific class if none of the above conditions match
    }
  }

  const handleEdit = (commande) => {
    setModifiedLotValues({});
    setModifiedQuantiteValues({});
    setEditingCommandesId(commande.id);
    setEditingCommandes(commande);
    console.log("Editing Commande", commande);
    setFormData({
      reference: commande.reference,
      dateCommande: commande.dateCommande,
      datePreparationCommande: commande.datePreparationCommande,
      client_id: commande.client_id,
      site_id: commande.site_id,
      mode_payement: commande.mode_payement,
      status: commande.status,
      codePreparation: commande.preparations.CodePreparation,
    });

    console.log("formData,", formData);

    if (commande && commande.preparations && commande.preparations.length > 0) {
      const selectedProducts = commande.preparations.flatMap((preparation) => {
        if (
          preparation.lignes_preparation &&
          preparation.lignes_preparation.length > 0
        ) {
          return preparation.lignes_preparation
            .map((lignePreparation) => {
              const product = produits.find(
                (produit) => produit.id === lignePreparation.produit_id
              );
              if (product) {
                return {
                  id: lignePreparation.id,
                  Code_produit: product.Code_produit,
                  calibre_id: product.calibre_id,
                  designation: product.designation,
                  produit_id: lignePreparation.produit_id,
                  quantite_lot: lignePreparation.quantite,
                  prix_unitaire: lignePreparation.prix_unitaire,
                  lot: lignePreparation.lot,
                };
              }
              console.error("Product not found:", lignePreparation.produit_id);
              return null;
            })
            .filter((product) => product);
        } else {
          console.error(
            "No lines of preparation available for this preparation:",
            preparation
          );
          return [];
        }
      });

      console.log("Selected Products in handle Edit", selectedProducts);
      setSelectedProductsData(selectedProducts);
    } else {
      const selectedProducts = commande.ligne_commandes.map((ligneCommande) => {
        const product = produits.find(
          (produit) => produit.id === ligneCommande.produit_id
        );

        return {
          Code_produit: product.Code_produit,
          calibre_id: product.calibre_id,
          designation: product.designation,
          produit_id: ligneCommande.produit_id,
          quantite: ligneCommande.quantite,
          prix_unitaire: ligneCommande.prix_unitaire,
        };
      });
      setSelectedProductsData(selectedProducts);
    }
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "1200px" });
    } else {
      closeForm();
    }
  };
  function editLine(ligneId) {
    // Trouver la ligne de préparation à éditer dans la commande en cours d'édition
    const preparationToEdit = editingCommandes.preparations.find(
      (preparation) =>
        preparation.lignes_preparation.some(
          (lignePreparation) => lignePreparation.id === ligneId
        )
    );

    if (preparationToEdit) {
      // Trouver la ligne de préparation spécifique
      const ligneToEdit = preparationToEdit.lignes_preparation.find(
        (lignePreparation) => lignePreparation.id === ligneId
      );

      // Mettre à jour l'état ou les données de la ligne de préparation en cours d'édition
      // Vous pouvez utiliser un état local ou un état global pour stocker les données de la ligne en cours d'édition
      // Par exemple :
      setEditingLine({
        ligneId: ligneId,
        preparationId: preparationToEdit.id,
        ...ligneToEdit,
      });

      // Afficher les valeurs éditables dans les cellules de la ligne
      // Ceci est généralement géré dans le rendu de votre composant React en fonction de l'état de l'édition

      // Afficher des boutons de confirmation et d'annulation pour appliquer ou annuler les modifications
      // Vous pouvez utiliser des boutons dans votre composant React pour confirmer ou annuler les modifications
    } else {
      console.error(
        "Ligne de préparation non trouvée dans la commande en cours d'édition"
      );
    }
  }

  const handleInputChange = (index, inputType, event) => {
    const newValue = event.target.value;
    console.log("selectedProductsData", selectedProductsData);
    console.log("index", index);
    if (selectedProductsData[index]) {
      const productId = selectedProductsData[index].produit_id;
      const quantite = selectedProductsData[index].quantite;
      if (inputType === "lot") {
        setModifiedLotValues((prev) => {
          const updatedValues = {
            ...prev,
            [`${index}_${productId}`]: newValue,
          };
          console.log("Modified Lot values:", updatedValues);
          return updatedValues;
        });
      } else if (inputType === "quantite") {
        if (newValue > quantite) {
          setWarningIndexes((prev) => [...prev, index]); // Add index to warning indexes
        } else {
          setWarningIndexes((prev) => prev.filter((item) => item !== index)); // Remove index from warning indexes

          setModifiedQuantiteValues((prev) => {
            const updatedValues = {
              ...prev,
              [`${index}_${productId}`]: newValue,
            };
            console.log("Modified quantite values:", updatedValues);
            return updatedValues;
          });
        }
      }
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce Commandes ?",
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
        axios
          .delete(`http://localhost:8000/api/commandes/${id}`)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Commandes supprimé avec succès.",
            });
            fetchData();
          })
          .catch((error) => {
            console.error("Erreur lors de la suppression du Commandes:", error);
            Swal.fire({
              icon: "error",
              title: "Erreur!",
              text: "Échec de la suppression du Commandes.",
            });
          });
      } else {
        console.log("Suppression annulée");
      }
    });
  };

  const handleShowFormButtonClick = () => {
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "-0%" });
      setTableContainerStyle({ marginRight: "1200px" });
    } else {
      closeForm();
    }
  };
  const handleDeleteAllSelection = () => {
    // Clear the selected products data
    setSelectedProductsData([]);
  };
  const closeForm = () => {
    handleDeleteAllSelection();
    setFormContainerStyle({ right: "-100%" });
    setTableContainerStyle({ marginRight: "0" });
    setShowForm(false); // Hide the form
    setFormData({
      // Clear form data
      reference: "",
      dateCommande: "",
      datePreparationCommande: "",
      client_id: "",
      site_id: "",
      mode_payement: "",
      status: "",
      user_id: "",
      produit_id: "",
      prix_unitaire: "",
      quantite: "",
    });
    setEditingCommandes(null); // Clear editing client
  };
  //---------------------------Produit--------------------------

  const handleProductSelection = (selectedProduct, index) => {
    console.log("selectedProduct", selectedProduct);
    const updatedSelectedProductsData = [...selectedProductsData];
    updatedSelectedProductsData[index] = selectedProduct;
    setSelectedProductsData(updatedSelectedProductsData);
    console.log("selectedProductsData", selectedProductsData);
  };

  useEffect(() => {
    const filtered = commandes.filter((Commandes) =>
      Commandes.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCommandes(filtered);
  }, [commandes, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCheckboxChange = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(commandes.map((Commandes) => Commandes.id));
    }
  };
  const handleAddEmptyRow = () => {
    setSelectedProductsData([...selectedProductsData, {}]);
    console.log("selectedProductData", selectedProductsData);
  };
  const handleClientSelection = (selected) => {
    if (selected && selected.length > 0) {
      console.log("selectedClient", selected);
      setSelectedClientId(selected[0].value);
    }
  };
  const handleDeleteProduct = (index, id) => {
    const updatedSelectedProductsData = [...selectedProductsData];
    updatedSelectedProductsData.splice(index, 1);
    setSelectedProductsData(updatedSelectedProductsData);
    if (id) {
      axios
        .delete(`http://localhost:8000/api/lignePreparationCommandes/${id}`)
        .then(() => {
          fetchData();
        });
    }
  };
  const getClientValue = (clientId, field) => {
    const client = clients.find((p) => p.id === clientId);

    if (client) {
      return client[field];
    }
    return "";
  };
  const getSiteClientValue = (siteClientId, field) => {
    const site = siteClients.find((p) => p.id === siteClientId);

    if (site) {
      return site[field];
    }

    return "";
  };
  const calculateRowColor = (ligne_commandes, preparations) => {
    if (!Array.isArray(ligne_commandes) || !Array.isArray(preparations)) {
      console.error(
        "Expected arrays but received:",
        ligne_commandes,
        preparations
      );
      return "#FF8787"; // Retourner rouge en cas d'erreur ou d'absence de préparations
    }

    const totalCommandes = calculateTotalQuantity(ligne_commandes);
    const totalPreparation =
      calculateTotalPreparationQuantityForCommande(preparations);
    console.log("Total des lignes de commande:", totalCommandes);
    console.log(
      "Total des lignes de préparation pour la commande:",
      totalPreparation
    );
    return totalCommandes === totalPreparation ? "#87A922" : "#FCDC2A";
  };

  const handleShowPreparationForm = (commande) => {
    // Réinitialiser les valeurs du formulaire de préparation
    setFormData({
      reference: commande.reference,
      dateCommande: commande.dateCommande,
      client_id: commande.client_id,
      site_id: commande.site_id,
      mode_payement: commande.mode_payement,
      datePreparationCommande: "",
      produit_id: "",
      prix_unitaire: 12,
      quantite: "",
      lot: "",
    });
    setEditingCommandes(commande);
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "1200px" });
    } else {
      closeForm();
    }
  };
  if (filteredCommandes) {
    console.log("filteredCommandes:", filteredCommandes);
  }

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{  position:'absolute',
        top:'0px',
        left:'220px',
        width:'90%' }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
          <Toolbar />
          <div className="d-flex justify-content-center align-items-center">
            <div className="col-md-auto" style={{ width: "700px" }}>
              <Search onSearch={handleSearch} type="search" />
            </div>
          </div>
          <h3>Preparation des Commandes</h3>
          <div
            id="formContainerCommande"
            style={{ ...formContainerStyle, padding: "50px" }}
          >
            <Form className="row" onSubmit={handleSubmit}>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="mode_payement" className="col-form-label">
                      Mode Paiement:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control"
                      id="mode_payement"
                      name="mode_payement"
                      value={formData.mode_payement}
                      readOnly // Make the input read-only
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
                      value={getClientValue(
                        formData.client_id,
                        "raison_sociale"
                      )}
                      readOnly // Make the input read-only
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="site_id" className="col-form-label">
                      Site Client:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      className={
                        formData.site_id
                          ? "form-control"
                          : "text-danger form-control"
                      }
                      id="site_id"
                      name="site_id"
                      value={
                        formData.site_id
                          ? getSiteClientValue(
                              formData.site_id,
                              "raison_sociale"
                            )
                          : "aucun site"
                      }
                      readOnly // Make the input read-only
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="status" className="col-form-label">
                      Status:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control"
                      id="status"
                      name="status"
                      value={formData.status
                        }
                      readOnly // Make the input read-only
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="dateCommande" className="col-form-label">
                      Date Commande:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control"
                      id="dateCommande"
                      name="dateCommande"
                      value={formData.dateCommande}
                      readOnly // Make the input read-only
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label
                      htmlFor="datePreparationCommande"
                      className="col-form-label"
                    >
                      Date Preparation Commande:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <Form.Group controlId="datePreparationCommande">
                      <Form.Control
                        type="date"
                        name="datePreparationCommande"
                        value={formData.datePreparationCommande}
                        onChange={handleChange}
                        className="form-control-sm"
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="codePreparation" className="col-form-label">
                      Code de Préparation:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control"
                      id="CodePreparation"
                      name="codePreparation"
                      value={formData.codePreparation}
                      onChange={handleChange} // Assurez-vous que handleChange met à jour le formData
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="status" className="col-form-label">
                      Statut:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <select
                      className="form-control"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange} // Assurez-vous que handleChange met à jour le formData
                    >
                      <option value="En attente" >En attente</option>
                      <option value="En cours">En cours</option>
                      <option value="Valide">Valide</option>
                    </select>
                  </div>
                </div>
              </div>
              {editingCommandes && (
                <>
                  {calculateTotalQuantity(
                    editingCommandes.ligne_preparation_commandes
                  ) !==
                    calculateTotalQuantity(
                      editingCommandes.ligne_commandes
                    ) && (
                    <div>
                      <Button
                        className="btn btn-sm mb-2"
                        variant="primary"
                        onClick={handleAddEmptyRow}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </Button>
                      <strong>Ajouter Produit</strong>
                    </div>
                  )}

                  {/* Add other JSX elements with the same condition */}
                </>
              )}

              <div className="col-md-12">
                {console.log("selectedProductsData:", selectedProductsData)}
                <Form.Group controlId="selectedProduitTable">
                  <div className="table-responsive">
                    <table className="table table-bordered ">
                      <thead>
                        <tr>
                          <th>Code Produit</th>
                          <th>Designation</th>
                          <th>Calibre</th>
                          <th>Quantité</th>
                          <th>Lot</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProductsData.map((productData, index) => {
                          console.log("Selected Product Data:", productData); // Ajout du console.log ici
                          return (
                            <tr key={index}>
                              <td>
                                <Select
                                  options={produits.map((produit) => ({
                                    value: produit.id,
                                    label: produit.Code_produit,
                                  }))}
                                  onChange={(selected) => {
                                    const produit = produits.find(
                                      (prod) => prod.id === selected[0].value
                                    );
                                    handleProductSelection(
                                      {
                                        produit_id: selected[0].value,
                                        Code_produit: produit.Code_produit,
                                        designation: produit.designation,
                                        calibre_id: produit.calibre_id,
                                      },
                                      index
                                    );
                                  }}
                                  values={
                                    productData.produit_id
                                      ? [
                                          {
                                            value: productData.produit_id,
                                            label: productData.Code_produit,
                                          },
                                        ]
                                      : []
                                  }
                                  placeholder="Code ..."
                                />
                              </td>
                              <td>{productData.designation}</td>
                              <td>{productData.calibre_id}</td>
                              <td>
                                <input
                                  type="text"
                                  className={
                                    warningIndexes.includes(index)
                                      ? "input-warning"
                                      : ""
                                  }
                                  id={`quantite_${index}_${productData.produit_id}`}
                                  // className="quantiteInput"
                                  placeholder={productData.quantite}
                                  value={
                                    modifiedQuantiteValues[
                                      `${index}_${productData.produit_id}`
                                    ] ||
                                    populateProductInputs(
                                      productData.id,
                                      "quantite_lot"
                                    )
                                  }
                                  onChange={(event) =>
                                    handleInputChange(index, "quantite", event)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  id={`lot_${index}_${productData.produit_id}`}
                                  className="lotInput"
                                  placeholder="Lot"
                                  value={
                                    modifiedLotValues[
                                      `${index}_${productData.produit_id}`
                                    ] ||
                                    populateProductInputs(productData.id, "lot")
                                  }
                                  onChange={(event) =>
                                    handleInputChange(index, "lot", event)
                                  }
                                />
                              </td>
                              <td>
                                <Button
                                  className=" btn btn-danger btn-sm m-1"
                                  onClick={() =>
                                    handleDeleteProduct(index, productData.id)
                                  }
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Form.Group>
              </div>

              <Form.Group className="col m-3 text-center">
                <Button type="submit" className="btn btn-sm col-4">
                  {editingCommandes ? "Modifier" : "Valider"}
                </Button>
                <Button
                  className="btn btn-secondary col-4 offset-1"
                  onClick={closeForm}
                >
                  Annuler
                </Button>
              </Form.Group>
            </Form>
          </div>
          <div
            id="tableContainer"
            className="table-responsive-sm"
            style={tableContainerStyle}
          >
            <table className="table table-bordered">
              <thead
                className="text-center "
                style={{ backgroundColor: "#ddd" }}
              >
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAllChange}
                    />
                  </th>
                  <th>Code de Preparation</th>
                  <th>Statut de Preparation</th>
                  <th>Date Preparation Commande</th>
                  <th>Reference</th>
                  <th>Client</th>
                  <th>Site Client</th>
                  <th>Date Commande</th>
                  <th>Mode de Paiement</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              
              <tbody className="text-center">
                {filteredCommandes &&
                  filteredCommandes.map((commande) => (
                    <React.Fragment key={commande.id}>
                      {commande.preparations &&
                      commande.preparations.length > 0 ? (
                        commande.preparations.map((preparation) => (
                          <React.Fragment key={preparation.id}>
                            <tr
                              style={{
                                backgroundColor: calculateRowColor(
                                  commande.ligne_commandes,
                                  commande.preparations
                                ),
                              }}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  onChange={() =>
                                    handleCheckboxChange(commande.id)
                                  }
                                  checked={selectedItems.includes(commande.id)}
                                />
                              </td>
                              <td>
                                <Button
                                  className="btn btn-sm btn-light"
                                  style={{ marginRight: "10px" }}
                                  onClick={() =>
                                    handleShowLignePreparationCommandes(
                                      preparation.id
                                    )
                                  }
                                >
                                  <FontAwesomeIcon
                                    icon={
                                      expandedPrepRows.includes(preparation.id)
                                        ? faMinus
                                        : faPlus
                                    }
                                  />
                                </Button>
                                {preparation.CodePreparation}
                              </td>
                              <td>{preparation.status}</td>
                              <td>{preparation.datePreparationCommande}</td>
                              <td>{commande.reference}</td>
                              <td>
                                {getClientValue(
                                  commande.client_id,
                                  "raison_sociale"
                                )}
                              </td>
                              <td
                                className={
                                  commande.site_id ? "" : "text-danger"
                                }
                              >
                                {commande.site_id
                                  ? getSiteClientValue(
                                      commande.site_id,
                                      "raison_sociale"
                                    )
                                  : "aucun site"}
                              </td>
                              <td>{commande.dateCommande}</td>
                              <td>{commande.mode_payement}</td>
                              <td>{commande.status}</td>
                              <td>
                                {calculateTotalQuantity(
                                  commande.ligne_commandes
                                )}
                              </td>
                              <td>
                                <div className="d-inline-flex text-center">
                                  <Button
                                    className="btn btn-sm btn-info m-1"
                                    onClick={() => handleEdit(commande)}
                                  >
                                    <i className="fas fa-edit"></i>
                                  </Button>
                                  <Button
                                    className="btn btn-sm btn-light m-1"
                                    onClick={() =>
                                      handleShowPreparationForm(commande)
                                    }
                                  >
                                    Ajouter une préparation
                                  </Button>
                                  <Button
                                    className="btn btn-sm btn-light"
                                    onClick={() =>
                                      handleShowLigneCommandes(commande.id)
                                    }
                                  >
                                    <FontAwesomeIcon icon={faList} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {expandedPrepRows.includes(preparation.id) && (
                              <tr>
                                <td colSpan="12" style={{ padding: "0" }}>
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
                                          <th
                                            Colspan="4"
                                            style={{
                                              backgroundColor: "#EEEEEE",
                                            }}
                                          >
                                            Liste des lignes de Préparation
                                            Commandes
                                          </th>
                                        </tr>
                                        <tr>
                                          <th
                                            style={{
                                              backgroundColor: "#ddd",
                                            }}
                                          >
                                            Code Produit
                                          </th>
                                          <th
                                            style={{
                                              backgroundColor: "#ddd",
                                            }}
                                          >
                                            Designation
                                          </th>
                                          <th
                                            style={{
                                              backgroundColor: "#ddd",
                                            }}
                                          >
                                            Quantite
                                          </th>
                                          <th
                                            style={{
                                              backgroundColor: "#ddd",
                                            }}
                                          >
                                            Calibre
                                          </th>
                                          <th
                                            style={{
                                              backgroundColor: "#ddd",
                                            }}
                                          >
                                            Prix Unitaire
                                          </th>
                                          <th
                                            style={{
                                              backgroundColor: "#ddd",
                                            }}
                                          >
                                            Lot
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {preparation.lignes_preparation.map(
                                          (lignePreparationCommande) => {
                                            const produit = produits.find(
                                              (prod) =>
                                                prod.id ===
                                                lignePreparationCommande.produit_id
                                            );

                                            return (
                                              <tr
                                                key={
                                                  lignePreparationCommande.id
                                                }
                                              >
                                                <td>{produit.Code_produit}</td>
                                                <td>{produit.designation}</td>
                                                <td>
                                                  {
                                                    lignePreparationCommande.quantite
                                                  }
                                                </td>
                                                <td>
                                                  {produit.calibre.calibre}
                                                </td>
                                                <td>
                                                  {
                                                    lignePreparationCommande.prix_unitaire
                                                  }{" "}
                                                  DH
                                                </td>
                                                <td>
                                                  {lignePreparationCommande.lot}
                                                </td>
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
                            {expandedRows.includes(commande.id) &&
                              commande.ligne_commandes && (
                                <tr>
                                  <td
                                    colSpan="12"
                                    style={{
                                      padding: "0",
                                    }}
                                  >
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
                                            <th
                                              Colspan="4"
                                              style={{
                                                backgroundColor: "#EEEEEE ",
                                              }}
                                            >
                                              Liste des ligne de Commandes
                                            </th>
                                          </tr>
                                          <tr>
                                            <th
                                              style={{
                                                backgroundColor: "#ddd",
                                              }}
                                            >
                                              Produit
                                            </th>
                                            <th
                                              style={{
                                                backgroundColor: "#ddd",
                                              }}
                                            >
                                              Quantite
                                            </th>
                                            <th
                                              style={{
                                                backgroundColor: "#ddd",
                                              }}
                                            >
                                              Prix Vente
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {commande.ligne_commandes.map(
                                            (ligneCommande) => (
                                              <tr key={ligneCommande.id}>
                                                <td>
                                                  {ligneCommande.produit_id}
                                                </td>
                                                <td>
                                                  {ligneCommande.quantite}
                                                </td>
                                                <td>
                                                  {ligneCommande.prix_unitaire}{" "}
                                                  DH
                                                </td>
                                              </tr>
                                            )
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr style={{ backgroundColor: "red" }}>
                          <td>
                            <input
                              type="checkbox"
                              onChange={() => handleCheckboxChange(commande.id)}
                              checked={selectedItems.includes(commande.id)}
                            />
                          </td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td>{commande.reference}</td>
                          <td>
                            {getClientValue(
                              commande.client_id,
                              "raison_sociale"
                            )}
                          </td>
                          <td className={commande.site_id ? "" : "text-danger"}>
                            {commande.site_id
                              ? getSiteClientValue(
                                  commande.site_id,
                                  "raison_sociale"
                                )
                              : "aucun site"}
                          </td>
                          <td>{commande.dateCommande}</td>
                          <td>{commande.mode_payement}</td>
                          <td>{commande.status}</td>
                          <td>
                            {calculateTotalQuantity(commande.ligne_commandes)}
                          </td>
                          <td>
                            <div className="d-inline-flex text-center">
                              <Button
                                className="btn btn-sm btn-info m-1"
                                onClick={() => handleEdit(commande)}
                              >
      <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button
                                className="btn btn-sm btn-light m-1"
                                onClick={() =>
                                  handleShowPreparationForm(commande)
                                }
                              >
                                Ajouter une préparation
                              </Button>
                              <Button
                                className="btn btn-sm btn-light"
                                onClick={() =>
                                  handleShowLigneCommandes(commande.id)
                                }
                              >
                                <FontAwesomeIcon icon={faList} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredCommandes.length}
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

export default CommandeList;
