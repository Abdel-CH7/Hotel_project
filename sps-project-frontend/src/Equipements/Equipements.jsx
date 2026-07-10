import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button, Modal } from "react-bootstrap";
import { highlightText } from '../utils/textUtils';
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
  setSelectedItems([]);
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
    document: null,
  });
  setErrors({});
  setHasSubmitted(false);
  setFormContainerStyle({ right: "0" });
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
        <Box component="main" className="app-page equipements-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>

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

          

          {/* Stats Cards */}
{/* Stats Cards */}
<div className="app-section app-stats-grid">
  {[
    {
      title: "Total Équipements",
      value: stats.total || 0,
      color: "#00afaa",
      icon: faTools,
    },
    {
      title: "Disponibles",
      value: stats.disponible || 0,
      color: "#28a745",
      icon: faCheckCircle,
    },
    {
      title: "En maintenance",
      value: stats.en_maintenance || 0,
      color: "#ffc107",
      icon: faWrench,
    },
    {
      title: "Hors service",
      value: stats.hors_service || 0,
      color: "#dc3545",
      icon: faTimesCircle,
    },
  ].map((stat, index) => (
    <div
      key={index}
      className="app-stat-card"
      style={{ borderTopColor: stat.color }}
    >
      <div
        className="app-stat-icon"
        style={{ backgroundColor: `${stat.color}20` }}
      >
        <FontAwesomeIcon
          icon={stat.icon}
          style={{ color: stat.color, fontSize: "20px" }}
        />
      </div>

      <div>
        <div className="app-stat-title">{stat.title}</div>
        <div className="app-stat-value" style={{ color: stat.color }}>
          {stat.value}
        </div>
      </div>
    </div>
  ))}
</div>

<div className="app-controls-row">
  <button
    type="button"
    onClick={handleShowForm}
    className="app-add-button"
  >
    <FontAwesomeIcon icon={faPlus} />
    Ajouter Équipement
  </button>

  <div className="app-filter-controls">
    <Form.Select
      aria-label="Filtrer par statut"
      value={selectedStatus || ""}
      onChange={(e) => setSelectedStatus(e.target.value || null)}
      className="app-filter-select"
    >
      <option value="">Tous les statuts</option>
      <option value="disponible">Disponible</option>
      <option value="en_maintenance">En maintenance</option>
      <option value="hors_service">Hors service</option>
    </Form.Select>

    <Form.Select
      aria-label="Filtrer par catégorie"
      value={selectedCategory || ""}
      onChange={(e) => setSelectedCategory(e.target.value || null)}
      className="app-filter-select"
    >
      <option value="">Toutes les catégories</option>
      {categories.map((categorie) => (
        <option key={categorie.id} value={categorie.id}>
          {categorie.nom}
        </option>
      ))}
    </Form.Select>
  </div>
</div>

{/* Form Container */}
<div
  id="formContainer"
  className="app-form-drawer"
  style={{
    ...formContainerStyle,
    width: "650px",
    maxWidth: "100%",
  }}
