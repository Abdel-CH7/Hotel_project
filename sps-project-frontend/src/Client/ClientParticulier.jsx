import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button, Modal, Carousel } from "react-bootstrap";
import Navigation from "../Acceuil/Navigation";
import TablePagination from "@mui/material/TablePagination";
import PrintList from "./PrintList";
import ExportPdfButton from "./exportToPdf";
import "jspdf-autotable";
import Search from "../Acceuil/Search";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PeopleIcon from "@mui/icons-material/People";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  faTrash,
  faFileExcel,
  faPlus,
  faMinus,
  faCircleInfo,
  faSquarePlus,
  faEdit,
  faList,
  faPrint,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import "../style.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Checkbox, Fab, Toolbar } from "@mui/material";
import { useOpen } from "../Acceuil/OpenProvider"; // Importer le hook personnalisé
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

//-------------------------Client Particulier---------------------//
const ClientParticulier = () => {
  const [clients, setClients] = useState([]);
  const [zones, setZones] = useState([]);
  const [regions, setRegions] = useState([]);
  const [agent, setAgent] = useState([]);
  const [modePaimant, setModePaimant] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);


  const [secteurClient, setSecteurClient] = useState([]);

  const [siteClients, setSiteClients] = useState([]);
  const [newCategory, setNewCategory] = useState({ categorie: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditModalSite, setShowEditModalSite] = useState(false);

  const [showEditModalregions, setShowEditModalregions] = useState(false);
  const [showEditModalregionsSite, setShowEditModalregionsSite] = useState(false);

  const [showEditModalSecteur, setShowEditModalSecteur] = useState(false);
  const [showEditModalmod, setShowEditModalmod] = useState(false);


  const [selectedCategoryId, setSelectedCategoryId] = useState([]);
  const [categorieId, setCategorie] = useState();

  const [regionFilter, setRegionFilter] = useState('');
const [zoneFilter, setZoneFilter] = useState('');
const [villeFilter, setVilleFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [errorsCR, setErrorsCR] = useState({
    nom: '',
    representant: '',
    date_debut: '',
    date_fin: ''
  });
  
  const [formData, setFormData] = useState({
    logo: "",
    raison_sociale: "",
    abreviation: "",
    adresse: "",
    tele: "",
    ville: "",
    zone_id: "",
    region_id: "",
    secteur_id: "",
    agent_id:"",
    ice: "",
    code_postal: "",
    mode_id:"",
    seance:"",
    date_plafond:"",
  });
  const [errors, setErrors] = useState({
    logoC: "",
    CodeClient: "",
    raison_sociale: "",
    abreviation: "",
    categorie: "",
    adresse: "",
    tele: "",
    ville: "",
    zone_id: "",
    region_id: "",
    ice: "",
    code_postal: "",
    date_fin:""
  });
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  //-------------------edit-----------------------//
  const [editingClient, setEditingClient] = useState(null); // State to hold the client being edited
  const [editingClientId, setEditingClientId] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false); // Gère l'affichage du formulaire
  const [showAddCategorySite, setShowAddCategorySite] = useState(false); // Gère l'affichage du formulaire

  const [showAddRegion, setShowAddRegion] = useState(false); // Gère l'affichage du formulaire
  const [showAddRegionSite, setShowAddRegionSite] = useState(false); // Gère l'affichage du formulaire

  const [showAddSecteur, setShowAddSecteur] = useState(false); // Gère l'affichage du formulaire

  const [showAddMod, setShowAddMod] = useState(false); // Gère l'affichage du formulaire

  //-------------------Pagination-----------------------/
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [filteredclients, setFilteredclients] = useState([]);
  // Pagination calculations
  const indexOfLastClient = (page + 1) * rowsPerPage;
  const indexOfFirstClient = indexOfLastClient - rowsPerPage;
  const currentClients = clients?.slice(indexOfFirstClient, indexOfLastClient);
  //-------------------Selected-----------------------/
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  //-------------------Search-----------------------/
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  //------------------------Site-Client---------------------
  const [showFormSC, setShowFormSC] = useState(false);
  const [editingSiteClient, setEditingSiteClient] = useState(null);
  const [editingSiteClientId, setEditingSiteClientId] = useState(null);
  const [formDataSC, setFormDataSC] = useState({
    CodeSiteclient: "",
    raison_sociale: "",
    abreviation: "",
    adresse: "",
    tele: "",
    ville: "",
    seance:"",
    zone_id: "",
    ice: "",
    logoSC: "",
    code_postal: "",
    client_id: "",
    region_id: "",
    mode_id:"",
    secteur_id:"",
    date_plafond:"",

  });
  const [formContainerStyleSC, setFormContainerStyleSC] = useState({
    right: "-100%",
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedRowsContact, setExpandedRowsContact] = useState([]);
  const [expandedRowsContactSite, setExpandedRowsContactsite] = useState([]);


  const [filteredsiteclients, setFilteredsiteclients] = useState([]);
  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [selectedProductsDataRep, setSelectedProductsDataRep] = useState([]);


  const fetchClients = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/clients-societe");
      const data = response.data;
  
      setClients(data.clients);
      setZones(data.zones);
      setSecteurClient(data.secteurs);
      setRegions(data.regions);
      setAgent(data.representants);
      // setSiteClients(data.secteurs);
      setModePaimant(data.modpai);
      console.log('data',data)
      // Store data in local storage
      localStorage.setItem("clients-societe", JSON.stringify(data.clients));
      localStorage.setItem("users", JSON.stringify(data.users));
      localStorage.setItem("secteurs", JSON.stringify(data.secteurs));
      localStorage.setItem("regions", JSON.stringify(data.regions));
      localStorage.setItem("modes", JSON.stringify(data.modpai));
      localStorage.setItem("representants", JSON.stringify(data.representants));

    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la liste des Clients Societe.",
        });
      }
    }
  };
  
  
  useEffect(() => {
    const storedClients = localStorage.getItem("clients");
    const storedZones = localStorage.getItem("zones");
    const storedRegions = localStorage.getItem("regions");
    const storedSecteurs = localStorage.getItem("secteurs");
    const storedSiteClients = localStorage.getItem("siteClients");
    if (storedClients) setClients(JSON.parse(storedClients));
    if (storedZones) setZones(JSON.parse(storedZones));
    if (storedRegions) setRegions(JSON.parse(storedRegions));
    if (storedSecteurs) setRegions(JSON.parse(storedSecteurs));
    if (storedSiteClients) setSiteClients(JSON.parse(storedSiteClients));
    if (!storedClients  || !storedSecteurs || !storedZones || !storedRegions || !storedSiteClients) {
      fetchClients();
    }
  }, []);


  const toggleRow = (clientId) => {
    setExpandedRows((prevExpandedRows) =>
      prevExpandedRows.includes(clientId)
        ? prevExpandedRows?.filter((id) => id !== clientId)
        : [...prevExpandedRows, clientId]
    );
  };
  const toggleRowContact = (clientId) => {
    setExpandedRowsContact((prevExpandedRows) =>
      prevExpandedRows.includes(clientId)
        ? prevExpandedRows?.filter((id) => id !== clientId)
        : [...prevExpandedRows, clientId]
    );
  };
  const toggleRowContactSite = (clientId) => {
    setExpandedRowsContactsite((prevExpandedRows) =>
      prevExpandedRows.includes(clientId)
        ? prevExpandedRows?.filter((id) => id !== clientId)
        : [...prevExpandedRows, clientId]
    );
  };

  // const toggleRow = async (clientId) => {
  //   if (expandedRows.includes(clientId)) {
  //     setExpandedRows(expandedRows?.filter((id) => id !== clientId));
  //   } else {
  //     try {
  //       // Fetch site clients associés au client
  //       const siteClients =clients.siteclients;
  //       // console.log('Site clients:', siteClients);

  //       // Mettre à jour l'état des clients avec les site clients associés au client
  //       setClients((prevClients) => {
  //         return prevClients?.map((client) => {
  //           if (client.id === clientId) {
  //             return { ...client, siteClients };
  //           }
  //           return client;
  //         });
  //       });

  //       // Ajouter le client ID aux lignes étendues
  //       setExpandedRows([...expandedRows, clientId]);
  //     } catch (error) {
  //       console.error(
  //         "Erreur lors de la récupération des site clients:",
  //         error
  //       );
  //     }
  //   }
  // };

  // const fetchSiteClients = async (clientId) => {
  //   try {
  //     const response = await axios.get(
  //       `http://localhost:8000/api/clients/${clientId}/siteclients`
  //     );
  //     return response.data.siteClients;
  //   } catch (error) {
  //     console.error("Erreur lors de la récupération des site clients:", error);
  //     return [];
  //   }
  // };

  // useEffect(() => {
  //   // Préchargement des site clients pour chaque client
  //   clients.forEach(async (client) => {
  //     if (!client.siteClients) {
  //       const siteClients = await fetchSiteClients(client.id);
  //       setClients((prevClients) => {
  //         return prevClients?.map((prevClient) => {
  //           if (prevClient.id === client.id) {
  //             return { ...prevClient, siteClients };
  //           }
  //           return prevClient;
  //         });
  //       });
  //     }
  //   });
  // }, [clients]); // Exécuter lorsqu'il y a un changement dans la liste des clients

  //---------------------------------------------
  useEffect(() => {
    const filtered = clients?.filter((client) =>
      Object.values(client)?.some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (typeof value === "number") {
          return value.toString().includes(searchTerm.toLowerCase());
        }
        return false;
      })
    );

    setFilteredclients(filtered);
  }, [clients, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChangeSC = (e) => {
    setFormDataSC({
      ...formDataSC,
      [e.target.name]:
        e.target.type === "file" ? e.target.files[0] : e.target.value,
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.type === "file" ? e.target.files[0] : e.target.value,
    });
  };

  // const handleChange = (e) => {
  //   setUser({
  //     ...user,
  //     [e.target.name]:
  //       e.target.type === "file" ? e.target.files[0] : e.target.value,
  //   });
  // };
  //------------------------- CLIENT EDIT---------------------//

  const handleEdit = (client) => {
    setEditingClient(client); // Set the client to be edited
    console.log('client',client)
    // Populate form data with client details
    setFormData({
      CodeClient: client.CodeClient,
      raison_sociale: client.raison_sociale,
      abreviation: client.abreviation,
      adresse: client.adresse,
      categorie: client.categorie,
      tele: client.tele,
      ville: client.ville,
      zone_id: client.zone_id,
      region_id: client.region_id,
      logoC: client.logoC,
      ice: client.ice,
      code_postal: client.code_postal,
      secteur_id:client.secteur_id,
      date_debut:client.date_debut,
      date_fin:client.date_fin,
      mode_id:client.mode_id,
      seance:client.seance,
      date_plafond:client.date_plafond,
     

    });
    setSelectedProductsData(client.contact_clients?.map(contact => ({ ...contact })));
    setSelectedProductsDataRep(client.represantant?.map(contact => ({ ...contact })));


    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    } else {
      closeForm();
    }
  };
  useEffect(() => {
    if (editingClientId !== null) {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    }
  }, [editingClientId]);

  const validateForm = () => {
    let isValid = true;
    let newErrors = {...errors};
  
    if (selectedProductsData?.some(item => item.nom === '')) {
      newErrors.nom = 'Le nom est obligatoire.';
      isValid = false;
    }
  
    if (selectedProductsDataRep?.some(item => item.agent_id === '')) {
      newErrors.representant = 'Le représentant est obligatoire.';
      isValid = false;
    }
  
    // Add other field validations as needed
  
    setErrors(newErrors);
    return isValid;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const url = editingClient
      ? `http://localhost:8000/api/clients-societe/${editingClient.id}`
      : "http://localhost:8000/api/clients-societe";
                                                            
    const method = editingClient ? "put" : "post";
    
    let requestData;

    if (editingClient) {
      requestData ={
      raison_sociale: formData.raison_sociale,
      abreviation: formData.abreviation,
      categorie: formData.categorie,
      adresse: formData.adresse,
      tele: formData.tele,
      ville: formData.ville,
      zone_id: formData.zone_id,
      region_id: formData.region_id,
      agent_id: formData.agent_id,
      secteur_id: formData.secteur_id,
      ice: formData.ice,
      code_postal: formData.code_postal,
      date_plafond: formData.date_plafond,
      seance: formData.seance,
      mode_id:formData.mode_id,
      }

  }else {
      const formDatad = new FormData();
      formDatad.append("raison_sociale", formData.raison_sociale);
      formDatad.append("abreviation", formData.abreviation);
      formDatad.append("categorie", formData.categorie);
      formDatad.append("adresse", formData.adresse);
      formDatad.append("tele", formData.tele);
      formDatad.append("ville", formData.ville);
      formDatad.append("zone_id", formData.zone_id);
      formDatad.append("region_id", formData.region_id);
      formDatad.append("ice", formData.ice);
      formDatad.append("code_postal", formData.code_postal);
      formDatad.append("secteur_id", formData.secteur_id);
      formDatad.append("mode_id", formData.mode_id);
      formDatad.append("seance", formData.seance);
      formDatad.append("date_plafond", formData.date_plafond);
      if (formData.logo) {
        formDatad.append("logoC", formData.logo);
      }

      requestData = formDatad;
    }
 
    try {
      const response = await axios({
        method: method,
        url: url,
        data: requestData,

      });

      if (response.status === 200 || response.status === 201) {
        fetchClients();
        const successMessage = `Client ${
          editingClient ? "modifié" : "ajouté"
        } avec succès.`;
        Swal.fire({
          icon: "success",
          title: "Succès!",
          text: successMessage,
        });
        setSelectedProductsData([])
        setSelectedProductsDataRep([])
        setFormData({
          CodeClient: "",
          raison_sociale: "",
          abreviation: "",
          adresse: "",
          tele: "",
          categorie: "Direct",
          ville: "",
          zone_id: "",
          region_id: "",
          ice: "",
          code_postal: "",
          logoC: null,
          secteur_id:"",
          agent_id:"",
           id_agent:"",
    date_debut:"",
    date_fin:"",
        mode_id:"",
            seance:"",
                date_plafond:"",

        });
        setErrors({
          CodeClient: "",
          raison_sociale: "",
          abreviation: "",
          adresse: "",
          categorie: "",
          tele: "",
          ville: "",
          zone_id: "",
          region_id: "",
          ice: "",
          code_postal: "",
        });
        setEditingClient(null);
        closeForm();
      }
    } catch (error) {
      if (error.response) {
        const serverErrors = error.response.data.error;
        console.log(serverErrors);
        setErrors({
          raison_sociale: serverErrors.raison_sociale
            ? serverErrors.raison_sociale[0]
            : "",
          abreviation: serverErrors.abreviation
            ? serverErrors.abreviation[0]
            : "",
          categorie: serverErrors.categorie ? serverErrors.categorie[0] : "",
          adresse: serverErrors.adresse ? serverErrors.adresse[0] : "",
          tele: serverErrors.tele ? serverErrors.tele[0] : "",
          ville: serverErrors.ville ? serverErrors.ville[0] : "",
          zone_id: serverErrors.zone_id ? serverErrors.zone_id[0] : "",
          region_id: serverErrors.region_id ? serverErrors.region_id[0] : "",
          ice: serverErrors.ice ? serverErrors.ice[0] : "",
          date_fin:serverErrors.date_fin ? serverErrors.date_fin[0] : "",
          code_postal: serverErrors.code_postal
            ? serverErrors.code_postal[0]
            : "",
        });
      
      }
      setTimeout(() => {
        setErrors({});
      }, 3000);
    }
  };

  //------------------------- CLIENT FORM---------------------//

  const handleShowFormButtonClick = () => {
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    } else {
      closeForm();
    }
  };

  const closeForm = () => {
    setFormContainerStyle({ right: "-100%" });
    setTableContainerStyle({ marginRight: "0" });
    setShowForm(false); // Hide the form
    setFormData({
      CodeClient: "",
      raison_sociale: "",
      abreviation: "",
      adresse: "",
      tele: "",
      ville: "",
      zone_id: "",
      region_id: "",
      categorie: "Direct",
      user_id: "",
      ice: "",
      code_postal: "",
      agent_id:"",
      secteur_id:"",
       id_agent:"",
    date_debut:"",
    date_fin:"",
        mode_id:"",
            seance:"",
    date_plafond:"",

    });
    setErrors({
      CodeClient: "",
      raison_sociale: "",
      abreviation: "",
      categorie: "",
      adresse: "",
      tele: "",
      ville: "",
      zone_id: "",
      region_id: "",
      ice: "",
      code_postal: "",
    });
    setSelectedProductsData([])
    setSelectedProductsDataRep([])
    setEditingClient(null); // Clear editing client
  };
  //-------------------------SITE CLIENT----------------------------//
  //-------------------------  SUBMIT---------------------//
  const handleSelectItem = (item) => {
    const selectedIndex = selectedItems.findIndex(
      (selectedItem) => selectedItem.id === item.id
    );

    if (selectedIndex === -1) {
      setSelectedItems([...selectedItems, item.id]);
    } else {
      const updatedItems = [...selectedItems];
      updatedItems.splice(selectedIndex, 1);
      setSelectedItems(updatedItems);
    }

    console.log("Selected items:", selectedItems);
  };

  const getSelectedClientIds = () => {
    return selectedItems?.map((item) => item.id);
  };
  const handleEditSC = (siteClient) => {
    setEditingSiteClient(siteClient); // Set the client to be edited
    // Populate form data with client details
    console.log('siteClient',siteClient)
    setFormDataSC({
      CodeSiteclient: siteClient.CodeSiteclient,
      raison_sociale: siteClient.raison_sociale,
      abreviation: siteClient.abreviation,
      adresse: siteClient.adresse,
      tele: siteClient.tele,
      ville: siteClient.ville,
      zone_id: siteClient.zone_id,
      region_id: siteClient.region_id,
      user_id: siteClient.user_id,
      ice: siteClient.ice,
      code_postal: siteClient.code_postal,
      logoSC: siteClient.logoSC,
      client_id: siteClient.client_id,
      mode_id:siteClient.mode_id,
    secteur_id:siteClient.secteur_id,
     date_plafond:siteClient.date_plafond,
    seance: siteClient.seance,
    });

        setSelectedProductsData(siteClient.contact_site_clients?.map(contact => ({ ...contact })));
    setSelectedProductsDataRep(siteClient.represantant?.map(contact => ({ ...contact })));
    if (formContainerStyleSC.right === "-100%") {
      setFormContainerStyleSC({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    } else {
      closeFormSC();
    }
  };
  console.log('formDataSC',formDataSC,selectedProductsDataRep)
  const handleSubmitSC = async (e) => {
    e.preventDefault();
    const selectedClientIds = getSelectedClientIds();
    const url = editingSiteClient
      ? `http://localhost:8000/api/siteclients/${editingSiteClient.id}`
      : "http://localhost:8000/api/siteclients";
      const urlContact = "http://localhost:8000/api/contactClient";
      const urlRep = "http://localhost:8000/api/representant";


    const method = editingSiteClient ? "put" : "post";

    let requestData;

    if (editingSiteClient) {
      requestData = {
        CodeSiteclient: formDataSC.CodeSiteclient,
        raison_sociale: formDataSC.raison_sociale,
        abreviation: formDataSC.abreviation,
        adresse: formDataSC.adresse,
        tele: formDataSC.tele,
        ville: formDataSC.ville,
        zone_id: formDataSC.zone_id,
        region_id: formDataSC.region_id,
        ice: formDataSC.ice,
        code_postal: formDataSC.code_postal,
        client_id: formDataSC.client_id,
        secteur_id: formDataSC.secteur_id,
        mode_id: formDataSC.mode_id,
        seance: formDataSC.seance,
        date_plafond: formDataSC.date_plafond,

      };
      if (formDataSC.logoSC) {
        console.log('formDataSC.logoSC', formDataSC.logoSC);
        const formData2 = new FormData();
        formData2.append('logoSC', formDataSC.logoSC); // Append the logo file to FormData
    
        try {
            const response = await fetch(`http://localhost:8000/api/Siteclient/${editingSiteClient.id}/update-logo`, {
                method: 'POST',
                body: formData2,
            });
    
            console.log('response', response);
    
            // Ensure the response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('Updated logo:', data.logo); // Log the new logo URL
            } else {
                const errorText = await response.text();
                console.error('Server response:', errorText);
            }
        } catch (error) {
            console.error(error);
        }
    }
    
    } else {
      const formDataScd = new FormData();
      formDataScd.append("CodeSiteclient", formDataSC.CodeSiteclient);
      formDataScd.append("raison_sociale", formDataSC.raison_sociale);
      formDataScd.append("abreviation", formDataSC.abreviation);
      formDataScd.append("adresse", formDataSC.adresse);
      formDataScd.append("tele", formDataSC.tele);
      formDataScd.append("ville", formDataSC.ville);
      formDataScd.append("zone_id", formDataSC.zone_id);
      formDataScd.append("region_id", formDataSC.region_id);
      formDataScd.append("ice", formDataSC.ice);
      formDataScd.append("code_postal", formDataSC.code_postal);
      formDataScd.append("secteur_id", formDataSC.secteur_id);
      formDataScd.append("mode_id", formDataSC.mode_id);
      formDataScd.append("date_plafond", formDataSC.date_plafond);
      formDataScd.append("client_id", selectedClientIds.join(", "));
      if (formDataSC.logoSC) {
        formDataScd.append("logoSC", formDataSC.logoSC);
      }
      requestData = formDataScd;
    }
    console.log(requestData);

    try {
      const response = await axios({
        method: method,
        url: url,
        data: requestData,
      });
      console.log(response.data)
      console.log('selectedProductsData',selectedProductsData)

      const formDataContact = {
        contacts: selectedProductsData?.filter((contact)=>contact.name && contact.name!=='')?.map(contact => ({
          ...contact,
          idClient: response.data.siteclient.id ,
          type: 'SC'  // Ajoute la variable constante à chaque élément
        }))
      };
console.log(selectedProductsData)
      if(selectedProductsData?.filter((contact)=>contact.name && contact.name!=='')?.length >0){

        const responseContact = await axios({
        method: 'put',
        url: urlContact,
        data: formDataContact,
      });
      console.log('responseContact',responseContact)

      }

      const formDataRep = {
        represantants: selectedProductsDataRep?.filter((contact)=>contact.id_agent && contact.id_agent!=='')?.map(contact => ({
          ...contact,
          id_SiteClient: response.data.siteclient.id ,
          type: 'SC' 
        }))
      };
      if(selectedProductsDataRep?.filter((contact)=>contact.id_agent && contact.id_agent!=='')?.length >0){
        const responseRep = await axios({
        method: 'post',
        url: urlRep,
        data: formDataRep,
      });
      }
      if (response.status === 200) {
        fetchClients();
        const successMessage = `SiteClient ${
          editingSiteClient ? "modifié" : "ajouté"
        } avec succès.`;
        Swal.fire({
          icon: "success",
          title: "Succès!",
          text: successMessage,
        });
        closeFormSC();
        setFormData({
          CodeSiteclient: "",
          raison_sociale: "",
          abreviation: "",
          adresse: "",
          tele: "",
          ville: "",
          zone_id: "",
          region_id: "",
          ice: "",
          logoSC: null,
          code_postal: "",
          agent_id:"",
          id_agent:"",
          date_debut:"",
          date_fin:"",
          mode_id:"",
          seance:"",
          date_plafond:"",
        });
        setErrors({
          CodeClient: "",
          raison_sociale: "",
          abreviation: "",
          adresse: "",
          tele: "",
          ville: "",
          zone_id: "",
          region_id: "",
          ice: "",
          code_postal: "",
        });
        setEditingClient(null);
        
      }
    } catch (error) {
      if (error.response) {
        const serverErrors = error.response.data.error;
        console.log(serverErrors);
        setErrors({
          CodeSiteclient: serverErrors.CodeSiteclient
            ? serverErrors.CodeSiteclient[0]
            : "",
          raison_sociale: serverErrors.raison_sociale
            ? serverErrors.raison_sociale[0]
            : "",
          abreviation: serverErrors.abreviation
            ? serverErrors.abreviation[0]
            : "",
          adresse: serverErrors.adresse ? serverErrors.adresse[0] : "",
          tele: serverErrors.tele ? serverErrors.tele[0] : "",
          ville: serverErrors.ville ? serverErrors.ville[0] : "",
          zone_id: serverErrors.zone_id ? serverErrors.zone_id[0] : "",
          region_id: serverErrors.region_id ? serverErrors.region_id[0] : "",
          ice: serverErrors.ice ? serverErrors.ice[0] : "",
          code_postal: serverErrors.code_postal
            ? serverErrors.code_postal[0]
            : "",
        });
      }
      setTimeout(() => {
        setErrors({});
      }, 3000);
    }
  };

  const handleDeleteSiteClient = (id) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce site client ?",
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
          .delete(`http://localhost:8000/api/siteclients/${id}`)
          .then(() => {
            fetchClients();
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Site Client supprimé avec succès.",
            });
          })
          .catch((error) => {
            if (error.response && error.response.status === 500) {
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Impossible de supprimer ce site  car il est utilise dans d'autre interfaces.",
              });
            } else {
              console.error(
                "Erreur lors de la suppression du site client:",
                error
              );
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: `Échec de la suppression du livreur. Veuillez consulter la console pour plus d'informations.`,
              });
            }
          });
      } else {
        console.log("Suppression annulée");
      }
    });
  };
  //------------------------- CLIENT FORM---------------------//

  const handleShowFormButtonClickSC = () => {
    if (!selectedItems) {
      console.error("Aucun client sélectionné pour ajouter un site client.");
      return;
    }
    if (formContainerStyleSC.right === "-100%") {
      setFormContainerStyleSC({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    } else {
      closeFormSC();
    }
  };

  const closeFormSC = () => {
    setFormContainerStyleSC({ right: "-100%" });
    setTableContainerStyle({ marginRight: "0" });
    setShowFormSC(false); // Hide the form
    setFormDataSC({
      CodeSiteclient: "",
      raison_sociale: "",
      abreviation: "",
      adresse: "",
      tele: "",
      ville: "",
      zone_id: "",
      region_id: "",
      user_id: "",
      ice: "",
      code_postal: "",
      mode_id:"",
    secteur_id:"",
        seance:"",
            secteur_id:"",


    });
    setSelectedItems([])
    setEditingSiteClient(null); // Clear editing client
  };

  //------------------------- CLIENT PAGINATION---------------------//

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const selectedRows = parseInt(event.target.value, 10);
    setRowsPerPage(selectedRows);
    localStorage.setItem('rowsPerPageClients', selectedRows);  // Store in localStorage
    setPage(0);
  };

  useEffect(() => {
    const savedRowsPerPage = localStorage.getItem('rowsPerPageClients');
    if (savedRowsPerPage) {
      setRowsPerPage(parseInt(savedRowsPerPage, 10));
    }
  }, []);

  //------------------------- CLIENT DELETE---------------------//

  const handleDelete = (id) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce client ?",
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
          .delete(`http://localhost:8000/api/clients-societe/${id}`)
          .then(() => {
            fetchClients();
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Client supprimé avec succès.",
            });
          })
          .catch((error) => {
            if (error.response && error.response.status === 400) {
              Swal.fire({
                icon: "error",
                title: "Erreur",
                text: error.response.data.error,
              });
            } else {
              console.error("Une erreur s'est produite :", error);
            }
          });
      } else {
        console.log("Suppression annulée");
      }
    });
  };
  
  //-------------------------Select Delete --------------------//
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
        console.log('selectedItems',selectedItems)
        selectedItems.forEach((id) => {
          axios
            .delete(`http://localhost:8000/api/clients-societe/${id}`)
            .then(() => {
              fetchClients();
              Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Client supprimé avec succès.",
              });
            })
            .catch((error) => {
              console.error("Erreur lors de la suppression du client:", error);
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la suppression du client.",
              });
            });
        });
        
      }
    });

    setSelectedItems([]);
    localStorage.setItem("clients-societe", [])
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(clients?.map((client) => client_id));
    }
  };
  const handleCheckboxChange = (itemId) => {
    if (selectedItems.includes(itemId)) {
      console.log("id", selectedItems);
      setSelectedItems(selectedItems?.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const exportToExcel = () => {
    const table = document.getElementById('clientsTable');
    const workbook = XLSX.utils.table_to_book(table, { sheet: 'Clients' });
    XLSX.writeFile(workbook, 'clients_table.xlsx');
  };

  
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Manually adding HTML content
    const title = 'Table  Clients';
    doc.text(title, 14, 16);
    
    doc.autoTable({
      head: [['Logo', 'Code', 'Raison Sociale', 'Téléphone', 'Ville', 'Zone', 'Région']],
      body: filteredClients?.map(client => [
        client.logoC ? { content: 'Logo', rowSpan: 1 } : '',
        client.CodeClient || '',
        client.raison_sociale || '',
        client.tele || '',
        client.ville || '',
        client.zone?.zone || '',
        client.region?.region || ''
      ]),
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8, overflow: 'linebreak' },
      headStyles: { fillColor: '#007bff' }
    });
  
    doc.save('clients_table.pdf');
  };
  

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Client List</title>
          <style>
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <h1>Client List</h1>
          <table>
            <thead>
              <tr>
                <th>Logo</th>
                <th>Code</th>
                <th>Raison Sociale</th>
                <th>Téléphone</th>
                <th>Ville</th>
                <th>Zone</th>
                <th>Région</th>
              </tr>
            </thead>
            <tbody>
              ${filteredClients?.map(client => `
                <tr>
                  <td><img src="${client.logoC || ''}" alt="Logo" style="width:50px; height:50px; border-radius:50%;" /></td>
                  <td>${client.CodeClient || ''}</td>
                  <td>${client.raison_sociale || ''}</td>
                  <td>${client.tele || ''}</td>
                  <td>${client.ville || ''}</td>
                  <td>${client.zone?.zone || ''}</td>
                  <td>${client.region?.region || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
  
    printWindow.document.close();
    printWindow.print();
  };
  
  //------------------ Zone --------------------//
  // const handleDeleteZone = async (zoneId) => {
  //   try {
  //     const response = await axios.delete(
  //       `http://localhost:8000/api/zones/${zoneId}`
  //     );
  //     console.log(response.data);
  //     Swal.fire({
  //       icon: "success",
  //       title: "Succès!",
  //       text: "Zone supprimée avec succès.",
  //     });
  //   } catch (error) {
  //     console.error("Error deleting zone:", error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Erreur!",
  //       text: "Échec de la suppression de la zone.",
  //     });
  //   }
  // };

  // const handleEditZone = async (zoneId) => {
  //   try {
  //     const response = await axios.get(
  //       `http://localhost:8000/api/zones/${zoneId}`
  //     );
  //     const zoneToEdit = response.data;

  //     if (!zoneToEdit) {
  //       console.error("Zone not found or data is missing");
  //       return;
  //     }

  //     const { value: editedZone } = await Swal.fire({
  //       title: "Modifier une zone",
  //       html: `
  //         <form id="editZoneForm">
  //             <input id="swal-edit-input1" class="swal2-input" placeholder="Zone" name="zone" value="${zoneToEdit.zone}">
  //         </form>
  //     `,
  //       showCancelButton: true,
  //       confirmButtonText: "Modifier",
  //       cancelButtonText: "Annuler",
  //       preConfirm: () => {
  //         const editedZoneValue =
  //           document.getElementById("swal-edit-input1").value;
  //         return { zone: editedZoneValue };
  //       },
  //     });

  //     if (editedZone && editedZone.zone !== zoneToEdit.zone) {
  //       const putResponse = await axios.put(
  //         `http://localhost:8000/api/zones/${zoneId}`,
  //         editedZone
  //       );
  //       console.log(putResponse.data);
  //       Swal.fire({
  //         icon: "success",
  //         title: "Succès!",
  //         text: "Zone modifiée avec succès.",
  //       });
  //     } else {
  //       console.log("Zone not edited or unchanged");
  //     }
  //   } catch (error) {
  //     console.error("Error editing zone:", error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Erreur!",
  //       text: "Échec de la modification de la zone.",
  //     });
  //   }
  //   fetchClients();
  // };

  // const handleAddZone = async () => {
  //   const { value: zoneData } = await Swal.fire({
  //     title: "Ajouter une zone",
  //     html: `
  //         <form id="addZoneForm">
  //             <input id="swal-input1" class="swal2-input" placeholder="Zone" name="zone">
  //         </form>
  //         <div class="form-group mt-3">
  //             <table class="table table-hover">
  //                 <thead>
  //                     <tr>
  //                         <th>Zone</th>
  //                         <th>Action</th>
  //                     </tr>
  //                 </thead>
  //                 <tbody>
  //                     ${zones
  //                       ?.map(
  //                         (zone) => `
  //                         <tr key=${zone.id}>
  //                             <td>${zone.zone}</td>
  //                             <td>
  //                                 <select class="custom-select" id="actionDropdown_${zone.id}" class="form-control">
  //                                     <option class="btn btn-light" disabled selected value="">Select Action</option>
  //                                     <option class="btn btn-danger text-center" value="delete_${zone.id}">Delete</option>
  //                                     <option class="btn btn-info text-center" value="edit_${zone.id}">Edit</option>
  //                                 </select>
  //                             </td>
  //                         </tr>
  //                     `
  //                       )
  //                       .join("")}
  //                 </tbody>
  //             </table>
  //         </div>
  //     `,
  //     showCancelButton: true,
  //     confirmButtonText: "Ajouter",
  //     cancelButtonText: "Annuler",
  //     preConfirm: () => {
  //       const zone = Swal.getPopup().querySelector("#swal-input1").value;
  //       return { zone };
  //     },
  //   });

  //   if (zoneData) {
  //     try {
  //       const response = await axios.post(
  //         "http://localhost:8000/api/zones",
  //         zoneData
  //       );
  //       console.log(response.data);
  //       Swal.fire({
  //         icon: "success",
  //         title: "Success!",
  //         text: "Zone ajoutée avec succès.",
  //       });
  //     } catch (error) {
  //       console.error("Error adding zone:", error);
  //       Swal.fire({
  //         icon: "error",
  //         title: "Erreur!",
  //         text: "Échec de l'ajout de la zone.",
  //       });
  //     }
  //   }
  //   fetchClients();
  // };

  document.addEventListener("change", async function (event) {
    if (event.target && event.target.id.startsWith("actionDropdown_")) {
      const [action, zoneId] = event.target.value.split("_");
      console.log("Action:", action); // Add this line for debugging
      if (action === "delete") {
        // Delete action
        handleDeleteZone(zoneId);
      } else if (action === "edit") {
        // Edit action
        handleEditZone(zoneId);
      }

      // Clear selection after action
      event.target.value = "";
    }
  });
  const handleDeleteRegion = async (RegionId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/regions/${RegionId}`
      );
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Region supprimée avec succès.",
      });
      await fetchClients()
    } catch (error) {
      console.error("Region deleting zone:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur!",
        text: "Error lors de la suppression de cette Region.",
      });
    }
  };

  const handleEditRegion = async (RegionId) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/regions/${RegionId}`
      );
      const regionToEdit = response.data;

      if (!regionToEdit) {
        console.error("Region not found or data is missing");
        return;
      }

      const { value: editedRegion } = await Swal.fire({
        title: "Modifier une region",
        html: `
          <form id="editZoneForm">
              <input id="swal-edit-input1" class="swal2-input" placeholder="Region" name="region" value="${regionToEdit.region
}">
          </form>
      `,
        showCancelButton: true,
        confirmButtonText: "Modifier",
        cancelButtonText: "Annuler",
        preConfirm: () => {
          const editedRegionValue =
            document.getElementById("swal-edit-input1").value;
          return { region: editedRegionValue };
        },
      });

      if (editedRegion && editedRegion.region !== regionToEdit.region) {
        const putResponse = await axios.put(
          `http://localhost:8000/api/regions/${RegionId}`,
          editedRegion
        );
        console.log(putResponse.data);
        Swal.fire({
          icon: "success",
          title: "Succès!",
          text: "Region modifiée avec succès.",
        });
      } else {
        console.log("Region not edited or unchanged");
      }
    } catch (error) {
      console.error("Error editing Region:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur!",
        text: "Échec de la modification de la region.",
      });
    }
    fetchClients();
  };



  document.addEventListener("change", async function (event) {
    if (event.target && event.target.id.startsWith("actionDropdown_R")) {
      const [action, RegionId] = event.target.value.split("_");
      console.log("Action:", action); // Add this line for debugging
      if (action === "delete") {
        // Delete action
        handleDeleteRegion(RegionId);
      } else if (action === "edit") {
        // Edit action
        handleEditRegion(RegionId);
      }

      // Clear selection after action
      event.target.value = "";
    }
  });
  //-----------------------------------------//

  const handleAddEmptyRow = () => {
    setSelectedProductsData([...selectedProductsData, {}]);
    console.log("selectedProductData", selectedProductsData);
};
  const handleAddEmptyRowRep = () => {
    setSelectedProductsDataRep([...selectedProductsDataRep, {}]);
    console.log("selectedProductDatarap", selectedProductsDataRep);
};
const handleDeleteProduct = (index, id) => {
  const updatedSelectedProductsData = [...selectedProductsData];
  updatedSelectedProductsData.splice(index, 1);
  setSelectedProductsData(updatedSelectedProductsData);
  if (id) {
      axios
          .delete(`http://localhost:8000/api/contactClient/${id}`)
          .then(() => {
            fetchClients();
          });
  }
};
const handleDeleteProductRap = (index, id) => {
  const updatedSelectedProductsData = [...selectedProductsDataRep];
  updatedSelectedProductsData.splice(index, 1);
  setSelectedProductsDataRep(updatedSelectedProductsData);
  if (id) {
      axios
          .delete(`http://localhost:8000/api/contactClient/${id}`)
          .then(() => {
            fetchClients();
          });
  }
};
const handleInputChange = (index, field, value) => {
  const updatedProducts = [...selectedProductsData];
  updatedProducts[index][field] = value;


  let newErrors = {...errors};
  if (field === 'name' && value === '') {
    newErrors.nom = 'Le nom est obligatoire.';
  } else {
    newErrors.nom = '';
  }
  setSelectedProductsData(updatedProducts);

  setErrors(newErrors);
};
const handleInputChangeRep = (index, field, value) => {
  const updatedProducts = [...selectedProductsDataRep];
  updatedProducts[index][field] = value;
  let newErrors = {...errors};
  if (field === 'agent_id' && value === '') {
    newErrors.representant = 'Le représentant est obligatoire.';
  } else {
    newErrors.representant = '';
  }





  setErrors(newErrors);
  setSelectedProductsDataRep(updatedProducts);
};
console.log('SelectedProductsData',selectedProductsData)

