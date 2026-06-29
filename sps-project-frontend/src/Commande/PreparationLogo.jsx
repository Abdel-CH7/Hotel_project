import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

import axios from "axios";
import Navigation from "../Acceuil/Navigation";
import '../App.css';
import {
  Autocomplete,
  Button,
  Fab,
  Select,
  TextField,
  Toolbar,
} from "@mui/material";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import PeopleIcon from "@mui/icons-material/People";
import {  Card } from "react-bootstrap";
import { CardContent, Typography } from "@mui/material";

import CardMedia from "@mui/material/CardMedia";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faList,
  faMinus,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { border, style, textAlign } from "@mui/system";
import { useOpen } from "../Acceuil/OpenProvider";

const PreparationLogo = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [siteClients, setSiteClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingCommandes, setEditingCommandes] = useState(null);
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [modifiedLotValues, setModifiedLotValues] = useState({});
  const [modifiedQuantiteValues, setModifiedQuantiteValues] = useState({});
  const [expandedPrepRows, setExpandedPrepRows] = useState([]);
  const [expandedOrderRows, setExpandedOrderRows] = useState([]);
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [warningIndexes, setWarningIndexes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("en_attente");

  const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfTokenMeta ? csrfTokenMeta.content : null;
  const [showForm, setShowForm] = useState(false);
  const[content,setContent]=useState(false)
  const [
    existingLignePreparationCommandes,
    setExistingLignePreparationCommandes,
  ] = useState([]);
  const [existingLigneCommandes, setExistingLigneCommandes] = useState([]);

  const [editingCommandesId, setEditingCommandesId] = useState(null);
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  const [selectedClients, setSelectedClients] = useState([]);
  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const [formData, setFormData] = useState({
    reference: "",
    dateCommande: "",
    datePreparationCommande: "",
    client_id: "",
    site_id: "",
    mode_payement: "",
    status: "",
    status_preparation: "",
    user_id: "",
    produit_id: "",
    prix_unitaire: "",
    quantite: "",
    codePreparation: "",
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
  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/getAllDataComande");
      console.log('response.data',response.data)
      const { commandes, clients, siteclients, produits } = response.data;
      
      const filtrecomde = commandes.filter((commande)=>commande.latest_preparation !== null    )
      setCommandes(filtrecomde);
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
    if (editingCommandes) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        client_id: editingCommandes.client_id,
      }));
    }
  }, [editingCommandes]);
  const [status ,setStatus]=useState();
  // function changeStatus(status){
  //   setStatus(status)
  // }
  const [clientid , setClientid]=useState();
   function hndelid (id){
    setClientid(id)
  }

const [filtredatacmd,setFiltredatacmd]=useState([]);
const filtredata = async ( id,clientid) => {
  try {
      // Logging the status for debugging purposes
      console.log('Status:', status ,clientid);
      
      // Making the API request to fetch orders by client ID
      const response = await axios.get(`http://localhost:8000/api/clients/${clientid}/commandes`);
      const orders = response.data.commandes;

      // Logging preparations for debugging purposes
      console.log('Preparations:', response.data.preparations);

      // Filtering the orders by status and id
      const filteredOrders = orders.filter(order => order.status === status && order.id === id);
      console.log(id)
      // Logging the status and filtered orders for debugging purposes
      console.log('Filtered by Status:', status);
      console.log("Filtered Orders:", filteredOrders);

      // Updating the state with the filtered orders
      setFiltredatacmd(filteredOrders);
  } catch (error) {
      console.error("Error fetching orders:", error);
  }
};
const [filtrecmd ,setFiltrecmd]=useState([])
const filtrecmddata = async () => {
  try {
      // Logging the status for debugging purposes
      console.log('Status:', status ,clientid);
      
      // Making the API request to fetch orders by client ID
     

      // Filtering the orders by status and id
      const filteredOrders = selectedOrder.filter(selectedOrder => selectedOrder.id === id);
      console.log(id)
      // Logging the status and filtered orders for debugging purposes
      console.log('Filtered by Status:', status);
      console.log("Filtered Orders:", filteredOrders);

      // Updating the state with the filtered orders
      // setFiltrecmd(filteredOrders);
         const ligneCommandes = filteredOrders.flatMap(order => order.ligne_commandes);

      setSelectedProductsData(ligneCommandes)
  } catch (error) {
      console.error("Error fetching orders:", error);
  }
};