>
  <Form onSubmit={handleSubmit}>
    <h4 className="app-form-drawer-title">
      {editingEquipement ? "Modifier" : "Ajouter"} un Équipement
    </h4>

    <div className="row g-3">
      <Form.Group className="col-md-6">
        <Form.Label>Nom *</Form.Label>
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

      <Form.Group className="col-md-6">
        <Form.Label>N° Série *</Form.Label>
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

      <Form.Group className="col-md-6">
        <Form.Label>Modèle *</Form.Label>
        <Form.Control
          type="text"
          name="modele"
          value={formData.modele}
          isInvalid={hasSubmitted && errors.modele}
          onChange={handleChange}
        />
        {hasSubmitted && errors.modele && (
          <Form.Control.Feedback type="invalid">
            Required
          </Form.Control.Feedback>
        )}
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Marque *</Form.Label>
        <Form.Control
          type="text"
          name="marque"
          value={formData.marque}
          isInvalid={hasSubmitted && errors.marque}
          onChange={handleChange}
        />
        {hasSubmitted && errors.marque && (
          <Form.Control.Feedback type="invalid">
            Required
          </Form.Control.Feedback>
        )}
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Catégorie *</Form.Label>
        <Form.Select
          name="categorie_id"
          value={formData.categorie_id}
          onChange={handleChange}
          isInvalid={hasSubmitted && errors.categorie_id}
        >
          <option value="">Sélectionner une catégorie</option>
          {categories.map((categorie) => (
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

      <Form.Group className="col-md-6">
        <Form.Label>Statut</Form.Label>
        <Form.Select
          name="statut"
          value={formData.statut}
          onChange={handleChange}
        >
          <option value="disponible">Disponible</option>
          <option value="en_maintenance">En maintenance</option>
          <option value="hors_service">Hors service</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Localisation *</Form.Label>
        <Form.Control
          type="text"
          name="localisation"
          value={formData.localisation}
          isInvalid={hasSubmitted && errors.localisation}
          onChange={handleChange}
        />
        {hasSubmitted && errors.localisation && (
          <Form.Control.Feedback type="invalid">
            Required
          </Form.Control.Feedback>
        )}
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Date acquisition *</Form.Label>
        <Form.Control
          type="date"
          name="date_acquisition"
          value={formData.date_acquisition}
          isInvalid={hasSubmitted && errors.date_acquisition}
          onChange={handleChange}
        />
        {hasSubmitted && errors.date_acquisition && (
          <Form.Control.Feedback type="invalid">
            Required
          </Form.Control.Feedback>
        )}
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Date fin garantie</Form.Label>
        <Form.Control
          type="date"
          name="date_fin_garantie"
          value={formData.date_fin_garantie}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Fournisseur</Form.Label>
        <Form.Control
          type="text"
          name="fournisseur"
          value={formData.fournisseur}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Prix d'achat</Form.Label>
        <Form.Control
          type="number"
          name="prix_achat"
          value={formData.prix_achat}
          onChange={handleChange}
          min="0"
          step="0.01"
        />
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Document</Form.Label>
        <Form.Control
          type="file"
          name="document"
          onChange={handleChange}
          accept=".pdf,.jpg,.png"
        />
      </Form.Group>

      <Form.Group className="col-12">
        <Form.Label>Notes</Form.Label>
        <Form.Control
          as="textarea"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
        />
      </Form.Group>
    </div>

    <div className="app-form-actions">
      <Button type="submit" className="app-primary-button">
        Valider
      </Button>

      <Button
        type="button"
        className="app-secondary-button"
        onClick={closeForm}
      >
        Annuler
      </Button>
    </div>
  </Form>
</div>
          {/* Table Container */}
{/* Table Container */}
<div className="app-section">
  <div id="tableContainer" className="app-table-wrapper">
    <table id="equipementsTable" className="table table-bordered app-table mb-0">
      <thead className="text-center">
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAllChange}
            />
          </th>
          <th>Nom</th>
          <th>N° Série</th>
          <th>Modèle</th>
          <th>Localisation</th>
          <th>Catégorie</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody className="text-center">
        {filteredEquipements
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((equipement) => (
            <tr key={equipement.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(equipement.id)}
                  onChange={() => handleCheckboxChange(equipement.id)}
                />
              </td>

              <td>{highlightText(equipement.nom, searchTerm)}</td>
              <td>{highlightText(equipement.numero_serie, searchTerm)}</td>
              <td>{highlightText(equipement.modele, searchTerm)}</td>
              <td>{highlightText(equipement.localisation, searchTerm)}</td>
              <td>{equipement.categorie?.nom || ""}</td>

              <td>
                <span
                  className={`app-status-badge ${
  equipement.statut === "disponible"
    ? "is-success"
    : equipement.statut === "en_maintenance"
    ? "is-warning"
    : "is-danger"
}`}
                >
                  {equipement.statut === "disponible"
                    ? "Disponible"
                    : equipement.statut === "en_maintenance"
                    ? "En maintenance"
                    : "Hors service"}
                </span>
              </td>

              <td style={{ whiteSpace: "nowrap" }}>
                <div className="d-flex align-items-center justify-content-center">
                  <FontAwesomeIcon
                    onClick={() => handleEdit(equipement)}
                    icon={faEdit}
                    className="app-table-action is-edit"
                  />

                  <FontAwesomeIcon
                    onClick={() => handleDelete(equipement.id)}
                    icon={faTrash}
                    className="app-table-action is-delete"
                  />
                </div>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>

  <div className="app-table-footer">
    <Button
      type="button"
      className="app-danger-button"
      onClick={handleDeleteSelected}
      disabled={selectedItems.length === 0}
    >
      <FontAwesomeIcon icon={faTrash} />
      Supprimer sélectionnés
    </Button>

    <div className="app-table-pagination">
      <span>Lignes par page:</span>

      <select
        value={rowsPerPage}
        onChange={(e) =>
          handleChangeRowsPerPage({
            target: { value: e.target.value },
          })
        }
      >
        {[5, 10, 15, 20, 25].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <span>
        {filteredEquipements.length > 0
          ? `${page * rowsPerPage + 1}-${Math.min(
              (page + 1) * rowsPerPage,
              filteredEquipements.length
            )} sur ${filteredEquipements.length}`
          : "0-0 sur 0"}
      </span>

      <button
        type="button"
        className="app-pagination-arrow"
        disabled={page === 0}
        onClick={(e) => handleChangePage(e, page - 1)}
      >
        ‹
      </button>

      <button
        type="button"
        className="app-pagination-arrow"
        disabled={(page + 1) * rowsPerPage >= filteredEquipements.length}
        onClick={(e) => handleChangePage(e, page + 1)}
      >
        ›
      </button>
    </div>
  </div>
</div>
    </Box>
  </Box>
</ThemeProvider>
  );
} 
export default GestionEquipements;