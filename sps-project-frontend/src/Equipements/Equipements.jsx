import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button, Modal } from "react-bootstrap";
import {
  formatFrenchDate,
  formatFrenchNumber,
  highlightText,
  normalizeSearchValue,
} from '../utils/textUtils';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
  faEdit,
  faTools,
  faCheckCircle,
  faWrench,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import SearchWithExport from "../components/SearchWithExport";
import AppStats from "../components/AppStats";
import ListFilterReset from "../components/ListFilterReset";
import ListPagination from "../components/ListPagination";
import ListState from "../components/ListState";
import useListControls from "../components/useListControls";
import {
  exportToExcel as exportRowsToExcel,
  exportToPdf as exportRowsToPdf,
  printRows,
} from "../utils/listExportUtils";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { useOpen } from "../Acceuil/OpenProvider";
import "../style.css";

const createEmptyEquipmentForm = () => ({
  nom: "",
  numero_serie: "",
  modele: "",
  marque: "",
  date_acquisition: "",
  date_fin_garantie: "",
  fournisseur: "",
  statut: "disponible",
  categorie_id: "",
  chambre_id: "",
  emplacement_id: "",
  prix_achat: "",
  notes: "",
  document: null,
});

const createEmptyEmplacementForm = () => ({
  id: null,
  nom: "",
  type: "",
  description: "",
});

const getEquipmentStatusLabel = (status) => {
  if (status === "disponible") return "En service";
  if (status === "en_maintenance") return "En maintenance";
  return "Hors service";
};

const getEquipmentLocationLabel = (equipement) => {
  if (equipement?.chambre?.num_chambre) {
    return `Chambre ${equipement.chambre.num_chambre}`;
  }

  return (
    equipement?.emplacement?.nom ||
    equipement?.localisation ||
    "Non affecté"
  );
};

const getWarrantyDisplay = (dateFinGarantie) => {
  if (!dateFinGarantie) {
    return {
      label: "Non renseignée",
      className: "is-neutral",
      title: "Date de fin de garantie non renseignée",
    };
  }

  const dateValue = String(dateFinGarantie).split("T")[0];
  const [year, month, day] = dateValue.split("-").map(Number);
  const warrantyEnd = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(warrantyEnd.getTime())) {
    return {
      label: "Non renseignée",
      className: "is-neutral",
      title: "Date de fin de garantie invalide",
    };
  }

  const remainingDays = Math.ceil(
    (warrantyEnd.getTime() - today.getTime()) / 86400000
  );
  const title = `Fin de garantie : ${warrantyEnd.toLocaleDateString("fr-FR")}`;

  if (remainingDays < 0) {
    return { label: "Expirée", className: "is-danger", title };
  }

  if (remainingDays <= 30) {
    return {
      label: `Expire dans ${remainingDays} j`,
      className: "is-warning",
      title,
    };
  }

  return { label: "Sous garantie", className: "is-success", title };
};

const EQUIPMENT_EXPORT_COLUMNS = [
  { key: "name", label: "Nom" },
  { key: "serial", label: "N° Série" },
  { key: "brandModel", label: "Marque / Modèle" },
  { key: "category", label: "Catégorie" },
  { key: "location", label: "Localisation" },
  { key: "status", label: "Statut" },
  { key: "acquisitionDate", label: "Date acquisition" },
  { key: "warrantyEnd", label: "Fin garantie" },
  { key: "supplier", label: "Fournisseur" },
  { key: "purchasePrice", label: "Prix d'achat" },
];

