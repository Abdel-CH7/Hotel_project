import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Form, Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import '../style.css';

import ChambreTable from '../components/etatChambreTable';
import { useOpen } from "../Acceuil/OpenProvider";
import Box from '@mui/material/Box';
import Search from "../Acceuil/Search";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPrint,
  faFilePdf,
  faFileExcel,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

const EtatChambre = () => {
  const { dynamicStyles } = useOpen();
  
  const [chambres, setChambres] = useState([]);
  const [formData, setFormData] = useState({
    num_chambre: '',
    status: '',
    date_nettoyage: '',
    nettoyée_par: '',
    maintenance: 'non',
    maintenance_type_id: '',
    date_debut_maintenance: '',
    date_fin_maintenance: '',
    commentaire: '',
  });

  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMaintenance, setSelectedMaintenance] = useState("");
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [dateNettoyage, setDateNettoyage] = useState("");
  const [dateDebutMaintenance, setDateDebutMaintenance] = useState("");
  const [dateFinMaintenance, setDateFinMaintenance] = useState("");
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);

  const exportToExcel = () => {
    try {
      const table = document.getElementById('exportTable');
      if (!table) {
        throw new Error("Table element not found!");
      }
      const workbook = XLSX.utils.table_to_book(table, { sheet: 'Chambres' });
      XLSX.writeFile(workbook, 'chambres.xlsx');
    } catch (error) {
      setError("Erreur lors de l'exportation Excel: " + error.message);
    }
  };

  const exportToPDF = () => {
    try {
      const table = document.getElementById('exportTable');
      if (!table) {
        throw new Error("Table element not found!");
      }
      const doc = new jsPDF();
      doc.text("État des Chambres", 14, 16);
      doc.autoTable({
        html: '#exportTable',
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8, overflow: 'linebreak' },
        headStyles: { fillColor: '#00afaa' }
      });
      doc.save("chambres.pdf");
    } catch (error) {
      setError("Erreur lors de l'exportation PDF: " + error.message);
    }
  };

  const printTable = () => {
    try {
      const tableElement = document.getElementById('exportTable');
      if (!tableElement) {
        throw new Error("Table element not found!");
      }
      const tableHtml = tableElement.outerHTML;
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) {
        throw new Error("Impossible d'ouvrir la fenêtre d'impression");
      }
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Table</title>
            <style>
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #00afaa; color: #fff; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h2 style="text-align: center; color: #00afaa;">État des Chambres</h2>
            ${tableHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      setError("Erreur lors de l'impression: " + error.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [chambresResponse, etatResponse, maintenanceTypesResponse] = await Promise.all([
          fetch('http://localhost:8000/api/chambres'),
          fetch('http://localhost:8000/api/etat-chambre'),
          fetch('http://localhost:8000/api/maintenance-types')
        ]);

        if (!chambresResponse.ok || !etatResponse.ok || !maintenanceTypesResponse.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }

        const [chambresData, etatData, maintenanceTypesData] = await Promise.all([
          chambresResponse.json(),
          etatResponse.json(),
          maintenanceTypesResponse.json()
        ]);

        // Check if chambresData.chambres exists, if not use chambresData directly
        const chambresArray = Array.isArray(chambresData.chambres) ? chambresData.chambres : 
                            Array.isArray(chambresData) ? chambresData : [];
        setRoomNumbers(chambresArray);
        
        // Check if etatData is an array directly or nested under a property
        const etatArray = Array.isArray(etatData) ? etatData : 
                         Array.isArray(etatData.chambres) ? etatData.chambres : [];
        
        const flatChambres = etatArray.map((chambre) => ({
          ...chambre,
          maintenance: chambre.maintenance ? 'oui' : 'non',
          maintenance_type_id: chambre.maintenance_type_id ? String(chambre.maintenance_type_id) : '',
          date_debut_maintenance: chambre.date_debut_maintenance || '',
          date_fin_maintenance: chambre.date_fin_maintenance || '',
        }));
        
        setChambres(flatChambres);
        setMaintenanceTypes(maintenanceTypesData.types || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Erreur lors du chargement des données: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleEditClick = (chambre) => {
    setIsEdit(true);
    setFormData({
      ...chambre,
      maintenance: chambre.maintenance ? 'oui' : 'non',
      maintenance_type_id: chambre.maintenance_type_id ? String(chambre.maintenance_type_id) : '',
      date_debut_maintenance: chambre.date_debut_maintenance || '',
      date_fin_maintenance: chambre.date_fin_maintenance || '',
      num_chambre: chambre.num_chambre || '',
      status: chambre.status || '',
      date_nettoyage: chambre.date_nettoyage || '',
      nettoyée_par: chambre.nettoyée_par || '',
      commentaire: chambre.commentaire || '',
    });
    if (!showForm) {
      handleShowForm();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form with data:", formData);

    if (!formData.num_chambre) {
      setError("Le numéro de chambre est obligatoire");
      return;
    }

    if (!formData.status) {
      setError("Le statut est obligatoire");
      return;
    }

    if (formData.maintenance === 'oui') {
      // Validate maintenance_type_id
      if (!formData.maintenance_type_id || !maintenanceTypes.some(type => type.id === parseInt(formData.maintenance_type_id))) {
        setError("Le type de maintenance sélectionné est invalide");
        return;
      }

      // Validate date_debut_maintenance
      if (!formData.date_debut_maintenance) {
        setError("La date de début de maintenance est obligatoire");
        return;
      }

      // Validate date_fin_maintenance
      if (!formData.date_fin_maintenance) {
        setError("La date de fin de maintenance est obligatoire");
        return;
      }

      // Validate date format and order
      const startDate = new Date(formData.date_debut_maintenance);
      const endDate = new Date(formData.date_fin_maintenance);

      if (isNaN(startDate.getTime())) {
        setError("La date de début de maintenance n'est pas valide");
        return;
      }

      if (isNaN(endDate.getTime())) {
        setError("La date de fin de maintenance n'est pas valide");
        return;
      }

      if (endDate < startDate) {
        setError("La date de fin de maintenance doit être postérieure ou égale à la date de début");
        return;
      }
    }

    if (!isEdit) {
      const alreadyExists = chambres.some(ch => ch.num_chambre === formData.num_chambre);
      if (alreadyExists) {
        setError("Cette chambre existe déjà");
        return;
      }
    }

    try {
      // Build a payload that only includes maintenance fields when maintenance is true
      const dataToSubmit = {
        num_chambre: formData.num_chambre,
        status: formData.status,
        date_nettoyage: formData.date_nettoyage || null,
        nettoyée_par: formData.nettoyée_par || null,
        commentaire: formData.commentaire || null,
        maintenance: formData.maintenance === 'oui',
      };

      if (formData.maintenance === 'oui') {
        if (formData.maintenance_type_id) {
          dataToSubmit.maintenance_type_id = parseInt(formData.maintenance_type_id);
        }
        dataToSubmit.date_debut_maintenance = formData.date_debut_maintenance || null;
        dataToSubmit.date_fin_maintenance = formData.date_fin_maintenance || null;
      }

      const url = isEdit 
        ? `http://localhost:8000/api/etat-chambre/${formData.num_chambre}`
        : 'http://localhost:8000/api/etat-chambre';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.errors ? 
          Object.values(errorData.errors).flat().join('\n') : 
          errorData.message || 'Une erreur est survenue';
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Normalize the response: backend returns the created/updatedEtatChambre object directly
      const newEtat = result.chambre || result.etat_chambre || result;

      setChambres(prevChambres => {
        const transformed = {
          ...newEtat,
          maintenance: newEtat.maintenance ? 'oui' : 'non',
          maintenance_type_id: newEtat.maintenance_type_id ? String(newEtat.maintenance_type_id) : ''
        };

        if (isEdit) {
          return prevChambres.map(ch => ch.num_chambre === formData.num_chambre ? transformed : ch);
        } else {
          return [...prevChambres, transformed];
        }
      });

      resetAndCloseForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Une erreur est survenue lors de la soumission du formulaire');
    }
  };

  const resetAndCloseForm = () => {
    setFormData({
      num_chambre: '',
      status: '',
      date_nettoyage: '',
      nettoyée_par: '',
      maintenance: 'non',
      maintenance_type_id: '',
      date_debut_maintenance: '',
      date_fin_maintenance: '',
      commentaire: '',
    });
    setIsEdit(false);
    setShowForm(false);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleMarkAsClean = (chambre) => {
    const updatedChambre = {
      ...chambre,
      status: "nettoyée",
      date_nettoyage: new Date().toISOString().split('T')[0],
    };

    fetch(`http://localhost:8000/api/etat-chambre/${chambre.num_chambre}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedChambre),
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP Error ${response.status}: ${text}`);
        }
        return response.json();
      })
      .then((data) => {
        setChambres((prevChambres) =>
          prevChambres.map((ch) =>
            ch.num_chambre === data.etat_chambre.num_chambre ? data.etat_chambre : ch
          )
        );
      })
      .catch((error) => {
        console.error("Error marking room as clean:", error);
        setError("Erreur lors de la mise à jour du statut de la chambre");
      });
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (key, value) => {
    if (key === "status") {
      setSelectedStatus(value);
    } else if (key === "maintenance") {
      setSelectedMaintenance(value);
    } else if (key === "date_nettoyage") {
      setDateNettoyage(value);
    } else if (key === "date_debut_maintenance") {
      setDateDebutMaintenance(value);
    } else if (key === "date_fin_maintenance") {
      setDateFinMaintenance(value);
    }
  };

  const filteredChambres = chambres.filter((ch) => {
    if (!ch) return false;
    
    const matchesSearch = ch.num_chambre
      ? ch.num_chambre.toString().toLowerCase().includes(searchTerm.toLowerCase())
      : false;

    const matchesStatus = selectedStatus
      ? ch.status?.toLowerCase() === selectedStatus.toLowerCase()
      : true;

    const maintenanceValue = ch.maintenance === 'oui' ? 'oui' : 'non';
    const matchesMaintenance = selectedMaintenance
      ? maintenanceValue === selectedMaintenance
      : true;

    const matchesDateNettoyage = dateNettoyage ? ch.date_nettoyage === dateNettoyage : true;
    const matchesDateDebut = dateDebutMaintenance ? ch.date_debut_maintenance === dateDebutMaintenance : true;
    const matchesDateFin = dateFinMaintenance ? ch.date_fin_maintenance === dateFinMaintenance : true;

    return matchesSearch && matchesStatus && matchesMaintenance && matchesDateNettoyage && matchesDateDebut && matchesDateFin;
  });

  return (
    <Box sx={{ ...dynamicStyles }}>
      <Box
      component="main"
      className="app-page etat-chambre-page"
      sx={{ flexGrow: 1, p: 3, mt: 0 }}
    >
        
<div className="app-page-header">
  <h1 className="app-page-title">État des Chambres</h1>

  <div className="app-toolbar">
    <div className="app-search-box">
      <Search onSearch={handleSearch} type="search" />
    </div>

    <div className="app-export-actions">
      <FontAwesomeIcon
        icon={faPrint}
        onClick={printTable}
        className="app-action-icon is-muted"
        title="Imprimer"
      />
      <FontAwesomeIcon
        icon={faFilePdf}
        onClick={exportToPDF}
        className="app-action-icon is-danger"
        title="Exporter en PDF"
      />
      <FontAwesomeIcon
        icon={faFileExcel}
        onClick={exportToExcel}
        className="app-action-icon is-success"
        title="Exporter en Excel"
      />
    </div>
  </div>
</div>

<div className="app-controls-row">
  <button
    type="button"
    onClick={() => {
      setIsEdit(false);
      setFormData({
        num_chambre: '',
        status: '',
        date_nettoyage: '',
        nettoyée_par: '',
        maintenance: 'non',
        maintenance_type_id: '',
        date_debut_maintenance: '',
        date_fin_maintenance: '',
        commentaire: '',
      });
      handleShowForm();
    }}
    className="app-add-button"
  >
    <FontAwesomeIcon icon={faPlus} />
    Ajouter un État de Chambre
  </button>

  <div className="app-filter-controls">
    <Form.Select
      value={selectedStatus}
      onChange={(e) => handleFilterChange("status", e.target.value)}
      className="app-filter-select"
    >
      <option value="">Tous les statuts</option>
      <option value="nettoyée">Nettoyée</option>
      <option value="non nettoyée">Non nettoyée</option>
    </Form.Select>

    <Form.Select
      value={selectedMaintenance}
      onChange={(e) => handleFilterChange("maintenance", e.target.value)}
      className="app-filter-select"
    >
      <option value="">Maintenance</option>
      <option value="oui">En maintenance</option>
      <option value="non">Pas en maintenance</option>
    </Form.Select>

    <Form.Control
      type="date"
      value={dateNettoyage}
      onChange={(e) => handleFilterChange("date_nettoyage", e.target.value)}
      className="app-filter-select"
      title="Date de nettoyage"
    />

    <Form.Control
      type="date"
      value={dateDebutMaintenance}
      onChange={(e) => handleFilterChange("date_debut_maintenance", e.target.value)}
      className="app-filter-select"
      title="Début Maintenance"
    />

    <Form.Control
      type="date"
      value={dateFinMaintenance}
      onChange={(e) => handleFilterChange("date_fin_maintenance", e.target.value)}
      className="app-filter-select"
      title="Fin Maintenance"
    />
  </div>
</div>
        {loading && (
          <div className="text-center my-4">
            <Spinner animation="border" style={{ color: '#00afaa' }} />
            <p className="mt-2">Chargement des données...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="my-3">
            <Alert.Heading>Erreur</Alert.Heading>
            <p style={{ whiteSpace: 'pre-line' }}>{error}</p>
          </Alert>
        )}

        {!loading && !error && filteredChambres.length === 0 && (
          <Alert variant="info" className="my-3">
            Aucune chambre ne correspond aux filtres.
          </Alert>
        )}

<div className="app-section">
  <ChambreTable
    filteredChambres={filteredChambres}
    handleEditClick={handleEditClick}
    handleMarkAsClean={handleMarkAsClean}
  />
</div>

<div
  id="formContainer"
  className="app-form-drawer"
  style={{
    right: showForm ? "0" : "-100%",
    width: "560px",
    maxWidth: "100%",
  }}
>
  <Form onSubmit={handleSubmit}>
    <h4 className="app-form-drawer-title">
      {isEdit ? "Modifier" : "Ajouter"} un État de Chambre
    </h4>

    <div className="row g-3">
      <Form.Group className="col-md-6">
        <Form.Label>Numéro de Chambre</Form.Label>
        <Form.Select
          name="num_chambre"
          value={formData.num_chambre || ""}
          onChange={handleChange}
        >
          <option value="">Sélectionner une chambre</option>
          {roomNumbers.map((ch) => (
            <option key={ch.num_chambre} value={ch.num_chambre}>
              {ch.num_chambre}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Statut</Form.Label>
        <Form.Select
          name="status"
          value={formData.status || ""}
          onChange={handleChange}
        >
          <option value="">Sélectionner le statut</option>
          <option value="nettoyée">Nettoyée</option>
          <option value="non nettoyée">Non nettoyée</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Date de Nettoyage</Form.Label>
        <Form.Control
          type="date"
          name="date_nettoyage"
          value={formData.date_nettoyage || ""}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Nettoyée Par</Form.Label>
        <Form.Control
          type="text"
          name="nettoyée_par"
          value={formData.nettoyée_par || ""}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="col-12">
        <Form.Label>Maintenance</Form.Label>

        <div className="d-flex gap-4">
          <Form.Check
            type="radio"
            id="maintenance-oui"
            name="maintenance"
            value="oui"
            label="Oui"
            checked={formData.maintenance === "oui"}
            onChange={handleChange}
          />

          <Form.Check
            type="radio"
            id="maintenance-non"
            name="maintenance"
            value="non"
            label="Non"
            checked={formData.maintenance === "non"}
            onChange={handleChange}
          />
        </div>
      </Form.Group>

      {formData.maintenance === "oui" && (
        <>
          <Form.Group className="col-12">
            <Form.Label>Type de Maintenance</Form.Label>
            <Form.Select
              name="maintenance_type_id"
              value={formData.maintenance_type_id || ""}
              onChange={handleChange}
            >
              <option value="">Sélectionner le type</option>
              {maintenanceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.types_maintenance}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="col-md-6">
            <Form.Label>Date Début Maintenance</Form.Label>
            <Form.Control
              type="date"
              name="date_debut_maintenance"
              value={formData.date_debut_maintenance || ""}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="col-md-6">
            <Form.Label>Date Fin Maintenance</Form.Label>
            <Form.Control
              type="date"
              name="date_fin_maintenance"
              value={formData.date_fin_maintenance || ""}
              onChange={handleChange}
            />
          </Form.Group>
        </>
      )}

      <Form.Group className="col-12">
        <Form.Label>Commentaire</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="commentaire"
          value={formData.commentaire || ""}
          onChange={handleChange}
        />
      </Form.Group>
    </div>

    <div className="app-form-actions">
      <Button type="submit" className="app-primary-button">
        {isEdit ? "Modifier" : "Ajouter"}
      </Button>

      <Button
        type="button"
        className="app-secondary-button"
        onClick={resetAndCloseForm}
      >
        Annuler
      </Button>
    </div>
  </Form>
</div>      </Box>
    </Box>
  );
};

export default EtatChambre;