const handleRegionFilterChange = (e) => {
  setRegionFilter(e.target.value);
};

const handleZoneFilterChange = (e) => {
  setZoneFilter(e.target.value);
};

const handleVilleFilterChange = (e) => {
  setVilleFilter(e.target.value);
};
console.log('selectedCategory',selectedCategory)
const filteredClients = clients?.filter((client) => {
  return (
    (regionFilter ? client.region?.region === regionFilter : true) &&
    (zoneFilter ? client.zone?.zone === zoneFilter : true) &&
    (villeFilter ? client.ville === villeFilter : true) &&
    (selectedCategory ? client.secteur_id
      === selectedCategory : true)
  );
});
console.log('zones,',zones)
console.log('regions,',regions)
console.log('formdata',formData)


const handleAddZone = async () => {
  try {
    const formData = new FormData();
    formData.append("zone", newCategory.categorie);
console.log('newCategory.categorie',newCategory.categorie)
    const response = await axios.post("http://localhost:8000/api/zones", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(response.data);
    await fetchClients(); // Refresh categories after adding
    setNewCategory({ categorie: "" })
    Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Zone ajoutée avec succès.",
              }); // Hide the modal after success
              setShowAddCategory(false);

  } catch (error) {
    console.error("Error adding category:", error);
  }
};
const handleSave = async () => {
  try {
    await axios.put(`http://localhost:8000/api/zones/${categorieId}`, { zone:selectedCategoryId });
    await fetchClients(); // Refresh categories after adding
    setShowEditModal(false);
    setSelectedCategoryId([])
    // Fermer le modal
            Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Zone modifiée avec succès.",
      });
  } catch (error) {
    console.error("Erreur lors de la modification de la catégorie :", error);
  }
};
const handleDeleteZone = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/zones/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Zone supprimée avec succès.",
    });
    await fetchClients(); // Refresh categories after adding

    // Récupérer les nouvelles catégories après suppression
   
  } catch (error) {
    console.error("Error deleting categorie:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Échec de la suppression de la Zone.",
    });
  }
};
const handleEditZone = (categorieId) => {
  setSelectedCategoryId(categorieId);
  setCategorie(categorieId.id)
  setShowEditModal(true);
};
const handleAddRegine = async () => {
  try {
    const formData = new FormData();
    formData.append("region", newCategory.categorie);
console.log('newCategory.categorie',newCategory.categorie)
    const response = await axios.post("http://localhost:8000/api/regions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(response.data);
    await fetchClients(); // Refresh categories after adding
    setNewCategory({ categorie: "" })

    Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Regions ajoutée avec succès.",
              }); // Hide the modal after success
              setShowAddCategory(false);

  } catch (error) {
    console.error("Error adding category:", error);
  }
};
const handleSaveRegine = async () => {
  try {
    await axios.put(`http://localhost:8000/api/regions/${categorieId}`, { region:selectedCategoryId });
    await fetchClients(); // Refresh categories after adding
    setShowEditModalregions(false);
    setSelectedCategoryId([])
    // Fermer le modal
            Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Regions modifiée avec succès.",
      });
  } catch (error) {
    console.error("Erreur lors de la modification de la Regions :", error);
  }
};