const GestionEquipements = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const STORAGE_URL =
    import.meta.env.VITE_API_URL_BASE_IMAGE ||
    `${(API_URL || "").replace(/\/api\/?$/, "")}/storage`;

  const getEquipmentRequestConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  };

  const getDocumentUrl = (path) => {
    if (!path) return "";

    const documentPath = String(path);
    if (/^(https?:|blob:|data:)/i.test(documentPath)) {
      return documentPath;
    }

    const cleanPath = documentPath
      .replace(/^\/+/, "")
      .replace(/^storage\//, "");

    const cleanStorageUrl = String(
  STORAGE_URL || ""
).replace(/\/+$/, "");

return `${cleanStorageUrl}/${cleanPath}`;
  };

  const formatDateForInput = (value) =>
    value ? String(value).split("T")[0] : "";
  const [equipements, setEquipements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [emplacements, setEmplacements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  
  // Form states
  const [formData, setFormData] = useState(createEmptyEquipmentForm);
  const [locationType, setLocationType] = useState("");
  
  const [errors, setErrors] = useState({});
  const [editingEquipement, setEditingEquipement] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Selection
  const [selectedItems, setSelectedItems] = useState([]);
  
  // UI states
  const [formContainerStyle, setFormContainerStyle] = useState({ right: "-100%" });
  const [showEmplacementModal, setShowEmplacementModal] = useState(false);
  const [emplacementForm, setEmplacementForm] = useState(
    createEmptyEmplacementForm
  );
  const [emplacementErrors, setEmplacementErrors] = useState({});
  
  const { dynamicStyles } = useOpen();

  // Fetch data
  const fetchEquipements = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await axios.get(
        `${API_URL}/equipements`,
        getEquipmentRequestConfig()
      );

      if (response.data && response.data.equipements) {
        setEquipements(response.data.equipements.data || []);
        setCategories(response.data.categories || []);
        setChambres(response.data.chambres || []);
        setEmplacements(response.data.emplacements || []);
        setStats(response.data.stats || {});
      } else {
        console.error("Format de réponse inattendu:", response.data);
        setLoadError("Format de réponse inattendu de l'API.");
      }
    } catch (error) {
      console.error("Erreur détaillée:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      let errorMessage = "Impossible de charger les équipements";
      if (error.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setLoadError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipements();
  }, []);

  // Form handlers
const handleChange = (e) => {
  const {
    name,
    value,
    type,
    files,
  } = e.target;

  const nextValue =
    type === "file"
      ? files?.[0] || null
      : value;

  const nextFormData = {
    ...formData,
    [name]: nextValue,
  };

  if (name === "chambre_id") {
    nextFormData.emplacement_id = "";
  } else if (name === "emplacement_id") {
    nextFormData.chambre_id = "";
  }

  setFormData(nextFormData);

  setErrors((currentErrors) => {
    const nextErrors = {
      ...currentErrors,
    };

    delete nextErrors[name];

    if (name === "chambre_id" || name === "emplacement_id") {
      delete nextErrors.location_type;
      delete nextErrors.chambre_id;
      delete nextErrors.emplacement_id;
    }

    if (
      name === "date_acquisition" ||
      name === "date_fin_garantie"
    ) {
      if (
        nextFormData.date_acquisition &&
        nextFormData.date_fin_garantie &&
        nextFormData.date_fin_garantie <
          nextFormData.date_acquisition
      ) {
        nextErrors.date_fin_garantie =
          "La date de fin de garantie doit être postérieure ou égale à la date d'acquisition.";
      } else {
        delete nextErrors.date_fin_garantie;
      }
    }

    return nextErrors;
  });
};

  const handleLocationTypeChange = (event) => {
    setLocationType(event.target.value);
    setFormData((currentFormData) => ({
      ...currentFormData,
      chambre_id: "",
      emplacement_id: "",
    }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.location_type;
      delete nextErrors.chambre_id;
      delete nextErrors.emplacement_id;
      return nextErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire.";
    if (!formData.numero_serie.trim()) {
      newErrors.numero_serie = "Le numéro de série est obligatoire.";
    }
    if (!formData.modele.trim()) newErrors.modele = "Le modèle est obligatoire.";
    if (!formData.marque.trim()) newErrors.marque = "La marque est obligatoire.";
    if (!formData.date_acquisition) {
      newErrors.date_acquisition = "La date d'acquisition est obligatoire.";
    }
    if (!locationType) {
      newErrors.location_type = "Le type de localisation est obligatoire.";
    } else if (locationType === "chambre" && !formData.chambre_id) {
      newErrors.chambre_id = "La chambre est obligatoire.";
    } else if (locationType === "emplacement" && !formData.emplacement_id) {
      newErrors.emplacement_id = "L'emplacement est obligatoire.";
    }
    if (!formData.categorie_id) {
      newErrors.categorie_id = "La catégorie est obligatoire.";
    }
    if (
      formData.date_acquisition &&
      formData.date_fin_garantie &&
      formData.date_fin_garantie < formData.date_acquisition
    ) {
      newErrors.date_fin_garantie =
        "La date de fin de garantie doit être postérieure ou égale à la date d'acquisition.";
    }
    if (
      formData.prix_achat !== "" &&
      (Number.isNaN(Number(formData.prix_achat)) || Number(formData.prix_achat) < 0)
    ) {
      newErrors.prix_achat =
        "Le prix d'achat doit être un nombre positif ou nul.";
    }
    
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
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "document") {
        if (value instanceof File) {
          formDataToSend.append(key, value);
        }
        return;
      }

      if (value !== null && value !== undefined) {
        formDataToSend.append(key, value);
      }
    });

    try {
      if (editingEquipement) {
        formDataToSend.append('_method', 'PUT');
        await axios.post(
          `${API_URL}/equipements/${editingEquipement.id}`,
          formDataToSend,
          getEquipmentRequestConfig()
        );
      } else {
        await axios.post(
          `${API_URL}/equipements`,
          formDataToSend,
          getEquipmentRequestConfig()
        );
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

      if (error.response?.status === 422 && error.response?.data?.errors) {
        const backendErrors = Object.fromEntries(
          Object.entries(error.response.data.errors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages[0] : String(messages),
          ])
        );
        const firstError = Object.values(backendErrors)[0];

        setErrors(backendErrors);
        setHasSubmitted(true);
        Swal.fire({
          icon: "error",
          title: "Erreur de validation",
          text: firstError || "Veuillez vérifier les informations saisies.",
        });
        return;
      }

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
      nom: equipement.nom ?? "",
      numero_serie: equipement.numero_serie ?? "",
      modele: equipement.modele ?? "",
      marque: equipement.marque ?? "",
      date_acquisition: formatDateForInput(equipement.date_acquisition),
      date_fin_garantie: formatDateForInput(equipement.date_fin_garantie),
      fournisseur: equipement.fournisseur ?? "",
      statut: equipement.statut,
      categorie_id: equipement.categorie_id ?? "",
      chambre_id: equipement.chambre_id ?? "",
      emplacement_id: equipement.emplacement_id ?? "",
      prix_achat: equipement.prix_achat ?? "",
      notes: equipement.notes ?? "",
      document: null
    });
    setLocationType(
      equipement.chambre_id
        ? "chambre"
        : equipement.emplacement_id
        ? "emplacement"
        : ""
    );
    setErrors({});
    setHasSubmitted(false);
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
        axios.delete(
          `${API_URL}/equipements/${equipement}`,
          getEquipmentRequestConfig()
        )
          .then(() => {
            fetchEquipements();
            setSelectedItems((currentItems) =>
              currentItems.filter((id) => id !== equipement)
            );
            Swal.fire("Supprimé!", "L'équipement a été supprimé.", "success");
          })
          .catch((error) => {
            console.error("Erreur de suppression:", error);
            Swal.fire("Erreur!", "La suppression a échoué: " + (error.response?.data?.message || error.message), "error");
          });
      }
    });
  };