// Example usage


  
  
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

  const getSiteClientValue = (siteClientId, field) => {
    const site = siteClients.find((p) => p.id === siteClientId);

    if (site) {
      return site[field];
    }

    return "";
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
  const getClientValue = (clientId, field) => {
    const client = clients.find((p) => p.id === clientId);

    if (client) {
      return client[field];
    }
    return "";
  };

  const handleOrderClient = (order) => {
    setSelectedOrder(order);
  };
  // const handleOrderClick = (filteredOrders) => {
  //   // Utiliser un objet pour enregistrer les clients uniques
  //   const clientsWithOrders = {};
  //   filteredOrders.forEach(order => {
  //     if (!clientsWithOrders[order.client.id]) {
  //       clientsWithOrders[order.client.id] = order.client;
  //       setContent(true);
  //     }
  //   });

  //   // Convertir l'objet en un tableau de clients uniques
  //   const uniqueClients = Object.values(clientsWithOrders);
  //   setSelectedClients(uniqueClients);
  // };

  const handleShowLigneCommandes = (commandeId) => {
    setExpandedOrderRows((prevRows) =>
      prevRows.includes(commandeId)
        ? prevRows.filter((row) => row !== commandeId)
        : [...prevRows, commandeId]
    );
  };

  const handleShowLignePreparationCommandes = (preparationId) => {
    setExpandedPrepRows((prevRows) =>
      prevRows.includes(preparationId)
        ? prevRows.filter((row) => row !== preparationId)
        : [...prevRows, preparationId]
    );
  };

  const handleInputChange = (index, inputType, event) => {
    const newValue = event.target.value;
    console.log("selectedProductsData", selectedProductsData);
    console.log("index", index);
    if (selectedProductsData[index]) {
      const productId = selectedProductsData[index].produit_id;
      if (inputType === "lot") {
        setModifiedLotValues((prev) => {
          const updatedValues = {
            ...prev,
            [`${index}_${productId}`]: newValue,
          };
          console.log("Modified Lot values:", updatedValues);
          return updatedValues;
        });
      }
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
      codePreparation: "",
      client_id: "",
      site_id: "",
      mode_payement: "",
      status: "",
      user_id: "",
      produit_id: "",
      prix_unitaire: "",
      quantite: "",
    });
    setWidth('77%')
    setEditingCommandes(null); // Clear editing client
    setModifiedLotValues({})
  };
  //---------------------------Produit--------------------------
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
  const handleProductSelection = (selectedProduct, index) => {
    console.log("selectedProduct", selectedProduct);
    const updatedSelectedProductsData = [...selectedProductsData];
    updatedSelectedProductsData[index] = selectedProduct;
    setSelectedProductsData(updatedSelectedProductsData);
    console.log("selectedProductsData", selectedProductsData);
  };

  const handleAddEmptyRow = () => {
    // Ajouter un objet initialisé avec les valeurs nécessaires
    setSelectedProductsData([
      ...selectedProductsData,
      {
        produit_id: "",
        Code_produit: "",
        designation: "",
        calibre_id: "",
      },
    ]);
    console.log("selectedProductData", selectedProductsData);
  };
const [width ,setWidth]=useState('77%');


  const [id ,setId]=useState();


  const [clientId,setClientId]=useState()
