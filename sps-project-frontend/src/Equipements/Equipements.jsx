import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button, Modal } from "react-bootstrap";
import { highlightText } from '../utils/textUtils';
import TablePagination from "@mui/material/TablePagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faTrash,
  faFileExcel,
  faPlus,
  faEdit,
  faFilePdf,
  faPrint,faTools, faCheckCircle, faWrench, faTimesCircle 
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import SearchWithExport from "../components/SearchWithExport";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Fab, Checkbox } from "@mui/material";
import { useOpen } from "../Acceuil/OpenProvider";
import "../style.css";

const GestionEquipements = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [equipements, setEquipements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({});
  
  // Form states
  const [formData, setFormData] = useState({
    nom: "",
    numero_serie: "",
    modele: "",
    marque: "",
    date_acquisition: "",
    date_fin_garantie: "",
    fournisseur: "",
    localisation: "",
    statut: "disponible",
    categorie_id: "",
    prix_achat: "",
    notes: "",
    document: null
  });
  
  const [errors, setErrors] = useState({});
  const [editingEquipement, setEditingEquipement] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  
  // Selection
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // UI states
  const [formContainerStyle, setFormContainerStyle] = useState({ right: "-100%" });
  const [tableContainerStyle, setTableContainerStyle] = useState({ marginRight: "0px" });
  
  const { dynamicStyles } = useOpen();

  // Fetch data
  const fetchEquipements = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token); // Log the token

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/equipements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.equipements) {
        setEquipements(response.data.equipements.data || []);
        setCategories(response.data.categories || []);
        setStats(response.data.stats || {});
      } else {
        console.error("Format de réponse inattendu:", response.data);
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Format de réponse inattendu de l'API"
        });
      }
    } catch (error) {
      console.error("Erreur détaillée:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      let errorMessage = "Impossible de charger les équipements";
      if (error.message === 'No authentication token found') {
        errorMessage = "Veuillez vous connecter pour accéder aux équipements";
      } else if (error.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
        // Optionally, redirect to login
        window.location.href = '/login';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: errorMessage
      });
    }
  };

  useEffect(() => {
    fetchEquipements();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = true;
    if (!formData.numero_serie.trim()) newErrors.numero_serie = true;
    if (!formData.modele.trim()) newErrors.modele = true;
    if (!formData.marque.trim()) newErrors.marque = true;
    if (!formData.date_acquisition) newErrors.date_acquisition = true;
    if (!formData.localisation.trim()) newErrors.localisation = true;
    if (!formData.categorie_id) newErrors.categorie_id = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    
    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    const formDataToSend = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    }

    try {
      if (editingEquipement) {
        formDataToSend.append('_method', 'PUT');
        await axios.post(`${API_URL}/equipements/${editingEquipement.id}`, formDataToSend);
      } else {
        await axios.post(`${API_URL}/equipements`, formDataToSend);
      }

      Swal.fire({
        icon: "success",
        title: "Succès",
        text: `Équipement ${editingEquipement ? "modifié" : "ajouté"} avec succès`
      });

      closeForm();
      fetchEquipements();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.response?.data?.message || "Une erreur est survenue lors de la soumission"
      });
    }
  };

  const handleEdit = (equipement) => {
    setEditingEquipement(equipement);
    setFormData({
      nom: equipement.nom,
      numero_serie: equipement.numero_serie,
      modele: equipement.modele,
      marque: equipement.marque,
      date_acquisition: equipement.date_acquisition.split('T')[0],
      date_fin_garantie: equipement.date_fin_garantie?.split('T')[0] || "",
      fournisseur: equipement.fournisseur,
      localisation: equipement.localisation,
      statut: equipement.statut,
      categorie_id: equipement.categorie_id,
      prix_achat: equipement.prix_achat,
      notes: equipement.notes,
      document: null
    });
    setFormContainerStyle({ right: "0" });
    setTableContainerStyle({ marginRight: "650px" });
  };    

  const handleDelete = (equipement) => {
    Swal.fire({
      title: "Confirmer la suppression",
      text: "Êtes-vous sûr de vouloir supprimer cet équipement ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler"
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${API_URL}/equipements/${equipement}`)
          .then(() => {
            fetchEquipements();
            Swal.fire("Supprimé!", "L'équipement a été supprimé.", "success");
          })
          .catch((error) => {
            console.error("Erreur de suppression:", error);
            Swal.fire("Erreur!", "La suppression a échoué: " + (error.response?.data?.message || error.message), "error");
          });
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;

    Swal.fire({
      title: "Confirmer la suppression",
      text: `Êtes-vous sûr de vouloir supprimer ${selectedItems.length} équipement(s) ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler"
    }).then((result) => {
      if (result.isConfirmed) {
        const deletePromises = selectedItems.map(id => 
          axios.delete(`${API_URL}/equipements/${id}`)
        );

        Promise.all(deletePromises)
          .then(() => {
            fetchEquipements();
            setSelectedItems([]);
            Swal.fire("Supprimé!", "Les équipements ont été supprimés.", "success");
          })
          .catch((error) => {
            console.error("Erreur lors de la suppression:", error);
            Swal.fire("Erreur!", error.response?.data?.message || "La suppression a échoué.", "error");
          });
      }
    });
  };

  const closeForm = () => {
    setFormContainerStyle({ right: "-100%" });
    setTableContainerStyle({ marginRight: "0" });
    setEditingEquipement(null);
    setSelectedItems([]); // Désélectionne toutes les cases
    setFormData({
      nom: "",
      numero_serie: "",
      modele: "",
      marque: "",
      date_acquisition: "",
      date_fin_garantie: "",
      fournisseur: "",
      localisation: "",
      statut: "disponible",
      categorie_id: "",
      prix_achat: "",
      notes: "",
      document: null
    });
    setErrors({});
    setHasSubmitted(false);
  };

  const handleShowForm = () => {
    setEditingEquipement(null);
    setFormData({
      nom: "",
      numero_serie: "",
      modele: "",
      marque: "",
      date_acquisition: "",
      date_fin_garantie: "",
      fournisseur: "",
      localisation: "",
      statut: "disponible",
      categorie_id: "",
      prix_achat: "",
      notes: "",
      document: null
    });
    setErrors({});
    setHasSubmitted(false);
    
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    }
  };

  // Selection handlers
  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedItems(equipements.map(e => e.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleCheckboxChange = (id) => {
    const newSelected = selectedItems.includes(id)
      ? selectedItems.filter(item => item !== id)
      : [...selectedItems, id];
    setSelectedItems(newSelected);
    
    if (newSelected.length === 1) {
      const selectedEq = equipements.find(e => e.id === newSelected[0]);
      if (selectedEq) {
        handleEdit(selectedEq);
      }
    } else if (newSelected.length === 0) {
      closeForm();
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export functions
  const exportToExcel = () => {
    const data = filteredEquipements.map(equipement => ({
      "Nom": equipement.nom,
      "N° Série": equipement.numero_serie,
      "Modèle": equipement.modele,
      "Marque": equipement.marque,
      "Catégorie": equipement.categorie?.nom || '',
      "Localisation": equipement.localisation,
      "Statut": equipement.statut,
      "Date acquisition": equipement.date_acquisition,
      "Fin garantie": equipement.date_fin_garantie || "",
      "Fournisseur": equipement.fournisseur,
      "Prix d'achat": equipement.prix_achat
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Équipements");
    XLSX.writeFile(workbook, "equipements.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des équipements", 14, 16);
    
    const headers = [["Nom", "N° Série", "Modèle", "Localisation","Catégorie" , "Statut"]];
    const data = filteredEquipements.map(equipement => [
      equipement.nom,
      equipement.numero_serie,
      equipement.modele,
      equipement.localisation,
      equipement.categorie.nom,
      equipement.statut === 'disponible' ? 'Disponible' : 
      equipement.statut === 'en_maintenance' ? 'En maintenance' : 'Hors service'
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      startY: 20,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("equipements.pdf");
  };

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    const tableContent = document.getElementById('equipementsTable').outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Liste des équipements</title>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .badge-success { background-color: #28a745; color: white; padding: 3px 6px; border-radius: 3px; }
            .badge-warning { background-color: #ffc107; color: black; padding: 3px 6px; border-radius: 3px; }
            .badge-danger { background-color: #dc3545; color: white; padding: 3px 6px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>Liste des équipements</h1>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>N° Série</th>
                <th>Modèle</th>
                <th>Localisation</th>
                <th>Catégorie</th>
                <th>Statut</th>
              </tr>
            </thead>
             <tbody>
              ${filteredEquipements?.map(equipements => `
                <tr>
                  <td>${equipements?.nom || ''}</td>
                  <td>${equipements.numero_serie || ''}</td>
                  <td>${equipements.modele || ''}</td>
                  <td>${equipements.localisation || ''}</td>
                  <td>${equipements?.categorie?.nom|| ''}</td>
                  <td>${equipements?.statut || ''}</td>
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

  // Filter equipements
  const filteredEquipements = Array.isArray(equipements) 
  ? equipements.filter(equipement => {
      const matchesSearch = 
        equipement.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipement.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipement.modele?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipement.localisation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory 
        ? equipement.categorie_id == selectedCategory 
        : true;

      const matchesStatus = selectedStatus
        ? equipement.statut === selectedStatus
        : true;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
  : [];



  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles}}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>

          <SearchWithExport
            onSearch={setSearchTerm}
            exportToExcel={exportToExcel}
            exportToPDF={exportToPDF}
            printTable={printTable}
            categories={equipements}
            selectedCategory={selectedCategory}
            handleCategoryFilterChange={setSelectedCategory}
            Title="Gestion des Équipements"
          />

{
          
          <div className=" bgSecteur">
          </div>

      }

          

          {/* Stats Cards */}
<div style={{ 
  display: 'flex', 
  gap: '20px', 
  marginBottom: '70px',
  marginTop: '30px',
  flexWrap: 'wrap',
  justifyContent: 'center'
}}>
  {[
    { 
      title: "Total Équipements", 
      value: stats.total || 0, 
      color: "#00afaa",
      icon: faTools 
    },
    { 
      title: "Disponibles", 
      value: stats.disponible || 0, 
      color: "#28a745",
      icon: faCheckCircle 
    },
    { 
      title: "En maintenance", 
      value: stats.en_maintenance || 0, 
      color: "#ffc107",
      icon: faWrench 
    },
    { 
      title: "Hors service", 
      value: stats.hors_service || 0, 
      color: "#dc3545",
      icon: faTimesCircle 
    }
  ].map((stat, index) => (
    <div key={index} style={{ 
      flex: 1,
      minWidth: '200px',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      borderTop: `4px solid ${stat.color}`
    }}>
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: `${stat.color}20`, // 20 = 0.2 opacity
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FontAwesomeIcon 
            icon={stat.icon} 
            style={{ 
              color: stat.color, 
              fontSize: '20px' 
            }} 
          />
        </div>
        <div>
          <div style={{ 
            color: '#6c757d', 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {stat.title}
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: stat.color
          }}>
            {stat.value}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

<div style={{ display: "flex", alignItems: "center", marginTop: '-50px', padding: '15px' }}>
            <button
              onClick={handleShowForm}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#329982",
                color: "white",
                borderRadius: "10px",
                fontWeight: "bold",
                marginLeft: "96%",
                padding: "6px 15px",
                border: "none",
                height: "40px",
              }}
              className="gap-2 AjouteBotton sm:ml-0 md:ml-auto"
            >
              <FontAwesomeIcon
                icon={faPlus}
                className=" AjouteBotton"
                style={{ cursor: "pointer", color: "white" }}
              />
            </button>
          </div>

          <div className="filters" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
  {/* Filtre Catégorie (existant) */}
            <Form.Select
              aria-label="Filtrer par catégorie"
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              style={{
                width: '12%',
                height: "40px",
                position: 'absolute',
                marginTop: "20px",
                left: '81%',
                top: '260px',
                cursor: "pointer",
                borderRadius: "10px",
                color: "black",
                fontWeight: "bold",
              }}
              className="sm:w-3/4 md:w-1/2 lg:w-1/4"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((categorie) => (
                <option key={categorie.id} value={categorie.id}>
                  {categorie.nom}
                </option>
              ))}
            </Form.Select>

             {/* Nouveau filtre Statut */}
              <Form.Select
                aria-label="Filtrer par statut"
                value={selectedStatus || ""}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                style={{
                  width: '12%',
                  height: "40px",
                  position: 'absolute',
                  marginTop: "20px",
                  left: '68%',
                  top: '260px',
                  cursor: "pointer",
                  borderRadius: "10px",
                  color: "black",
                  fontWeight: "bold",
                }}
              >
                <option value="">Tous les statuts</option>
                <option value="disponible">Disponible</option>
                <option value="en_maintenance">En maintenance</option>
                <option value="hors_service">Hors service</option>
              </Form.Select>
            
              </div>


          {/* Form Container */}
          <div id="formContainer" className="" style={{...formContainerStyle,marginTop:'0px',maxHeight:'700px',overflow:'auto',padding:'0'}}>
            <Form className="d-flex flex-column align-items-start" onSubmit={handleSubmit}>
              <Form.Label className="w-100 text-center">
                <h4 style={{
                  fontSize: "25px", 
                  fontFamily: "Arial, sans-serif", 
                  fontWeight: "bold", 
                  color: "black",
                  borderBottom: "2px solid black", 
                  paddingBottom: "5px",
                }}>
                  {editingEquipement ? "Modifier" : "Ajouter"} un Équipement
                </h4>
              </Form.Label>

              <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                    Nom *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="nom"
                    value={formData.nom}
                    isInvalid={hasSubmitted && errors.nom}
                    onChange={handleChange}
                  />
                  {hasSubmitted && errors.nom && (
                    <Form.Control.Feedback type="invalid">
                      Required
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                    N° Série *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="numero_serie"
                    value={formData.numero_serie}
                    isInvalid={hasSubmitted && errors.numero_serie}
                    onChange={handleChange}
                  />
                  {hasSubmitted && errors.numero_serie && (
                    <Form.Control.Feedback type="invalid">
                      Required
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>

              <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>Modèle *</Form.Label>
                  <Form.Control
                    type="text"
                    name="modele"
                    value={formData.modele}
                    isInvalid={hasSubmitted && errors.modele}
                    onChange={handleChange}
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  />
                  {hasSubmitted && errors.modele && (
                    <Form.Control.Feedback type="invalid">
                      Required
                    </Form.Control.Feedback>
                  )}
              </Form.Group>

              <Form.Group style={{ flex: 1 }}>
                <Form.Label style={{ fontWeight: "bold" }}>
                  Marque *
                </Form.Label>
                  <Form.Control
                    type="text"
                    name="marque"
                    value={formData.marque}
                    isInvalid={hasSubmitted && errors.marque}
                    onChange={handleChange}
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  />
                  {hasSubmitted && errors.marque && (
                    <Form.Control.Feedback type="invalid">
                      Required
                    </Form.Control.Feedback>
                  )}
              </Form.Group>
              </div>


              <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Catégorie *
                </Form.Label>
                  <Form.Select
                    name="categorie_id"
                    value={formData.categorie_id}
                    onChange={handleChange}
                    isInvalid={hasSubmitted && errors.categorie_id}
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(categorie => (
                      <option key={categorie.id} value={categorie.id}>
                        {categorie.nom}
                      </option>
                    ))}
                  </Form.Select>
                  {hasSubmitted && errors.categorie_id && (
                    <Form.Control.Feedback type="invalid">
                      Required
                    </Form.Control.Feedback>
                  )}
              </Form.Group>

              <Form.Group style={{ flex: 1 }}>
              <Form.Label style={{ fontWeight: "bold" }}>
                  Statut
                </Form.Label>
                  <Form.Select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="en_maintenance">En maintenance</option>
                    <option value="hors_service">Hors service</option>
                  </Form.Select>
              </Form.Group>
              </div>

              <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Localisation *
                </Form.Label>
                  <Form.Control
                    type="text"
                    name="localisation"
                    value={formData.localisation}
                    isInvalid={hasSubmitted && errors.localisation}
                    onChange={handleChange}
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  />
                  {hasSubmitted && errors.localisation && (
                    <Form.Control.Feedback type="invalid">
                      Required
                    </Form.Control.Feedback>
                  )}
              </Form.Group>

              <Form.Group style={{ flex: 1 }}>
              <Form.Label style={{ fontWeight: "bold" }}>
                  Date acquisition *
                </Form.Label>
                  <Form.Control
                    type="date"
                    name="date_acquisition"
                    value={formData.date_acquisition}
                    isInvalid={hasSubmitted && errors.date_acquisition}
                    onChange={handleChange}
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  />
                  {hasSubmitted && errors.date_acquisition && (
                    <Form.Control.Feedback type="invalid">
                      Required
                    </Form.Control.Feedback>
                  )}
              </Form.Group>
              </div>

              <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Date fin garantie
                </Form.Label>
                  <Form.Control
                    type="date"
                    name="date_fin_garantie"
                    value={formData.date_fin_garantie}
                    onChange={handleChange}
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  />
              </Form.Group>

                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Fournisseur
                </Form.Label>
                  <Form.Control
                    type="text"
                    name="fournisseur"
                    value={formData.fournisseur}
                    onChange={handleChange}
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  />
              </Form.Group>
              </div>

              <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Prix d'achat
                </Form.Label>
                  <Form.Control
                    type="number"
                    name="prix_achat"
                    value={formData.prix_achat}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  />
              </Form.Group>

              <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Document
                </Form.Label>
                  <Form.Control
                    type="file"
                    name="document"
                    onChange={handleChange}
                    accept=".pdf,.jpg,.png"
                    style={{ minWidth: "100%", maxWidth: "400px" }}
                  />
              </Form.Group>
              </div>


              <Form.Group className="w-100" style={{ marginBottom: "20px" }}>
                <Form.Label style={{ fontWeight: "bold" }}>
                  Notes
                </Form.Label>
                <Form.Control
                  as="textarea"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </Form.Group>

              <Form.Group className="mt-5 tarif-button-container">
                <div className="button-container">
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
                </div>
              </Form.Group>
            </Form>
          </div>

          {/* Table Container */}
          <div id="tableContainer" className="table-responsive" style={{
            ...tableContainerStyle, 
            overflowX: 'auto', 
            minWidth: '650px',
            maxHeight: '700px', 
            overflow: 'auto',
            marginTop:'0px',
            paddingTop:'0px'
          }}>
            <table className="table table-bordered" id="equipementsTable" style={{ marginTop: "-5px" }}>
              <thead className="text-center table-secondary" style={{ 
                position: 'sticky', 
                top: -1, 
                backgroundColor: '#ddd', 
                zIndex: 1,
                padding:'10px'
              }}>
                <tr className="tableHead">
                  <th className="tableHead">
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
                  </th>
                  <th className="tableHead">Nom</th>
                  <th className="tableHead">N° Série</th>
                  <th className="tableHead">Modèle</th>
                  <th className="tableHead">Localisation</th>
                  <th className="tableHead">Catégorie</th>
                  <th className="tableHead">Statut</th>
                  <th className="tableHead">Actions</th>
                </tr>
              </thead>
              <tbody className="text-center" style={{ backgroundColor: '#007bff' }}>
                {filteredEquipements
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((equipement) => (
                    <tr key={equipement.id}>
                      <td style={{ backgroundColor: "white" }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(equipement.id)}
                          onChange={() => handleCheckboxChange(equipement.id)}
                        />
                      </td>
                      <td style={{ backgroundColor: "white" }}>{highlightText(equipement.nom, searchTerm)}</td>
                      <td style={{ backgroundColor: "white" }}>{highlightText(equipement.numero_serie, searchTerm)}</td>
                      <td style={{ backgroundColor: "white" }}>{highlightText(equipement.modele, searchTerm)}</td>
                      <td style={{ backgroundColor: "white" }}>{highlightText(equipement.localisation, searchTerm)}</td>
                      <td style={{ backgroundColor: "white" }}>{equipement.categorie?.nom}</td>
                      <td style={{ backgroundColor: "white" }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: 
                              equipement.statut === 'disponible' ? 'rgba(40, 167, 69, 0.1)' :
                              equipement.statut === 'en_maintenance' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                            color: 
                              equipement.statut === 'disponible' ? '#28a745' :
                              equipement.statut === 'en_maintenance' ? '#ffc107' : '#dc3545'
                          }}>
                            {equipement.statut === 'disponible' ? 'Disponible' :
                            equipement.statut === 'en_maintenance' ? 'En maintenance' : 'Hors service'}
                          </span>
                      </td>
                      <td style={{ backgroundColor: "white", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FontAwesomeIcon
                            onClick={() => handleEdit(equipement)}
                            icon={faEdit}
                            style={{ color: "#007bff", cursor: "pointer", marginRight: "10px" }}
                          />
                          <FontAwesomeIcon
                            onClick={() => handleDelete(equipement.id)}
                            icon={faTrash}
                            style={{ color: "#ff0000", cursor: "pointer", marginRight: "10px" }}
                          />
                        </div>  
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <Button
              className="btn btn-danger btn-sm"
              onClick={handleDeleteSelected}
              disabled={selectedItems.length === 0}
              style={{
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "17px",
                color: "white",
                marginBottom: "10px"
              }}
            >
              <FontAwesomeIcon
                icon={faTrash}
                style={{ marginRight: "0.5rem" }}

              />
              Supprimer sélectionnés
            </Button>
            <TablePagination
          rowsPerPageOptions={[5, 10, 15, 20, 25]}
          component="div"
          count={filteredEquipements.length}
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
} 
export default GestionEquipements;