const handleAddSecteur = async () => {
  try {
    const formData = new FormData();
    formData.append("secteur", newCategory.categorie);
    formData.append("logoP", newCategory.imageFile);

console.log('newCategory.categorie',newCategory.categorie)
    const response = await axios.post("http://localhost:8000/api/secteurs", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(response.data);
    await fetchClients(); // Refresh categories after adding
    setNewCategory({ categorie: "" })

    Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Secteur d'activité ajoutée avec succès.",
              }); // Hide the modal after success
              setShowAddSecteur(false);

  } catch (error) {
    console.error("Error adding category:", error);
  }
};
const handleSaveSecteur = async () => {
  try {
    await axios.put(`http://localhost:8000/api/secteurs/${categorieId}`, { secteur:selectedCategoryId });
     fetchClients(); // Refresh categories after adding
    setShowEditModalSecteur(false);
    // Fermer le modal
    setSelectedCategoryId([])

            Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Secteur d'activité modifiée avec succès.",
      });
  } catch (error) {
    console.error("Erreur lors de la modification de la Regions :", error);
  }
};
const handleDeleteSecteur = async (categorieId) => {
  try {
     axios.delete(`http://localhost:8000/api/secteurs/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Secteur d'activité supprimée avec succès.",
    });
     fetchClients(); // Refresh categories after adding

    // Récupérer les nouvelles catégories après suppression
   
  } catch (error) {
    console.error("Error deleting categorie:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Échec de la suppression de la Secteur d'activité.",
    });
  }
};
const handleEditSecteur = (categorieId) => {
  setSelectedCategoryId(categorieId.
    secteur
    );
  setCategorie(categorieId.id)
  setShowEditModalSecteur(true);
};

const handleAddModP = async () => {
  try {
    const formData = new FormData();
    formData.append("mode_paiement", newCategory.categorie);
console.log('newCategory.categorie',newCategory.categorie)
    const response = await axios.post("http://localhost:8000/api/modes", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(response.data);
    await fetchClients(); // Refresh categories after adding
    setNewCategory({ categorie: "" })

    Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Mode paimants ajoutée avec succès.",
              }); // Hide the modal after success
              setShowAddMod(false);

  } catch (error) {
    console.error("Error adding category:", error);
  }
};
const handleSaveModP = async () => {
  try {
    await axios.put(`http://localhost:8000/api/modes/${categorieId}`, { mode_paiement:selectedCategoryId });
     fetchClients(); // Refresh categories after adding
     setShowEditModalmod(false);
    // Fermer le modal
    setSelectedCategoryId([])

            Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Mode paimants modifiée avec succès.",
      });
  } catch (error) {
    console.error("Erreur lors de la modification de la Regions :", error);
  }
};
const handleDeleteModP = async (categorieId) => {
  try {
     axios.delete(`http://localhost:8000/api/mode-paimants/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Mode paimants supprimée avec succès.",
    });
     fetchClients(); // Refresh categories after adding

    // Récupérer les nouvelles catégories après suppression
   
  } catch (error) {
    console.error("Error deleting categorie:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Échec de la suppression de Mode paimants.",
    });
  }
};
const handleEditModP = (categorieId) => {
  setSelectedCategoryId(categorieId.
    mode_paiement
    );
  setCategorie(categorieId.mode_id)
  setShowEditModalmod(true);
};
console.log('setSelectedCategoryId',selectedCategoryId,categorieId)

const [activeIndex, setActiveIndex] = useState(0);
const [filtreclientBySect,setFiltreClientBySect] = useState([])
const handleSelect = (selectedIndex) => {
  setActiveIndex(selectedIndex);
};
const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array?.length; i += size) {
    result.push(array?.slice(i, i + size));
  }
  return result;
};
const chunkSize = 9;
const chunks = chunkArray(secteurClient, chunkSize);


const handleCategoryFilterChange = (catId) => {
 
  setSelectedCategory(catId);
};
  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles}}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>

       
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ marginTop: "15px" }}
          >
            <h3 className="titreColore">
              {/* <PeopleIcon style={{ fontSize: "24px", marginRight: "8px" }} /> */}
              Liste des Clients Societe
            </h3>
            <div className="d-flex">
              <div style={{ width: "500px", marginRight: "20px" }}>
                <Search onSearch={handleSearch} type="search" />
              </div>


              <div>
              <FontAwesomeIcon
    style={{
      cursor: "pointer",
      color: "grey",
      fontSize: "2rem",
    }}
    onClick={printTable}  
    icon={faPrint}
    className="me-2"
  />
                  <FontAwesomeIcon
      style={{
        cursor: "pointer",
        color: "red",
        fontSize: "2rem",
        marginLeft: "15px",
      }}
      onClick={exportToPDF}
            icon={faFilePdf}
    />

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

          {
          
            <div style={{height:'125px',marginTop:'-15px'}}>
                                        <h5 className="container-d-flex justify-content-start AjouteBotton"style={{marginBottom:'-3px'}} >Secteur d'activité</h5>
                                        <div className=" bgSecteur" >

<Carousel activeIndex={activeIndex} onSelect={handleSelect} interval={null}
 nextIcon={<FaArrowRight size="2x" color="@ffffff" style={{backgroundColor:"black" ,borderRadius:'50%' ,marginTop:'-50px',marginRight:"5px",marginLeft:"-5px"}} />}
 prevIcon={<FaArrowLeft size="2x" color="@ffffff" style={{backgroundColor:"black" ,borderRadius:'50%',marginTop:'-50px',marginRight:"-5px",marginLeft:"5px"}} />}>

  {chunks?.map((chunk, chunkIndex) => (
    <Carousel.Item key={chunkIndex}>
      <div className="d-flex justify-content-start">
        <a href="#" style={{marginLeft:'60px'}}>
          <div
            className={`category-item ${selectedCategory === '' ? 'active' : ''}`} 
            onClick={() => handleCategoryFilterChange("")}
          >
            <img
              src={'../../public/images/bayd.jpg'}
              alt={'tout'}
              className={`rounded-circle category-img ${selectedCategory === '' ? 'selected' : ''}`}
            />
            <p className="category-text">Tout</p>
          </div>
        </a>

        {chunk?.map((category, index) => (
          <a href="#" className="mx-5" key={index}>
            <div 
              className={`category-item ${selectedCategory === category.id ? 'active' : ''}`} 
              onClick={() => handleCategoryFilterChange(category.id)}
            >
              <img
                src={category.logo}
                alt={category.secteur}
                className={`rounded-circle category-img ${selectedCategory === category.id ? 'selected' : ''}`}
              />
              <p className="category-text">{category.secteur}</p>
            </div>
          </a>
        ))}
      </div>
    </Carousel.Item>
  ))}
</Carousel>
</div>
                                        </div>

          }

          <div className="container-d-flex justify-content-start">
            <div style={{ display: "flex", alignItems: "center" ,marginTop:'15px' ,padding:'0'}}>
             
              <a
                onClick={handleShowFormButtonClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                className="AjouteBotton"
              >
 <FontAwesomeIcon
                    icon={faPlus}
                    className=" AjouteBotton"
                    style={{ cursor: "pointer" }}
                  />Ajouter Client
              </a>

            </div>

            <div className="filters" 
            >
            <Form.Select aria-label="Default select example"
             value={regionFilter} onChange={handleRegionFilterChange}
             style={{width:'10%',height:"35px",position:'absolute', left: '66%', top: '233px'}}>
            <option value="">Sélectionner Region</option>
    {
      regions?.map((region)=>(
        <option value={region.region}>{region.region}</option>
      ))
    }
    </Form.Select>

    <Form.Select aria-label="Default select example"
    value={zoneFilter} onChange={handleZoneFilterChange}
    style={{width:'10%' ,height:"35px",position:'absolute', left: '77%',  top: '233px'}}>
    <option value="">Sélectionner Zone</option>
    {
      zones?.map((zone)=>(
        <option value={zone.zone}>{zone.zone}</option>
      ))
    }
    </Form.Select>

    <Form.Select 
  aria-label="Default select example"
  value={villeFilter} 
  onChange={handleVilleFilterChange}
  style={{ width: '10%', height: "35px", position:'absolute', left: '88%',  top: '233px' }}
>
  <option value="">Sélectionner Ville</option>
  {
    [...new Set(clients?.map(zone => zone.ville))] // Filtre les villes uniques
      ?.map((ville, index) => (
        <option key={index} value={ville}>{ville}</option>
      ))
  }
</Form.Select>



</div>

        <div style={{ marginTop:"0px",}}>
        <div id="formContainer" className="" style={{...formContainerStyle,marginTop:'0px',maxHeight:'700px',overflow:'auto',padding:'0'}}>
              <Form className="col row" onSubmit={handleSubmit}>
                <Form.Label className="text-center ">
                <h4
                     style={{
                      fontSize: "25px", 
                      fontFamily: "Arial, sans-serif", 
                      fontWeight: "bold", 
                      color: "black",
                      borderBottom: "2px solid black", 
                      paddingBottom: "5px",
                    }}
                    >
                      {editingClient ? "Modifier" : "Ajouter"} un Client</h4>
                </Form.Label>
                <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <FontAwesomeIcon
                    icon={faPlus}
                    className=" text-primary"
                    style={{ cursor: "pointer",marginTop:'-10px' }}
                    onClick={() => setShowAddCategory(true)} // Affiche le formulaire
                  />
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '20px'}}>Zone</Form.Label>
                  <Form.Select
                  style={{ flex: '2' }}
                    as="select"
                    name="zone_id"
                    value={formData.zone_id}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner Zone</option>
                    {zones?.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.zone}
                      </option>
                    ))}
                    <Form.Text className="text-danger">
                      {errors.zone_id}
                    </Form.Text>
                  </Form.Select>
                </Form.Group>

                  <Modal show={showAddCategory} onHide={() => setShowAddCategory(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Zone</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Zone</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nom de la Zone"
                value={newCategory.categorie}
                onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
              />
            </Form.Group>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3"  style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Zone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {zones?.map(categ => (
                  <tr key={categ.id}>
                    <td>{categ.id}</td>
                    <td>{categ.zone}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditZone(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteZone(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        
          
          
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddZone}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddCategory(false)}
  >
    Annuler
  </Fab>
      </Form.Group>
        
      </Modal>
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une Zone</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Nom de la Zone</Form.Label>
            <Form.Control
              type="text"
              value={selectedCategoryId.zone
              }
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSave}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModal(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
                <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <FontAwesomeIcon
                    icon={faPlus}
                    className="ml-2 text-primary"
                    style={{ cursor: "pointer",marginTop:'-10px' }}
                    onClick={() => setShowAddRegion(true)}
                  />
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '20px'}}>Région</Form.Label>
                  <Form.Select
                  style={{ flex: '2' }}
                    as="select"
                    name="region_id"
                    value={formData.region_id}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner Region</option>
                    {regions?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.region
                        }
                      </option>
                    ))}
                    <Form.Text className="text-danger">
                      {errors.region_id}
                    </Form.Text>
                  </Form.Select>
                </Form.Group>
                <Modal show={showAddRegion} onHide={() => setShowAddRegion(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Region</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Region</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nom de la region"
                value={newCategory.categorie}
                onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
              />
            </Form.Group>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3"  style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Region</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {regions?.map(categ => (
                  <tr key={categ.id}>
                    <td>{categ.id}</td>
                    <td>{categ.region}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditRegion(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteRegion(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        
          
          
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddRegine}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddRegion(false)}
  >
    Annuler
  </Fab>
      </Form.Group>
        
      </Modal>
      <Modal show={showEditModalregions} onHide={() => setShowEditModalregions(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une 
Region
</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Nom de la Region</Form.Label>
            <Form.Control
              type="text"
              value={selectedCategoryId 
                
              }
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveRegine}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModalregions(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
    <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <FontAwesomeIcon
                    icon={faPlus}
                    className="ml-2 text-primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowAddSecteur(true)}

                  />
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '20px',marginTop:'7px' }}>Secteur d'activité</Form.Label>
                  <Form.Select
                  style={{ flex: '2' }}
                    as="select"
                    name="secteur_id"
                    value={formData.secteur_id}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner Secteur</option>
                    {secteurClient?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.secteur
                        }
                      </option>
                    ))}
                    <Form.Text className="text-danger">
                      {errors.secteur_id}
                    </Form.Text>
                  </Form.Select>
                </Form.Group>
                <Modal show={showAddSecteur} onHide={() => setShowAddSecteur(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Secteur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Secteur</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nom de la Secteur"
                value={newCategory.categorie}
                onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Logo de Secteur</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setNewCategory({ ...newCategory, imageFile: e.target.files[0] })}
              />
            </Form.Group>
            <Form.Group className="mt-3">
            <div className="form-group mt-3"  style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Secteur</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {secteurClient?.map(categ => (
                  <tr key={categ.id}>
                    <td>{categ.id}</td>
                    <td>{categ.secteur}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditSecteur(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteSecteur(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        
          
          
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddSecteur}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddSecteur(false)}
  >
    Annuler
  </Fab>
      </Form.Group>
        
      </Modal>
      <Modal show={showEditModalSecteur} onHide={() => setShowEditModalSecteur(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une Secteur</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Nom de la Secteur</Form.Label>
            <Form.Control
              type="text"
              value={selectedCategoryId 
                
              }
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveSecteur}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModalSecteur(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>

    <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <FontAwesomeIcon
                    icon={faPlus}
                    className="ml-2 text-primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowAddMod(true)} // Affiche le formulaire

                  />
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '20px',marginTop:'7px' }}>Mode de paiement</Form.Label>
                  <Form.Select
                  style={{ flex: '2' }}
                    as="select"
                    name="mode_id"
                    value={formData.mode_id}
                    onChange={handleChange}
                  >
                    <option value="">mode de paiement</option>
                    {modePaimant?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.mode_paiement}
                      </option>
                      
                    ))}
                   
                  </Form.Select>
                </Form.Group>
                <Modal show={showAddMod} onHide={() => setShowAddMod(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une 
          mode de paiement
</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>mode de paiement</Form.Label>
              <Form.Control
                type="text"
                placeholder="Mode de Paiement"
                value={newCategory.categorie}
                onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
              />
            </Form.Group>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3"  style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>mode de paiement</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {modePaimant?.map(categ => (
                  <tr key={categ.id}>
                    <td>{categ.id}</td>
                    <td>{categ.mode_paiement}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditModP(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteModP(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        
          
          
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddModP}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddMod(false)}
  >
    Annuler
  </Fab>
      </Form.Group>
        
      </Modal>
      <Modal show={showEditModalmod} onHide={() => setShowEditModalmod(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier 
        mode de paiement
</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Nom de mode de paiement</Form.Label>
            <Form.Control
              type="text"
              name="mode_paiement"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveModP}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModalmod(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
                <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1', marginRight: '20px', marginLeft: '10px'}}>Logo </Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="file"
                    name="logo"
                    onChange={handleChange}
                    className="form-control"
                    lang="fr"
                  />
                  <Form.Text className="text-danger">{errors.logoC}</Form.Text>
                </Form.Group>
                
                
                <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">

                  <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '20px', marginLeft: '10px'}}>Raison Sociale</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="text"
                    name="raison_sociale"
                    value={formData.raison_sociale}
                    onChange={handleChange}
                    placeholder="Raison Sociale"
                    className="form-control"
                    isInvalid={!!errors.raison_sociale} // Validation pour Type de Quantité

                  />
                 
                </Form.Group>
                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '20px', marginLeft: '10px'}}>Adresse</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Adresse"
                    className="form-control "
                    isInvalid={!!errors.adresse} // Validation pour Type de Quantité

                  />

                </Form.Group>
                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
               
               <Form.Label className="col-sm-4" style={{ flex: '1', marginRight: '30px', marginLeft: '10px',marginTop:'7px' }}>Échéance</Form.Label>
               <Form.Select
               className="form-control "
               style={{ flex: '2' }}
                 as="select"
                 name="seance"
                 value={formData.seance}
                 onChange={handleChange}
               >
                 <option value="">Sélectionner Échéance</option>
                 {[20,40,60,80]?.map((region) => (
                   <option key={region} value={region}>
                     {region

                     }
                   </option>
                 ))}
                 <Form.Text className="text-danger">
                   {errors.seance}
                 </Form.Text>
               </Form.Select>
             </Form.Group>
                <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '20px', marginLeft: '10px' ,marginTop:'7px'}}>Abréviation</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="text"
                    name="abreviation"
                    value={formData.abreviation}
                    onChange={handleChange}
                    placeholder="abreviation"
                    className="form-control"
                  />
                  <Form.Text className="text-danger">
                    {errors.abreviation}
                  </Form.Text>
                </Form.Group>
                

                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '35px', marginLeft: '10px'}}>Catégorie</Form.Label>
                  <Form.Select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className="form-select form-select"
                  >
                    <option value="Direct">Direct</option>
                    <option value="Premium">Premium</option>
                    
                    <option value="Revendeur">Revendeur</option>
                  </Form.Select>
                  <Form.Text className="text-danger">
                    {errors.categorie}
                  </Form.Text>
                </Form.Group>

                
                <Form.Group className="col-sm-6 mt-4" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '20px', marginLeft: '10px'}}>Téléphone</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="tel"
                    name="tele"
                    value={formData.tele}
                    onChange={handleChange}
                    placeholder="06XXXXXXXX"
                    className="form-control"
                  />
                  <Form.Text className="text-danger">{errors.tele}</Form.Text>
                </Form.Group>
                <Form.Group className="col-sm-6 mt-4" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '20px', marginLeft: '10px'}}>Ville</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    placeholder="Ville"
                    className="form-control"
                  />
                  <Form.Text className="text-danger">{errors.ville}</Form.Text>
                </Form.Group>
              
                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '20px', marginLeft: '10px'}}>Code Postal</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="text"
                    name="code_postal"
                    value={formData.code_postal}
                    onChange={handleChange}
                    placeholder="Code Postal"
                    className="form-control"
                  />
                  <Form.Text className="text-danger">
                    {errors.code_postal}
                  </Form.Text>
                </Form.Group>
                

<Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '20px', marginLeft: '10px' ,marginTop:'7px'}}>Date plafond</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="date"
                    name="date_plafond"
                    value={formData.date_plafond}
                    onChange={handleChange}
                    placeholder="date plafond"
                    className="form-control"
                  />
                  <Form.Text className="text-danger">{errors.ice}</Form.Text>
                </Form.Group>
                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '20px', marginLeft: '20px' ,marginTop:'7px'}}>ICE</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="number"
                    name="ice"
                    value={formData.ice}
                    onChange={handleChange}
                    placeholder="ice"
                    className="form-control"
                  />
                  <Form.Text className="text-danger">{errors.ice}</Form.Text>
                </Form.Group>
                
                <div style={{ marginLeft: '10px' }}>
                  <a href="#" onClick={handleAddEmptyRow}>
                    <Button className="btn btn-sm mb-2" variant="primary" >
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <span style={{ margin: "0 8px" }}></span>

      <strong style={{
        color:'black'
      } } >Ajouter Contacts</strong>
                  </a>
      
    </div>
    <Form.Group controlId="selectedProduitTable">
    <div className="table-responsive">
  <table className="table table-bordered" style={{ width: '100%', marginTop:'2px',padding:'0' }}>
    <thead>
      <tr >
        <th colSpan={5}> List Contacts</th>
      </tr>
      <tr>
        <th className="ColoretableForm">Nom</th>
        <th className="ColoretableForm">Prénom</th>
        <th className="ColoretableForm">Téléphone</th>
        <th className="ColoretableForm">Email</th>
        <th className="ColoretableForm">Action</th>
      </tr>
    </thead>
    <tbody>
      {selectedProductsData?.map((productData, index) => (
        <tr key={index}>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="text"
              value={productData.name}
              onChange={(e) => handleInputChange(index, 'name', e.target.value)}
              placeholder="Nom"
            />
            <Form.Text className="text-danger">
  {errors.name}
</Form.Text>
          </td>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="text"
              value={productData.prenom}
              onChange={(e) => handleInputChange(index, 'prenom', e.target.value)}
              placeholder="Prénom"
            />
          </td>
          <td style={{ backgroundColor: 'white',width: '20%' }}>
            <Form.Control
              type="text"
              value={productData.telephone}
              onChange={(e) => handleInputChange(index, 'telephone', e.target.value)}
              placeholder="Téléphone"
            />
          </td>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="email"
              value={productData.email}
              onChange={(e) => handleInputChange(index, 'email', e.target.value)}
              placeholder="Email"
            />
          </td>
          <td style={{ backgroundColor: 'white', width: '10%' }}>
            <a href="#">
              <FontAwesomeIcon   color="red" onClick={() => handleDeleteProduct(index, productData.id)}
 icon={faTrash} />
            </a>
              
            
          </td>
        </tr>
      ))}
      {errors.products && (
        <tr>
          <td colSpan="5" className="text-danger text-center">
            {errors.products}
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

    </Form.Group>
    <div style={{ marginLeft: '10px' }}>
                  <a href="#" onClick={handleAddEmptyRowRep}>
                    <Button className="btn btn-sm mb-2" variant="primary" >
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <span style={{ margin: "0 8px" }}></span>

      <strong style={{
        color:'black'
      } } >Ajouter Représentant</strong>
                  </a>
      
    </div>
    <Form.Group controlId="selectedProduitTable">
    <div className="table-responsive" style={{padding:'0'}}>
  <table className="table table-bordered" style={{ width: '100%', marginTop:'2px',padding:'0' }}>
    <thead>
      <tr >
        <th colSpan={5}> Représentant</th>  
      </tr>
      <tr>
        <th className="ColoretableForm">Représentant</th>
        <th className="ColoretableForm">date début</th>
        <th className="ColoretableForm">date fin</th>
        <th className="ColoretableForm">Action</th>

        
      </tr>
    </thead>
    <tbody>
    {selectedProductsDataRep?.map((productData, index) => (
        <tr key={index}>
                   <td style={{ backgroundColor: 'white', width: '20%' }}>
          <Form.Select
                  style={{ flex: '2' }}
                    as="select"
                  
                    value={productData.id_agent}
              onChange={(e) => handleInputChangeRep(index, 'id_agent', e.target.value)}
                  >
                    <option value="">Sélectionner Représentant</option>
                    {agent?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.NomAgent

                        }
                      </option>
                    ))}
                    <Form.Text className="text-danger">
                      {errors.region_id}
                    </Form.Text>
                  </Form.Select>
          </td>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="date"
             
              value={productData.date_debut}
              onChange={(e) => handleInputChangeRep(index, 'date_debut', e.target.value)}
              placeholder="Date debut"
            />
          </td>
          <td style={{ backgroundColor: 'white',width: '20%' }}>
            <Form.Control
              type="date"
              
              value={productData.date_fin}
              onChange={(e) => handleInputChangeRep(index, 'date_fin', e.target.value)}
              placeholder="Date fin"
              isInvalid={!!errors.date_fin} // Validation pour Type de Quantité

            />
          </td>
          <td style={{ backgroundColor: 'white', width: '10%' }}>
            <a href="#">
              <FontAwesomeIcon   color="red" onClick={() => handleDeleteProductRap(index, productData.id)}
 icon={faTrash} />
            </a>
              
            
          </td>
        </tr>
      ))}
       
      {errors.products && (
        <tr>
          <td colSpan="5" className="text-danger text-center">
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
        </div>
            <div
              id="formContainer"
              className=""
                style={{...formContainerStyleSC,marginTop:'0px',maxHeight:'700px',overflow:'auto'}}
            >
              <Form className="col row" onSubmit={handleSubmitSC}>
                <Form.Label className="text-center m-2">
                <h4
                     style={{
                      fontSize: "25px", 
                      fontFamily: "Arial, sans-serif", 
                      fontWeight: "bold", 
                      color: "black", 
                      borderBottom: "2px solid black",
                      paddingBottom: "5px",
                    }}
                    >
                    {editingSiteClient ? "Modifier" : "Ajouter"} Site Client
                  </h4>
                </Form.Label>

                <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <FontAwesomeIcon
                    icon={faPlus}
                    className=" text-primary"
                    style={{ cursor: "pointer" ,marginTop:'-10px'}}
                    onClick={() => setShowAddCategory(true)} // Affiche le formulaire
                  />
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px'}}>Zone</Form.Label>
                  <Form.Control
                  style={{ flex: '2',marginLeft:'-15px' }}
                    as="select"
                    name="zone_id"
                    value={formDataSC.zone_id}
                    onChange={handleChangeSC}
                  >
                    <option value="">Sélectionner Zone</option>
                    {zones?.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.zone}
                      </option>
                    ))}
                    <Form.Text className="text-danger">
                      {errors.zone_id}
                    </Form.Text>
                  </Form.Control>
                </Form.Group>


                  <Modal show={showAddCategorySite} onHide={() => setShowAddCategorySite(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Zone</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Zone</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nom de la Zone"
                value={newCategory.categorie}
                onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
              />
            </Form.Group>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Zone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {zones?.map(categ => (
                  <tr key={categ.id}>
                    <td>{categ.id}</td>
                    <td>{categ.zone}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditZone(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteZone(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        
          
          
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddZone}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddCategorySite(false)}
  >
    Annuler
  </Fab>
      </Form.Group>
        
      </Modal>
      <Modal show={showEditModalSite} onHide={() => setShowEditModalSite(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une Zone</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Nom de la Zone</Form.Label>
            <Form.Control
              type="text"
              value={selectedCategoryId.zone
              }
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSave}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModalSite(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
                <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <FontAwesomeIcon
                    icon={faPlus}
                    className=" text-primary"
                    style={{ cursor: "pointer" ,marginTop:''}}
                    onClick={() => setShowAddRegion(true)} // Affiche le formulaire

                  />
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px'}}>Région</Form.Label>
                  <Form.Control
                  style={{ flex: '2' ,marginLeft:'-15px'}}
                    as="select"
                    name="region_id"
                    value={formDataSC.region_id}
                    onChange={handleChangeSC}
                  >
                    <option value="">Sélectionner Region</option>
                    {regions?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.region
                        }
                      </option>
                    ))}
                    <Form.Text className="text-danger">
                      {errors.region_id}
                    </Form.Text>
                  </Form.Control>
                </Form.Group>
                <Modal show={showAddRegionSite} onHide={() => setShowAddRegionSite(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Region</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Region</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nom de la region"
                value={newCategory.categorie}
                onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
              />
            </Form.Group>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Region</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {regions?.map(categ => (
                  <tr key={categ.id}>
                    <td>{categ.id}</td>
                    <td>{categ.region}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditRegion(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteRegion(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        
          
          
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddRegine}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddRegionSite(false)}
  >
    Annuler
  </Fab>
      </Form.Group>
        
      </Modal>
      <Modal show={showEditModalregionsSite} onHide={() => setShowEditModalregionsSite(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une 
Region
</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Nom de la Region</Form.Label>
            <Form.Control
              type="text"
              value={selectedCategoryId 
                
              }
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveRegine}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModalregionsSite(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
    <Modal show={showAddMod} onHide={() => setShowAddMod(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une 
          mode de paiement
</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>mode de paiement</Form.Label>
              <Form.Control
                type="text"
                placeholder="Mode de Paiement"
                value={newCategory.categorie}
                onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
              />
            </Form.Group>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3"  style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>mode de paiement</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {modePaimant?.map(categ => (
                  <tr key={categ.id}>
                    <td>{categ.id}</td>
                    <td>{categ?.mode_paiement}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditModP(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteModP(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        
          
          
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddModP}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddMod(false)}
  >
    Annuler
  </Fab>
      </Form.Group>
        
      </Modal>
      <Modal show={showEditModalmod} onHide={() => setShowEditModalmod(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier 
        mode de paiement
</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Nom de mode de paiement</Form.Label>
            <Form.Control
              type="text"
              value={selectedCategoryId 
                
              }
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveModP}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModalmod(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
    <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <FontAwesomeIcon
                    icon={faPlus}
                    className="ml-2 text-primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowAddSecteur(true)} // Affiche le formulaire

                  />
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '20px',marginTop:'7px' }}>Secteur d'activité</Form.Label>
                  <Form.Select
                  style={{ flex: '2' }}
                    as="select"
                    name="secteur_id"
                    value={formDataSC.secteur_id}
                    onChange={handleChangeSC}
                  >
                    <option value="">Sélectionner Secteur</option>
                    {secteurClient?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.secteur
                        }
                      </option>
                    ))}
                    <Form.Text className="text-danger">
                      {errors.region_id}
                    </Form.Text>
                  </Form.Select>
                </Form.Group>
                <Modal show={showAddSecteur} onHide={() => setShowAddSecteur(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Secteur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Secteur</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nom de la Secteur"
                value={newCategory.categorie}
                onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Logo de Secteur</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setNewCategory({ ...newCategory, imageFile: e.target.files[0] })}
              />
            </Form.Group>
            <Form.Group className="mt-3">
            <div className="form-group mt-3"  style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Secteur</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {secteurClient?.map(categ => (
                  <tr key={categ.id}>
                    <td>{categ.id}</td>
                    <td>{categ.secteur}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditSecteur(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteSecteur(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        
          
          
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddSecteur}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddSecteur(false)}
  >
    Annuler
  </Fab>
      </Form.Group>
        
      </Modal>
      <Modal show={showEditModalSecteur} onHide={() => setShowEditModalSecteur(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une Secteur</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Nom de la Secteur</Form.Label>
            <Form.Control
              type="text"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveSecteur}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModalSecteur(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>

    <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <FontAwesomeIcon
                    icon={faPlus}
                    className="ml-2 text-primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowAddMod(true)} // Affiche le formulaire

                  />
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '20px',marginTop:'7px' }}>mode de paiement</Form.Label>
                  <Form.Select
                  style={{ flex: '2' }}
                    as="select"
                    name="mode_id"
                    value={formDataSC.mode_id}
                    onChange={handleChangeSC}
                  >
                    <option value="">mode de paiement</option>
                    {modePaimant?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region?.mode_paiement}
                      </option>
                      
                    ))}
                   
                  </Form.Select>
                </Form.Group>
                <Modal show={showAddMod} onHide={() => setShowAddMod(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une 
          mode de paiement
</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>mode de paiement</Form.Label>
              <Form.Control
                type="text"
                placeholder="Mode de Paiement"
                value={newCategory.categorie}
                onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
              />
            </Form.Group>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3"  style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>mode de paiement</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {modePaimant?.map(categ => (
                  <tr key={categ.id}>
                    <td>{categ.id}</td>
                    <td>{categ?.mode_paiement}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditModP(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteModP(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        
          
          
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddModP}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddMod(false)}
  >
    Annuler
  </Fab>
      </Form.Group>
        
      </Modal>
      <Modal show={showEditModalmod} onHide={() => setShowEditModalmod(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier 
        mode de paiement
</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Nom de mode de paiement</Form.Label>
            <Form.Control
              type="text"
              value={selectedCategoryId 
                
              }
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveModP}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModalmod(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">

                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Raison Sociale</Form.Label>
                  <Form.Control
                                    style={{ flex: '2' }}

                    type="text"
                    name="raison_sociale"
                    value={formDataSC.raison_sociale}
                    onChange={handleChangeSC}
                    placeholder="Raison Sociale"
                    className="form-control"
                    isInvalid={!!errors.raison_sociale} // Validation pour Type de Quantité

                  />
                </Form.Group>
                <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }} >Adresse</Form.Label>
                  <Form.Control
                                    style={{ flex: '2' }}

                    type="text"
                    name="adresse"
                    value={formDataSC.adresse}
                    onChange={handleChangeSC}
                    placeholder="Adresse"
                    className="form-control"
                    isInvalid={!!errors.adresse} // Validation pour Type de Quantité

                  />
                </Form.Group>
                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
               
               <Form.Label className="col-sm-4" style={{ flex: '1', marginRight: '30px', marginLeft: '10px',marginTop:'7px' }}>Échéance</Form.Label>
               <Form.Select
               className="form-control "
               style={{ flex: '2' }}
                 as="select"
                 name="seance"
                 value={formDataSC.seance}
                 onChange={handleChangeSC}
               >
                 <option value="">Sélectionner Échéance</option>
                 {[20,40,60,80]?.map((region) => (
                   <option key={region} value={region}>
                     {region

                     }
                   </option>
                 ))}
                 <Form.Text className="text-danger">
                   {errors.region_id}
                 </Form.Text>
               </Form.Select>
             </Form.Group>

                <Form.Group className="col-sm-6 mt-2" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Logo du Site Client</Form.Label>
                  <Form.Control
                                    style={{ flex: '2' }}

                    type="file"
                    name="logoSC"
                    onChange={handleChangeSC}
                    className="form-control"
                    lang="fr"
                  />{" "}
                </Form.Group>
                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Abréviation</Form.Label>
                  <Form.Control
                                    style={{ flex: '2' }}

                    type="text"
                    name="abreviation"
                    value={formDataSC.abreviation}
                    onChange={handleChangeSC}
                    placeholder="Abréviation"
                    className="form-control"
                  />
                </Form.Group>
                
                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Téléphone</Form.Label>
                  <Form.Control
                                    style={{ flex: '2' }}

                    type="tel"
                    name="tele"
                    value={formDataSC.tele}
                    onChange={handleChangeSC}
                    placeholder="06XXXXXXXX"
                    className="form-control"
                  />
                </Form.Group>
                <Form.Group className="col-sm-6 mt-4" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Ville</Form.Label>
                  <Form.Control
                                    style={{ flex: '2' }}

                    type="text"
                    name="ville"
                    value={formDataSC.ville}
                    onChange={handleChangeSC}
                    placeholder="Ville"
                    className="form-control"
                  />
                </Form.Group>
                <Form.Group className="col-sm-6 mt-4" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Code Postal</Form.Label>
                  <Form.Control
                                    style={{ flex: '2' }}

                    type="text"
                    name="code_postal"
                    value={formDataSC.code_postal}
                    onChange={handleChangeSC}
                    placeholder="Code Postal"
                    className="form-control"
                  />
                </Form.Group>

                <Form.Group className="col-sm-6 mt-3" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                <Form.Label className="col-sm-4" style={{ flex: '1',marginRight: '20px', marginLeft: '10px' ,marginTop:'7px'}}>Date plafond</Form.Label>
                  <Form.Control
                  style={{ flex: '2' }}
                    type="date"
                    name="date_plafond"
                    value={formDataSC.date_plafond}
                    onChange={handleChangeSC}
                    placeholder="date plafond"
                    className="form-control"
                  />
                  <Form.Text className="text-danger">{errors.ice}</Form.Text>
                </Form.Group>

                <Form.Group className="col-sm-6 mt-4" style={{ display: 'flex', alignItems: 'center' }} controlId="calibre_id">
                  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>ICE</Form.Label>
                  <Form.Control
                                    style={{ flex: '2' }}

                    type="text"
                    name="ice"
                    value={formDataSC.ice}
                    onChange={handleChangeSC}
                    placeholder="ice"
                    className="form-control"
                  />
                </Form.Group>

                
                {/* <Form.Group className="col-sm-4 m-2" controlId="user_id">
                  <Form.Label>Utilisateur</Form.Label>
                  <Form.Control
                                    style={{ flex: '2' }}

                    type="text"
                    name="user_id"
                    value={formDataSC.user_id}
                    onChange={handleChangeSC}
                    placeholder="user_id"
                    className="form-control-sm"
                  />
                </Form.Group> */}
                <div style={{ marginLeft: '10px' }}>
                  <a href="#" onClick={handleAddEmptyRow}>
                    <Button className="btn btn-sm mb-2" variant="primary" >
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <span style={{ margin: "0 8px" }}></span>

      <strong style={{
        color:'black'
      } } >Ajouter Contacts</strong>
                  </a>
      
    </div>
    <Form.Group controlId="selectedProduitTable">
    <div className="table-responsive">
  <table className="table table-bordered" style={{ width: '100%', marginTop:'2px' }}>
    <thead>
      <tr >
        <th colSpan={5}> List Contacts</th>
      </tr>
      <tr>
        <th className="ColoretableForm">Nom</th>
        <th className="ColoretableForm">Prénom</th>
        <th className="ColoretableForm">Téléphone</th>
        <th className="ColoretableForm">Email</th>
        <th className="ColoretableForm">Action</th>
      </tr>
    </thead>
    <tbody>
      {selectedProductsData?.map((productData, index) => (
        <tr key={index}>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="text"
              value={productData.name}
              onChange={(e) => handleInputChange(index, 'name', e.target.value)}
              placeholder="Nom"
            />
          </td>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="text"
              value={productData.prenom}
              onChange={(e) => handleInputChange(index, 'prenom', e.target.value)}
              placeholder="Prénom"
            />
          </td>
          <td style={{ backgroundColor: 'white',width: '20%' }}>
            <Form.Control
              type="text"
              value={productData.telephone}
              onChange={(e) => handleInputChange(index, 'telephone', e.target.value)}
              placeholder="Téléphone"
            />
          </td>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="email"
              value={productData.email}
              onChange={(e) => handleInputChange(index, 'email', e.target.value)}
              placeholder="Email"
            />
          </td>
          <td style={{ backgroundColor: 'white', width: '10%' }}>
            
              <FontAwesomeIcon   color="red" onClick={() => handleDeleteProduct(index, productData.id)}
 icon={faTrash} />
            
          </td>
        </tr>
      ))}
      {errors.products && (
        <tr>
          <td colSpan="5" className="text-danger text-center">
            {errors.products}
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

    </Form.Group>
    <div style={{ marginLeft: '10px' }}>
                  <a href="#" onClick={handleAddEmptyRowRep}>
                    <Button className="btn btn-sm mb-2" variant="primary" >
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <span style={{ margin: "0 8px" }}></span>

      <strong style={{
        color:'black'
      } } >Ajouter Représentant</strong>
                  </a>
      
    </div>
    <Form.Group controlId="selectedProduitTable">
    <div className="table-responsive">
  <table className="table table-bordered" style={{ width: '100%', marginTop:'2px',padding:'0' }}>
    <thead>
      <tr >
        <th colSpan={5}> Représentant</th>
      </tr>
      <tr>
        <th className="ColoretableForm">Représentant</th>
        <th className="ColoretableForm">date début</th>
        <th className="ColoretableForm">date fin</th>
        <th className="ColoretableForm">Action</th>

        
      </tr>
    </thead>
    <tbody>
    {selectedProductsDataRep?.map((productData, index) => (
        <tr key={index}>
                   <td style={{ backgroundColor: 'white', width: '20%' }}>
          <Form.Select
                  style={{ flex: '2' }}
                    as="select"
                  
                    value={productData.id_agent}
              onChange={(e) => handleInputChangeRep(index, 'id_agent', e.target.value)}
                  >
                    <option value="">Sélectionner Représentant</option>
                    {agent?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.NomAgent

                        }
                      </option>
                    ))}
                    <Form.Text className="text-danger">
                      {errors.region_id}
                    </Form.Text>
                  </Form.Select>
          </td>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="date"
             
              value={productData.date_debut}
              onChange={(e) => handleInputChangeRep(index, 'date_debut', e.target.value)}
              placeholder="Date debut"
            />
          </td>
          <td style={{ backgroundColor: 'white',width: '20%' }}>
            <Form.Control
              type="date"
              
              value={productData.date_fin}
              onChange={(e) => handleInputChangeRep(index, 'date_fin', e.target.value)}
              placeholder="Date fin"
              isInvalid={!!errors.date_fin} // Validation pour Type de Quantité

            />
          </td>
          <td style={{ backgroundColor: 'white', width: '10%' }}>
            <a href="#">
              <FontAwesomeIcon   color="red"            onClick={() => handleDeleteProductRap(index, productData.id)}
 icon={faTrash} />
            </a>
              
            
          </td>
        </tr>
      ))}
       
      {errors.products && (
        <tr>
          <td colSpan="5" className="text-danger text-center">
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
    onClick={closeFormSC}
  >
    Annuler
  </Fab>
</Form.Group>

              </Form>
            </div>
            <div className="">
              <div
                id="tableContainer"
                className="table-responsive"
                style={{...tableContainerStyle, overflowX: 'auto', minWidth: '650px',
                  maxHeight: '700px', overflow: 'auto',

                  marginTop:'0px',
                }}
              >
                 <table className="table table-bordered" id="clientsTable" style={{ marginTop: "-5px", }}>
  <thead className="text-center table-secondary" style={{ position: 'sticky', top: -1, backgroundColor: '#ddd', zIndex: 1,padding:'10px'}}>
    <tr className="tableHead">
      <th className="tableHead widthDetails">{/* vide */}</th>
      <th className="tableHead">
        <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
      </th>
      <th className="tableHead">Logo</th>
      <th className="tableHead">Code</th>
      <th className="tableHead">Raison Sociale</th>
      <th className="tableHead">Abréviationnn</th>
      <th className="tableHead">Adresse</th>
      <th className="tableHead">Téléphone</th>
      <th className="tableHead">Ville</th>
      <th className="tableHead">Code Postal</th>
      <th className="tableHead">ICE</th>
      <th className="tableHead">Zone</th>
      <th className="tableHead">Région</th>
      <th className="tableHead">Catégorie</th>
      <th className="tableHead">Secteur d'activité</th>
      <th className="tableHead">représentant</th>
      <th className="tableHead">Séance</th>
      <th className="tableHead">Date plafond</th>
      <th className="tableHead">Mode de paiement </th>
      <th className="tableHead">Action</th>
    </tr>
  </thead>
  <tbody className="text-center" style={{ backgroundColor: '#007bff' }}>
    {filteredClients
      ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      ?.map((client) => {
        const rep =agent?.find((agent)=>agent.id===client.last_represantant?.id_agent);
        console.log('rep',rep,agent,filteredClients)
      return(
         <React.Fragment key={client_id}>
          <tr>
            <td style={{ backgroundColor: "white" }}>
              {
                client.siteclients?.length===0 ? '':
                  <FontAwesomeIcon onClick={() => toggleRow(client_id)} icon={expandedRows.includes(client_id) ? faMinus : faPlus} />
              }
              
            </td>
            <td style={{ backgroundColor: "white" }}>
              <input
                type="checkbox"
                checked={selectedItems?.some((item) => item === client_id)}
                onChange={() => handleSelectItem(client)}
              />
            </td>
            <td style={{ backgroundColor: "white" }}>
              {client.logo && (
                <img
                  src={client.logo}
                  alt="Logo"
                  style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                />
              )}
            </td>
            <td style={{ backgroundColor: "white" }}>{client.code_client ||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.raison_sociale ||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.abreviation||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.adresse||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.tele ||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.ville||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.code_postal ||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.ice||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.zone?.zone||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.region?.region||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.categorie||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.secteur?.secteur||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.representant?.nom_representant ? client.representant?.nom_representant + " "+client?.representant?.prenom_representant : ''}<button onClick={() => toggleRow(client_id)} style={{
              border:'none'
              ,backgroundColor:'white'
            }}>
              <FontAwesomeIcon icon={faList}
             /></button></td>     
            <td style={{ backgroundColor: "white" }}>{client.seance ||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.date_plafond ||''}</td>
            <td style={{ backgroundColor: "white" }}>{client.mode?.mode_paiement ||''}</td>
            <td style={{ backgroundColor: "white", whiteSpace: "nowrap" }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    <FontAwesomeIcon
      onClick={() => handleEdit(client)}
      icon={faEdit}
      style={{ color: "#007bff", cursor: "pointer", marginRight: "10px" }}
    />
    <FontAwesomeIcon
      onClick={() => handleDelete(client_id)}
      icon={faTrash}
      style={{ color: "#ff0000", cursor: "pointer", marginRight: "10px" }}
    />
    <PeopleIcon
      style={{ color: "#007bff", cursor: "pointer" }}
      onClick={() => {
        handleSelectItem(client);
        handleShowFormButtonClickSC();
      }}
    />
  </div>
</td>
</tr>
{expandedRows.includes(client.id) && client?.represantant?.map((represantant) => (
  <React.Fragment key={represantant.id}>
    <tr className="represantant">
      <td colSpan={2}>Represantant</td>
      <td>{represantant.id || ''}</td>
      <td>{represantant.nom || ''}</td>
      <td>{represantant.prenom || ''}</td>
      <td>{represantant.sexe || ''}</td>
      <td>{represantant.telephone || ''}</td>
      <td>{represantant.adresse || ''}</td>
      <td>{represantant.ville || ''}</td>
      <td>{represantant.code_postal || ''}</td>
      <td colSpan={1}></td>
      
      {/* <td>{secteurClient?.find((agent)=>agent.id===siteClient.
secteur?.id)?.
secteurClient
|| ''}</td>
      <td>{agent?.find((agent)=>agent.id===siteClient.
last_represantant?.id_agent
)?.
NomAgent|| ''}</td>

      <td >{siteClient.seance || ''}</td>
      <td >{siteClient.date_plafond || ''}</td>

      <td>{modePaimant?.find((agent)=>agent.id===siteClient?.
mode_id
)?.mode_paiement|| ''}</td>
      <td colSpan={2}></td> */}
      <td> 
        <FontAwesomeIcon
          onClick={() => handleEditSC(siteClient)}
          icon={faEdit}
          style={{ color: "#007bff", cursor: "pointer" }}
        />
        <span style={{ margin: "0 8px" }}></span>
        <FontAwesomeIcon
          onClick={() => handleDeleteSiteClient(siteClient.id)}
          icon={faTrash}
          style={{ color: "#ff0000", cursor: "pointer" }}
        />
      </td>
    </tr>

    {/* Contact Client Rendering */}
    {expandedRowsContactSite.includes(siteClient.id) && siteClient.
contact_site_clients
 && (
      <tr>
        <td colSpan="24"
         style={{
          padding: "0",
        }}
        >

            <table
              className="table table-responsive table-bordered"
              style={{ marginTop: '0px', marginBottom: '0px' }}
            >
              <thead>
                <tr>
                  <th className="ColoretableForm">Nom</th>
                  <th className="ColoretableForm">Prenom</th>
                  <th className="ColoretableForm">Telephone</th>
                  <th className="ColoretableForm">Email</th>
                </tr>
              </thead>
              <tbody>
                {siteClient.
contact_site_clients?.map((contact_clients) => (
                  <tr key={contact_clients.id}>
                    <td>{contact_clients.name}</td>
                    <td>{contact_clients.prenom}</td>
                    <td>{contact_clients.telephone}</td>
                    <td>{contact_clients.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </td>
      </tr>
    )}
  </React.Fragment>
))}

          {expandedRowsContact.includes(client_id) && client.contact && (
                                            <tr>
                                                <td colSpan="25"
                                                 style={{
                                                  padding: "0",
                                                }}
                                                >
                                                    <div>
                                                        <table
                                                            className="table table-responsive table-bordered"
                                                            style={{marginTop:'0px',marginBottom:'0px'}}
                                                        >
                                                            <thead>
                                                            <tr>
                                                                <th   className="ColoretableForm">Nom</th>
                                                                <th   className="ColoretableForm">Prenom</th>
                                                                <th   className="ColoretableForm">Telephone</th>
                                                                <th   className="ColoretableForm">Email</th>
                                                                {/* <th    style={{ backgroundColor: "#adb5bd" }}>Prix Vente</th>
                                                                <th    style={{ backgroundColor: "#adb5bd" }}>Total HT </th> */}
                                                                {/* <th className="text-center">Action</th> */}
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {client.contact_clients?.map((contact_clients) => {
                                                                    

                                                                    return (
                                                                        <tr key={contact_clients                                                                          .id}>
                                                                            <td>{contact_clients.name}</td>
                                                                            <td>{contact_clients.prenom}</td>
                                                                            <td>{contact_clients.telephone}</td>
                                                                            <td>{contact_clients.email}</td>
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

                {/* )} */}
               
                <a href="#">
                  <Button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedItems?.length === 0}
                >
                  <FontAwesomeIcon
                    icon={faTrash}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Supprimer selection
                </Button>
                </a>
                <TablePagination
                  rowsPerPageOptions={[5, 10,15,20, 25]}
                  component="div"
                  count={filteredclients?.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </div>
            </div>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ClientParticulier;