console.log('clientId',clientId)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {




      let preparationResponse;

        // Update existing preparation
console.log('formData',formData)
 preparationResponse = await axios.put(
          `http://localhost:8000/api/PreparationCommandes/${formData.idpreparation}`,
          {
            commande_id: formData.idComande,
            datePreparationCommande: formData.datePreparationCommande,
            status_preparation: formData.status_preparation,
            CodePreparation: formData.codePreparation,

          }
        );
         
       

        
        // handleEditPreparationForm(preparationId) 
        // fetchOrdersByClientAndStatus(clientid)        
        // preparationId = preparationResponse.data.id;
      

console.log('preparationResponse',preparationResponse.data)
      // Get existing lignePreparationCommandes
      console.log("selectedPrdsData12", selectedProductsData, modifiedLotValues);
      // Map selectedProductsData to include existing ids if they exist
      const selectedPrdsData = selectedProductsData.map(
        (selectedProduct, index) => {
          
console.log("selectedProductget elemant",  getElementValueById(
  `lot_${index}_${selectedProduct.produit_id}`
)? getElementValueById(
  `lot_${index}_${selectedProduct.produit_id}`
):selectedProduct.
Nlot)
const lotValue = modifiedLotValues[`${index}_${selectedProduct.produit_id}`] || selectedProduct.Nlot;
console.log('e3r4gt5hy6ju',lotValue,index,selectedProduct.produit_id)
          return {
            id: selectedProduct.id,
            preparation_id:formData.datePreparationCommande,
            produit_id: selectedProduct.produit_id,
            prix_unitaire: 12,
            quantite:selectedProduct.quantite,
            lot: lotValue
            ,
          };
          
        }
      );

      console.log("selectedPrdsData", selectedProductsData);

      // Track IDs to be deleted (i.e., those not in the new set of data)
     

      // Delete lines that are not in the new set

      // Update or create lignePreparationCommandes
      for (const lignePreparationCommandeData of selectedPrdsData) {
        console.log('dfg',lignePreparationCommandeData)

          const lignep=await axios.put(
            `http://localhost:8000/api/lignePreparationCommandes/${lignePreparationCommandeData.id}`,
            { id: lignePreparationCommandeData.id,
              preparation_id: lignePreparationCommandeData.preparation_id,
              produit_id: lignePreparationCommandeData.produit_id,
              prix_unitaire: 12,
              quantite:lignePreparationCommandeData.quantite,
              lot: lignePreparationCommandeData.lot
              ,}
            
          );
          console.log('lignep',lignep)
        
      }

      fetchData();
      
      setFormData({
        id: "",
        reference: "",
        dateCommande: "",
        client_id: "",
        site_id: "",
        mode_payement: "",
        status: "",
        datePreparationCommande: "",
        status_preparation: "",
        produit_id: "",
        prix_unitaire: 12,
        quantite: "",
        lot: "",
      });
      console.log("stat",formData)

      setShowForm(false);
      setIsEditing(false); // Reset editing mode
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
    handleClientClick(clientId)
  };
