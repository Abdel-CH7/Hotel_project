import React, { useState, useEffect } from "react";
import Select from "react-dropdown-select";

import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { CircularProgress, Fab, ListItemIcon, Toolbar } from "@mui/material";
import Navigation from "../Acceuil/Navigation";
import { Form, Button, Modal, Table, Dropdown } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReceiptIcon from "@mui/icons-material/Receipt";
import {
    faTrash,
    faFilePdf,
    faPrint,
    faPlus,
    faMinus,
    faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Swal from "sweetalert2";
import Search from "../Acceuil/Search";
import TablePagination from "@mui/material/TablePagination";
import {LiaFileInvoiceSolid} from "react-icons/lia";
import {CiDeliveryTruck} from "react-icons/ci";
import { width } from "@mui/system";
import { BsShop } from "react-icons/bs";
import { FaEdit } from "react-icons/fa";
import { useAuth } from "../AuthContext";
import { useOpen } from "../Acceuil/OpenProvider"; // Importer le hook personnalisé


const DevisListvente = () => {
    const [existingLigneDevis, setExistingLigneDevis] = useState([]);
    const [authId, setAuthId] = useState([]);
    const [selectedClient, setSelectedClient] = useState([]);
    const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfTokenMeta ? csrfTokenMeta.content : null;
    const [devises, setDevises] = useState([]);
    const [ligneDevises, setLigneDevis] = useState([]);
    const [modifiedPrixValues, setModifiedPrixValues] = useState({});
    const [modifiedQuantiteValues, setModifiedQuantiteValues] = useState({});
    const [clients, setClients] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [filtereddevises, setFiltereddevises] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectAll, setSelectAll] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    // Ajouter des états pour suivre si la facture et le bon de livraison ont été générés
    const [factureGenerated, setFactureGenerated] = useState(false);
    const [bonLivraisonGenerated, setBonLivraisonGenerated] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const handleModalClose = () => setShowModal(false);
    const [totals, setTotals] = useState({});
    const [selectedProductsData, setSelectedProductsData] = useState([]);
    const [errors, setErrors] = useState({});

    const { open } = useOpen();
    const { dynamicStyles } = useOpen();
    
    const [produits, setProduits] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [factures, setFactures] = useState([]);
    const [formData, setFormData] = useState({
        reference: "",
        date: "",
        validation_offer: "",
        modePaiement: "",
        status: "",
        client_id: "",
        user_id: "",
        Code_produit: "",
        designation: "",
        prix_vente: "",
        quantite: "",
        id_devis: "",

    });
    const tableHeaderStyle = {
        background: "#ddd",
        padding: "10px",
        textAlign: "left",
        borderBottom: "1px solid #ddd",
    };
    const [editingDevis, setEditingDevis] = useState(null); // State to hold the devis being edited
    const [showForm, setShowForm] = useState(false);
    const [formContainerStyle, setFormContainerStyle] = useState({
        right: "-100%",
    });
    const [tableContainerStyle, setTableContainerStyle] = useState({
        width:'100%'
    });
    const handleAddEmptyRow = () => {
        setSelectedProductsData([...selectedProductsData, {}]);
        console.log("selectedProductData", selectedProductsData);
    };
    const handleClientSelection = (selected) => {
        if (selected) {
            setSelectedClient(selected);
            console.log("selectedClient", selectedClient);
        } else {
            setSelectedClient(null);
        }
    };
    const getClientValue = (clientId, field) => {
        // Find the product in the produits array based on produitId
        const client = clients.find((c) => c.id === clientId);

        // If the product is found, return the value of the specified field
        if (client) {
            return client[field];
        }

        // If the product is not found, return an empty string or any default value
        return "";
    };

    const populateProductInputs = (ligneDevisId, inputType) => {
        console.log("ligneDevisId", ligneDevisId);
        const existingLigneDevis = selectedProductsData.find(
            (ligneDevis) => ligneDevis.id === ligneDevisId
        );
        console.log("existing LigneDevis", existingLigneDevis);

        if (existingLigneDevis) {
            return existingLigneDevis[inputType];
        }
        return "";
    };
    const handleInputChange = (index, inputType, event) => {
        const newValue = event.target.value;
        console.log("selectedProductsData", selectedProductsData);
        console.log("index", index);
        if (selectedProductsData[index]) {
            const productId = selectedProductsData[index].produit_id;

            if (inputType === "prix_vente") {
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
    const handleDeleteProduct = (index, id) => {
        const updatedSelectedProductsData = [...selectedProductsData];
        updatedSelectedProductsData.splice(index, 1);
        setSelectedProductsData(updatedSelectedProductsData);
        if (id) {
            axios
                .delete(`http://localhost:8000/api/ligneDevis/${id}`)
                .then(() => {
                    fetchDevis();
                });
        }
    };
    const { user } = useAuth();
console.log('user',user)

    const fetchDevis = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/getAllDataDevis");
        console.log('kkkkk',response)
            // Extraire et stocker les données dans le state et le localStorage
            setClients(response.data.clients.data);
            localStorage.setItem('clients', JSON.stringify(response.data.clients.data));
        
            setDevises(response.data.devises.data);
            localStorage.setItem('devisesVante', JSON.stringify(response.data.devises.data));
        
            setProduits(response.data.produits.data);
            localStorage.setItem('produits', JSON.stringify(response.data.produits.data));
        
        } catch (error) {
            console.error('Erreur lors de la récupération des données :', error);
        }
        
    };

    useEffect(() => {
        const devisFromStorage = localStorage.getItem('devisesVante');
        const produitsFromStorage = localStorage.getItem('produits');
        const clientFromStorage = localStorage.getItem('client');


        if (devisFromStorage) {
            setDevises(JSON.parse(devisFromStorage));
        }
        if (produitsFromStorage) {
            setProduits(JSON.parse(produitsFromStorage));
        }
        if (clientFromStorage) {
            setClients(JSON.parse(clientFromStorage));
        }

        fetchDevis();
    }, []);










    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getElementValueById = (id) => {
        return document.getElementById(id)?.value || "";
    };


    const [counts, setCounts] = useState({});

    // Retrieve counts from localStorage when the component mounts
    useEffect(() => {
        const savedCounts = localStorage.getItem('countsVente');
        if (savedCounts) {
            setCounts(JSON.parse(savedCounts));
        }
    }, []);

    // Update counts and save to localStorage
    const updateCounts = (devis, type) => {
        setCounts(prevCounts => {
            const newCounts = {
                ...prevCounts,
                [devis.id]: {
                    ...prevCounts[devis.id],
                    [`${type}Count`]: (prevCounts[devis.id]?.[`${type}Count`] || 0) + 1,
                },
            };

            // Save to localStorage
            localStorage.setItem('countsVente', JSON.stringify(newCounts));
            return newCounts;
        });
    };
    const [freshFact,setFreshFact]=useState(false)

    const handleGenerateFacture = async (devis) => {
        console.log('devis',devis)
        setFreshFact(true)
        try {
            let htt=0
            devis.lignedevis.map((ligneDevis) => {
                 console.log((parseFloat (ligneDevis.quantite) *
                 parseFloat(ligneDevis.prix_vente)))

                htt=Number(parseFloat(htt)+ (
                    parseFloat (ligneDevis.quantite) *parseFloat(ligneDevis.prix_vente)
                )).toFixed(2)
            }
        )
        console.log(htt*0.2,htt)
            // 1. Préparer les données de la facture
            const factureData = {
                reference:'FAC'+devis.reference.slice(2),

                client_id: devis.client_id,
                modePaiement: devis.modePaiement,
                total_ttc:( Number(htt)+Number(htt*0.2)),
                user_id: user.id,
                id_devis: devis.id,
                type:'C',
                date: new Date().toISOString().split('T')[0], // Adding current date

                // Autres données de la facture...
            };

            // 2. Envoyer une requête POST pour créer la facture
            const factureResponse = await axios.post(
                "http://localhost:8000/api/factures",
                factureData
            );
            console.log("factureResponse", factureResponse);


            // 3. Récupérer les lignes de devis associées au devis
            const lignesDevisResponse = await axios.get(
                `http://localhost:8000/api/ligneDevis/${devis.id}`
            );

            console.log("ligneDevis Response : ", lignesDevisResponse.data.lignedevis
            );

            const lignesFactureData = lignesDevisResponse.data.lignedevis.map(
                (ligneDevis) => ({
                    id_facture:  factureResponse.data.facture
                    .id ,
                    produit_id: ligneDevis.produit_id,
                    quantite: ligneDevis.quantite,
                    prix_vente: ligneDevis.prix_vente,
                })
            );

            console.log("factureData1", lignesFactureData);
            for (const lignefactureData of lignesFactureData) {
                // Sinon, il s'agit d'une nouvelle ligne de Devis
                await axios.post(
                    "http://localhost:8000/api/ligneFacture",
                    lignefactureData
                );
            }
            updateCounts(devis, 'factureVente');

            // Afficher un message de succès à l'utilisateur
            Swal.fire({
                icon: "success",
                title: "Facture générée avec succès",
                text: "La facture a été générée avec succès.",
            });
        } catch (error) {
            console.error("Erreur lors de la génération de la facture :", error);

            // Afficher un message d'erreur à l'utilisateur
            Swal.fire({
                icon: "error",
                title: "Erreur lors de la génération de la facture",
                text: "Une erreur s'est produite lors de la génération de la facture. Veuillez réessayer.",
            });
            setFreshFact(false)
        }
        setFreshFact(false)
    };
const [fresh,setFresh]=useState(false)
    const handleGenerateBonLivraison = async (DevisData) => {
        console.log('devis',DevisData)
        setFresh(true)
                try {
                    // Préparer les données du bon de livraison
                    const bonLivraisonData = {
                        reference:'BL'+ DevisData.reference.slice(2),
                        date:DevisData.date,
        
                        validation_offer:DevisData.validation_offer,
                        modePaiement:DevisData.modePaiement,
                        status:DevisData.status,
                        client_id:DevisData.client_id,
                        user_id:user.id,
                        type:'C'
        
                    };
                    console.log('bonLivraisonData',bonLivraisonData)
        
                    // Envoyer une requête POST pour créer le bon de livraison
                    const bonLivraisonResponse = await axios.post(
                        "http://localhost:8000/api/livraisons",
                        {
                            reference:'BL'+ DevisData.reference.slice(2),
                            date:DevisData.date,
        
                        validation_offer:DevisData.validation_offer,
                        modePaiement:DevisData.modePaiement,
                        status:DevisData.status,
                        client_id:DevisData.client_id,
                        user_id:user.id,
                        type:'C'
                        }
                    );
        
                    const livraison = bonLivraisonResponse.data;
        
        
        
                    // 3. Récupérer les lignes de devis associées au devis
                    const lignesDevisResponsee = await axios.get(
                        `http://localhost:8000/api/ligneDevis/${DevisData.id}`
                    );
        
        
        
                    console.log("ligneDevis Responsee : ",lignesDevisResponsee.data )
        
        
        
                    const lignesbonLivraisonData = lignesDevisResponsee.data.lignedevis.map((ligneDevis) => ({
                        id_bon_Livraison:livraison.devis.id.toString(),
                        produit_id: ligneDevis.produit_id,
                        quantite: ligneDevis.quantite,
                    }));
        
                    console.log("livraison1", lignesbonLivraisonData);
                    for (const lignebonLivraisonData of lignesbonLivraisonData) {
                        // Sinon, il s'agit d'une nouvelle ligne de Devis
                        await axios.post(
                            "http://localhost:8000/api/lignelivraisons",
                            lignebonLivraisonData
                        );
                    }
                    updateCounts(DevisData, 'bonLivraisonVente');

                    Swal.fire({
                        icon: "success",
                        title: "bon de livraison générée avec succès",
                        text: "La bon de livraison a été générée avec succès.",
                    });
                } catch (error) {
                    console.error("Erreur lors de la génération de la bon de livraison :", error);
                    setFresh(false)
                }
                setFresh(false)
            };
            function generateUniqueReference() {
                const date = new Date();
                const components = [
                    date.getFullYear(),
                    ("0" + (date.getMonth() + 1)).slice(-2), // Months are zero-based
                    ("0" + date.getDate()).slice(-2),
                    ("0" + date.getHours()).slice(-2),
                    ("0" + date.getMinutes()).slice(-2),
                    ("0" + date.getSeconds()).slice(-2),
                    Math.floor(Math.random() * 10000) // Random number to ensure uniqueness
                ];
                
                return components.join("");
            }
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const reference = generateUniqueReference();

                // const userResponse = await axios.get("http://localhost:8000/api/users", {
                //   withCredentials: true,
                //   headers: {
                //     "X-CSRF-TOKEN": csrfToken,
                //   },
                // });
    
                // const authenticatedUserId = userResponse.data[0].id;
                // console.log("auth user", authenticatedUserId);
                // Préparer les données du Devis
                console.log("authId",authId)
                console.log("selectedClient",selectedClient)
                const DevisData = {
                    date: formData.date,
                    status: formData.status,
                    validation_offer: formData.validation_offer,
                    modePaiement: formData.modePaiement,
                    reference: 'DV'+reference,
                    client_id: selectedClient.id,
                    user_id: user.id,
                };
    
                let response;
                if (editingDevis) {
                    // Mettre à jour le Devis existant
                    response = await axios.put(
                        `http://localhost:8000/api/devises/${editingDevis.id}`,
                        {
                            date: formData.date,
                            status: formData.status,
                            validation_offer: formData.validation_offer,
                            modePaiement: formData.modePaiement,
                            reference: formData.reference,
                            client_id: selectedClient.id,
                            user_id: user.id,
                        }
                    );
                    const existingLigneDevisResponse = await axios.get(
                        `http://localhost:8000/api/ligneDevis/${editingDevis.id}`
                    );
    
                    const existingLigneDevis =
                    existingLigneDevisResponse.data.
                    lignedevis;
                    console.log("existing LigneDevis", existingLigneDevis
                        );
                    const selectedPrdsData = selectedProductsData.map(
                        (selectedProduct, index) => {
    
    
                            return {
                                id: selectedProduct.id,
                                id_devis: editingDevis.id,
                                produit_id: selectedProduct.produit_id,
                                quantite: getElementValueById(
                                    `quantite_${index}_${selectedProduct.produit_id}` 
                                )!==''?getElementValueById(
                                    `quantite_${index}_${selectedProduct.produit_id}` 
                                ):selectedProduct.quantite,
                                
                                prix_vente: getElementValueById(
                                    `prix_unitaire_${index}_${selectedProduct.produit_id}`
                                )!==''? getElementValueById(
                                    `prix_unitaire_${index}_${selectedProduct.produit_id}`
                                ):selectedProduct.prix_vente,
                                // Update other properties as needed
                            };
                        }
                    );
                    console.log("selectedPrdsData:", selectedPrdsData);
                    for (const ligneDevisData of selectedPrdsData) {
                        // Check if ligneDevis already exists for this produit_id and update accordingly
    
                        if (ligneDevisData.id) {
                            // If exists, update the existing ligneDevis
                            await axios.put(
                                `http://localhost:8000/api/ligneDevis/${ligneDevisData.id}`,
                                {
                                    id: ligneDevisData.id,
                                    Code_produit: ligneDevisData.produit_id,
                                    prix_vente: ligneDevisData.prix_vente,
                                    quantite: ligneDevisData.quantite,
                                    id_facture: ligneDevisData.id_devis
                                }
                            );
                        } else {
                            // If doesn't exist, create a new ligneDevis
                            await axios.post(
                                "http://localhost:8000/api/ligneDevis",
                                {
                                    produit_id: ligneDevisData.produit_id,
                                    prix_vente: ligneDevisData.prix_vente,
                                    quantite: ligneDevisData.quantite,
                                    id_devis: ligneDevisData.id_devis
                                }
                                
                            );
                        }
                    }
    
    
    
    
    
                } else {
                    // Créer un nouveau Devis
                    console.log('devisdata',DevisData)
                    response = await axios.post(
                        "http://localhost:8000/api/devises",
                        {
                            reference:'DV'+reference,
                            date:DevisData.date,
    
                            validation_offer:DevisData.validation_offer,
                            modePaiement:DevisData.modePaiement,
                            status:DevisData.status,
                            client_id:DevisData.client_id,
                            user_id:user.id,
                            type:'C'
                        }
                        
                    );
                    //console.log(response.data.devi)
                    const selectedPrdsData = selectedProductsData.map(
                        (selectProduct, index) => {
                            return {
                                id_devis: response.data.devis.id,
                                produit_id: selectProduct.produit_id,
                                quantite: getElementValueById(
                                    `quantite_${index}_${selectProduct.produit_id}`
                                ),
                                prix_vente: getElementValueById(
                                    `prix_unitaire_${index}_${selectProduct.produit_id}`
                                ),
                            };
                        }
                    );
                    console.log("selectedPrdsData", selectedPrdsData);
                    for (const ligneDevisData of selectedPrdsData) {
                        // Sinon, il s'agit d'une nouvelle ligne de Devis
                        await axios.post(
                            "http://localhost:8000/api/ligneDevis",
                            ligneDevisData
                        );
                    }
    
    
                }
                console.log("response of postDevis: ", response.data);
    
                fetchDevis();
    
                setSelectedClient([]);
    
                setSelectedProductsData([]);
                //fetchExistingLigneDevis();
                closeForm();
    
                // Afficher un message de succès à l'utilisateur
                Swal.fire({
                    icon: "success",
                    title: "Devis ajoutée avec succès",
                    text: "La devise a été ajoutée avec succès.",
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
          }

      
    };

    const handleEdit = (devis) => {
        console.log("devis for edit", devis)

        setEditingDevis(devis);
        setFormData({
            reference: devis.reference,
            date: devis.date,
            validation_offer: devis.validation_offer,
            modePaiement: devis.modePaiement,
            status: devis.status,
            client_id: devis.client_id,
            user_id:user.id,
        });

        console.log("formData for edit",formData)
        const selectedProducts = devis.lignedevis && devis.lignedevis.map((ligneDevis) => {
            const product = produits.find(
                (produit) => produit.id === ligneDevis.produit_id
            );
            console.log("product",product)
            return {
                id: ligneDevis.id,
                Code_produit: product.Code_produit,
                calibre_id: product.calibre_id,
                designation: product.designation,
                produit_id: ligneDevis.produit_id,
                quantite: ligneDevis.quantite,
                prix_vente: ligneDevis.prix_vente,
            };
        });
        setSelectedProductsData(selectedProducts);
        console.log("selectedProducts for edit",selectedProducts)
        if (formContainerStyle.right === "-100%") {
            setFormContainerStyle({ right: "0" });
            setTableContainerStyle({ width:'62%' });
        } else {
            closeForm();
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Êtes-vous sûr de vouloir supprimer ce devis ?",
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


                // Ensuite, supprimer le devis
                axios.delete(`http://localhost:8000/api/devises/${id}`)
                    .then(() => {
                        fetchDevis();
                        Swal.fire({
                            icon: "success",
                            title: "Succès!",
                            text: "Devis supprimé avec succès.",
                        });
                    })
                    .catch((error) => {
                        console.error("Erreur lors de la suppression du devis:", error);
                        Swal.fire({
                            icon: "error",
                            title: "Erreur!",
                            text: "Échec de la suppression du devis.",
                        });
                    })

                    .catch((error) => {
                        console.error("Erreur lors de la suppression de la facture:", error);
                        Swal.fire({
                            icon: "error",
                            title: "Erreur!",
                            text: "Échec de la suppression de la facture.",
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
            setTableContainerStyle({  width:'62%' });
        } else {
            closeForm();
        }
    };

    const closeForm = () => {
        setFormContainerStyle({ right: "-100%" });
        setTableContainerStyle({  width:'100%' });
        setShowForm(false); // Hide the form
        setFormData({
            // Clear form data
            reference: "",
            date: "",
            validation_offer: "",
            modePaiement: "",
            client_id: "",
            zone_id: "",
            user_id: "",
            Code_produit: "",
            designation: "",
            prix_vente: "",
            quantite: "",
            id_devis: "",
        });
        setErrors({
            // Clear form data
            reference: "",
            date: "",
            validation_offer: "",
            modePaiement: "",
            client_id: "",
            zone_id: "",
            user_id: "",
            Code_produit: "",
            designation: "",
            prix_vente: "",
            quantite: "",
            id_devis: "",
        });
        setEditingDevis(null); // Clear editing client
        setSelectedProductsData([])
    };
    //---------------------------Produit--------------------------
    // const handleProductCheckboxChange = (productId) => {
    //     const updatedSelectedProducts = selectedProducts.includes(productId)
    //         ? selectedProducts.filter((id) => id !== productId)
    //         : [...selectedProducts, productId];
    //     setSelectedProducts(updatedSelectedProducts);
    //
    //     console.log(updatedSelectedProducts);
    // };


    const handleProductSelection = (selectedProduct, index) => {
        console.log("selectedProduct", selectedProduct);
        const updatedSelectedProductsData = [...selectedProductsData];
        updatedSelectedProductsData[index] = selectedProduct;
        setSelectedProductsData(updatedSelectedProductsData);
        console.log("selectedProductsData", selectedProductsData);
    };


    useEffect(() => {
        const filtered = devises.filter((devis) => {
            const searchString = searchTerm.toLowerCase();
            return (
                (devis.reference && devis.reference.toLowerCase().includes(searchString)) ||
                (devis.date && devis.date.toLowerCase().includes(searchString)) ||
                (devis.modePaiement && devis.modePaiement.toLowerCase().includes(searchString)) ||
                (devis.client_id && String(devis.client_id).toLowerCase().includes(searchString)) ||
                (devis.validation_offer && devis.validation_offer.toLowerCase().includes(searchString)) ||
                (devis.status && devis.status.toLowerCase().includes(searchString))
            );
        });
        setFiltereddevises(filtered);
    }, [devises, searchTerm]);

    const handleSearch = (term) => {
        setSearchTerm(term);
    };



    const handlePDF = (devisId,handelV) => {
        // Récupérer les informations spécifiques au devis sélectionné
        const selectedDevis = devises.find((devis) => devis.id === devisId);
    
        if (!selectedDevis) {
            console.error(`Devis avec l'ID '${devisId}' introuvable.`);
            return;
        }
    
        // Création d'une nouvelle instance de jsPDF
        const doc = new jsPDF();
    
        // Ajouter une image de fond
        const backgroundImgUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAABooSURBVHhe7d0JkF11nejx37m3Oxs7PJSGABoCAuICsgVkE1ERdEREFJ+jaGlhOTNPhxp0lNE3o474FNFxdBbK9xwXEEaWAUF0BhhEkCWiASKLhi2yBALZO52k+9x3zu0ThXo8B5P09uvPp+qSs/yrDFjd3/s/a9HpdAIAmNhazZ8AwAQm6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDqw3vfkTmIAEHahNWbUkXvOVd8bA2SdFueQ3g3dHdE5q9gETgKAD0Slj1xsviDMGB6I3yii22aHcLjqxd7MbmAAEHYiyjC3uuSH2q/5s7bhn2YkoBqrNS4b3AhOBoAP1DL0YGoyeerlvVtXzVvFwFMWN3Z3AhCDoQHQ60apm58XpF0Vx5HvbrWj1HFxtnju8F5gIBB3oXTcQz2+WgQlK0GGy68SWj98Xh9YXwzVbgAlI0GGS63RiswfviAPKEHSYyAQdJrlOGdMevTd2a1aBCUrQYZKrZug9y5+IbRxyh4lN0GFya5VDsfnQ2uipfht0mm3ABCToMLnNWLooDhwcjJ7tZuo5TGSCDpNYp4yt5l8TJw5WM/S+3UqH3GECE3SYxKqgz7jrJ7F//cjXvtkdU3SYwAQdJq+etQOx88DKmF5fENe3R9lsBiYiQYfJa/OFd8Yf1Qs906Kz/S6d+oUswAQl6DBJ1Q+UmX9tvLpe7ptdz85bj9fLwMQk6DBJ1Q+UWbQgdu4ebt+tfsNaPNHsAiYgQYfJacqqpbHf2tUxtV7ZoTtDL/rrZWBiEnQYOzPW9McRD86LT69eVp5VzZlf1WwfDZvddV2cUt+uVj/DfeaLO2uqPx5p9m2woXXxkicXxmkDKzofqVYPG94KjAZBh7HRO7Ay5vz0wvjkpWfFGf98Wuv0/iXlqc2+EdfpxNRfXh9z6tvVttiuE9M3K5ZE0fpxs3tD1RfZnXLZ5+Nv/un9xaefuG/or5vtwCgQdBgD1cx4759fGR+e98M4rH5K2057lj0ztups1+weDa0Vj8c29UJz/nxxFMVV3T0bqhO9ixfG7KWPxnbVv1P72x9pH9HsAUaBoMMoGxqMvW7/UXzsZ5fH0XX4dt2njLd8fN1QNUN+qBky4qoZem89Oz/9oije8BetVrR6X1ptvn947wYqYuWs/eLObXaqvhxUvI4VRpegwyiqYr7nbVfEp264IP5o3UBMaWLeiVbrrmqGfG0zbKT1rFkZe1VB39TBXbftzLjgVe/pXLXFtrG83nDOSTH0jQ/Fov5lnU9Uq6N5BAImHUGHUVIOxh5VzD9z0/fi+LVVzHfepyy6MY/WI1H0XFhNaK9pho60KY/+Ko4eodel3r3LS4svHv/hzvnb9sXiepb+5MOx/SV/W7xv5VNlfaEcMEIEHUZBORS7/eyK+OxNF8bxgwPR28zMy+iZ2o6e3p2r2fmnqmGjdR/4lHtvisNH8JD4vB33rKL+552vb79zLKo3PHZf7HThJ1rv6e4FRoSgwwirYv7Cuf8WX7jl4jh27drobWbmZbRadzRDRlWnE+1H74kXNqsj5Vfbv6D42jGndS7ZevtYUv2i6SxZFNs2+4ARIOgwgsoydr354vi7my+pYt4fU592znx+tHrOboaNtmJgRcwYoUPuT7ewb4/ii0e8q3Pj1M1joI762SdF+eW3x7onHywvqvZvPTwM2BQEHUZIp4yZN14Q/zj3sjjmGefMi9aDUfR8o+rqZc3Q0dSqvli8pL5Vrlkfab+efVDx8Ved2rm5d1qsrTfUD7P59kdbb3xyYfnP3RHAJiHoMAKqmPfdcEGc+7PL4ug65rNe3szM63Pm7d5ZURTnVMO6V4KPsikL58cb66hOmd5sGXm373l48aHX/UnnP6ZvHqur3zqd+n//vI+13tjsBzYBQYdNrNOJ7a//Tnzz51fGUfVMuI75CR9ZV1Y/br9phoylnurvdXx9D/qOo/v+89urmfrpr/lA5+o66q1WlPUXnWYfsAkIOmxCVcy3vfb/xL9W0TyimZkXVczrW9MWRbv9zWbYWGo9fn/s1H3D2u7V33Z03Tv7wOLDR53auaU+/F6fU2+2A5uAoMOms+XV58Zl86+OOc+cmcfyKuZXRNH6u+FhY6ZY0x8vrw931yvD70AfdQv2Orx431HvKef2TIt19UVy9ecfTo2Vj91b/rAZA2wAQYdNY8a//2P8YP61cVB9a1oT8xi+z3zqNlXM31+NGev3jffc+9M4tT7cXq/stGc5VjPkX7/4qNY7X3ta57opU6L6jxTRvzw2u+CTrdF82xykI+iw8Xqv+kr8593Xx/7lYLSeNjNfOrx73Gjf/qN4dX24fesdO50p02Ms33/+wB6HFqce/b7ypm7Umwvlmn3ABhB02EiXnx233nNj7FvPzF8wfM683rwi2r0XdAeMI8seH364S9+senLeerJeHkOP7H1k6+SD3jy0sKcnhuqor79P/aHby7nV/vbwMOC5EHTYCJf8bfzygdtir/qtac3MvC5lf7R6royiNZ6eXV5UMT+xfiFMWS337V7/c/i+8DH22IEntg/d79ihJfWV7/WG+r/lJZ9tvezBeeWN3RHAcyLosIH+7X/FHQ/dEbs358yHZ+bD58w3j1b7HdWQsbjP/P+nmH9tnFKfEqhX+l5UDkVRjPUMfb1Fh/1xe6/93zD0279PHfVLz2rt26wCz4Ggwwa49Ky486F5sUcdnt33787Mh6rNq4b3jk9V0A/pzssrO7ywszqK1ni6qvzJw/57e/Z+rxta8bSZunPq8AcQdPgDXfrZmP/gvHhRPTOvYl688fTuOfPV0e49vztgnBpYFdPrC+KGHyjTWlkFvX6e+niy4qj3tme+/Jih/uoXU/cK/PXn1B/8efec+hb1NuDZFZ1Rf7YETFxXnBO33Tc3XtzEPKqY1z9Adcy/XQXyA9XyeP2BmlqFceX/OD96m/XxbNtrvz50/y+uam++/ohCHfg3/kV5524Htl7WHQH8P8zQ4bkpbrsivnv/bbHX02L+u3PmReu0asy4/Xa85NF4Rznyb1fbVJ6qZuo7H/r2ofu6a9Xfu753/tLPt17SXQeelaDDf61n/rVx7q2XxOvXDMTUp83Mlw3vHv/uuSHeVIexWZ0Ilh/45vbBr3r30D3Vb6lO91OpD8Hf/ePBB6LTeXe16vcXPI0fCPj92gtujc/95Dvx1pXLYvPfzswjBqJnysndERPAr2+OVzSLE8mT+x7Xft3+xw6tbta7rvhKzy4Lbu18uFp85fAWoCbo8HusWRWH33JJnFjHvJ7hvuK4+mL2Sv1O8yiuGV4Z/1Ysjq3Wn4+eYNbse1znmW+pq/5/uPfG2DU65QnNFqAi6PB7rOmPvQZWxozuSis6F32uNx5bUHWxKB6qtozbc+bP0ImtB9dOiIvhnk1562XtZ9zPv8tLy84xH+jeJjiWj66FcUfQ4ffYcvu4eZ+jykfW3xu9biDiwk9PiacejtnV6oS4T3rZE3F89znpE+sceq0oh2Krh+8udmrWY5d9yjjhjHXrenrbt0fR+l6zGagIOvx+PzvghOKsQ95a3tV93nhlXX8U3/1Ezy6dcmKcl75vbhy3/g1rE0mnE/9t4Z3xrlVPxZb1eh3zkz7ZavVMnzo1Wj1HVZt+Xm8Hhgk6/JeK7x50Yuu0I/64nLv+zWBrVkb7vI/Fxc2Ace3u6+OQ+s/tdpk4D52ovizNXLQg3n3ll+JDA/0xrZmZj4dnz8O4Jejw3Nzw8mNbpxz5ns4N9Uy9vsDs8QWxfbNvPJv25G/iefVC327dswbjXjkYL/rldfE/L/pU/PXAypg+c++yVce8Z2r7x80Q4FkIOjx397/k6OJ99Uy9+sHp1Iex6/ui//5dMbhi8dDl1f5Zw8PGj7Wr4xXVtLx77rxv9/E/QR8ajL2uPy++eu3/jnesHYgpM/cpi9/GvNXzp80w4FkIOvxhFlQz9Q++8pTyju6FcmUUa/qj9c3T269dubj8QjNm3Fg4P05YfzFc95Wp41g5FLOu/1Z87Rc/iMPr17zWM/PmnPm0KuavqYbcMzwSeDaCDn+42w44oTh9zsnlXd21KpgD/dHzrTNar++ujyP33hhH1EcSeqZFZ/tdOs1N9ONPp4yd5/0wPjPvR3FoORjtZmY+bv++MB4JOmyQ4uqD31KceejJ5d3VT1H3WPbAivF3r/cTD8TM+h3ofbOH77rrbhxnqpjv+Kub4owbzo83PT3mPVPbNzdDgOdA0GGDFZce/Nbirw47pbyjXqsvlDvnpBj6h/fEwLJHh26oNu1fbx8rdSjX9Me0erlvt+53jsH6H+NJPTN/YF782dXnxqnr1kZvczV7WcX8hmj1fLwZBjwHgg4bpfjegScUZx7+jnJevVZHvX9FTDnvzPZ+yxcNndUdMkYWPxQnrl0dU+u/0w71DL1oPdrsGhfKoZh938/iQ1f9fXxw/dXsJ36y1e6ZPrWnivmR1ZDrhkcCz4Wgw0Yrvn/Am4pPdKNeX4BWffqXx9Tzz2x37/8eK7+6OV63/pGvM/fqdKLV/n53xzgwtC72ufsnccZ//FO8rxvz4cPszV5gQwg6bLz6zrArq6h/6pWnlHeuP6fevzSmdveOkYfuiL0HB6O9xTadYvoWneprRus7za4xVX3JeNkd18RHr/9WvK1/WWzW3Gdev1r+ymYIsAGKzsR5eBSMd9VsuPOWWy7pfPT681ovqTdU35g707aMtad8ZujWrXZo1+eEr6+3j4ZvfCgWvftL8fxmdVwYXBP733F1nH7LJfH6/uXPiPkPotXz59UQt6bBBjJDh01nXfUd+eIDTyg+98q3lfPrDfWZ64HlMeW7f9Xef/mioU90R42Ccih2HapfyDKOrBuIOT+/Mj52y8VxXP/S2Pxp95m3qpgfVw0Rc9gIgg6b1pqq4ZccdGLx+TknlffWG+qor1wa084/s31od8QoWPxQvGntmpjSrI65Nf1x5NzL42Nzvx/HdA+zO2cOm5ygw6a3umr4RYecVJx98JvLBc22UT2nfu9P49jBgfER9IFV8epbL4m//MVVceTA8pjRt+dwzLuH2YFNRtBhZKyKovjuoW8rzn76TL1+9vtX3xVrlz4ydFNE59juyBGwaEG8sL4grlkdMwMr45hbLo6P3HFNHLI+5id+tI55z/ei1fM3zTBgExB0GDkrqqifV83UvzjnxPLXzbaoHxN7/sfb+y57rPzLZtOmNrW+/7x7C90Yqv4Oh829PP58/jUx5+kx753ec2G02p+phswdHglsCoIOI2t5FfULDjm5+NL+bygXdiNb36e+MnrP+3j7gGbMJrVuTbx4TX9Mr48INJtGXX01+51Xx5/88j9jTvXv+ruYb1ZfANd+WzWkfhCPZ7XDJiToMPKW1Yffj3hn8eX9jisfrX7qhp/9vjymfPVdsW7xg0O/iOi8s9o0o96+sRY/FK9eszKmN6ujrvpCccAvr4s/m/ejOGrV0th8pz3LqGLe6Z3Re24zBBgBgg6j46kq6t886tTiCwe+qXyg3tC9pa0/2t86o73P4gfLM6qoH98duZEW3BJHD6yKaVPGIOlrV8eh1cz8w3Mvj2OXLopt+/YoW03MvxRF63PNMGAECDqMnsVV1P/lsFOKs7vn1Jtz3PXrTc8/s71X/9LyhO6ojbTovnjB4GD07Di7HNVD7kPr4sV3/yTef9v347XLHo9tdhyOeVQx/1oV8y9XQ+4fHgmMBEGH0fVk90K5k4tzDjrxd7e07TCrbM/YsvOCZnWDDa6NfVcvj83r5b7dR/cpkAMr44B7b4w5y5+IreuZ+ZvXnzMvWn9a7X6o+ngsJYwgQYfRt6S+UO6Vb6+ifkJ5X/eVoVX8Ksu6ezfCwjvjbfV563q5b3Y5qgHdbJvOkl1fVq763dXs7Z80u4BR4FnuMHa2rSatrynXlW9utTubR6t9QfUj+S/Nvg1yzdfjuvnXxMFr10bvB89d05m29dTRvBd9+N9nsHNoq11fM9D692qbqMMoEXQYW/WV7TtWn/o1p/X7ypdWnw1VXPb5mLdgbuy95fM6rfees7asn+DS7Bstm1WfravP2uqzpPoMVh9gFDjkDmOrv/rUD525q/psTMzrK8wPX/lkFdMyir5Z3S/qY/FtfVX1ebj6PFF9xBxGkaBDEg/fHceueDK2qpf7di+rfxb1DBmYJAQdknhwXhw4sHL4CXHdoLfaP2p2AZOAoEMS1ex827J+IUsZxQ67dcpotS5odgGTgKBDEnXC69n5jnvUh9u7D6K7qbsDmBQEHXLYrDs7r/TN7l4LV1+QtqZeACYHQYcEBlbGnN89Ia7sRKt1R7XobWYwiQg6JLBoQRy5cklsWS93H/la9Hy7WqzvBQcmCUGHBH5zV+w3sCJmnP6v0dqyb0oriuIr1ebu82SByUHQIYHVy2PLweYcOjA5CTokUF/h3iwCk5RfAjDBDQ3Gi9b2x/RmFZikBB0muKWPxZHLn4ht6wfKNJuASUjQYYK7/7Z49dLHY9vtZnpzIkxmgg4T22ZPPRwz1/bHtOfvVpqhwyQm6DCBrXwqXrfkkXh+ORit7v3nwKQl6DCBrVkV268biCndN6y9qPRkOJjEik7Ht3qYwOYMrBg6c/mi2Pt5szoLo9VzeLMdmGQEHSa+F0R0ZlU/zrdXy4uHNwGTjaADQALOoQNAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6AEx4Ef8XOM2JC8oD5ygAAAAASUVORK5CYII='; // Remplacez par l'image de fond en Base64
        doc.addImage(backgroundImgUrl, 'PNG', 0, 0, 210, 297); // A4 size in mm
    
        // Ajouter le logo
        
        const logoUrl = 'data:image/png;base64,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OgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6AEx4Ef8XOM2JC8oD5ygAAAAASUVORK5CYII='; // Remplacez par le logo en Base64
     let separatorY=0
        if(handelV){ 
        // Dessiner un cadre pour le nom de la société et le logo
        const companyBoxX = 10; // Position horizontale du cadre
        const companyBoxY = 30;
        const companyBoxWidth = 190; // Largeur du cadre
        const companyBoxHeight = 40; // Hauteur du cadre
   
        doc.setDrawColor(0, 102, 204); // Couleur bleue pour le cadre
        doc.setFillColor(230, 230, 250); // Couleur de fond légèrement bleue
        doc.setLineWidth(1); // Épaisseur de la ligne
        doc.rect(companyBoxX, companyBoxY, companyBoxWidth, companyBoxHeight, 'FD'); // Dessiner le cadre avec remplissage
    
        // Ajouter le nom de la société à l'intérieur du cadre
        
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Nom de la Société", companyBoxX + 60, companyBoxY + 20); // Ajustez la position selon besoin
    
        // Ajouter une image de logo dans le cadre
        doc.addImage(logoUrl, 'PNG', companyBoxX + 10, companyBoxY + 10, 50, 20); // Position et taille du logo}
        
        // Dessiner une ligne séparatrice pour les informations du client
         separatorY = companyBoxY + companyBoxHeight + 5;
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(companyBoxX, separatorY, companyBoxX + companyBoxWidth, separatorY);
    }

        // Dessiner un cadre noir pour les informations du client
        const boxX = 120; // Ajustez la position horizontale du cadre
        const boxY = separatorY + 10;
        const boxWidth = 80; // Ajustez la largeur du cadre
        const boxHeight = 40; // Ajustez la hauteur du cadre
        doc.setDrawColor(0); // Couleur noire
        doc.setLineWidth(0.5); // Épaisseur de la ligne
        doc.rect(boxX, boxY, boxWidth, boxHeight);
    
        // Dessiner les informations du client dans le cadre à droite
        const clientInfo = [
            { label: "Nom:", value: selectedDevis.client.raison_sociale },
            { label: "Adresse:", value: selectedDevis.client.adresse },
            { label: "Téléphone:", value: selectedDevis.client.tele },
            { label: "ICE:", value: selectedDevis.client.ice },
        ];
    
        // Position de départ pour l'impression des données du client
        let textOffsetX = boxX + 5;
        let textOffsetY = boxY + 10;
    
        // Afficher les informations du client dans le cadre
        doc.setFontSize(10);
        clientInfo.forEach((info, index) => {
            if (index === 0) {
                // Nom du client en gras et police plus grande
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text(info.label, textOffsetX - 2, textOffsetY); // Ajouter le label
                doc.text(info.value ? info.value.toString() : "", textOffsetX + 20, textOffsetY); // Ajuster position
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
            } else {
                doc.text(info.label, textOffsetX - 2, textOffsetY); // Ajouter le label
                doc.text(info.value ? info.value.toString() : "", textOffsetX + 20, textOffsetY); // Ajuster position
            }
            textOffsetY += 8;
        });
    
        // Dessiner le numéro de devis en gras à gauche des informations du client
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Facture N°:", 10, boxY + 24);
        doc.text(selectedDevis.reference ? selectedDevis.reference.toString() : "", 60, boxY + 24);
    
        // Vérifier si les détails des lignes de devis sont définis
        if (selectedDevis.lignedevis) {
            // Dessiner les en-têtes du tableau des lignes de devis
            const headersLigneDevis = ["Produit", "Code produit", "Désignation", "Quantité", "Prix Unitaire", "Total"];
    
            // Récupérer les données des lignes de devis
            const rowsLigneDevis = selectedDevis.lignedevis.map((lignedevis) => {
                const produit = produits.find(prod => prod.id === lignedevis.produit_id);
                return [
                    lignedevis.produit_id ? lignedevis.produit_id.toString() : "",
                    produit ? produit.Code_produit : "",
                    produit ? produit.designation : "",
                    lignedevis.quantite ? lignedevis.quantite.toString() : "",
                    lignedevis.prix_vente?lignedevis.prix_vente:'0.0',
                    (lignedevis.quantite * lignedevis.prix_vente)?(lignedevis.quantite * lignedevis.prix_vente).toFixed(2) :0.0
                ];
            });
    
            // Dessiner le tableau des lignes de devis
            doc.autoTable({
                head: [headersLigneDevis],
                body: rowsLigneDevis,
                startY: boxY + boxHeight + 40,
                margin: { top: 20 },
                styles: {
                    lineWidth: 0.1,
                    lineColor: [0, 0, 0],
                    fontSize: 8,
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 45 },
                    3: { cellWidth: 15 },
                   
                },
            });
    

    

        }
        // Ajouter la table des informations supplémentaires
        doc.autoTable({
            head: [['Date', 'Validation de l\'offre', 'Mode de Paiement']],
            body: [[selectedDevis.date, selectedDevis.validation_offer, selectedDevis.modePaiement]],
            startY: boxY + boxHeight + 20,
            styles: {
                lineWidth: 0.2,  // Border width
                lineColor: [0, 0, 0],  // Border color (black)
                fontSize: 8,
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 80 },
                2: { cellWidth: 60 },
            },
        });
        
        // Ajouter une ligne séparatrice pour les informations de la société en bas de la page
        const companyInfoY = doc.internal.pageSize.height - 20; // Position verticale pour les informations de la société
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(10, companyInfoY - 5, 200, companyInfoY - 5); // Ligne au-dessus des informations de la société
    
        // Ajouter les informations de la société
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Nom de la Société", 15, companyInfoY);
        doc.text("Adresse de la Société", 50, companyInfoY );
        doc.text("Téléphone: 123456789", 100, companyInfoY );
        doc.text("Email: contact@societe.com", 150, companyInfoY );
    
        // Ajouter les sections de signature
        const signatureY = doc.autoTable.previous.finalY + 80;
        doc.line(20, signatureY - 4, 70, signatureY - 4);
        doc.line(150, signatureY - 4, 200, signatureY - 4);
        doc.setFontSize(10);
        doc.text("Signature du Client", 20, signatureY);
        doc.text("Signature du Fournisseur", 150, signatureY);
        doc.setLineWidth(0.5);
    
        // Enregistrer le fichier PDF avec le nom 'devis.pdf'
        doc.save("devis.pdf");
    };


// Fonction pour convertir un nombre en lettres (français)
const numberToWordsFr = (num) => {
    const ones = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];

    const convertToWords = (num) => {
        if (num === 0) return "zéro";

        let words = '';

        if (num < 10) {
            words = ones[num];
        } else if (num < 20) {
            words = teens[num - 10];
        } else if (num < 100) {
            words = tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ones[num % 10] : '');
        } else if (num < 1000) {
            words = (Math.floor(num / 100) === 1 ? 'cent' : ones[Math.floor(num / 100)] + ' cent') + (num % 100 !== 0 ? ' ' + convertToWords(num % 100) : '');
        } else if (num < 1000000) {
            words = (Math.floor(num / 1000) === 1 ? 'mille' : convertToWords(Math.floor(num / 1000)) + ' mille') + (num % 1000 !== 0 ? ' ' + convertToWords(num % 1000) : '');
        } else {
            // Add more cases if needed
        }

        return words.trim();
    };

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = convertToWords(integerPart);
    if (decimalPart > 0) {
        result += ` dirhams et ${convertToWords(decimalPart)} centimes`;
    } else {
        result += ` dirhams`;
    }

    return result;
};
    function convertirEnLettres(montant) {
        // Tableau des chiffres en lettres
        const chiffresEnLettres = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];

        // Tableau des dizaines en lettres
        const dizainesEnLettres = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

        // Tableau des exceptions pour les nombres entre 10 et 19
        const exceptions = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];

        // Fonction pour convertir un nombre en lettre
        function convertirNombre(n) {
            if (n < 10) {
                return chiffresEnLettres[n];
            } else if (n >= 10 && n < 20) {
                return exceptions[n - 10];
            } else {
                const dizaine = Math.floor(n / 10);
                const unite = n % 10;

                // Traitement spécial pour les nombres entre 70 et 79 et entre 90 et 99
                if (dizaine === 7 || dizaine === 9) {
                    return dizainesEnLettres[dizaine] + "-" + (unite === 1 ? "et-" : "") + chiffresEnLettres[unite];
                } else {
                    return dizainesEnLettres[dizaine] + (unite === 0 ? "" : ("-" + chiffresEnLettres[unite]));
                }
            }
        }

        // Séparation de la partie entière et de la partie décimale
        const [partieEntiere, partieDecimale] = montant.toFixed(2).split(".");

        // Conversion de la partie entière en lettres
        let montantEnLettres = convertirNombre(parseInt(partieEntiere));

        // Ajout de la partie décimale si elle est différente de zéro
        if (parseInt(partieDecimale) !== 0) {
            montantEnLettres += " virgule " + convertirNombre(parseInt(partieDecimale));
        }

        return montantEnLettres;
    }


    const print = (devisId,handelV) => {
        // Récupérer les informations spécifiques au devis sélectionné
        const selectedDevis = devises.find((devis) => devis.id === devisId);

        if (!selectedDevis) {
            console.error(`Devis avec l'ID '${devisId}' introuvable.`);
            return;
        }

        // Générer le contenu HTML pour impression
        const printWindow = window.open("", "_blank", "");
    
        const companyNameSection = handelV ? `
        <div class="company-name-container">
            <img src="logo_url_here" alt="Logo">
            Nom de la Société
        </div>
    ` : '';
    
        if (printWindow) {
            const newWindowDocument = printWindow.document;
            const title = `Devis N° ${selectedDevis.reference}`;

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
                        background-image: url('background_logo_url_here');
                        background-repeat: no-repeat;
                        background-size: cover;
                    }
                    .company-name-container {
                        border: 2px solid #000;
                        background-color: #f0f0f0;
                        padding: 10px;
                        text-align: center;
                        font-weight: bold;
                        font-size: 20px;
                        margin-bottom: 20px;
                        position: relative;
                    }
                    .company-name-container img {
                        max-width: 100px;
                        height: auto;
                        position: absolute;
                        top: 10px;
                        left: 10px;
                    }
                    .client-info {
                        position: relative;
                        top: 10px;
                        width: 50%;
                        padding: 10px;
                        border: 2px solid #000;
                        margin-left: 20px;
                        float: right;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        box-sizing: border-box;
                    }
                    .client-info h2 {
                        text-align: center;
                        margin: 0;
                        margin-bottom: 10px;
                    }
                    .client-info .left {
                        text-align: left;
                        margin-bottom: 5px;
                    }
                    h1 {
                        margin-top: 30px;
                    }
                    .title-container {
                        display: flex;
                        align-items: flex-end;
                        margin-bottom: 10px;
                    }
                    .title-container h1 {
                        flex: 1;
                        text-align: left;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: left;
                    }
                    .montant-total {
                        font-weight: bold;
                        font-style: italic;
                        font-size: 24px;
                        color: black;
                    }
                    .signature-container {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 50px;
                    }
                    .signature {
                        width: 45%;
                        border-top: 1px solid #000;
                        text-align: center;
                        padding-top: 5px;
                    }
                    .company-info-container {
                        border-top: 1px solid #000;
                        padding-top: 10px;
                        text-align: center;
                        font-size: 14px;
                        margin-top:40%;
    
                    }
                    .company-info-container img {
                        max-width: 100px;
                        height: auto;
                    }
                </style>
        </head>
        <body>
             ${companyNameSection}

            <div class="title-container">
                <h1>${title}</h1>
                <div class="client-info">

                    <h2>${selectedDevis.client.raison_sociale}</h2>
                    <p class="left">${selectedDevis.client.adresse}</p>
                    <p class="left">${selectedDevis.client.tele}</p>
                    <p class="left">${selectedDevis.client.ice}</p>
                </div>
            </div>

            <div style="clear:both;"></div>

            <table>
                <thead>     
                    <tr>
                        <th style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Date</th>
                        <th style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Validation de l'offre</th>
                        <th style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Mode de Paiement</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px;">${selectedDevis.date}</td>
                        <td style="border: 1px solid #000; padding: 8px;">${selectedDevis.validation_offer}</td>
                        <td style="border: 1px solid #000; padding: 8px;">${selectedDevis.modePaiement}</td>
                    </tr>
                </tbody>
            </table>

            <table>
                <thead>
                    <tr>
                        <th style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Produit</th>
                        <th style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Code produit</th>
                        <th style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Désignation</th>
                        <th style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Quantité</th>
                        <th style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Prix unitaire</th>
                        <th style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Total HT</th>
                    </tr>
                </thead>
                <tbody>
                    ${selectedDevis.lignedevis.map((lignedevis, index) => {
                const produit = produits.find(prod => prod.id === lignedevis.produit_id);
                return `
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px;">${lignedevis.produit_id}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${produit ? produit.Code_produit : ''}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${produit ? produit.designation : ''}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${lignedevis.quantite}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${lignedevis.prix_vente}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${(lignedevis.quantite * lignedevis.prix_vente).toFixed(2)}</td>
                            </tr>
                        `;
            }).join('')}
                </tbody>
            </table>

            <table class="montant-table">
                <tbody>
                    <tr>
                        <td>Montant Total Hors Taxes :</td>
                        <td>${getTotalHT(selectedDevis.lignedevis).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>TVA (20%) :</td>
                        <td>${calculateTVA(getTotalHT(selectedDevis.lignedevis)).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>TTC :</td>
                        <td>${getTotalTTC(selectedDevis.lignedevis).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

           
            <div class="signature-container">
                <div class="signature">
                    <p>Signature du Client</p>
                </div>
                <div class="signature">
                    <p>Signature de la Fornisseur</p>
                </div>
            </div>
             <div class="company-info-container">
                    <img src="logo_url_here" alt="Logo">
                    <p>Nom de la Société | Adresse de la Société | Contact: contact@societe.com</p>
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
            console.error("Erreur lors de l'ouverture de la fenêtre d'impression.");
        }
    };

    // Fonction pour calculer le montant total hors taxes
    const getTotalHT = (lignedevis) => {
        // Check if ligneDevis is defined and is an array
        if (!Array.isArray(lignedevis)) {
            // Handle the case where ligneDevis is not an array
            return 0; // or any default value that makes sense for your application
        }

        // ligneDevis is an array, proceed with the calculation
        return lignedevis.reduce(
            (total, item) => total + item.quantite * item.prix_vente,
            0
        );
    };


    // Fonction pour calculer la TVA
    const calculateTVA = (totalHT) => {
        return totalHT * 0.2; // 20% de TVA
    };
console.log('vrtb',getTotalHT())
    // Fonction pour calculer le montant total toutes taxes comprises (TTC)
    const getTotalTTC = (lignedevis) => {
        return getTotalHT(lignedevis) + calculateTVA(getTotalHT(lignedevis));
    };

    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [page, setPage] = useState(0);
    const filteredDevises = filtereddevises.filter((devis) => devis.type === 'C');

    // Pagination
    const indexOfLastDevis = (page + 1) * rowsPerPage;
    const indexOfFirstDevis = indexOfLastDevis - rowsPerPage;
    const currentDevises = filteredDevises.slice(indexOfFirstDevis, indexOfLastDevis);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleShowLigneDevis = (id) => {
        const newExpandedRows = expandedRows.includes(id)
            ? expandedRows.filter((rowId) => rowId !== id)
            : [...expandedRows, id];
        setExpandedRows(newExpandedRows);
    };

    const handleCheckboxChange = (id) => {
        const newSelectedItems = selectedItems.includes(id)
            ? selectedItems.filter((itemId) => itemId !== id)
            : [...selectedItems, id];
        setSelectedItems(newSelectedItems);
    };

    const handleSelectAllChange = () => {
        const newSelectedItems = selectAll ? [] : filteredDevises.map((devis) => devis.id);
        setSelectAll(!selectAll);
        setSelectedItems(newSelectedItems);
    };

    const validateForm = () => {
        let newErrors = {};
      
        if (!formData.reference) newErrors.reference = "Le champ N Devis est requis.";
        if (!formData.date) newErrors.date = "Le champ Date est requis.";
        if (!formData.validation_offer) newErrors.validation_offer = "Le champ Validation de l'offre est requis.";
        if (!formData.modePaiement) newErrors.modePaiement = "Le champ Mode de Paiement est requis.";
        if (!formData.status) newErrors.status = "Le champ Status est requis.";
      
        setErrors(newErrors);
      
        return Object.keys(newErrors).length === 0;
      };
      
    return (
        <ThemeProvider theme={createTheme()}>
            <Box sx={{...dynamicStyles  }}>
                <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
                    <h2 className="mt-3 titreColore">Liste des Devis</h2>
                    <div
                        className="search-container "
                        role="search"
                        style={{width:"31%", position:'absolute' ,right:'60px',marginTop:'-30px'}}
                    >
                        <Search onSearch={handleSearch} type="search" />
                    </div>
                    <div className="">
                    <a
              id="showFormButton"
              onClick={handleShowFormButtonClick}     
                       style={{
                // textDecoration: "none",
                display: "flex",
                alignItems: "center",
                marginBottom:'10px',
                marginTop:'10px',
                cursor: "pointer", // Change cursor to indicate clickable element
                marginLeft:'30px'
              }}
              className="AjouteBotton"
            >
                <ListItemIcon style={{position:'absolute',left:'30px'}} >
                <ReceiptIcon className="AjouteBotton" />
              </ListItemIcon>
              Ajouter devis
            </a>
            <div id="formContainer" style={{ ...formContainerStyle, overflowX: 'hidden' }}>
  <Form className="col row" style={{ maxHeight: '800px', overflowY: 'auto', overflowX: 'hidden' }} onSubmit={handleSubmit}>
    <Form.Label
      className="text-center m-2"
      style={{
        fontSize: '20px',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        color: 'black',
        borderBottom: '2px solid black',
        paddingBottom: '5px',
      }}
    >
      <h5>{editingDevis ? 'Modifier devis' : 'Ajouter un devis'}</h5>
    </Form.Label>
    <div className="row">
      {[
        { label: 'N Devis', name: 'reference', type: 'text', placeholder: 'Devis' },
        { label: 'Client', name: 'client_id', type: 'select', placeholder: 'Client ...' },
        { label: 'Date', name: 'date', type: 'date', placeholder: 'Date' },
        { label: 'Validation de l\'offre', name: 'validation_offer', type: 'select', placeholder: 'Select' },
        { label: 'Mode de Paiement', name: 'modePaiement', type: 'text', placeholder: 'Mode de paiement' },
        { label: 'Status', name: 'status', type: 'select', placeholder: 'Status' },
      ].map((field, index) => (
        <Form.Group className="col-sm-10 m-2" key={index} style={{ display: 'flex', alignItems: 'center' }}>
          <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>{field.label}</Form.Label>
          <div style={{ flex: '2' }}>
            {field.type === 'select' && field.name === 'client_id'? (
               <Select
               options={clients.map((client) => ({
                 value: client.id,
                 label: client.raison_sociale,
               }))}
               onChange={(selected) => {
                 if (selected && selected.length > 0) {
                   const client = clients.find((client) => client.id === selected[0].value);
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
                   handleClientSelection(null); // Handle deselection
                 }
               }}
               values={
                 formData.client_id
                   ? [
                       {
                         value: formData.client_id,
                         label: getClientValue(formData.client_id, 'raison_sociale'),
                       },
                     ]
                   : []
               }
               placeholder={field.placeholder}
             />
            ) :
            field.type === 'select' && field.name === 'validation_offer'?
                <Form.Select
                    value={formData.validation_offer}
                    onChange={handleChange}
                    name="validation_offer"
                >
                    <option value="">Select</option>
                    <option value="30 jours">30 jours</option>
                    <option value="60 jours">60 jours</option>
                    <option value="90 jours">90 jours</option>
                </Form.Select>
           : field.type === 'select' && field.name === 'status'?
           <Form.Select
                        value={formData.status}
                        onChange={handleChange}
                        name="status"
                        id="status"
                    >
                        <option value="">Status</option>
                        <option value="Envoye">Envoye</option>
                        <option value="Valider">Valider</option>
                        <option value="Non Valider">Non Valide</option>
                    </Form.Select>: (
            <Form.Control
              type={field.type}
              placeholder={field.placeholder}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              isInvalid={!!errors[field.name]}
            />
          )}
           
            <Form.Control.Feedback type="invalid">
              {errors[field.name]}
            </Form.Control.Feedback>
          </div>
        </Form.Group>
      ))}
      
    </div>
    <div style={{ marginLeft: '10px' }}>
      <Button className="btn btn-sm mb-2" variant="primary" onClick={handleAddEmptyRow}>
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <strong>Ajouter Produit</strong>
    </div>
    <Form.Group controlId="selectedProduitTable">
              <table className="table table-bordered" style={{ width: '100%',zIndex:'999' }}>
                <thead>
                  <tr>
                    <th className="ColoretableForm">Code Produit</th>
                    <th className="ColoretableForm">Designation</th>
                    <th className="ColoretableForm">Calibre</th>
                    <th className="ColoretableForm">Quantité</th>
                    <th className="ColoretableForm">Prix vente</th>
                    <th className="ColoretableForm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProductsData.map((productData, index) => (
                    <tr key={index}>
<td style={{ backgroundColor: 'white', width: '50px', position: 'relative', zIndex: 10 }}>
  <Select
    options={produits.map((produit) => ({
      value: produit.id,
      label: produit.Code_produit,
    }))}
    onChange={(selected) => {
      const produit = produits.find((prod) => prod.id === selected[0].value);
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
    values={productData.produit_id ? [{ value: productData.produit_id, label: productData.Code_produit }] : []}
    placeholder="Code ..."
    menuPortalTarget={document.body}  // Render dropdown outside the form
    styles={{
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),  // Ensure high z-index for the dropdown
      menu: (provided) => ({
        ...provided,
        zIndex: 9999,  // Ensure dropdown menu stays above everything
      }),
      menuList: (provided) => ({
        ...provided,
        maxHeight: '100px',  // Set max height for the dropdown list
        overflowY: 'auto',   // Enable scroll for the dropdown list
      }),
    }}
  />
</td>




                      <td style={{ backgroundColor: 'white', width: '50px' }}>
                        <Select
                          options={produits.map((produit) => ({
                            value: produit.id,
                            label: produit.designation,
                          }))}
                          onChange={(selected) => {
                            const produit = produits.find((prod) => prod.id === selected[0].value);
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
                      <td>{productData.calibre_id}</td>
                      <td>
                        <input
                          type="text"
                          style={{ border: 'none', width: '50px' }}
                          id={`quantite_${index}_${productData.produit_id}`}
                          className="quantiteInput"
                          placeholder={productData.quantite}
                          value={
                            modifiedQuantiteValues[`${index}_${productData.produit_id}`] 
                          }
                          onChange={(event) =>
                            handleInputChange(index, 'quantite', event)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          style={{ border: 'none', width: '50px' }}
                          id={`prix_unitaire_${index}_${productData.produit_id}`}
                          className=''
                          placeholder={productData.prix_vente}
                          value={
                            modifiedPrixValues[`${index}_${productData.produit_id}`]
                          }
                          onChange={(event) =>
                            handleInputChange(index, 'prix_vente', event)
                          }
                        />
                      </td>
                      <td>
                        <Button
                          className=" btn btn-danger btn-sm m-1"
                          onClick={() => handleDeleteProduct(index, productData.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {errors.products && (
                    <tr>
                      <td colSpan="6" className="text-danger text-center">
                        {errors.products}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            
    </Form.Group>
    <Form.Group className="mt-5 d-flex justify-content-center" >
  <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
      // Set lower z-index than the dropdown
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
      // Set lower z-index than the dropdown
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
                            <table className=" table_width table table-bordered" style={{marginTop:'-0px'}}>
                                <thead
                                    className="text-center "
                                >
                                <tr>
                                    <th className="tableHead widthDetails" >{/* Vide */}</th>
                                    <th  className="tableHead">
                                        <input  
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={handleSelectAllChange}
                                        />
                                    </th>
                                    <th   className="tableHead">N° Devis</th>
                                    <th className="tableHead" >Date</th>
                                    <th   className="tableHead">Client</th>
                                    <th   className="tableHead">Total HT</th>
                                    <th  className="tableHead">TVA (20%)</th>
                                    <th  className="tableHead">Total TTC</th>
                                    <th  className="tableHead">Status</th>
                                    <th  className="tableHead">Validation l'offre</th>
                                    <th  className="tableHead">Mode Paiement</th>
                                    <th  className="tableHead">Generation</th>
                                    <th   className="tableHead">Actions</th>



                                </tr>
                                </thead>
                                <tbody className="text-center">
                                {currentDevises.map((devis) => {
                                    const client =clients.find((client)=>
                                    client.id===devis.client_id)
                                    console.log('dfg',client)
                                     const count = counts[devis.id] || {};
                                    return(
                                        <React.Fragment key={devis.id}>
                                        <tr className="table-row">
                                        <td className="table-ce">
                                                <div className="no-print ">
                                                    <button
                                                        className="btn btn-sm btn-light"
                                                        onClick={() =>handleShowLigneDevis (devis.id)}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                expandedRows.includes(devis.id)
                                                                    ? faMinus
                                                                    : faPlus
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                {/*               <input*/}
                                                {/*  type="checkbox"*/}
                                                {/*  checked={selectedItems.some(*/}
                                                {/*    (item) => item.id === devis.id*/}
                                                {/*  )}*/}
                                                {/*  onChange={() => handleSelectItem(devis)}*/}
                                                {/*/>*/}
                                                <input
                                                    type="checkbox"
                                                    onChange={() => handleCheckboxChange(devis.id)}
                                                    checked={selectedItems.includes(devis.id)}
                                                />
                                            </td>
                                            <td>{devis.reference}</td>
                                            <td>{devis.date}</td>
                                            <td>{client.raison_sociale}</td>
                                            <td>{getTotalHT(devis.lignedevis)} DH</td> 
                                             <td>{getTotalHT(devis.lignedevis)*0.2}Dh</td>
                                            <td>{getTotalHT(devis.lignedevis)+getTotalHT(devis.lignedevis)*0.2}  DH</td>
                                            <td>{devis.status}</td>
                                            <td>{devis.validation_offer}</td>
                                            <td>{devis.modePaiement}</td>
                                            <td>
    <div>
        {devis.status === "Valider" && (
            <div>
                <Button
                    className="btn btn-sm"
                    variant="success"
                    onClick={() => handleGenerateFacture(devis)}
                >
                    {freshFact?
                        <CircularProgress size="20px" />:'F'

                    }
                </Button>
                <Button
                    className="btn btn-sm"
                    variant="outline-success"
                    style={{ marginRight: '10px' }}
                >
                    {counts[devis.id]?.factureVenteCount || 0}
                </Button>
                <Button
                    className="btn btn-sm"
                    variant="dark"
                    onClick={() => handleGenerateBonLivraison(devis)}
                >
                    {fresh?
                        <CircularProgress size="20px" />:'BL'

                    }
                </Button>
                <Button className="btn btn-sm" variant="outline-dark">
                    {counts[devis.id]?.bonLivraisonVenteCount || 0}
                </Button>
            </div>
        )}
    </div>
</td>

                                            <td>
                                                <div className="d-inline-flex flex-wrap flex-column flex-md-row">
                                                <FontAwesomeIcon
                                                 className="btn btn- ml-1"
                                                 onClick={() => handleEdit(devis)}                                                    icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                                <FontAwesomeIcon
                                                 className="btn btn ml-1"
                                                 onClick={() => handleDelete(devis.id)}                                 icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                                                        <Dropdown>
            <Dropdown.Toggle className="btn btn ml-1" style={{backgroundColor:'white',border:'none',
                color:'#007bff'
            }} id="dropdown-basic">
                <FontAwesomeIcon icon={faFilePdf} />
            </Dropdown.Toggle>

            <Dropdown.Menu>
                <Dropdown.Item onClick={() => handlePDF(devis.id,true)}>avec Entite</Dropdown.Item>
                <Dropdown.Item onClick={() => handlePDF(devis.id,false)}>sans Entite</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
                                                        <Dropdown>
            <Dropdown.Toggle className="btn btn ml-1"
            style={{backgroundColor:'white',border:'none',
                color:'red'
            }}
             id="dropdown-basic">
                <FontAwesomeIcon icon={faPrint} />
            </Dropdown.Toggle>

            <Dropdown.Menu>
                <Dropdown.Item onClick={() => print(devis.id,true)}>avec Entite</Dropdown.Item>
                <Dropdown.Item onClick={() => print(devis.id,false)}>sans Entite</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>


                                                </div>

                                            </td>


                                        </tr>
                                        {expandedRows.includes(devis.id) && devis.lignedevis && (
                                            <tr>
                                                <td colSpan="12">
                                                    <div>
                                                        <table
                                                            className="table table-responsive table-bordered"
                                                            style={{marginTop:'0px',marginBottom:'0px'}}
                                                        >
                                                            <thead>
                                                            <tr>
                                                                <th    style={{ backgroundColor: "#adb5bd" }}>Code Produit</th>
                                                                <th    style={{ backgroundColor: "#adb5bd" }}>designation</th>
                                                                <th    style={{ backgroundColor: "#adb5bd" }}>calibre</th>
                                                                <th    style={{ backgroundColor: "#adb5bd" }}>Quantite</th>
                                                                {/* <th    style={{ backgroundColor: "#adb5bd" }}>Prix Vente</th>
                                                                <th    style={{ backgroundColor: "#adb5bd" }}>Total HT </th> */}
                                                                {/* <th className="text-center">Action</th> */}
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {devis.lignedevis.map((ligneDevis) => {
                                                                    const produit = produits.find(
                                                                        (prod) =>
                                                                            prod.id === ligneDevis.produit_id
                                                                    );
                                                                    console.log("prod",produit)
                                                                    console.log("id",ligneDevis.produit_id)

                                                                    return (
                                                                        <tr key={ligneDevis.id}>
                                                                            <td>{produit ?produit.Code_produit:''}</td>
                                                                            <td>{produit ?produit.designation:''}</td>
                                                                            <td>{produit?produit.calibre.calibre:''}</td>
                                                                            <td>{ligneDevis.quantite}</td>
                                                                            {/* <td>{ligneDevis.prix_vente} DH</td>
                                                                            <td>
                                                                                {(
                                                                                    ligneDevis.quantite *
                                                                                    ligneDevis.prix_vente
                                                                                ).toFixed(2)}{" "}
                                                                                DH
                                                                            </td> */}


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
                                    )
                                   
})}
                                </tbody>
                            </table>
                            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredDevises.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
                        </div>
                    </div>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default DevisListvente;