const handleDeleteSelected = async () => {
  if (selectedItems.length === 0) {
    return;
  }

  const result = await Swal.fire({
    title: "Confirmer la suppression",
    text: `Êtes-vous sûr de vouloir supprimer ${selectedItems.length} équipement(s) ?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Oui, supprimer",
    cancelButtonText: "Annuler",
  });

  if (!result.isConfirmed) {
    return;
  }

  const idsToDelete = [...selectedItems];

  const results = await Promise.allSettled(
    idsToDelete.map((id) =>
      axios.delete(
        `${API_URL}/equipements/${id}`,
        getEquipmentRequestConfig()
      )
    )
  );

  const deletedIds = idsToDelete.filter(
    (_, index) =>
      results[index].status === "fulfilled"
  );

  const failedCount =
    results.length - deletedIds.length;

  await fetchEquipements();

  setSelectedItems((currentItems) =>
    currentItems.filter(
      (id) => !deletedIds.includes(id)
    )
  );

  if (failedCount > 0) {
    Swal.fire({
      icon: "warning",
      title: "Suppression partielle",
      text: `${deletedIds.length} équipement(s) supprimé(s), ${failedCount} échec(s).`,
    });

    return;
  }

  Swal.fire(
    "Supprimé!",
    "Les équipements ont été supprimés.",
    "success"
  );
};
  const closeForm = () => {
    setFormContainerStyle({ right: "-100%" });
    setEditingEquipement(null);
    setFormData(createEmptyEquipmentForm());
    setLocationType("");
    setErrors({});
    setHasSubmitted(false);
  };

const handleShowForm = () => {
  setEditingEquipement(null);
  setFormData(createEmptyEquipmentForm());
  setLocationType("");
  setErrors({});
  setHasSubmitted(false);
  setFormContainerStyle({ right: "0" });
};
  // Selection handlers
  const handleCheckboxChange = (id) => {
    setSelectedItems((currentItems) =>
      currentItems.includes(id)
        ? currentItems.filter((item) => item !== id)
        : [...currentItems, id]
    );
  };

  const handleStatusFilterChange = (event) => {
    setSelectedStatus(event.target.value || null);
    resetPage();
  };

  const handleCategoryFilterChange = (event) => {
    setSelectedCategory(event.target.value || null);
    resetPage();
  };

  const openEmplacementModal = () => {
    setEmplacementForm(createEmptyEmplacementForm());
    setEmplacementErrors({});
    setShowEmplacementModal(true);
  };

  const closeEmplacementModal = () => {
    setShowEmplacementModal(false);
    setEmplacementForm(createEmptyEmplacementForm());
    setEmplacementErrors({});
  };

  const handleEmplacementFormChange = (event) => {
    const { name, value } = event.target;
    setEmplacementForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setEmplacementErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleEditEmplacement = (emplacement) => {
    setEmplacementForm({
      id: emplacement.id,
      nom: emplacement.nom ?? "",
      type: emplacement.type ?? "",
      description: emplacement.description ?? "",
    });
    setEmplacementErrors({});
  };

  const handleEmplacementSubmit = async (event) => {
    event.preventDefault();

    if (!emplacementForm.nom.trim()) {
      setEmplacementErrors({ nom: "Le nom est obligatoire." });
      return;
    }

    const payload = {
      nom: emplacementForm.nom,
      type: emplacementForm.type || null,
      description: emplacementForm.description || null,
    };

    try {
      const response = emplacementForm.id
        ? await axios.put(
            `${API_URL}/emplacements/${emplacementForm.id}`,
            payload,
            getEquipmentRequestConfig()
          )
        : await axios.post(
            `${API_URL}/emplacements`,
            payload,
            getEquipmentRequestConfig()
          );

      await fetchEquipements();

      if (!emplacementForm.id && response.data?.emplacement?.id) {
        setLocationType("emplacement");
        setFormData((currentFormData) => ({
          ...currentFormData,
          chambre_id: "",
          emplacement_id: response.data.emplacement.id,
        }));
      }

      setEmplacementForm(createEmptyEmplacementForm());
      setEmplacementErrors({});
      Swal.fire({
        icon: "success",
        title: "Succès",
        text: `Emplacement ${emplacementForm.id ? "modifié" : "ajouté"} avec succès.`,
      });
    } catch (error) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const backendErrors = Object.fromEntries(
          Object.entries(error.response.data.errors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages[0] : String(messages),
          ])
        );
        setEmplacementErrors(backendErrors);
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text:
          error.response?.data?.message ||
          "Impossible d'enregistrer l'emplacement.",
      });
    }
  };

  const handleDeleteEmplacement = async (emplacement) => {
    const result = await Swal.fire({
      title: "Confirmer la suppression",
      text: `Supprimer l'emplacement « ${emplacement.nom} » ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(
        `${API_URL}/emplacements/${emplacement.id}`,
        getEquipmentRequestConfig()
      );
      await fetchEquipements();

      if (String(formData.emplacement_id) === String(emplacement.id)) {
        setFormData((currentFormData) => ({
          ...currentFormData,
          emplacement_id: "",
        }));
      }

      if (emplacementForm.id === emplacement.id) {
        setEmplacementForm(createEmptyEmplacementForm());
      }

      Swal.fire("Supprimé!", "L'emplacement a été supprimé.", "success");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: error.response?.status === 409 ? "Suppression impossible" : "Erreur",
        text:
          error.response?.data?.message ||
          "Impossible de supprimer l'emplacement.",
      });
    }
  };

  const filterEquipements = useCallback(
    (rows, currentSearchTerm) => {
      const normalizedSearch = normalizeSearchValue(currentSearchTerm);

      return rows.filter((equipement) => {
        const matchesSearch = [
          equipement.nom,
          equipement.numero_serie,
          equipement.marque,
          equipement.modele,
          equipement.categorie?.nom,
          getEquipmentLocationLabel(equipement),
          getEquipmentStatusLabel(equipement.statut),
          equipement.fournisseur,
        ].some((value) =>
          normalizeSearchValue(value).includes(normalizedSearch)
        );
        const matchesCategory = selectedCategory
          ? String(equipement.categorie_id) === String(selectedCategory)
          : true;
        const matchesStatus = selectedStatus
          ? String(equipement.statut) === String(selectedStatus)
          : true;

        return matchesSearch && matchesCategory && matchesStatus;
      });
    },
    [selectedCategory, selectedStatus]
  );

  const {
    searchTerm,
    page,
    rowsPerPage,
    filteredRows: filteredEquipements,
    visibleRows: visibleEquipements,
    totalRows,
    setSearchTerm,
    setPage,
    setRowsPerPage,
    resetPage,
  } = useListControls({
    allRows: equipements,
    filterRows: filterEquipements,
    storageKey: "rowsPerPageEquipements",
  });

  const filtersActive = Boolean(
    searchTerm || selectedCategory || selectedStatus
  );
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedStatus(null);
    resetPage();
  }, [resetPage, setSearchTerm]);

  const exportRows = useMemo(
    () =>
      filteredEquipements.map((equipement) => ({
        name: equipement.nom || "",
        serial: equipement.numero_serie || "",
        brandModel: `${equipement.marque || ""} — ${equipement.modele || ""}`,
        category: equipement.categorie?.nom || "",
        location: getEquipmentLocationLabel(equipement),
        status: getEquipmentStatusLabel(equipement.statut),
        acquisitionDate: formatFrenchDate(equipement.date_acquisition),
        warrantyEnd: formatFrenchDate(equipement.date_fin_garantie),
        supplier: equipement.fournisseur || "",
        purchasePrice: formatFrenchNumber(equipement.prix_achat, "DH"),
      })),
    [filteredEquipements]
  );

  const exportToExcel = () =>
    exportRowsToExcel({
      rows: exportRows,
      columns: EQUIPMENT_EXPORT_COLUMNS,
      sheetName: "Équipements",
      filename: "equipements.xlsx",
    });
  const exportToPDF = () =>
    exportRowsToPdf({
      rows: exportRows,
      columns: EQUIPMENT_EXPORT_COLUMNS,
      title: "Gestion des Équipements",
      filename: "equipements.pdf",
      orientation: "landscape",
    });
  const printTable = () =>
    printRows({
      rows: exportRows,
      columns: EQUIPMENT_EXPORT_COLUMNS,
      title: "Gestion des Équipements",
      orientation: "landscape",
    });

  const visibleEquipmentIds = visibleEquipements.map(
    (equipement) => equipement.id
  );
  const areAllVisibleEquipmentsSelected =
    visibleEquipmentIds.length > 0 &&
    visibleEquipmentIds.every((id) => selectedItems.includes(id));

  const handleSelectAllChange = () => {
    setSelectedItems((currentItems) => {
      if (areAllVisibleEquipmentsSelected) {
        return currentItems.filter(
          (id) => !visibleEquipmentIds.includes(id)
        );
      }

      return [...new Set([...currentItems, ...visibleEquipmentIds])];
    });
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles}}>
        <Box component="main" className="app-page equipements-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>

          <SearchWithExport
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            exportToExcel={exportToExcel}
            exportToPDF={exportToPDF}
            printTable={printTable}
            Title="Gestion des Équipements"
            resultCount={totalRows}
            loading={loading}
            exportsDisabled={loading || totalRows === 0}
          />

          

          <AppStats
            loading={loading}
            items={[
              { key: "total", title: "Total Équipements", value: stats.total ?? 0, icon: faTools, variant: "primary" },
              { key: "service", title: "En service", value: stats.disponible ?? 0, icon: faCheckCircle, variant: "success" },
              { key: "maintenance", title: "En maintenance", value: stats.en_maintenance ?? 0, icon: faWrench, variant: "warning" },
              { key: "hors-service", title: "Hors service", value: stats.hors_service ?? 0, icon: faTimesCircle, variant: "danger" },
            ]}
          />

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
      onChange={handleStatusFilterChange}
      className="app-filter-select"
    >
      <option value="">Tous les statuts</option>
      <option value="disponible">En service</option>
      <option value="en_maintenance">En maintenance</option>
      <option value="hors_service">Hors service</option>
    </Form.Select>

    <Form.Select
      aria-label="Filtrer par catégorie"
      value={selectedCategory || ""}
      onChange={handleCategoryFilterChange}
      className="app-filter-select"
    >
      <option value="">Toutes les catégories</option>
      {categories.map((categorie) => (
        <option key={categorie.id} value={categorie.id}>
          {categorie.nom}
        </option>
      ))}
    </Form.Select>

    <ListFilterReset active={filtersActive} onReset={resetFilters} />
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
  <Form onSubmit={handleSubmit} noValidate>
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
            {errors.nom}
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
            {errors.numero_serie}
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
            {errors.modele}
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
            {errors.marque}
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
            {errors.categorie_id}
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
          <option value="disponible">En service</option>
          <option value="en_maintenance">En maintenance</option>
          <option value="hors_service">Hors service</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Type de localisation *</Form.Label>
        <Form.Select
          value={locationType}
          onChange={handleLocationTypeChange}
          isInvalid={hasSubmitted && Boolean(errors.location_type)}
        >
          <option value="">Sélectionner un type</option>
          <option value="chambre">Chambre</option>
          <option value="emplacement">Espace / emplacement</option>
        </Form.Select>
        {hasSubmitted && errors.location_type && (
          <Form.Control.Feedback type="invalid">
            {errors.location_type}
          </Form.Control.Feedback>
        )}
      </Form.Group>

      {locationType === "chambre" && (
        <Form.Group className="col-md-6">
          <Form.Label>Chambre *</Form.Label>
          <Form.Select
            name="chambre_id"
            value={formData.chambre_id}
            onChange={handleChange}
            isInvalid={hasSubmitted && Boolean(errors.chambre_id)}
          >
            <option value="">Sélectionner une chambre</option>
            {chambres.map((chambre) => (
              <option key={chambre.id} value={chambre.id}>
                Chambre {chambre.num_chambre}
              </option>
            ))}
          </Form.Select>
          {hasSubmitted && errors.chambre_id && (
            <Form.Control.Feedback type="invalid">
              {errors.chambre_id}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      )}

      {locationType === "emplacement" && (
        <Form.Group className="col-md-6">
          <Form.Label>Emplacement *</Form.Label>
          <Form.Select
            name="emplacement_id"
            value={formData.emplacement_id}
            onChange={handleChange}
            isInvalid={hasSubmitted && Boolean(errors.emplacement_id)}
          >
            <option value="">Sélectionner un emplacement</option>
            {emplacements.map((emplacement) => (
              <option key={emplacement.id} value={emplacement.id}>
                {emplacement.nom}
              </option>
            ))}
          </Form.Select>
          {hasSubmitted && errors.emplacement_id && (
            <Form.Control.Feedback type="invalid">
              {errors.emplacement_id}
            </Form.Control.Feedback>
          )}
          <Button
            type="button"
            className="app-secondary-button mt-2"
            onClick={openEmplacementModal}
          >
            Gérer les emplacements
          </Button>
        </Form.Group>
      )}

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
            {errors.date_acquisition}
          </Form.Control.Feedback>
        )}
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Date fin garantie</Form.Label>
        <Form.Control
          type="date"
          name="date_fin_garantie"
          value={formData.date_fin_garantie}
          min={formData.date_acquisition || undefined}
          isInvalid={hasSubmitted && Boolean(errors.date_fin_garantie)}
          onChange={handleChange}
        />
        {hasSubmitted && errors.date_fin_garantie && (
          <Form.Control.Feedback type="invalid">
            {errors.date_fin_garantie}
          </Form.Control.Feedback>
        )}
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
          isInvalid={hasSubmitted && Boolean(errors.prix_achat)}
          min="0"
          step="0.01"
        />
        {hasSubmitted && errors.prix_achat && (
          <Form.Control.Feedback type="invalid">
            {errors.prix_achat}
          </Form.Control.Feedback>
        )}
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Document</Form.Label>
        <Form.Control
          type="file"
          name="document"
          onChange={handleChange}
          accept=".pdf,.jpg,.jpeg,.png"
          isInvalid={hasSubmitted && Boolean(errors.document)}
        />
        {editingEquipement?.document_path && (
          <div className="small mt-1">
            <a
              href={getDocumentUrl(editingEquipement.document_path)}
              target="_blank"
              rel="noreferrer"
            >
              Document actuel
            </a>
          </div>
        )}
        {hasSubmitted && errors.document && (
          <Form.Control.Feedback type="invalid">
            {errors.document}
          </Form.Control.Feedback>
        )}
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

