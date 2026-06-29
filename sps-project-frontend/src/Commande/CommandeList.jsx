import React, { useState, useEffect } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Navigation from "../Acceuil/Navigation";
import { Form, Button, Card } from "react-bootstrap";
import { CardContent, Fab, Toolbar, Typography } from "@mui/material";
import PrintList from "./PrintCommandes";
import ExportPdfButton from "./ExportPdfCommande";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faTrash,
  faPlus,
  faMinus,
  faFileExcel,
  faEdit,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import Select from "react-dropdown-select";
import "jspdf-autotable";
import Swal from "sweetalert2";
import Search from "../Acceuil/Search";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TablePagination from "@mui/material/TablePagination";
import "../style.css";
import { useOpen } from "../Acceuil/OpenProvider";
import { width } from "@mui/system";
const CommandeList = () => {
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [commandes, setCommandes] = useState([]);
  const [selectedClient, setSelectedClient] = useState([]);
  const [clients, setClients] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedClient, setExpandedClient] = useState([]);
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [modifiedPrixValues, setModifiedPrixValues] = useState({});
  const [modifiedQuantiteValues, setModifiedQuantiteValues] = useState({});
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfTokenMeta ? csrfTokenMeta.content : null;
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [authId, setAuthId] = useState([]);
  const [selectedSiteClient, setSelectedSiteClient] = useState(null);
  useState(null);
  const [formData, setFormData] = useState({
    reference: "",
    dateCommande: "",
    client_id: "",
    site_id: "",
    mode_payement: "",
    status: "",
    user_id: authId,
    produit_id: "",
    prix_unitaire: "",
    quantite: "",
  });
  const [existingLigneCommandes, setExistingLigneCommandes] = useState([]);
  const [siteClients, setSiteClients] = useState([]);
  const [editingCommandes, setEditingCommandes] = useState(null);
  const [editingCommandesId, setEditingCommandesId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expand_total, setExpandTotal] = useState([]);
  const [expand_status, setExpandedStatus] = useState([]);
  const calibres = produits.map((produit) => produit.calibre?.calibre);
  const uniqueCalibres = [...new Set(calibres)];
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    width: "100%",
  });

  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  // const fetchData = async () => {
  //   try {
  //     const response = await axios.get("http://localhost:8000/api/commandes");
  //     setCommandes(response.data.commandes);
  //     const clientResponse = await axios.get(
  //       "http://localhost:8000/api/clients"
  //     );
  //     setClients(clientResponse.data.client);

  //     const produitResponse = await axios.get(
  //       "http://localhost:8000/api/produits"
  //     );
  //     setProduits(produitResponse.data.produit);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 5));
    setPage(0);
  };
  useEffect(() => {
    if (editingCommandesId) {
      fetchExistingLigneCommandes(editingCommandesId);
      console.log(existingLigneCommandes);
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

  const handleShowTotalDetails = (commande) => {
    const selectedProducts = commande.ligne_commandes.map((ligneCommande) => {
      const product = produits.find(
        (produit) => produit.id === ligneCommande.produit_id
      );
      return {
        id: ligneCommande.id,
        Code_produit: product.Code_produit,
        calibre_id: product.calibre_id,
        calibre: product.calibre,
        designation: product.designation,
        produit_id: ligneCommande.produit_id,
        quantite: ligneCommande.quantite,
        prix_unitaire: ligneCommande.prix_unitaire,
      };
    });
    setSelectedProductsData(selectedProducts);

    setExpandTotal((prevRows) =>
      prevRows.includes(commande.id)
        ? prevRows.filter((row) => row !== commande.id)
        : [...prevRows, commande.id]
    );
  };
  const handleShowLigneCommandes = async (commandeId) => {
    setExpandedRows((prevRows) =>
      prevRows.includes(commandeId)
        ? prevRows.filter((row) => row !== commandeId)
        : [...prevRows, commandeId]
    );
  };
  const handleShowSiteClients = async (commandeId) => {
    setExpandedClient((prevRows) =>
      prevRows.includes(commandeId)
        ? prevRows.filter((row) => row !== commandeId)
        : [...prevRows, commandeId]
    );
  };
  const handleShowStatusCommandes = async (commande) => {
    setExpandedStatus((prevRows) =>
      prevRows.includes(commande)
        ? prevRows.filter((row) => row !== commande)
        : [...prevRows, commande]
    );
  };
  const exportToExcel = () => {
    const selectedClients = clients.filter((client) =>
      selectedItems.includes(client.id)
    );
    const ws = XLSX.utils.json_to_sheet(selectedClients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "clients.xlsx");
  };
  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/getAllDataComande");
      
      const { user, commandes, clients, siteclients, produits } = response.data;
      
      setAuthId(user.id);
      setCommandes(commandes);
      setClients(clients);
      setSiteClients(siteclients);
      setProduits(produits);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    // Update formData.client_id when commande changes
    if (editingCommandes) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        client_id: editingCommandes.client_id,
      }));
    }
  }, [editingCommandes]);
  const handleChange = (e) => {
    console.log(e.target.value);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getElementValueById = (id) => {
    return document.getElementById(id)?.value || "";
  };
  const calculateTotalQuantity = (ligneCommandes) => {
    // fetchData();
    return ligneCommandes.reduce((total, ligneCommande) => {
      return total + ligneCommande.quantite;
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
  const populateProductInputs = (ligneCommandId, inputType) => {
    console.log("ligneCommandId", ligneCommandId);
    const existingLigneCommande = selectedProductsData.find(
      (ligneCommande) => ligneCommande.id === ligneCommandId
    );
    console.log("existing LigneCommande", existingLigneCommandes);

    if (existingLigneCommande) {
      return existingLigneCommande[inputType];
    }
    return "";
  };

  const getTotalForCalibre = (ligneCommandes, calibre, produits) => {
    // Filter ligneCommandes for the given calibre
    const ligneCommandesForCalibre = ligneCommandes.filter(
      (ligne) =>
        produits.find((produit) => produit.id === ligne.produit_id)?.calibre
          .calibre === calibre
    );

    // Calculate the total quantity for the calibre
    const total = ligneCommandesForCalibre.reduce(
      (acc, ligne) => acc + ligne.quantite,
      0
    );

    return total;
  };
  const generateUniqueCode = () => {
    const now = new Date();
    const timestamp = now.getTime(); // Current timestamp in milliseconds
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
  
    return `PREP-${timestamp}-${randomNum}`;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // const userResponse = await axios.get("http://localhost:8000/api/users", {
      //   withCredentials: true,
      //   headers: {
      //     "X-CSRF-TOKEN": csrfToken,
      //   },
      // });

      // const authenticatedUserId = userResponse.data[0].id;
      // console.log("auth user", authenticatedUserId);
      // Préparer les données du Commandes
      const CommandesData = {
        dateCommande: formData.dateCommande,
        status: formData.status,
        mode_payement: formData.mode_payement,
        site_id: selectedSiteClient ? selectedSiteClient.id : null,
        client_id: selectedClient.id,
        user_id: authId,
      };

      let response;
      if (editingCommandes) {
        if(editingCommandes.status !=='Valide'){

        
        // Mettre à jour le Commandes existant
        response = await axios.put(
          `http://localhost:8000/api/commandes/${editingCommandes.id}`,
          {
            dateCommande: formData.dateCommande,
            status: formData.status,
            mode_payement: formData.mode_payement,
            site_id: selectedSiteClient ? selectedSiteClient.id : null,
            client_id: selectedClient.id,
            user_id: authId,
          }
        );
console.log('editingCommandes.status',editingCommandes.status,formData.status,response)

        
        console.log("existing LigneCommandes", selectedProductsData);
        const selectedPrdsData = selectedProductsData.map(
          (selectedProduct, index) => {
            // const existingLigneCommande = existingLigneCommandes.find(
            //   (ligneCommande) =>
            //     ligneCommande.produit_id === selectedProduct.produit_id
            // );
           

            return {
              id: selectedProduct.id,
              commande_id: editingCommandes.id,
              produit_id: selectedProduct.produit_id,
              quantite: getElementValueById(
                `quantite_${index}_${selectedProduct.produit_id}`
              )?getElementValueById(
                `quantite_${index}_${selectedProduct.produit_id}`
              ):selectedProduct.quantite              ,
              prix_unitaire: getElementValueById(
                `prix_unitaire_${index}_${selectedProduct.produit_id}`
              )? getElementValueById(
                `prix_unitaire_${index}_${selectedProduct.produit_id}`
              ):selectedProduct.
              prix_unitaire
              ,
              // Update other properties as needed
            };
          }
        );
        let preparationResponse;
        if((editingCommandes.status ==='Non Valide' || editingCommandes.status ==='Annuler' )&& formData.status==='Valide'){
           preparationResponse = await axios.post(
            `http://localhost:8000/api/PreparationCommandes`,
            {
              commande_id:response.data.
              commande
              .id,
               datePreparationCommande: new Date().toISOString().split('T')[0],
              status_preparation: 'En Attente',
              CodePreparation: 'P'+ generateUniqueCode(),
  
            }
          );
          console.log('preparationResponse',preparationResponse)

        }
        if((formData.status ==='Non Valide' || formData.status ==='Annuler') && editingCommandes.status==='Valide'){
          preparationResponse = await axios.delete(
           `http://localhost:8000/api/PreparationCommandes/${formData.idpreparation}`,
          )

       }
        console.log("selectedPrdsData:", selectedPrdsData);
        for (const ligneCommandeData of selectedPrdsData) {
          // Check if ligneCommande already exists for this produit_id and update accordingly
          if((editingCommandes.status ==='Non Valide' || editingCommandes.status ==='Annuler' ) && formData.status==='Valide'){
            
            console.log('preparationResponse',preparationResponse)
            await axios.post(
              "http://localhost:8000/api/lignePreparationCommandes",
              {
                preparation_id:preparationResponse.data.id,
                produit_id:ligneCommandeData.produit_id,
                quantite:ligneCommandeData.quantite,
                prix_unitaire:ligneCommandeData.prix_unitaire,
                
  
              },
            )
          }
          if (ligneCommandeData.id) {
            console.log(ligneCommandeData.id);
            await axios.put(
              `http://localhost:8000/api/ligneCommandes/${ligneCommandeData.id}`,
              ligneCommandeData,
              {
                withCredentials: true,
                headers: {
                  "X-CSRF-TOKEN": csrfToken,
                },
              }
            );
            if(editingCommandes.status ==='Valide' && formData.status==='Valide'){
              await axios.put(
                `http://localhost:8000/api/lignePreparationCommandes${ce}`,
                {
                  preparation_id:preparationResponse.data.id,
                  produit_id:ligneCommandeData.produit_id,
                  quantite:ligneCommandeData.quantite,
                  prix_unitaire:ligneCommandeData.prix_unitaire,
                  
    
                },
              )
            }
          } else {
            await axios.post(
              "http://localhost:8000/api/ligneCommandes",
              ligneCommandeData,
              {
                withCredentials: true,
                headers: {
                  "X-CSRF-TOKEN": csrfToken,
                },
              }
              
            );
            if(editingCommandes.status ==='Valide' && formData.status==='Valide'){
              await axios.post(
                "http://localhost:8000/api/lignePreparationCommandes",
                {
                  preparation_id:preparationResponse.data.id,
                  produit_id:ligneCommandeData.produit_id,
                  quantite:ligneCommandeData.quantite,
                  prix_unitaire:ligneCommandeData.prix_unitaire,
                  
    
                },
              )
            }
          }
        }

        const existingStatusesResponse = await axios.get(
          "http://localhost:8000/api/statusCommande"
        );
        const existingStatuses = existingStatusesResponse.data.StatusCommande;

        const selectedStatus = getElementValueById("status");
        const statusExists = existingStatuses.some(
          (status) => status.status === selectedStatus
        );
        const statusCommandeData = {
          commande_id: editingCommandes.id,
          status: getElementValueById("status"),
          // Update other properties as needed
        };
        // if (!statusExists) {
        await axios.post(
          `http://localhost:8000/api/statusCommande/`,
          statusCommandeData,
          {
            withCredentials: true,
            headers: {
              "X-CSRF-TOKEN": csrfToken,
            },
          }
        );
      }else{
        Swal.fire({
          icon: "error",
          title: "Erreur !",
          text: "Commande deja valide !",
        });
        return
      }
    } else {
        // Créer un nouveau Commandes
        response = await axios.post(
          "http://localhost:8000/api/commandes",
          CommandesData
        );
        const selectedPrdsData = selectedProductsData.map(
          (selectProduct, index) => {
            return {
              commande_id: response.data.commande.id,
              produit_id: selectProduct.produit_id,
              quantite: getElementValueById(
                `quantite_${index}_${selectProduct.produit_id}`
              ),
              prix_unitaire: getElementValueById(
                `prix_unitaire_${index}_${selectProduct.produit_id}`
              ),
            };
          }
        );
        console.log("selectedPrdsData", selectedPrdsData);
        for (const ligneCommandesData of selectedPrdsData) {
          // Sinon, il s'agit d'une nouvelle ligne de Commandes
          await axios.post(
            "http://localhost:8000/api/ligneCommandes",
            ligneCommandesData
          );
        }
        const statusCommandeData = {
          commande_id: response.data.commande.id,
          status: "En cours",
        };
        await axios.post(
          "http://localhost:8000/api/statusCommande",
          statusCommandeData,
          {
            withCredentials: true,
            headers: {
              "X-CSRF-TOKEN": csrfToken,
            },
          }
        );
      }
      console.log("response of postCommande: ", response.data);

      fetchData();

      setSelectedClient([]);
      setSelectedSiteClient([]);
      setSelectedProductsData([]);
      fetchExistingLigneCommandes();
      closeForm();

      // Afficher un message de succès à l'utilisateur
      Swal.fire({
        icon: "success",
        title: "Commande ajoutée avec succès",
        text: "La commande a été ajoutée avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la soumission des données :", error);

      // Afficher un message d'erreur à l'utilisateur
      Swal.fire({
        icon: "error",
        title: "Erreur !",
        text: "Erreur !",
      });
    }
    closeForm();
  };
  const getProduitValue = (produitId, field) => {
    // Find the product in the produits array based on produitId
    const produit = produits.find((p) => p.id === produitId);

    // If the product is found, return the value of the specified field
    if (produit) {
      return produit[field];
    }

    // If the product is not found, return an empty string or any default value
    return "";
  };
  const getClientValue = (clientId, field) => {
    // Find the product in the produits array based on produitId
    const client = clients.find((p) => p.id === clientId);

    // If the product is found, return the value of the specified field
    if (client) {
      return client[field];
    }

    // If the product is not found, return an empty string or any default value
    return "";
  };

  const getSiteClientValue = (siteClientId, field) => {
    const siteClient = siteClients.find((s) => s.id === siteClientId);

    // If the product is found, return the value of the specified field
    if (siteClient) {
      return siteClient[field];
    }

    // If the product is not found, return an empty string or any default value
    return "";
  };
  const handleEdit = (commande) => {
    console.log('commande',commande)
    setModifiedQuantiteValues({});
    setModifiedPrixValues({});
    setEditingCommandesId(commande.id);
    setEditingCommandes(commande);
    console.log(commande);
    setFormData({
      reference: commande.reference,
      idpreparation:commande.
      latest_preparation!==null?commande.
      latest_preparation.id:'' ,
      dateCommande: commande.dateCommande,
      client_id: commande.client_id,
      site_id: commande.site_id,
      mode_payement: commande.mode_payement,
      status: commande.status,
    });

    console.log("formData,", formData);

    const selectedProducts = commande.ligne_commandes.map((ligneCommande) => {
      const product = produits.find(
        (produit) => produit.id === ligneCommande.produit_id
      );

      return {
        id: ligneCommande.id,
        Code_produit: product.Code_produit,
        calibre_id: product.calibre_id,
        designation: product.designation,
        produit_id: ligneCommande.produit_id,
        quantite: ligneCommande.quantite,
        prix_unitaire: ligneCommande.prix_unitaire,

      };
    });

    setSelectedProductsData(selectedProducts);

    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ width:'62%' });
    } else {
      closeForm();
    }
  };
  const handleInputChange = (index, inputType, event) => {
    const newValue = event.target.value;
    console.log("selectedProductsData", selectedProductsData);
    console.log("index", index);
    if (selectedProductsData[index]) {
      const productId = selectedProductsData[index].produit_id;

      if (inputType === "prix_unitaire") {
        setModifiedPrixValues((prev) => {
          const updatedValues = {
            ...prev,
            [`${index}_${productId}`]: newValue,
          };
          console.log("Modified prix values:", updatedValues);
          return updatedValues;
        });
      } else if (inputType === "quantite") {
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
  };

  // const handleInputChange = (index, inputType, event) => {
  //   const newValue = event.target.value;
  //   const productId = selectedProductsData[index].id;

  //   if (inputType === "prix_unitaire") {
  //     setModifiedPrixValues((prev) => ({
  //       ...prev,
  //       [`${productId}_${index}`]: newValue,
  //     }));
  //   } else if (inputType === "quantite") {
  //     setModifiedQuantiteValues((prev) => ({
  //       ...prev,
  //       [`${productId}_${index}`]: newValue,
  //     }));
  //   }
  // };
  const handleDelete = async (commande) => {
    console.log('commande',commande)
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce Commande ?",
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
  }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Delete the commande
          await axios.delete(`http://localhost:8000/api/commandes/${commande.id}`);
          
          // Optionally delete the preparation if the status is 'Valide'
          // if (commande.status === 'Valide') {
          //   await axios.delete(`http://localhost:8000/api/PreparationCommandes/${commande.latest_preparation
          //     .id}`);
          // }
          
          Swal.fire({
            icon: "success",
            title: "Succès!",
            text: "Commande supprimée avec succès.",
          });
          fetchData(); // Refresh the data after deletion
        } catch (error) {
          console.error("Erreur lors de la suppression de la commande:", error);
          Swal.fire({
            icon: "error",
            title: "Erreur!",
            text: "Échec de la suppression de la commande.",
          });
        }
      } else {
        console.log("Suppression annulée");
      }
    });
  };
  

  const handleShowFormButtonClick = () => {
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "-0%" });
      setTableContainerStyle({width:'62%'});
    } else {
      closeForm();
    }
  };

  const closeForm = () => {
    handleDeleteAllSelection();
    handleClientSelection(null); // Réinitialise la sélection du client
    handleSiteClientSelection(null); // Réinitialise la sélection du site client
    setFormContainerStyle({ right: "-100%" });
    setTableContainerStyle({width:'100%' });
    setShowForm(false); // Hide the form
    setSelectedClient([null]);
    setSelectedSiteClient([null]);
    setFormData({
      // Clear form data
      reference: "",
      dateCommande: "",
      client_id: "",
      site_id: "",
      mode_payement: "",
      status: "",
      user_id: authId,
      produit_id: "",
      prix_unitaire: "",
      quantite: "",
    });
    setEditingCommandes(null); // Clear editing client
    setSelectedProductsData([])
    setSelectedClient([])
  };
  //---------------------------Produit--------------------------

  // const handleClientSelection = (selectedOption) => {
  //   console.log("Selected option:", selectedOption);
  //   if (selectedOption && selectedOption.length > 0) {
  //     // Handle the selected client
  //     console.log("Selected client:", selectedOption[0].value);
  //     setFormData((prevFormData) => ({
  //       ...prevFormData,
  //       client_id: selectedOption.value,
  //     }));
  //   } else {
  //     console.log("No client selected");
  //   }
  // };

  const handleProductSelection = (selectedProduct, index) => {
    console.log("selectedProduct", selectedProduct);
    const updatedSelectedProductsData = [...selectedProductsData];
    updatedSelectedProductsData[index] = selectedProduct;
    setSelectedProductsData(updatedSelectedProductsData);
    console.log("selectedProductsData", selectedProductsData);
  };
  const handleClientSelection = (selected) => {
    if (selected) {
      setSelectedClient(selected);
      console.log("selectedClient", selectedClient);
    } else {
      setSelectedClient(null);
    }
  };
  // const handleClientSelection = (selected) => {
  //   if (selected && selected.length > 0) {
  //     console.log("selectedOptionClient", selected);
  //     setSelectedClientId(selected[0].value);
  //     const client = clients.find((c) => c.id === selectedClientId);
  //     setSelectedClient(client);
  //     console.log("selected client", selectedClient);
  //   }
  // };
  const handleSiteClientSelection = (selected) => {
    if (selected) {
      setSelectedSiteClient(selected);
      console.log("selectedSiteClient", selectedSiteClient);
    } else {
      setSelectedSiteClient(null);
    }
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

  const handlePrint = (CommandesId) => {
    // Récupérer les informations spécifiques au Commandes sélectionné
    const selectedCommandes = commandes.find(
      (Commandes) => Commandes.id === CommandesId
    );

    // Création d'une nouvelle instance de jsPDF
    const doc = new jsPDF();

    // Position de départ pour l'impression des données
    let startY = 20;

    // Dessiner les informations du client dans un tableau à gauche
    const clientInfo = [
      {
        label: "Raison sociale:",
        value: selectedCommandes.client.raison_sociale,
      },
      { label: "Adresse:", value: selectedCommandes.client.adresse },
      { label: "Téléphone:", value: selectedCommandes.client.tele },
      { label: "ICE:", value: selectedCommandes.client.ice },
      // Ajoutez d'autres informations client si nécessaire
    ];

    // Dessiner le tableau d'informations client à gauche
    doc.setFontSize(10); // Police plus petite pour les informations du client
    clientInfo.forEach((info) => {
      doc.text(`${info.label}`, 10, startY);
      doc.text(`${info.value}`, 40, startY);
      startY += 10; // Espacement entre les lignes du tableau
    });

    // Dessiner le tableau des informations du Commandes à droite
    const CommandesInfo = [
      { label: "N° Commandes:", value: selectedCommandes.reference },
      { label: "Date:", value: selectedCommandes.date },
      {
        label: "Validation de l'offre:",
        value: selectedCommandes.validation_offer,
      },
      { label: "Mode de Paiement:", value: selectedCommandes.modePaiement },
    ];

    // Dessiner le tableau des informations du Commandes à droite
    startY = 20; // Réinitialiser la position Y
    CommandesInfo.forEach((info) => {
      doc.text(`${info.label}`, 120, startY);
      doc.text(`${info.value}`, 160, startY);
      startY += 10; // Espacement entre les lignes du tableau
    });

    // Vérifier si les détails des lignes de Commandes sont définis
    if (selectedCommandes.ligneCommandes) {
      // Dessiner les en-têtes du tableau des lignes de Commandes
      const headersLigneCommandes = [
        "Code produit",
        "Désignation",
        "Quantité",
        "Prix",
        "Total HT",
      ];

      // Récupérer les données des lignes de Commandes
      const rowsLigneCommandes = selectedCommandes.ligneCommandes.map(
        (ligneCommandes) => [
          ligneCommandes.Code_produit,
          ligneCommandes.designation,
          ligneCommandes.quantite,
          ligneCommandes.prix_vente,
          // Calculate the total for each product line
          (ligneCommandes.quantite * ligneCommandes.prix_vente).toFixed(2), // Assuming the price is in currency format
        ]
      );

      // Dessiner le tableau des lignes de Commandes
      doc.autoTable({
        head: [headersLigneCommandes],
        body: rowsLigneCommandes,
        startY: startY + 20, // Décalage vers le bas pour éviter de chevaucher les informations du Commandes
        margin: { top: 20 },
        styles: {
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fontSize: 8, // Police plus petite pour les lignes de Commandes
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Largeur de la première colonne
          1: { cellWidth: 60 }, // Largeur de la deuxième colonne
          2: { cellWidth: 20 }, // Largeur de la troisième colonne
          3: { cellWidth: 30 }, // Largeur de la quatrième colonne
          4: { cellWidth: 30 }, // Largeur de la cinquième colonne
        },
      });

      // Dessiner le tableau des montants
      // const montantTable = [
      //   [
      //     "Montant Total Hors Taxes:",
      //     getTotalHT(selectedCommandes.ligneCommandes).toFixed(2),
      //   ],
      //   [
      //     "TVA (20%):",
      //     calculateTVA(getTotalHT(selectedCommandes.ligneCommandes)).toFixed(2),
      //   ],
      //   ["TTC:", getTotalTTC(selectedCommandes.ligneCommandes).toFixed(2)],
      // ];

      // doc.autoTable({
      //   body: montantTable,
      //   startY: doc.autoTable.previous.finalY + 10,
      //   margin: { top: 20 },
      //   styles: {
      //     lineWidth: 0.1,
      //     lineColor: [0, 0, 0],
      //     fontSize: 10, // Police plus petite pour les montants
      //   },
      // });
    }

    // Enregistrer le fichier PDF avec le nom 'Commandes.pdf'
    doc.save("Commandes.pdf");
  };
  const handleDeleteProduct = (index, id) => {
    const updatedSelectedProductsData = [...selectedProductsData];
    updatedSelectedProductsData.splice(index, 1);
    setSelectedProductsData(updatedSelectedProductsData);
    if (id) {
      axios
        .delete(`http://localhost:8000/api/ligneCommandes/${id}`)
        .then(() => {
          fetchData();
        });
    }
  };
  
  const handleDeleteAllSelection = () => {
    // Clear the selected products data
    setSelectedProductsData([]);
  };
  const handleProductCheckboxChange = (selectedOptions) => {
    const selectedProductIds = selectedOptions.map((option) => option.value);

    const updatedSelectedProducts = produits
      .map((produit) => ({
        ...produit,
        prix: produit.prix_vente, // Initialize prix with prix_vente
      }))
      .filter((produit) => selectedProductIds.includes(produit.id));

    setSelectedProducts(updatedSelectedProducts);
    console.log("selectedProducts :", selectedProducts);
  };

  // Fonction pour calculer le montant total hors taxes
  // const getTotalHT = (ligneCommandes) => {
  //   return ligneCommandes.reduce(
  //     (total, item) => total + item.quantite * item.prix_vente,
  //     0
  //   );
  // };

  // // Fonction pour calculer la TVA
  // const calculateTVA = (totalHT) => {
  //   return totalHT * 0.2; // 20% de TVA
  // };

  // // Fonction pour calculer le montant total toutes taxes comprises (TTC)
  // const getTotalTTC = (ligneCommandes) => {
  //   return (
  //     getTotalHT(ligneCommandes) + calculateTVA(getTotalHT(ligneCommandes))
  //   );
  // };

  const handleAddEmptyRow = () => {
    setSelectedProductsData([...selectedProductsData, {}]);
    console.log("selectedProductData", selectedProductsData);
  };

  const handleDeleteSelected = () => {
    Swal.fire({
      title: "Confirmation de suppression",
      text: "Êtes-vous sûr de vouloir supprimer les éléments sélectionnés ? Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        const promises = selectedItems.map((id) => {
          return axios
            .delete(`http://localhost:8000/api/commandes/${id}`)
            .then(() => {
              return { id, success: true };
            })
            .catch(() => {
              return { id, success: false };
            });
        });

        Promise.all(promises).then((results) => {
          const successCount = results.filter((res) => res.success).length;
          if (successCount === results.length) {
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Toute les commandes sélectionnées ont été supprimées avec succès.",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: "Certains commandes n'ont pas pu être supprimées.",
            });
          }
          fetchData();
          setSelectedItems([]);
        });
      } else {
        setSelectedItems([]);
      }
    });
  };
  const [status ,setStatus]=useState('Non Valide');
