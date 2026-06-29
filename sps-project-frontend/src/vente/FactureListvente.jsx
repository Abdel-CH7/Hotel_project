import React, { useState, useEffect } from "react";
import axios from "axios";
import Navigation from "../Acceuil/Navigation";
import Swal from "sweetalert2";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Fab, ListItemIcon, Toolbar } from "@mui/material";
import { Form, Button, Modal, Table, Dropdown } from "react-bootstrap";
import "../style.css";
import Search from "../Acceuil/Search";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faTrash, faFilePdf, faPrint, faPlus,faMinus, faEdit,} from "@fortawesome/free-solid-svg-icons";
import TablePagination from "@mui/material/TablePagination";
import Select from "react-dropdown-select";
import { width } from "@mui/system";
import DescriptionIcon from "@mui/icons-material/Description";
import { useAuth } from "../AuthContext";


import { useOpen } from "../Acceuil/OpenProvider"; // Importer le hook personnalisé

const FactureListvente = () => {
    const [factures, setFactures] = useState([]);
    const [LigneFacture, setLigneFacture] = useState([]);
    const [clients, setClients] = useState([]);
    const [devises, setDevises] = useState([]);
    const [authId, setAuthId] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);

    const [selectedClient, setSelectedClient] = useState([]);
    const [widthtable ,setwidthtable]=useState({width:"100%"})
    const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfTokenMeta ? csrfTokenMeta.content : null;
    const [editingFacture, setEditingFacture] = useState(null); // State to hold the devis being edited
    const [errors, setErrors] = useState({});

    const { open } = useOpen();
    const { dynamicStyles } = useOpen();
    
    const [formData, setFormData] = useState({
         reference: "", 
         date: "", 
         ref_BL: "",
          ref_BC: "",
           modePaiement: "",
           total_ttc:"",
           client_id:"",
            user_id: "",
        Code_produit: "",
        designation: "",
        prix_vente: "",
        quantite: "",
        id_facture: "",
    });
    const tableHeaderStyle = {
        background: "#007bff",
        padding: "10px",
        textAlign: "left",
        borderBottom: "1px solid #ddd",
    };
    
    const [formContainerStyle, setFormContainerStyle] = useState({ right: '-100%' });
    const [tableContainerStyle, setTableContainerStyle] = useState({ width:'100%'});
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [produits, setProduits] = useState([]);
    const [selectedProductsData, setSelectedProductsData] = useState([]);
    const [modifiedQuantiteValues, setModifiedQuantiteValues] = useState({});
    const [modifiedPrixValues, setModifiedPrixValues] = useState({});

    const [filteredfactures, setFilteredfactures] = useState([]);

    const { user } = useAuth();
    console.log('user',user)

    const handleAddEmptyRow = () => {
        setSelectedProductsData([...selectedProductsData, {}]);
        console.log("selectedProductData", selectedProductsData);
    };

    const handleShowLigneFactures = async (factureId) => {
        setExpandedRows((prevRows) =>
            prevRows.includes(factureId)
                ? prevRows.filter((row) => row !== factureId)
                : [...prevRows, factureId]
        ); 
    };
    console.log('fact',formData)
    useEffect(() => {
        // Préchargement des lignes de facture pour chaque facture
        factures.forEach(async (facture) => {
            if (!facture.lignefactures) {
                try {
                    const lignefactures = await fetchLignefacture(facture.id);
                    setFactures((prevFactures) => {
                        return prevFactures.map((prevFacture) => {
                            if (prevFacture.id === facture.id) {
                                return { ...prevFacture, lignefactures };
                            }
                            return prevFacture;
                        });
                    });
                } catch (error) {
                    console.error('Erreur lors du préchargement des lignes de facture:', error);
                }
            }
        });
    }, []); // Le tableau de dépendances vide signifie que ce useEffect ne sera exécuté qu'une seule fois après le montage du composant


    // const fetchLignefacture = async (factureId) => {
    //     try {
    //         const response = await axios.get(
    //             `http://localhost:8000/api/factures/${factureId}/ligneFacture`
    //         );
    //         console.log("fetch lign facture ", response.data.lignefactures);
    //         return response.data.lignefactures;
    //     } catch (error) {
    //         console.error(
    //             "Erreur lors de la récupération des lignes de facture :",
    //             error
    //         );
    //         return [];
    //     }
    // };
    // useEffect(() => {
    //     // Préchargement des lingedevises pour chaque devis
    //     factures.forEach(async (facture) => {
    //         if (!facture.lignefacture) {
    //             const lignefactures = await fetchLignefacture(factures.id);
    //             setClients((prevFactures) => {
    //                 return prevFactures.map((prevFactures) => {
    //                     if (prevFactures.id === facture.id) {
    //                         return { ...prevFactures, lignefactures };
    //                     }
    //                     return prevFactures;
    //                 });
    //             });
    //         }
    //     });
    // }, [factures]);
    //
    // useEffect(() => {
    //     fetchFactures();
    // }, []);
    const handleProductSelection = (selectedProduct, index) => {
        console.log("selectedProduct", selectedProduct);
        const updatedSelectedProductsData = [...selectedProductsData];
        updatedSelectedProductsData[index] = selectedProduct;
        setSelectedProductsData(updatedSelectedProductsData);
        console.log("selectedProductsData", selectedProductsData);
    };
    const populateProductInputs = (lignefacturesId, inputType) => {
        console.log("lignefacturesId", lignefacturesId);
        const existingLigneFactures = selectedProductsData.find(
            (LigneFacture) => LigneFacture.id === lignefacturesId
        );
        console.log("existingLigneFactures", existingLigneFactures);

        if (existingLigneFactures) {
            return existingLigneFactures[inputType];
        }
        return "";
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
                .delete(`http://localhost:8000/api/ligneFacture/${id}`)
                .then(() => {
                    fetchFactures();
                });
        }
    };

   
    const getElementValueById = (id) => {
        return document.getElementById(id)?.value || "";
    };


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClientSelection = (selected) => {
        if (selected) {
            setSelectedClient(selected);
            console.log("selectedClient", selectedClient);
        } else {
            setSelectedClient(null);
        }
    };

    const fetchFactures = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/getAllDataFacture");
    
            // Extraire et stocker les données dans le state et le localStorage
            setFactures(response.data.factures.data);
            localStorage.setItem('factures', JSON.stringify(response.data.factures.data));
    
            setClients(response.data.clients.data);
            localStorage.setItem('clients', JSON.stringify(response.data.clients.data));
    
            setLigneFacture(response.data.ligneFactures);
            localStorage.setItem('ligneFacture', JSON.stringify(response.data.ligneFactures));
    
            setProduits(response.data.produits.data);
            localStorage.setItem('produits', JSON.stringify(response.data.produits.data));
    
            console.log("ligneFactures", response.data.ligneFactures);
    
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        const facturesFromStorage = localStorage.getItem('factures');
        const produitsFromStorage = localStorage.getItem('produits');
        const clientFromStorage = localStorage.getItem('clients');

        if (facturesFromStorage && produitsFromStorage && clientFromStorage) {
            setFactures(JSON.parse(facturesFromStorage));
            setProduits(JSON.parse(produitsFromStorage));
            setClients(JSON.parse(clientFromStorage));


        }
            fetchFactures();
        
        
    }, []);
    

    useEffect(() => {
        const filtered = factures.filter((devis) => {
            const searchString = searchTerm.toLowerCase();
            return (
                (devis.type && devis.type==='C')&&(
                (devis.reference && devis.reference.toLowerCase().includes(searchString)) ||
                (devis.date && devis.date.toLowerCase().includes(searchString)) ||
                (devis.modePaiement && devis.modePaiement.toLowerCase().includes(searchString)) ||
                (devis.client_id && String(devis.client_id).toLowerCase().includes(searchString)) ||
                (devis.validation_offer && devis.validation_offer.toLowerCase().includes(searchString)) ||
                (devis.status && devis.status.toLowerCase().includes(searchString)))
            );
        });
        setFilteredfactures(filtered);
    }, [factures, searchTerm]);
    const handleSearch = (term) => {
        setSearchTerm(term);
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

                console.log("authId",authId)
                console.log("selectedClient",selectedClient)
                const FactureData = {
                    date: formData.date,
                    ref_BL: formData.ref_BL,
                    ref_BC: formData.ref_BC,
                    modePaiement:formData.modePaiement,
                    total_ttc:formData.total_ttc,
                    reference:'FAC'+ reference,
                    client_id: selectedClient.id,
                    user_id: user.id,
                    type:'C'
                };
    
    console.log('formfactur',FactureData)
                let response;
                if (editingFacture) {
                    // Mettre à jour le Devis existant
                    response = await axios.put(
                        `http://localhost:8000/api/factures/${editingFacture.id}`,
                        {
                            date: formData.date,
                            ref_BL: formData.ref_BL,
                            ref_BC: formData.ref_BC,
                            modePaiement:formData.modePaiement,
                            total_ttc:formData.total_ttc,
                            reference: formData.reference,
                            client_id: selectedClient.id,
                            user_id: user.id,
    
                        }
                    );
                    // const existingLigneFacturesResponse = await axios.get(
                    //     `http://localhost:8000/api/ligneFacture/${editingFacture.id}`
                    // );
    
                    const existingLigneFactures =
                        editingFacture.ligne_facture;
                    console.log("existing lignefactures", existingLigneFactures);
                    const selectedPrdsData = selectedProductsData.map(
                        (selectedProduct, index) => {
                            const ligneFactureForSelectedProduct = existingLigneFactures.find(
                              (ligneFacture) =>
                                  ligneFacture.produit_id === selectedProduct.produit_id
                            );
    
                            return {
                                id: ligneFactureForSelectedProduct ? ligneFactureForSelectedProduct.id : '',
                                id_facture: editingFacture.id,
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
                    for (const lignefactureData of selectedPrdsData) {
                        // Check if ligneDevis already exists for this produit_id and update accordingly
    
                        if (lignefactureData.id) {
                            // If exists, update the existing ligneDevis
                            await axios.put(
                                `http://localhost:8000/api/ligneFacture/${lignefactureData.id}`,
                                {
                                    id: lignefactureData.id,
                                    Code_produit: lignefactureData.produit_id,
                                    prix_vente: lignefactureData.prix_vente,
                                    quantite: lignefactureData.quantite,
                                    id_facture: lignefactureData.id_facture
                                }
                            );
                            
                            
                        } else {
                            await axios.post(
                                "http://localhost:8000/api/ligneFacture",
                                
                                {
                                    produit_id: lignefactureData.produit_id,
                                    prix_vente: lignefactureData.prix_vente,
                                    quantite: lignefactureData.quantite,
                                    id_facture: lignefactureData.id_facture
                                }
                               
                            );
                        }
                    }
    
    
    
    
    
                } else {
                    // Créer un nouveau Devis
                    response = await axios.post(
                        "http://localhost:8000/api/factures",
                        FactureData
                    );
                    //console.log(response.data.devi)
                    const selectedPrdsData = selectedProductsData.map(
                        (selectProduct, index) => {
                            return {
                                id_facture: response.data.facture.id,
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
                    for (const lignefactureData of selectedPrdsData) {
                        // Sinon, il s'agit d'une nouvelle ligne de Devis
                        await axios.post(
                            "http://localhost:8000/api/ligneFacture",
                            lignefactureData
                        );
                    }
    
                }
                console.log("response of postFACTURE: ", response.data);
    
                fetchFactures();
    
                setSelectedClient([]);
    
                setSelectedProductsData([]);
                //fetchExistingLigneDevis();
                closeForm();
    
                // Afficher un message de succès à l'utilisateur
                Swal.fire({
                    icon: "success",
                    title: "FACTURE ajoutée avec succès",
                    text: "La FACTURE a été ajoutée avec succès.",
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
            setFormData({ // Clear form data
                raison_sociale: '',
                abreviation: '',
                adresse: '',
                tele: '',
                ville: '',
                zone_id: '',
                user_id: '',
                total_ttc: '',
                client_id: '',
                ice: '',
                code_postal: '',
                Code_produit: "",
                designation: "",
                prix_vente: "",
                quantite: "",
                id_facture: "",
            });
            closeForm();
          }
       
    };


    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: "Êtes-vous sûr de vouloir supprimer cette facture ?",
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
                // Delete the invoice with the given ID
                await axios.delete(`http://localhost:8000/api/factures/${id}`);

                // Refresh the list of invoices (if necessary)
                fetchFactures(); // Ensure this function retrieves the list of invoices again after deletion

                Swal.fire({
                    icon: "success",
                    title: "Succès!",
                    text: "Facture supprimée avec succès.",
                });
            } else {
                console.log("Suppression annulée");
            }
        } catch (error) {
            console.error("Erreur lors de la suppression de la facture:", error);

            Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la suppression de la facture.",
            });
        }
    };


    const clearFormData = () => {
        // Reset the form data to empty values
        setFormData({
            reference: "",
            date: "",
            ref_BL: "",
            ref_BC: "",
            modePaiement: "",
            total_ttc:"",
            client_id: "",
            devis_id: "",
            id: "",
        });
    };

    const handleEdit = (facture) => {
        console.log("facture for edit", facture);

        // Populate the form data with the details of the selected facture
        setEditingFacture(facture);

        setFormData({
            reference: facture.reference,
            date: facture.date,
            ref_BL: facture.ref_BL,
            ref_BC: facture.ref_BC,
            modePaiement: facture.modePaiement,
            total_ttc: facture.total_ttc,
            client_id: facture.client_id,
            // user_id: facture.user_id, // No need to set user_id here as it's handled in handleSubmit
        });

        const selectedProducts = facture.ligne_facture && facture.ligne_facture.map((lignefacture) => {
            const product = produits.find((produit) => produit.id === lignefacture.produit_id);
            return {
                id: lignefacture.id,
                Code_produit: product.Code_produit,
                calibre_id: product.calibre_id,
                designation: product.designation,
                produit_id: lignefacture.produit_id,
                quantite: lignefacture.quantite,
                prix_vente: lignefacture.prix_vente,
            };
        });

        setSelectedProductsData(selectedProducts);
        console.log("selectedProducts for edit", selectedProducts);

        if (formContainerStyle.right === "-100%") {
            setFormContainerStyle({ right: "0" });
            setTableContainerStyle({ width:'62%' });
        } else {
            closeForm();
            setFormData({ // Clear form data
                raison_sociale: '',
                abreviation: '',
                adresse: '',
                tele: '',
                ville: '',
                zone_id: '',
                user_id: '',
                total_ttc: '',
                client_id: '',
                ice: '',
                code_postal: '',
                Code_produit: "",
                designation: "",
                prix_vente: "",
                quantite: "",
                id_facture: "",
            });
        }
    };

    const closeForm = () => {
        setFormData({ 
            reference: "",
            date: "",
            ref_BL: "",
            ref_BC: "",
            modePaiement: "",
            total_ttc: "",
            client_id: "",
        });

        setFormContainerStyle({ right: '-100%' });
        setTableContainerStyle({width:'100% '});
        setShowForm(false); // Hide the form
       
        setEditingFacture(null); // Clear editing client
        setSelectedProductsData([])
setErrors({})
    };
console.log('fff',selectedProductsData)
    const handleShowFormButtonClick = () => {
       
       
        if (formContainerStyle.right === "-100%") {
            setFormContainerStyle({ right: "-0%" });
            setTableContainerStyle({ width:'62%'});
        } else {
            closeForm();
        }
    };

    const handlePDF = (devisId,handelV) => {
        // Récupérer les informations spécifiques au devis sélectionné
        const selectedDevis = factures.find((devis) => devis.id === devisId);
    
        if (!selectedDevis) {
            console.error(`Devis avec l'ID '${devisId}' introuvable.`);
            return;
        }
    
        // Création d'une nouvelle instance de jsPDF
        const doc = new jsPDF();
    
        // Ajouter une image de fond
        const backgroundImgUrl = 'data:image/png;base64,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OgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6ACQg6ACQgKADQAKCDgAJCDoAJCDoAJCAoANAAoIOAAkIOgAkIOgAkICgA0ACgg4ACQg6AEx4Ef8XOM2JC8oD5ygAAAAASUVORK5CYII='; // Remplacez par l'image de fond en Base64
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
        if (selectedDevis.ligne_facture) {
            // Dessiner les en-têtes du tableau des lignes de devis
            const headersLigneDevis = ["Produit", "Code produit", "Désignation", "Quantité", "Prix Unitaire", "Total"];
    
            // Récupérer les données des lignes de devis
            const rowsLigneDevis = selectedDevis.ligne_facture.map((lignedevis) => {
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
            head: [["Date", "Référence BL", "Référence BC", "Total TTC", "Mode de paiement"]],
            body: [[selectedDevis.date,selectedDevis.ref_BL, selectedDevis.ref_BC,
                selectedDevis.total_ttc, selectedDevis.modePaiement]],
            startY: boxY + boxHeight + 20,
            styles: {
                lineWidth: 0.2,  // Border width
                lineColor: [0, 0, 0],  // Border color (black)
                fontSize: 8,
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 50 },
                2: { cellWidth: 40 },
                3: { cellWidth: 30 },
               
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
        doc.save("Facture.pdf");
    };
    
    const print = (devisId,handelV) => {
        const selectedDevis = factures.find((devis) => devis.id === devisId);
    
        if (!selectedDevis) {
            console.error(`Devis avec l'ID '${devisId}' introuvable.`);
            return;
        }
    
        const printWindow = window.open("", "_blank", "");
    
        const companyNameSection = handelV ? `
        <div class="company-name-container">
            <img src="logo_url_here" alt="Logo">
            Nom de la Société
        </div>
    ` : '';
    
        if (printWindow) {
            const newWindowDocument = printWindow.document;
            const title = `Facture N° : ${selectedDevis.reference}`;
    
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
                        <p class="left">Adresse: ${selectedDevis.client.adresse}</p>
                        <p class="left">Téléphone: ${selectedDevis.client.tele}</p>
                        <p class="left">ICE: ${selectedDevis.client.ice}</p>
                    </div>
                </div>
    
                <div style="clear:both;"></div>
    
                <table>
                    <thead>     
                        <tr>
                                                <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Date</th>
                    <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Référence BL</th>
                    <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Référence BC</th>
                    <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Total TTC</th>
                    <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Mode de paiement</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${selectedDevis.date}</td>
                             <td>${selectedDevis.ref_BL}</td>
                    <td>${selectedDevis.ref_BC}</td>
                    <td class="right-align">${selectedDevis.total_ttc}</td>
                    <td>${selectedDevis.modePaiement}</td>
                        </tr>
                    </tbody>
                </table>
    
                <table>
                    <thead>
                        <tr>
                    <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Code produit</th>
                    <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Désignation</th>
                    <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Quantité</th>
                    <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Prix Unitaire</th>
                    <th  style="border: 1px solid #000; padding: 8px; background-color: #adb5bd;">Total HT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${selectedDevis.ligne_facture.map((lignedevis) => {
                            const produit = produits.find(prod => prod.id === lignedevis.produit_id);
                            return `
                                <tr>
                                    <td>${produit ? produit.Code_produit : ''}</td>
                                    <td>${produit ? produit.designation : ''}</td>
                                    <td>${lignedevis.quantite}</td>
                                                               <td class="right-align">${Number(lignedevis.prix_vente).toFixed(2)}</td>
                            <td class="right-align">${(Number(lignedevis.quantite) * Number(lignedevis.prix_vente)).toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
    
                <div class="signature-container">
                    <div class="signature">
                        <p>Signature du Client</p>
                    </div>
                    <div class="signature">
                        <p>Signature du Fournisseur</p>
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


    function nombreEnLettres(nombre) {
        const units = ['', 'un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf'];
        const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-Sept', 'Dix-Huit', 'Dix-Neuf'];
        const tens = ['', 'Dix', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-Dix', 'Quatre-Vingt', 'Quatre-Vingt-Dix'];

        let parts = [];

        if (nombre === 0) {
            return 'zéro';
        }

        if (nombre >= 1000) {
            parts.push(nombreEnLettres(Math.floor(nombre / 1000)) + ' Mille');
            nombre %= 1000;
        }

        if (nombre >= 100) {
            parts.push(units[Math.floor(nombre / 100)] + ' Cent');
            nombre %= 100;
        }

        if (nombre >= 10 && nombre <= 19) {
            parts.push(teens[nombre - 10]);
            nombre = 0;
        } else if (nombre >= 20 || nombre === 10) {
            parts.push(tens[Math.floor(nombre / 10)]);
            nombre %= 10;
        }

        if (nombre > 0) {
            parts.push(units[nombre]);
        }

        return parts.join(' ');
    }

    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [page, setPage] = useState(0);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Filtrer les factures par type 'C'
    const filteredFactures = filteredfactures.filter((facture) => facture.type === 'C');

    // Pagination
    const indexOfLastFacture = (page + 1) * rowsPerPage;
    const indexOfFirstFacture = indexOfLastFacture - rowsPerPage;
    const currentFactures = filteredfactures.slice(indexOfFirstFacture, indexOfLastFacture);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleShowLigneFacture = (id) => {
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
        const newSelectedItems = selectAll ? [] : filteredFactures.map((facture) => facture.id);
        setSelectAll(!selectAll);
        setSelectedItems(newSelectedItems);
    };
    const validateForm = () => {
        let newErrors = {};
      
        if (!formData.date) newErrors.date = "Le champ Date est requis.";
        if (!formData.ref_BL) newErrors.ref_BL = "Le champ REF BL N est requis.";
        if (!formData.ref_BC) newErrors.ref_BC = "Le champ REF BC N est requis.";
        if (!formData.total_ttc) newErrors.total_ttc = "Le champ TOTAL TTC est requis.";
        if (!formData.modePaiement) newErrors.modePaiement = "Le champ Mode de paiement est requis.";
      
        setErrors(newErrors);
      
        return Object.keys(newErrors).length === 0;
      };
      
    return (
        <ThemeProvider theme={createTheme()}>
            <Box sx={{...dynamicStyles }}>
                <Box component="main" sx={{ flexGrow: 1, p: 3, }}>
                    <Toolbar />
                    <div className="titreColore">
                        <h2>Liste des Factures </h2>
                    </div>
                    <div className="search-container " style={{width:"30%", position:'absolute' ,right:'60px' ,marginTop:'-30px'}} role="search">
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
                <ListItemIcon style={{position:'absolute',left:'20px'}} >
                <DescriptionIcon className="AjouteBotton"/>
              </ListItemIcon>
              Ajouter facture
            </a>
            <div id="formContainer" style={{...formContainerStyle,overflowX: 'hidden'}}>
  <Form className="col row" style={{ maxHeight: '800px', overflowY:'auto',overflowX: "hidden "}} onSubmit={handleSubmit}>
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
      <h5>{editingFacture ? 'Modifier facture' : 'Ajouter un facture'}</h5>
    </Form.Label>

    {[
      { label: 'N Facture', name: 'reference', type: 'text', placeholder: 'facture' },
      { label: 'Client', name: 'client_id', type: 'select', placeholder: 'Client ...' },
      { label: 'Date', name: 'date', type: 'date', placeholder: 'Date' },
      { label: 'REF BL N', name: 'ref_BL', type: 'text', placeholder: 'ref bl n' },
      { label: 'REF BC N', name: 'ref_BC', type: 'text', placeholder: 'ref bc n' },
      { label: 'TOTAL TTC', name: 'total_ttc', type: 'text', placeholder: 'total ttc' },
      { label: 'Mode de paiement', name: 'modePaiement', type: 'text', placeholder: 'Mode de paiement' },
    ].map((field, index) => (
      <Form.Group className="row mb-3" key={index} style={{ display: 'flex', alignItems: 'center' }}>
        <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>{field.label}</Form.Label>
        <div style={{ flex: '2' }}>
          {field.type === 'select' ? (
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
          ) : (
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

    <div style={{ marginLeft: '10px' }}>
      <Button className="btn btn-sm mb-2 " variant="primary" onClick={handleAddEmptyRow}>
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <strong>Ajouter Produit</strong>
    </div>


          <Form.Group controlId="selectedProduitTable">
            <div className="table-responsive">
              <table className="table table-bordered" style={{ width: '100%' }}>
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
                      <td style={{ backgroundColor: 'white', width: '50px' }}>
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
            </div>
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



                        <div id="" className="table_width" style={tableContainerStyle } >
                            <table className="table_width  table table-bordered" style={{
                                marginTop:'-0px'
                            }}>
                                <thead className="text-center"  >
                                <tr>
                                    <th className="tableHead widthDetails"  >Détails</th>
                                    <th className="tableHead">N° Facture</th>
                                    <th className="tableHead">Date</th>
                                    <th className="tableHead">Client</th>
                                    {/*<th>Total HT</th>*/}
                                    {/*<th>TVA</th>*/}
                                    {/*<th>Total TTC</th>*/}
                                    <th className="tableHead">REF BL N°</th>
                                    <th className="tableHead">REF BC N°</th>
                                    <th className="tableHead">TOTAL TTC</th>
                                    <th className="tableHead">Mode de Paiement</th>
                                    <th className="tableHead">Action</th>
                                </tr>
                                </thead>
                                {/*<tbody className="text-center">*/}
                                {/*{filteredfactures*/}
                                {/*    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)*/}
                                {/*    .map((facture) => (*/}
                                <tbody className="text-center">
                                {currentFactures.map((facture) => (
                                    <React.Fragment key={facture.id}>
                                        <tr>
                                            <td >
                                                <div className="no-print " >
                                                    <button
                                                        className="btn btn btn-light"
                                                        onClick={() => handleShowLigneFactures(facture.id)}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                expandedRows.includes(facture.id)
                                                                    ? faMinus
                                                                    : faPlus
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>{facture.reference}</td>
                                            <td>{facture.date}</td>
                                            <td>{facture.client.raison_sociale !== undefined && facture.client.raison_sociale !== null ? facture.client.raison_sociale : ''}
                                            </td>
                                            <td>{facture.ref_BL}</td>
                                            <td>{facture.ref_BC}</td>
                                            <td>{facture.total_ttc}</td>
                                            <td>{facture.modePaiement}</td>
                                            <td>
                                            <div className="d-inline-flex text-center">
                                                <FontAwesomeIcon
                                                 className="btn btn m-1"
                                                    onClick={() => handleEdit(facture)}
                                                    icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                                <FontAwesomeIcon
                                                 className="btn btn m-1"
onClick={() => handleDelete(facture.id)}                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                                                <Dropdown>
            <Dropdown.Toggle className="btn btn m-1" style={{backgroundColor:'white',border:'none',
                color:'#007bff'
            }} id="dropdown-basic">
                <FontAwesomeIcon icon={faFilePdf} />
            </Dropdown.Toggle>

            <Dropdown.Menu>
                <Dropdown.Item onClick={() => handlePDF(facture.id,true)}>avec Entite</Dropdown.Item>
                <Dropdown.Item onClick={() => handlePDF(facture.id,false)}>sans Entite</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
        <Dropdown>
            <Dropdown.Toggle className="btn btn m-1"style={{backgroundColor:'white',border:'none',
                color:'red'
            }} id="dropdown-basic">
                <FontAwesomeIcon icon={faPrint} />
            </Dropdown.Toggle>

            <Dropdown.Menu>
                <Dropdown.Item onClick={() => print(facture.id,true)}>avec Entite</Dropdown.Item>
                <Dropdown.Item onClick={() => print(facture.id,false)}>sans Entite</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
                                                </div>
                                                
                                            </td>
                                        </tr>
                                        {expandedRows.includes(facture.id) && facture.ligne_facture && (
                                            <tr>
                                                <td colSpan="8">
                                                    <div>
                                                        <table className="table table-responsive table-bordered" style={{ backgroundColor: "#adb5bd", width:'100%', marginTop:'0px',marginBottom:'0px'}}
                                                        >
                                                            <thead>
                                                            <tr>
                                                                <th style={{backgroundColor: "#adb5bd"}}>Code Produit</th>
                                                                <th style={{backgroundColor: "#adb5bd"}}>designation</th>

                                                                <th style={{backgroundColor: "#adb5bd"}}>Quantite</th>
                                                                <th style={{backgroundColor: "#adb5bd"}}>Prix Vente</th>
                                                                {/*<th>Total HT </th>*/}
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {facture.ligne_facture.map((lignefacture) => {

                                                                const produit = produits.find(
                                                                (prod) =>
                                                                prod.id === lignefacture.produit_id
                                                                );
                                                                return (

                                                                    <tr key={lignefacture.id}>
                                                                        <td>{lignefacture.produit_id}</td>
                                                                        <td>{produit? produit.designation:''}</td>

                                                                        <td>{lignefacture.quantite}</td>
                                                                        <td>{lignefacture.prix_vente} DH</td>
                                                                        
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


                               <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredFactures.length}
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

export default FactureListvente;