<Modal
  show={showEmplacementModal}
  onHide={closeEmplacementModal}
  size="lg"
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Gérer les emplacements</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form onSubmit={handleEmplacementSubmit} noValidate>
      <div className="row g-3">
        <Form.Group className="col-md-6">
          <Form.Label>Nom *</Form.Label>
          <Form.Control
            name="nom"
            value={emplacementForm.nom}
            onChange={handleEmplacementFormChange}
            isInvalid={Boolean(emplacementErrors.nom)}
          />
          {emplacementErrors.nom && (
            <Form.Control.Feedback type="invalid">
              {emplacementErrors.nom}
            </Form.Control.Feedback>
          )}
        </Form.Group>

        <Form.Group className="col-md-6">
          <Form.Label>Type</Form.Label>
          <Form.Control
            name="type"
            value={emplacementForm.type}
            onChange={handleEmplacementFormChange}
            isInvalid={Boolean(emplacementErrors.type)}
          />
          {emplacementErrors.type && (
            <Form.Control.Feedback type="invalid">
              {emplacementErrors.type}
            </Form.Control.Feedback>
          )}
        </Form.Group>

        <Form.Group className="col-12">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="description"
            value={emplacementForm.description}
            onChange={handleEmplacementFormChange}
            isInvalid={Boolean(emplacementErrors.description)}
          />
          {emplacementErrors.description && (
            <Form.Control.Feedback type="invalid">
              {emplacementErrors.description}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      </div>

      <div className="app-form-actions">
        <Button type="submit" className="app-primary-button">
          {emplacementForm.id ? "Modifier" : "Ajouter"}
        </Button>
        {emplacementForm.id && (
          <Button
            type="button"
            className="app-secondary-button"
            onClick={() => {
              setEmplacementForm(createEmptyEmplacementForm());
              setEmplacementErrors({});
            }}
          >
            Annuler la modification
          </Button>
        )}
      </div>
    </Form>

    <div className="app-table-wrapper mt-3">
      <table className="table table-bordered app-table mb-0">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {emplacements.length > 0 ? (
            emplacements.map((emplacement) => (
              <tr key={emplacement.id}>
                <td>{emplacement.nom}</td>
                <td>{emplacement.type || "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <FontAwesomeIcon
                    icon={faEdit}
                    className="app-table-action is-edit"
                    title="Modifier"
                    onClick={() => handleEditEmplacement(emplacement)}
                  />
                  <FontAwesomeIcon
                    icon={faTrash}
                    className="app-table-action is-delete"
                    title="Supprimer"
                    onClick={() => handleDeleteEmplacement(emplacement)}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>Aucun emplacement disponible</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button
      type="button"
      className="app-secondary-button"
      onClick={closeEmplacementModal}
    >
      Fermer
    </Button>
  </Modal.Footer>
</Modal>
          {/* Table Container */}
{/* Table Container */}
<ListState
  loading={loading}
  error={loadError}
  allRowsCount={equipements.length}
  filteredRowsCount={totalRows}
  emptyDataMessage="Aucun équipement enregistré."
  onRetry={fetchEquipements}
  onResetFilters={resetFilters}
/>
{!loading && !loadError && totalRows > 0 && (
<div className="app-section">
  <div
    id="tableContainer"
    className="app-table-wrapper"
  >
    <div className="app-table-scroll">
      <table
        id="equipementsTable"
        className="table table-bordered app-table mb-0"
      >
        <thead className="text-center">
          <tr>
            <th>
              <input
                type="checkbox"
                checked={areAllVisibleEquipmentsSelected}
                disabled={visibleEquipmentIds.length === 0}
                aria-label="Sélectionner les équipements visibles"
                onChange={handleSelectAllChange}
              />
            </th>

            <th>Nom</th>
            <th>N° Série</th>
            <th>Marque / Modèle</th>
            <th>Localisation</th>
            <th>Catégorie</th>
            <th>Statut</th>
            <th>Garantie</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody className="text-center">
          {visibleEquipements.length > 0 ? (
            visibleEquipements.map((equipement) => {
              const warranty = getWarrantyDisplay(
                equipement.date_fin_garantie
              );

              return (
                <tr key={equipement.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(
                      equipement.id
                    )}
                    onChange={() =>
                      handleCheckboxChange(
                        equipement.id
                      )
                    }
                  />
                </td>

                <td>
                  {highlightText(
                    equipement.nom,
                    searchTerm
                  )}
                </td>

                <td>
                  {highlightText(
                    equipement.numero_serie,
                    searchTerm
                  )}
                </td>

                <td>
                  {highlightText(
                    equipement.marque,
                    searchTerm
                  )}
                  {" — "}
                  {highlightText(equipement.modele, searchTerm)}
                </td>

                <td>
                  {highlightText(
                    getEquipmentLocationLabel(equipement),
                    searchTerm
                  )}
                </td>

                <td>
                  {equipement.categorie?.nom || ""}
                </td>

                <td>
                  <span
                    className={`app-status-badge ${
                      equipement.statut ===
                      "disponible"
                        ? "is-success"
                        : equipement.statut ===
                          "en_maintenance"
                        ? "is-warning"
                        : "is-danger"
                    }`}
                  >
                    {getEquipmentStatusLabel(equipement.statut)}
                  </span>
                </td>

                <td>
                  <span
                    className={`app-status-badge ${warranty.className}`}
                    title={warranty.title}
                  >
                    {warranty.label}
                  </span>
                </td>

                <td style={{ whiteSpace: "nowrap" }}>
                  <div className="d-flex align-items-center justify-content-center">
                    <FontAwesomeIcon
                      onClick={() =>
                        handleEdit(equipement)
                      }
                      icon={faEdit}
                      className="app-table-action is-edit"
                    />

                    <FontAwesomeIcon
                      onClick={() =>
                        handleDelete(equipement.id)
                      }
                      icon={faTrash}
                      className="app-table-action is-delete"
                    />
                  </div>
                </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9}>
                Aucun équipement disponible
              </td>
            </tr>
          )}
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

      <ListPagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={totalRows}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </div>
  </div>
</div>
)}
    </Box>
  </Box>
</ThemeProvider>
  );
} 
export default GestionEquipements;