console.log('formData',formData)
  const handleEditPreparationForm =  (preparation) => {
 
    try {
      // Récupérer les données de la préparation et de la commande associée
    console.log('preparation',preparation)
      // Mettre à jour les états avec les données récupérées
      setFormData({
        idpreparation:preparation.latest_preparation.id,
        idComande:preparation.id,
        reference: preparation.reference,
        dateCommande: preparation.dateCommande,
        client_id: preparation.client.raison_sociale,
        site_id: preparation.site_id,
        mode_payement: preparation.mode_payement,
        datePreparationCommande: preparation.
        latest_preparation.datePreparationCommande

        ,
        status: preparation.status,
        status_preparation: preparation.latest_preparation.status_preparation,
        codePreparation: preparation.latest_preparation.CodePreparation,
      });
      setWidth('47.5%')
      const selectedProducts = preparation.latest_preparation.lignes_preparation.map((ligneCommande) => {
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
          Nlot:ligneCommande.
          lot
                    
        };
      });
      setSelectedProductsData(selectedProducts);
      console.log('selectedProducts',selectedProducts)
      console.log(preparation.latest_preparation.lignes_preparation);
      setEditingCommandes(preparation);
      setIsEditing(true); // Set to editing mode

      // Afficher le formulaire
      if (formContainerStyle.right === "-100%") {
        setFormContainerStyle({ right: "0" });
        setTableContainerStyle({ marginRight: "1200px" });
      } else {
        closeForm();
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
    }
  };

  const handleDeletePreparation = async (preparation) => {
    console.log('preparation',preparation)
    const result = await  Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce preparation ?",
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
  });

    if (result.isConfirmed) {
      try {
        const response = await axios.put(
          `http://localhost:8000/api/commandes/${preparation.id}`,
          {
            dateCommande: preparation.dateCommande,
            status:'Annuler',
            mode_payement: preparation.mode_payement,
            site_id: preparation.site_id
            ? preparation.site_id : null,
            client_id: preparation.client_id,
            user_id: preparation.user_id
            ,
          }
        );
        console.log("Commande updated successfully:", response.data);
        if(preparation.
          chargement_commandes.length!==0){
            if(preparation.livraison){
  const response = await axios.delete(`http://localhost:8000/api/livraisons/${preparation.livraison.id}`);
}else{
  Swal.fire({
    icon: "error",
    title: "Erreur !",
    text: "Erreur ",
  });
  return
}
await axios.delete(`http://localhost:8000/api/chargementCommandes/${preparation.chargement_commandes[0].id}`);
  
          }
 await axios.delete(
          `http://localhost:8000/api/PreparationCommandes/${preparation.latest_preparation.id}`,
          {
            withCredentials: true,
            headers: {
              "X-CSRF-TOKEN": csrfToken,
            },
          }
        );
     
        // if()
        fetchData(); // Re-fetch data to update the UI
        Swal.fire({
          icon: "success",
          title: "Succès !",
          text: "Préparation supprimée avec succès.",
        });
      } catch (error) {
        const response = await axios.put(
          `http://localhost:8000/api/commandes/${preparation.id}`,
          {
            dateCommande: preparation.dateCommande,
            status:preparation.
            status
            ,
            mode_payement: preparation.mode_payement,
            site_id: preparation.site_id
            ? preparation.site_id : null,
            client_id: preparation.client_id,
            user_id: preparation.user_id
            ,
          }
        );
        console.error(
          "Erreur lors de la suppression de la préparation :",
          error
        );
        Swal.fire({
          icon: "error",
          title: "Erreur !",
          text: "Erreur lors de la suppression de la préparation.",
        });
      }
    }
  };
  const getColorByStatus = (status) => {
    switch (status) {
      case "En Attente":
        return " rgb(253 224 71)";
      case "En Cours":
        return "rgb(249 115 22)";
      case "Annuler":
        return "#ff0000";
        case "Préparer":
        return "rgb(34 197 94)";
      default:
        return "#ffffff"; // Default color
    }
  };
  console.log('cdfv',clients)

  const [comandeFiltre ,setCommnadeFiltre]=useState([])
  const [clientFiltre ,setClientFiltre]=useState([])
  const [filtreByClient,setFiltreByClient]=useState([])
  //filtre client
    const handleOrderClick = (filteredOrders) => {
      const clientIdsWithOrders = new Set(filteredOrders.map(order => order.client_id));
      const clientsWithOrders = clients.filter(client => clientIdsWithOrders.has(client.id));
      
      setClientFiltre(clientsWithOrders)
      setContent(true)
      setCommnadeFiltre(filteredOrders)
    }
    function changeStatus(status){
      setStatus(status)
    }

    useEffect(() => {
      const filteredOrders = commandes.filter(

        (order) => order.latest_preparation.status_preparation === status
        
      );
      const filteredclient = filteredOrders.filter(

        (order) => order.client_id
        === clientId
        
      );
      console.log('filteredclient',filteredclient)
      setCommnadeFiltre(filteredOrders)
      setFiltreByClient(filteredclient)
      setSelectedClients([]     )
      console.log('Status:', status,filteredOrders );
      console.log('Commande Filtre:', comandeFiltre);
      console.log('filteredOrders231',filteredOrders)
    },[commandes,status,clientId]); //

  console.log('commandes',comandeFiltre)