const [comandeFiltre ,setCommnadeFiltre]=useState([])

  const handleOrderClick = (filteredOrders) => {
    setCommnadeFiltre(filteredOrders)
  }
  function changeStatus(status){
    setStatus(status)
  }
  useEffect(() => {
    const filteredOrders = commandes.filter(
      (order) => order.status === status
    );
    setCommnadeFiltre(filteredOrders)
    console.log('Status:', status);
    console.log('Commande Filtre:', comandeFiltre);
  },[commandes]); //


  console.log('comandeFiltre',comandeFiltre)
  const getColorByStatus = (status) => {
    switch (status) {
      case "Non Valide":
        return " rgb(253 224 71)";
      case "Annuler":
        return "rgb(249 115 22)";
      case "Valide":
        return "rgb(34 197 94)";
      default:
        return "#ffffff"; // Default color
    }
  };
  const handlePrintLine = (commande) => {
    const printContent = `
      <div>
        <h1>Bon Commande</h1>
        <p>Référence: ${commande.reference}</p>
        <p>Client: ${getClientValue(commande.client_id, 'raison_sociale')}</p>
        <p>Site Client: ${
          commande.site_id
            ? getSiteClientValue(commande.site_id, 'raison_sociale')
            : 'aucun site'
        }</p>
        <p>Date Commande: ${commande.dateCommande}</p>
        <p>Mode de Paiement: ${commande.mode_payement}</p>
        <p>Status: ${commande.status}</p>
  
        <table border="1" cellpadding="5" cellspacing="0" width="100%">
          <thead>
            <tr>
              <th>Calibre</th>
              ${commande.ligne_commandes.map(ligne => {
                const produit = produits.find(prod => prod.id === ligne.produit_id);
                return `<th>${produit.designation}</th>`;
              }).join('')}
              <th>Total (Unité) / Calibre</th>
            </tr>
          </thead>
          <tbody>
            ${uniqueCalibres.map(calibre => `
              <tr>
                <td><strong>calibre: [${calibre}]</strong></td>
                ${commande.ligne_commandes.map(ligne => {
                  const produit = produits.find(prod => prod.id === ligne.produit_id);
                  return `<td>${getQuantity(commande.ligne_commandes, calibre, produit.designation)}</td>`;
                }).join('')}
                <td><strong>${getTotalForCalibre(commande.ligne_commandes, calibre, produits)}</strong></td>
              </tr>
            `).join('')}
            <tr>
              <td><strong>Total</strong></td>
              ${commande.ligne_commandes.map(ligne => {
                const produit = produits.find(prod => prod.id === ligne.produit_id);
                return `<td><strong>${uniqueCalibres.reduce((total, calibre) => {
                  return total + getQuantity(commande.ligne_commandes, calibre, produit.designation);
                }, 0)}</strong></td>`;
              }).join('')}
              <td><strong>${uniqueCalibres.reduce((total, calibre) => {
                return total + getTotalForCalibre(commande.ligne_commandes, calibre, produits);
              }, 0)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  
    const newWindow = window.open('', '_blank');
    newWindow.document.write(printContent);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
    newWindow.close();
  };
  
  
  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles  }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 6 }}>
          {/* <Toolbar /> */}
          {/* <div
            className="d-flex flex-row justify-content-end"
            style={{ marginLeft: "1300px" }}
          >
            <div style={{ width: "500px", marginRight: "20px" }}>
              <Search onSearch={handleSearch} type="search" />
            </div>{" "}
            <PrintList
              tableId="CommandeTable"
              title="Liste des commandes"
              commandes={commandes}
              filteredCommandes={filteredCommandes}
            />{" "}
            <ExportPdfButton
              commandes={commandes}
              selectedItems={selectedItems}
            />{" "}
            <FontAwesomeIcon
              icon={faFileExcel}
              onClick={exportToExcel}
              style={{
                cursor: "pointer",
                color: "green",
                fontSize: "2.5rem",
                marginLeft: "15px",
              }}
            />
          </div>

          <h3 className="text-left" style={{ color: "grey" }}>Liste des Commandes</h3> */}
          <div
            className="d-flex justify-content-between align-items-center"
            
          >
            <h3 className="titreColore" >
             Gestion du Commandes
            </h3>

            <div className="d-flex">
              <div style={{ width: "500px", marginRight: "20px" }}>
                <Search onSearch={handleSearch} type="search" />
              </div>
              <div>
                <PrintList
                  tableId="CommandeTable"
                  title="Liste des commandes"
                  commandes={commandes}
                  filteredCommandes={filteredCommandes}
                />{" "}
                <ExportPdfButton
                  commandes={commandes}
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


          <div style={{ width: "100%"}}>
    <div className="d-flex flex-wrap">
      {[ "Non Valide", "Valide","Annuler"].map((status) => {
        const filteredOrders = commandes.filter(
          (order) => order.status === status
        );
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
    color: "black", // Dark color
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
  <a
            // href="#"
            onClick={handleShowFormButtonClick}
            style={{
              // textDecoration: "none",
             
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              marginTop:'5px',
            }}
            className="AjouteBotton"
          >
            <ShoppingBagIcon style={{ fontSize: "24px", marginRight: "8px" }} className="AjouteBotton"/>
             Ajouter Commande
          </a>
          <div
            id="formContainer"
            style={{ ...formContainerStyle,marginTop:'10px' }}
          >
            <Form className="row" onSubmit={handleSubmit}>
              <Form.Label
              className="text-center m-2"
              style={{
                fontSize: '20px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                color: 'black',
                borderBottom: '2px solid black',
                paddingBottom: '5px',
               
              }}>
                <h5 >
                  {editingCommandes ? "Modifier" : "Ajouter"} une Commande
                </h5>
              </Form.Label>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="client_id" className="col-form-label">
                      Client:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    {console.log("selected client  :", selectedClient)}
                    <Select
                      options={clients.map((client) => ({
                        value: client.id,
                        label: client.raison_sociale,
                      }))}
                      onChange={(selected) => {
                        if (selected && selected.length > 0) {
                          const client = clients.find(
                            (client) => client.id === selected[0].value
                          );
                          handleClientSelection({
                            id: selected[0].value,
                            raison_sociale: client.raison_sociale,
                            adresse: client.adresse,
                            tele: client.tele,
                            abreviation: client.abreviation,
                            code_postal: client.code_postal,
                            ice: client.ice,
                            zone: client.zone,
                            siteclients: client.siteclients,
                          });
                        } else {
                          handleClientSelection(null);
                        }
                      }}
                      values={
                        formData.client_id
                          ? [
                              {
                                value: formData.client_id,
                                label: getClientValue(
                                  formData.client_id,
                                  "raison_sociale"
                                ),
                              },
                            ]
                          : []
                      }
                      placeholder="Client ..."
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
                    {console.log("selected siteClient  :", selectedSiteClient)}
                    <Select
                      options={
                        selectedClient && selectedClient.siteclients
                          ? selectedClient.siteclients.map((site) => ({
                              value: site.id,
                              label: site.raison_sociale,
                            }))
                          : []
                      }
                      onChange={(selected) => {
                        if (selected && selected.length > 0) {
                          const site = siteClients.find(
                            (site) => site.id === selected[0].value
                          );
                          handleSiteClientSelection({
                            id: selected[0].value,
                            raison_sociale: site.raison_sociale,
                            adresse: site.adresse,
                            tele: site.tele,
                            abreviation: site.abreviation,
                            code_postal: site.code_postal,
                            ice: site.ice,
                            zone: site.zone,
                          });
                        } else {
                          handleSiteClientSelection(null); // Handle deselection
                        }
                      }}
                      values={
                        formData.site_id
                          ? [
                              {
                                value: formData.site_id,
                                label: getSiteClientValue(
                                  formData.site_id,
                                  "raison_sociale"
                                ),
                              },
                            ]
                          : []
                      }
                      placeholder="Site client ..."
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="mode_payement" className="col-form-label">
                      Mode Paiement:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <Form.Select
                      name="mode_payement"
                      value={
                        formData ? formData.mode_payement : "Mode de Paiement"
                      }
                      onChange={handleChange}
                    >
                      <option>mode de paiement</option>
                      <option value="Espece">Espece</option>
                      <option value="Tpe">Tpe</option>
                      <option value="Cheque">Cheque</option>
                      {/* Add more payment types as needed */}
                    </Form.Select>
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                {editingCommandes && (
                  <div className="row mb-3">
                    <div className="col-sm-6">
                      <label htmlFor="status" className="col-form-label">
                        Status:
                      </label>
                    </div>
                    <div className="col-sm-6">
                      <Form.Select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="Non Valide">Non Valide</option>
                        <option value="Annuler">Annuler</option>
                        <option value="Valide">Valide</option>
                        {/* Add more statuses as needed */}
                      </Form.Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-md-12">
                <div className="row mb-4">
                  <div className="col-sm-6">
                    <label htmlFor="dateCommande" className="col-form-label">
                      Date Commande:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <Form.Group controlId="dateCommande">
                      <Form.Control
                        controlId="dateCommande"
                        type="date"
                        name="dateCommande"
                        value={formData.dateCommande}
                        onChange={handleChange}
                        className="form-control-sm"
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>
              <div>
                <Button
                  className="btn btn-sm mb-2 "
                  variant="primary"
                  onClick={handleAddEmptyRow}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
                <strong style={{ marginLeft: "12px" }}>Ajouter Produit</strong>
              </div>

              
                    <Form.Group controlId="" >
                      
                        <table className="table table-bordered ">
                          <thead>
                            <tr>
                              <th  className="ColoretableForm" >Code Produit</th>
                              <th  className="ColoretableForm" >Designation</th>
                              <th  className="ColoretableForm" >Calibre</th>
                              <th  className="ColoretableForm" >Quantité</th>
                              <th  className="ColoretableForm" >Prix vente</th>
                              <th  className="ColoretableForm" >Action</th>
                            </tr>
                          </thead>
                        
                          <tbody style={{zIndex:'9999'}}>
                            {selectedProductsData.map((productData, index) => (
                              <tr key={index}>
                                <td style={{ backgroundColor: "" }}>
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
                                          calibre: produit.calibre,
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
                                    styles={{
                                      menu: (provided) => ({
                                        ...provided,
                                        zIndex: 9999, // Ensures the dropdown is on top of all other components
                                      }),
                                    }}
                                  
                                  />
                                </td>
                                <td style={{ backgroundColor: "white" }}>
                                  <Select
                                    options={produits.map((produit) => ({
                                      value: produit.id,
                                      label: produit.designation,
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
                                          calibre: produit.calibre,
                                        },
                                        index
                                      );
                                    }}
                                    values={
                                      productData.produit_id
                                        ? [
                                            {
                                              value: productData.produit_id,
                                              label: productData.designation,
                                            },
                                          ]
                                        : []
                                    }
                                    placeholder="Designation ..."
                                  />
                                </td>
                                {/* <td>{productData.designation}</td> */}
                                <td style={{ backgroundColor: "white" }}>
                                  {productData.calibre_id}
                                </td>
                                <td style={{ backgroundColor: "white" }}>
                                  <input
                                    type="text"
                                    id={`quantite_${index}_${productData.produit_id}`}
                                    className="quantiteInput"
                                    placeholder={ 
                                      populateProductInputs(
                                        productData.id,
                                        "quantite"
                                      )|| ''}
                                    style={{width:'100%'}}
                                    value={
                                      modifiedQuantiteValues[
                                        `${index}_${productData.produit_id}`
                                      ]
                                    }
                                    onChange={(event) =>
                                      handleInputChange(
                                        index,
                                        "quantite",
                                        event
                                      )
                                    }
                                  />
                                </td>
                                <td style={{ backgroundColor: "white" }}>
                                  <input
                                    type="text"
                                    id={`prix_unitaire_${index}_${productData.produit_id}`}
                                    className="prixInput"
                                    placeholder={
                                      populateProductInputs(
                                        productData.id,
                                        "prix_unitaire"
                                      )|| ''}
                                    style={{width:'100%'}}
                                    value={
                                      modifiedPrixValues[
                                        `${index}_${productData.produit_id}`
                                      ] 
                                    }
                                    onChange={(event) =>
                                      handleInputChange(
                                        index,
                                        "prix_unitaire",
                                        event
                                      )
                                    }
                                  />
                                </td>
                                <td style={{ backgroundColor: "white" }}>
                                  <Button
                                    className=" btn btn-danger btn-sm m-1"
                                    onClick={() =>
                                      handleDeleteProduct(
                                        index,
                                        productData.id // Utilisez l'ID de la ligne de commande ici
                                      )
                                    }
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      
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

          <div
  id=""
  className="table_width"
style={tableContainerStyle}
>
 
    <table className=" table_width table table-bordered" style={{marginTop:'10px'}}>
      <thead  className="text-center ">
        <tr>
          <th className="tableHead widthDetails">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAllChange}
            />
          </th>
          <th className="tableHead">référence</th>
          <th className="tableHead">Client</th>
          <th className="tableHead">Site Client</th>
          <th className="tableHead">Date Commande</th>
          <th className="tableHead">Mode de Paiement</th>
          <th className="tableHead">Status</th>
          <th className="tableHead">Total</th>
          <th className="tableHead">Actions</th>
        </tr>
      </thead>
      <tbody className="text-center">
        {comandeFiltre &&
          comandeFiltre.map((commande) => (
            <React.Fragment key={commande.id}>
              <tr>
                <td style={{ backgroundColor: 'white' }}>
                  <input
                    type="checkbox"
                    onChange={() => handleCheckboxChange(commande.id)}
                    checked={selectedItems.includes(commande.id)}
                  />
                </td>
                <td style={{ backgroundColor: 'white' }}>
                  <Button
                    className="btn btn-sm btn-light"
                    style={{ marginRight: '10px' }}
                    onClick={() => handleShowLigneCommandes(commande.id)}
                  >
                    <FontAwesomeIcon
                      icon={
                        expandedRows.includes(commande.id) ? faMinus : faPlus
                      }
                    />
                  </Button>
                  {commande.reference}
                </td>
                <td style={{ backgroundColor: 'white' }}>
                  {getClientValue(commande.client_id, 'raison_sociale')}
                </td>
                <td
                  style={{ backgroundColor: 'white' }}
                  className={commande.site_id ? '' : 'text-danger'}
                >
                  {commande.site_id
                    ? getSiteClientValue(commande.site_id, 'raison_sociale')
                    : 'aucun site'}
                </td>
                <td style={{ backgroundColor: 'white' }}>
                  {commande.dateCommande}
                </td>
                <td style={{ backgroundColor: 'white' }}>
                  {commande.mode_payement}
                </td>
                <td style={{ backgroundColor: 'white' }}>
                  <button
                    className="btn btn-sm btn-light"
                    style={{ marginRight: '10px' }}
                    onClick={() => handleShowStatusCommandes(commande.id)}
                  >
                    <FontAwesomeIcon
                      icon={
                        expand_status.includes(commande.id) ? faMinus : faPlus
                      }
                    />
                  </button>
                  {commande.status}
                </td>
                <td style={{ backgroundColor: 'white' }}>
                  <button
                    className="btn btn-sm btn-light"
                    style={{ marginRight: '10px' }}
                    onClick={() => handleShowTotalDetails(commande)}
                  >
                    <FontAwesomeIcon
                      icon={
                        expand_total.includes(commande.id) ? faMinus : faPlus
                      }
                    />
                  </button>
                  {calculateTotalQuantity(commande.ligne_commandes)}
                </td>
                <td style={{ backgroundColor: 'white' }}>
                  <div className="d-inline-flex text-center">
                    <FontAwesomeIcon
                      onClick={() => handleEdit(commande)}
                      icon={faEdit}
                      style={{ color: '#007bff', cursor: 'pointer' }}
                    />
                    <span style={{ margin: '0 8px' }}></span>
                    <FontAwesomeIcon
                      onClick={() => handleDelete(commande)}
                      icon={faTrash}
                      style={{ color: '#ff0000', cursor: 'pointer' }}
                    />
                  </div>
                </td>
              </tr>
              {expandedRows.includes(commande.id) &&
                        commande.ligne_commandes && (
                          <tr>
                            <td
                              colSpan="11"
                              style={{
                                padding: "0",
                              }}
                            >
                              <div id="lignesCommandes">
                                <table
                                  className=" table-bordered"
                                  style={{
                                    borderCollapse: "collapse",
                                    // backgroundColor: "#f2f2f2",
                                    width: "100%",
                                  }}
                                >
                                  <thead>
                                    <tr>
                                      <th
                                         className="ColoretableForm"
                                      >
                                        Code Produit
                                      </th>
                                      <th
                                         className="ColoretableForm"
                                      >
                                        designation
                                      </th>
                                      <th
                                         className="ColoretableForm"
                                      >
                                        Calibre
                                      </th>
                                      <th
                                         className="ColoretableForm"
                                      >
                                        Quantite
                                      </th>
                                      <th
                                         className="ColoretableForm"
                                      >
                                        Prix Unitaire
                                      </th>
                                      {/* <th className="text-center">Action</th> */}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {commande.ligne_commandes.map(
                                      (ligneCommande) => {
                                        const produit = produits.find(
                                          (prod) =>
                                            prod.id === ligneCommande.produit_id
                                        );
                                        console.log("prod", produit);
                                        console.log(
                                          "id",
                                          ligneCommande.produit_id
                                        );
                                        return (
                                          <tr key={ligneCommande.id}>
                                            <td>{produit.Code_produit}</td>
                                            <td>{produit.designation}</td>
                                            <td>{produit.calibre.calibre}</td>
                                            <td>{ligneCommande.quantite}</td>
                                            <td>
                                              {ligneCommande.prix_unitaire} DH
                                            </td>
                                            {/* Ajoutez ici d'autres colonnes ou actions si nécessaire */}
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
                        {expand_total.includes(commande.id) && (
                          <tr>
  <td
    style={{
      padding: "0",
    }}
    colSpan="11"
  >
    {/* Table for ligne_commandes */}
    <table
      className="table-bordered"
      style={{
        borderCollapse: "collapse",
        width: "100%",
      }}
    >
      <thead>
        <tr>
          <th className="ColoretableForm"></th>
          {commande.ligne_commandes.map((ligne) => {
            const produit = produits.find(
              (prod) => prod.id === ligne.produit_id
            );
            return (
              <th className="ColoretableForm" key={produit.designation}>
                {produit.designation}
              </th>
            );
          })}
          <th className="ColoretableForm">Total (Unité) / Calibre</th>
          <th className="ColoretableForm">Action</th>
        </tr>
      </thead>
      <tbody>
  {uniqueCalibres.map((calibre, index) => (
    <tr key={calibre}>
      <td className="ColoretableForm">
        <strong>calibre : [{calibre}]</strong>
      </td>
      {commande.ligne_commandes.map((ligne) => {
        const produit = produits.find((prod) => prod.id === ligne.produit_id);
        return (
          <td key={produit.designation}>
            {getQuantity(commande.ligne_commandes, calibre, produit.designation)}
          </td>
        );
      })}
      <td>
        <strong>
          {getTotalForCalibre(commande.ligne_commandes, calibre, produits)}
        </strong>
      </td>
      
      {/* Show the print icon only in the first row */}
      {index === 0 && (
        <td rowSpan={uniqueCalibres.length} style={{ verticalAlign: 'middle' }}>
          <FontAwesomeIcon
            onClick={() => handlePrintLine(commande)}
            icon={faPrint}
            style={{ color: '#28a745', cursor: 'pointer' }}
          />
        </td>
      )}
    </tr>
  ))}

  {/* New row to display total for each product */}
  <tr>
    <td className="ColoretableForm">
      <strong>Total</strong>
    </td>
    <td rowSpan={4}></td>
    <td rowSpan={4}></td>
    <td style={{ backgroundColor: '#cb4a4a' }}>
      <strong>
        {uniqueCalibres.reduce((total, calibre) => {
          return total + getTotalForCalibre(commande.ligne_commandes, calibre, produits);
        }, 0)}
      </strong>
    </td>
  </tr>
</tbody>



    </table>
  </td>
</tr>

                      )}
                      {expand_status.includes(commande.id) &&
                        commande.status_commandes && (
                          <tr>
                            <td
                              colSpan="11"
                              style={{
                                padding: "0",
                              }}
                            >
                              <div id="statusCommandes">
                                <table
                                  className="table-bordered"
                                  style={{
                                    borderCollapse: "collapse",
                                    // backgroundColor: "#f2f2f2",
                                    width: "100%",
                                  }}
                                >
                                  <thead>
                                    <tr>
                                      <th
                                         className="ColoretableForm"
                                      >
                                        Status
                                      </th>
                                      <th
                                         className="ColoretableForm"
                                      >
                                        Date Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {commande.status_commandes.map(
                                      (statusCommande) => (
                                        <tr key={statusCommande.id}>
                                          <td>{statusCommande.status}</td>
                                          <td>{statusCommande.date_status}</td>
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
  <Button
    className="btn btn-danger btn-sm"
    onClick={handleDeleteSelected}
    disabled={selectedItems.length === 0}
  >
    <FontAwesomeIcon icon={faTrash} style={{ marginRight: '0.5rem' }} />
    Supprimer sélection  </Button>
</div>

        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default CommandeList;