//filtreOrderBy client
  const handleClientClick = (clientId) => {
    setClientId(clientId)
    const filtreByClient = comandeFiltre.filter((commend)=>commend.client_id===clientId)
    setFiltreByClient(filtreByClient)
  };
  console.log('filtreByClient',filtreByClient)
  return (
    <ThemeProvider theme={createTheme()} >
      <Box sx={{...dynamicStyles}}
      >
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
          {/* <Toolbar /> */}
          
          <Typography
            variant="h5"
            gutterBottom
            component="div"
            className="titreColore"
            sx={{
              color: "grey",
              display: "flex",
              alignItems: "center",
              marginTop:"15px",
            }}
          >
            <h3 className="titreColore">
               Preparation Commande
            </h3>
           
          </Typography>
          <div style={{ width: "100%",marginTop:'-10px' }}>
    <div className="d-flex flex-wrap">
      {["En Attente", "En Cours", "Préparer","Annuler"].map((status) => {
const filteredOrders = commandes.filter(
  (order) => order.latest_preparation?.status_preparation === status
);

        const orderCount = filteredOrders.length;
        const color = getColorByStatus(status);

        return (
          <div
            key={status}
            style={{ marginLeft: "40px", marginBottom: "-20px", width: "22%" }}
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
      {content &&
      <Typography
      variant="h5"
      gutterBottom
      component="div"
      sx={{
        color: "grey",
        display: "flex",
        alignItems: "center",
        marginBottom: "10px",
        marginTop:"25px",
        marginLeft:"-px"

      }}
    >
      <PeopleIcon sx={{ fontSize: "24px", marginRight: "8px"}} />
       { status}
    </Typography>
      }
          
    {
      content &&
      <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto', // 'auto' will show scrollbar only when needed
        height: '720px',
        alignItems: 'flex-start',
        width: '120px', 
        backgroundColor: '#f0f0f5', // Subtle background color for the container
        // padding: '10px', // Add some padding around the container
        borderRadius: '10px', // Rounded corners for a modern look
        scrollbarWidth: 'thin', // For Firefox scrollbar width
        scrollbarColor: '#888 #f0f0f5', // Scrollbar track and thumb colors
      }}
    >
      {clientFiltre.map((client) => (
        <div
          key={client.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%', 
            // paddingBottom: '10px',
            cursor: 'pointer',
            borderBottom: '1px solid #ccc',
            // padding: '10px', // Spacing inside each client box
            // borderRadius: '8px', // Rounded corners for each item
            // boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
            transition: 'background-color 0.3s', // Smooth transition on hover
          }}
          onClick={() => handleClientClick(client.id)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'} // Hover effect
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
        >
          <img
            src={client.logoC}
            alt="Logo"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              marginTop: '5px',
            }}
          />
          <Typography variant="subtitle1" gutterBottom style={{ textAlign: 'center', marginTop: '10px' }}>
            {client.raison_sociale}
          </Typography>
        </div>
      ))}
    </div>
    }
         


          {content && (
            <>
<div
  id="formContainerCommande"
  style={{
    ...formContainerStyle,
    overflowX: 'hidden',
    
  }}
>
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
        {isEditing ? 'Mise à jour Préparation' : 'Ajouter une Préparation'}
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
            Client:
          </label>
        </div>
        <div className="col-sm-6">
          <input
            type="text"
            className="form-control"
            id="client_id"
            name="client_id"
            value={getClientValue(formData.client_id, 'raison_sociale')}
            readOnly
            style={{ backgroundColor: '#e9ecef' }}
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
            value={formData.status}
            readOnly
            style={{ backgroundColor: '#e9ecef' }}
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
            className={formData.site_id ? 'form-control' : 'text-danger form-control'}
            id="site_id"
            name="site_id"
            value={
              formData.site_id
                ? getSiteClientValue(formData.site_id, 'raison_sociale')
                : 'aucun site'
            }
            readOnly
            style={{ backgroundColor: formData.site_id ? '#e9ecef' : '#ffcccc' }}
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
            readOnly
            onChange={handleChange}
          />
        </div>
      </div>
    </div>

    <div className="col-md-12">
  <div className="row mb-3">
    <div className="col-sm-6">
      <label htmlFor="datePreparationCommande" className="col-form-label">
        Date Préparation Commande:
      </label>
    </div>
    <div className="col-sm-6">
      <Form.Group controlId="datePreparationCommande">
        <Form.Control
          type="date"
          name="datePreparationCommande"
          value={formData.datePreparationCommande.split(" ")[0]} // Format the date
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
      <label htmlFor="status_preparation" className="col-form-label">
        Status de Préparation:
      </label>
    </div>
    <div className="col-sm-6">
      <select
        className="form-control"
        id="status_preparation"
        name="status_preparation"
        value={formData.status_preparation}
        onChange={handleChange}
      >
        <option value="En Attente">En Attente</option>
        <option value="En Cours">En Cours</option>
        <option value="Annuler">Annuler</option>
        <option value="Préparer">Préparer</option>
      </select>
    </div>
  </div>
</div>


    
      <Form.Group controlId="selectedProduitTable"   >
        <div className="table-responsive">
          <table className="table table-bordered" >
            <thead>
              <tr>
                <th  className="ColoretableForm">Code Produit</th>
                <th  className="ColoretableForm">Désignation</th>
                <th  className="ColoretableForm">Calibre</th>
                <th  className="ColoretableForm">Quantité</th>
                <th  className="ColoretableForm">Lot</th>
                <th  className="ColoretableForm">Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedProductsData.map((productData, index) => (
                <tr key={index}>
                  <td>{productData.Code_produit}</td>
                  <td>{productData.designation}</td>
                  <td>{productData.calibre_id}</td>
                  <td>{productData.quantite}</td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={productData.Nlot
                        || 'lot'}
                      value={
                        modifiedLotValues[`${index}_${productData.produit_id}`] 
                      }
                      onChange={(event) => handleInputChange(index, 'lot', event)}
                    />
                  </td>
                  <td>
                    <Button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        handleDeleteProduct(index, productData.id)
                      }
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Form.Group>
  

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

              <div
    id=""
                            className="table_width"
    style={{  maxHeight: '500px', overflowY: 'auto',
      position:'fixed'
      ,top:'240px',
      width: width,
      marginLeft:'140px'
     }}
  >
    <table  className=" table_width table table-bordered" style={{marginTop:'20px'}}>
      <thead className="text-center " >
        <tr>
          
          <th className="tableHead">Code de Préparation</th>
          <th className="tableHead">Status de Préparation</th>
          <th className="tableHead">Date de Préparation</th>
          <th className="tableHead">Référence Commande</th>
          <th className="tableHead">Client</th>
          <th className="tableHead">Site</th>
          <th className="tableHead">Date Commande</th>
          <th className="tableHead">Mode de payement</th>
          <th className="tableHead">Status</th>
          <th className="tableHead">Action</th>
        </tr>
      </thead>
      <tbody className="text-center">
        { filtreByClient.map((order) => (
          <React.Fragment key={order.id}>
            <tr>
              <td>
                <button
                  className="btn btn-sm btn-light"
                  style={{ marginRight: "10px" }}
                  onClick={() => handleShowLignePreparationCommandes(order.id)}
                >
                  <FontAwesomeIcon icon={expandedPrepRows.includes(order.id) ? faMinus : faPlus} />
                </button>
                {order.
latest_preparation
.CodePreparation
}
              </td>
              <td>{order.
latest_preparation
.status_preparation
}</td>
              <td>{order.latest_preparation.datePreparationCommande.slice(0, -8)}</td>
              <td>
                {order.reference}
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => handleShowLigneCommandes(order.id)}
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
              </td>
              <td>{order.client.
raison_sociale
 || 'N/A'}</td>
              <td className={order.site_id ? "" : "text-danger"}>
                {order.site_id ? getSiteClientValue(order.site_id, "raison_sociale") : "Aucun site"}
              </td>
              <td>{order.dateCommande}</td>
              <td>{order.mode_payement}</td>
              <td>{order.status}</td>
              <td>
                <div className="d-inline-flex text-center">
                  
                  <FontAwesomeIcon
                                style={{ color: "#007bff", cursor: "pointer" }}

                    onClick={() => {handleEditPreparationForm(order);
                    }}
                    
                    icon={faEdit}
                  />
                  <FontAwesomeIcon
                    onClick={() => handleDeletePreparation(order)}
                    icon={faTrash}
                    style={{ margin: "0 10px", cursor: "pointer", color: "red" }}
                  />
                </div>
              </td>
            </tr>
            {expandedPrepRows.includes(order.id) && (
              <tr>
                <td colSpan="11" >
                  <div id="lignesCommandes">
                    <table className="table-bordered" style={{ borderCollapse: "collapse", width: "100%" }}>
                      <thead>
                        <tr>
                          <th colSpan="8" style={{ backgroundColor: "#EEEEEE" }}>Liste des Préparation de Commande</th>
                        </tr>
                        <tr>
                          <th className="ColoretableForm">Code Produit</th>
                          <th className="ColoretableForm">Designation</th>
                          <th className="ColoretableForm">Quantite</th>
                          <th className="ColoretableForm">Calibre</th>
                          <th className="ColoretableForm">Prix Unitaire</th>
                          <th className="ColoretableForm">Lot</th>
                        </tr>
                      </thead>
                      <tbody>
                         { order.latest_preparation.lignes_preparation.map((lignePreparationCommande) => {
                            const produit = produits.find(prod => prod.id === lignePreparationCommande.produit_id);
                            return (
                              <tr key={lignePreparationCommande.id}>
                                <td >{produit?.Code_produit}</td>
                                <td >{produit?.designation}</td>
                                <td >{lignePreparationCommande.quantite}</td>
                                <td >{produit?.calibre.calibre}</td>
                                <td >{lignePreparationCommande.prix_unitaire} DH</td>
                                <td >{lignePreparationCommande.lot}</td>
                              </tr>
                            );
                          })
                       }
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            )}
            {expandedOrderRows.includes(order.id) && order.ligne_commandes && (
              <tr>
                <td colSpan="12" style={{ padding: "0" }}>
                  <div id="lignesCommandes">
                    <table className="table-bordered" style={{ borderCollapse: "collapse", width: "100%" }}>
                      <thead>
                        <tr>
                          <th colSpan="4" style={{ backgroundColor: "#EEEEEE" }}>Liste des lignes de Commandes</th>
                        </tr>
                        <tr>
                          <th className="ColoretableForm">Produit</th>
                          <th className="ColoretableForm">Quantite</th>
                          <th className="ColoretableForm">Prix Vente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.ligne_commandes.map((ligneCommande) => (
                          <tr key={ligneCommande.id}>
                            <td>{ligneCommande.produit_id}</td>
                            <td>{ligneCommande.quantite}</td>
                            <td>{ligneCommande.prix_unitaire} DH</td>
                          </tr>
                        ))}
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
  </div>
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PreparationLogo;
