import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

import "../style.css";

import Box from "@mui/material/Box";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faCheckCircle,
  faPen,
  faPlus,
  faTriangleExclamation,
  faTrash,
  faToggleOff,
  faToggleOn,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";

import { useOpen } from "../Acceuil/OpenProvider";
import SearchWithExport from "../components/SearchWithExport";
import AppStats from "../components/AppStats";
import ContextFilterChip from "../components/ContextFilterChip";
import RequiredLabel from "../components/RequiredLabel";
import ListFilterReset from "../components/ListFilterReset";
import ListPagination from "../components/ListPagination";
import ListState from "../components/ListState";
import useListControls from "../components/useListControls";
import apiClient from "../utils/apiClient";
import { readPositiveIntegerParam, removeSearchParam } from "../utils/contextNavigationUtils";
import {
  exportToExcel as exportRowsToExcel,
  exportToPdf as exportRowsToPdf,
  printRows,
} from "../utils/listExportUtils";
import {
  getDateSearchVariants,
  matchesNormalizedSearch,
} from "../utils/textUtils";
import ChambreTable, {
  formatFrenchDate,
  getCleanerLabel,
  getCurrentStayLabel,
  getEmployeeFullName,
  getMaintenanceTypeLabel,
  getOccupationLabel,
  getRoomOccupation,
  getRoomMaintenanceType,
  maintenanceToOuiNon,
  toInputDate,
} from "../components/etatChambreTable";

const ROOM_STATE_EXPORT_COLUMNS = [
  { key: "roomNumber", label: "Numéro de chambre" },
  { key: "cleanliness", label: "Propreté" },
  { key: "occupation", label: "Occupation" },
  { key: "currentReservation", label: "Réservation actuelle" },
  { key: "currentClient", label: "Client actuel" },
  { key: "currentStay", label: "Séjour actuel" },
  { key: "lastCleaning", label: "Dernier nettoyage" },
  { key: "cleaner", label: "Nettoyée par" },
  { key: "maintenance", label: "Maintenance" },
  { key: "comment", label: "Commentaire" },
];

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/+$/, "");

const createEmptyForm = () => ({
  num_chambre: "",
  status: "non nettoyée",
  date_nettoyage: "",
  nettoyee_par_id: "",
  maintenance: "non",
  maintenance_type_id: "",
  date_debut_maintenance: "",
  date_fin_maintenance: "",
  commentaire: "",
});

const createEmptyMaintenanceTypeForm = () => ({
  id: null,
  code: "",
  types_maintenance: "",
  description: "",
});

const createEmptyEmployeeForm = () => ({
  id: null,
  matricule: "",
  nom: "",
  prenom: "",
  fonction: "nettoyage",
  telephone: "",
  actif: true,
});

const isEligibleCleaner = (employee) =>
  employee?.actif === true &&
  ["nettoyage", "supervision"].includes(employee.fonction);

const getEmployeeFunctionLabel = (functionName) =>
  ({
    nettoyage: "Nettoyage",
    maintenance: "Maintenance",
    supervision: "Supervision",
  }[functionName] || functionName || "-");

const todayForInput = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
};

const firstValidationMessages = (errors = {}) =>
  Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : String(messages),
    ])
  );

const requestJson = async (url, options = {}) => {
  try {
    const response = await apiClient.request({
      url,
      method: options.method || "GET",
      headers: options.headers,
      data: options.body ? JSON.parse(options.body) : undefined,
    });
    return response.data;
  } catch (requestError) {
    const data = requestError.response?.data || {};
    const error = new Error(data.message || "Une erreur est survenue.");
    error.status = requestError.response?.status;
    error.data = data;
    throw error;
  }
};

const EtatChambre = () => {
  const { dynamicStyles } = useOpen();
  const [searchParams, setSearchParams] = useSearchParams();
  const roomContext = readPositiveIntegerParam(searchParams, "room_id");
  const contextRoomId = roomContext.value;
  const [chambres, setChambres] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [actionError, setActionError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [originalRoomNumber, setOriginalRoomNumber] = useState("");
  const [formData, setFormData] = useState(createEmptyForm);

  const [showQuickCleanModal, setShowQuickCleanModal] = useState(false);
  const [quickCleanRoom, setQuickCleanRoom] = useState(null);
  const [quickCleanData, setQuickCleanData] = useState({
    nettoyee_par_id: "",
    date_nettoyage: todayForInput(),
  });
  const [quickCleanErrors, setQuickCleanErrors] = useState({});

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeModalSource, setEmployeeModalSource] = useState("edit");
  const [managedEmployees, setManagedEmployees] = useState([]);
  const [employeeForm, setEmployeeForm] = useState(createEmptyEmployeeForm);
  const [employeeErrors, setEmployeeErrors] = useState({});
  const [employeeActionError, setEmployeeActionError] = useState("");
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const [showMaintenanceTypeModal, setShowMaintenanceTypeModal] =
    useState(false);
  const [maintenanceTypeForm, setMaintenanceTypeForm] = useState(
    createEmptyMaintenanceTypeForm
  );
  const [maintenanceTypeErrors, setMaintenanceTypeErrors] = useState({});
  const [maintenanceTypeActionError, setMaintenanceTypeActionError] =
    useState("");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMaintenance, setSelectedMaintenance] = useState("");
  const [selectedOccupation, setSelectedOccupation] = useState("");
  const [dateNettoyage, setDateNettoyage] = useState("");
  const [dateDebutMaintenance, setDateDebutMaintenance] = useState("");
  const [dateFinMaintenance, setDateFinMaintenance] = useState("");

  const loadRoomStates = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const data = await requestJson(`${API_URL}/etat-chambre`);

      setChambres(Array.isArray(data.etat_chambres) ? data.etat_chambres : []);
      setMaintenanceTypes(
        Array.isArray(data.maintenance_types) ? data.maintenance_types : []
      );
      setEmployees(Array.isArray(data.employes) ? data.employes : []);
    } catch (error) {
      setLoadError(
        error.message || "Erreur lors du chargement des états de chambre."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoomStates();
  }, [loadRoomStates]);

  const replaceRoomState = (updatedState, roomNumber) => {
    setChambres((currentStates) =>
      currentStates.map((state) =>
        String(state.num_chambre) === String(roomNumber) ? updatedState : state
      )
    );
  };

  const handleEditClick = (chambre) => {
    setOriginalRoomNumber(String(chambre.num_chambre || ""));
    setFormData({
      num_chambre: String(chambre.num_chambre || ""),
      status: chambre.status || "non nettoyée",
      date_nettoyage: toInputDate(chambre.date_nettoyage),
      nettoyee_par_id: chambre.nettoyee_par_id
        ? String(chambre.nettoyee_par_id)
        : "",
      maintenance: maintenanceToOuiNon(chambre.maintenance),
      maintenance_type_id: chambre.maintenance_type_id
        ? String(chambre.maintenance_type_id)
        : "",
      date_debut_maintenance: toInputDate(chambre.date_debut_maintenance),
      date_fin_maintenance: toInputDate(chambre.date_fin_maintenance),
      commentaire: chambre.commentaire || "",
    });
    setFormErrors({});
    setActionError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setOriginalRoomNumber("");
    setFormData(createEmptyForm());
    setFormErrors({});
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => {
      if (name === "maintenance" && value === "non") {
        return {
          ...currentData,
          maintenance: "non",
          maintenance_type_id: "",
          date_debut_maintenance: "",
          date_fin_maintenance: "",
        };
      }

      return { ...currentData, [name]: value };
    });
    setFormErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      if (name === "maintenance" && value === "non") {
        delete nextErrors.maintenance_type_id;
        delete nextErrors.date_debut_maintenance;
        delete nextErrors.date_fin_maintenance;
      }
      if (name === "date_debut_maintenance") {
        delete nextErrors.date_fin_maintenance;
      }
      return nextErrors;
    });
  };

  const validateEditForm = () => {
    const errors = {};

    if (!formData.status) errors.status = "Le statut est obligatoire.";
    if (formData.status === "nettoyée") {
      if (!formData.date_nettoyage) {
        errors.date_nettoyage = "La date de nettoyage est obligatoire.";
      }
      if (!formData.nettoyee_par_id) {
        errors.nettoyee_par_id = "L'employé de nettoyage est obligatoire.";
      }
    }
    if (formData.maintenance === "oui") {
      if (!formData.maintenance_type_id) {
        errors.maintenance_type_id = "Le type de maintenance est obligatoire.";
      }
      if (!formData.date_debut_maintenance) {
        errors.date_debut_maintenance = "La date de début est obligatoire.";
      }
      if (!formData.date_fin_maintenance) {
        errors.date_fin_maintenance = "La date de fin est obligatoire.";
      } else if (
        formData.date_debut_maintenance &&
        formData.date_fin_maintenance < formData.date_debut_maintenance
      ) {
        errors.date_fin_maintenance =
          "La date de fin doit être postérieure ou égale à la date de début.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionError("");
    if (!validateEditForm() || !originalRoomNumber) return;

    const isUnderMaintenance = formData.maintenance === "oui";
    const payload = {
      status: formData.status,
      date_nettoyage: formData.date_nettoyage || null,
      nettoyee_par_id: formData.nettoyee_par_id
        ? Number(formData.nettoyee_par_id)
        : null,
      maintenance: isUnderMaintenance,
      maintenance_type_id: isUnderMaintenance
        ? Number(formData.maintenance_type_id)
        : null,
      date_debut_maintenance: isUnderMaintenance
        ? formData.date_debut_maintenance
        : null,
      date_fin_maintenance: isUnderMaintenance
        ? formData.date_fin_maintenance
        : null,
      commentaire: formData.commentaire || null,
    };

    try {
      const result = await requestJson(
        `${API_URL}/etat-chambre/${encodeURIComponent(originalRoomNumber)}`,
        { method: "PUT", body: JSON.stringify(payload) }
      );
      replaceRoomState(result.etat_chambre, originalRoomNumber);
      closeForm();
    } catch (error) {
      if (error.status === 422 && error.data?.errors) {
        setFormErrors(firstValidationMessages(error.data.errors));
        return;
      }
      setActionError(error.message || "Impossible de modifier l'état de chambre.");
    }
  };

  const openQuickCleanModal = (chambre) => {
    setQuickCleanRoom(chambre);
    setQuickCleanData({
      nettoyee_par_id: "",
      date_nettoyage: todayForInput(),
    });
    setQuickCleanErrors({});
    setActionError("");
    setShowQuickCleanModal(true);
  };

  const closeQuickCleanModal = () => {
    setShowQuickCleanModal(false);
    setQuickCleanRoom(null);
    setQuickCleanErrors({});
  };

  const submitQuickClean = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!quickCleanData.nettoyee_par_id) {
      errors.nettoyee_par_id = "Sélectionnez un employé.";
    }
    if (!quickCleanData.date_nettoyage) {
      errors.date_nettoyage = "La date de nettoyage est obligatoire.";
    }
    if (Object.keys(errors).length > 0) {
      setQuickCleanErrors(errors);
      return;
    }

    try {
      const result = await requestJson(
        `${API_URL}/etat-chambre/${encodeURIComponent(
          quickCleanRoom.num_chambre
        )}`,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "nettoyée",
            date_nettoyage: quickCleanData.date_nettoyage,
            nettoyee_par_id: Number(quickCleanData.nettoyee_par_id),
          }),
        }
      );
      replaceRoomState(result.etat_chambre, quickCleanRoom.num_chambre);
      closeQuickCleanModal();
    } catch (error) {
      if (error.status === 422 && error.data?.errors) {
        setQuickCleanErrors(firstValidationMessages(error.data.errors));
        return;
      }
      setActionError(error.message || "Impossible d'enregistrer le nettoyage.");
    }
  };

  const applyEmployeeCollections = (allEmployees) => {
    const sortedEmployees = [...allEmployees].sort((left, right) =>
      getEmployeeFullName(left).localeCompare(
        getEmployeeFullName(right),
        "fr"
      )
    );
    const eligibleEmployees = sortedEmployees.filter(isEligibleCleaner);
    const eligibleIds = new Set(
      eligibleEmployees.map((employee) => String(employee.id))
    );

    setManagedEmployees(sortedEmployees);
    setEmployees(eligibleEmployees);
    setFormData((currentData) =>
      currentData.nettoyee_par_id &&
      !eligibleIds.has(String(currentData.nettoyee_par_id))
        ? { ...currentData, nettoyee_par_id: "" }
        : currentData
    );
    setQuickCleanData((currentData) =>
      currentData.nettoyee_par_id &&
      !eligibleIds.has(String(currentData.nettoyee_par_id))
        ? { ...currentData, nettoyee_par_id: "" }
        : currentData
    );
  };

  const openEmployeeManagement = async (source) => {
    setEmployeeModalSource(source);
    setEmployeeForm(createEmptyEmployeeForm());
    setEmployeeErrors({});
    setEmployeeActionError("");
    setEmployeeLoading(true);
    setShowEmployeeModal(true);

    try {
      const result = await requestJson(`${API_URL}/employes`);
      applyEmployeeCollections(
        Array.isArray(result.employes) ? result.employes : []
      );
    } catch (error) {
      setEmployeeActionError(
        error.message || "Impossible de charger les employés."
      );
    } finally {
      setEmployeeLoading(false);
    }
  };

  const closeEmployeeManagement = () => {
    setShowEmployeeModal(false);
    setEmployeeForm(createEmptyEmployeeForm());
    setEmployeeErrors({});
    setEmployeeActionError("");
  };

  const handleEmployeeChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEmployeeForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
    setEmployeeErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const editEmployee = (employee) => {
    setEmployeeForm({
      id: employee.id,
      matricule: employee.matricule || "",
      nom: employee.nom || "",
      prenom: employee.prenom || "",
      fonction: employee.fonction || "nettoyage",
      telephone: employee.telephone || "",
      actif: employee.actif === true,
    });
    setEmployeeErrors({});
    setEmployeeActionError("");
  };

  const synchronizeEmployeeRelation = (employee) => {
    setChambres((currentStates) =>
      currentStates.map((state) =>
        String(state.nettoyee_par_id) === String(employee.id)
          ? { ...state, nettoyee_par: employee }
          : state
      )
    );
  };

  const submitEmployee = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!employeeForm.matricule.trim()) {
      errors.matricule = "Le matricule est obligatoire.";
    }
    if (!employeeForm.nom.trim()) errors.nom = "Le nom est obligatoire.";
    if (!employeeForm.prenom.trim()) {
      errors.prenom = "Le prénom est obligatoire.";
    }
    if (!employeeForm.fonction) {
      errors.fonction = "La fonction est obligatoire.";
    }
    if (Object.keys(errors).length > 0) {
      setEmployeeErrors(errors);
      return;
    }

    const isEditing = Boolean(employeeForm.id);
    try {
      const result = await requestJson(
        isEditing
          ? `${API_URL}/employes/${employeeForm.id}`
          : `${API_URL}/employes`,
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({
            matricule: employeeForm.matricule.trim(),
            nom: employeeForm.nom.trim(),
            prenom: employeeForm.prenom.trim(),
            fonction: employeeForm.fonction,
            telephone: employeeForm.telephone.trim() || null,
            actif: Boolean(employeeForm.actif),
          }),
        }
      );
      const savedEmployee = result.employe;
      const nextEmployees = isEditing
        ? managedEmployees.map((employee) =>
            employee.id === savedEmployee.id ? savedEmployee : employee
          )
        : [...managedEmployees, savedEmployee];

      applyEmployeeCollections(nextEmployees);
      synchronizeEmployeeRelation(savedEmployee);

      if (!isEditing && isEligibleCleaner(savedEmployee)) {
        if (employeeModalSource === "quick-clean") {
          setQuickCleanData((currentData) => ({
            ...currentData,
            nettoyee_par_id: String(savedEmployee.id),
          }));
          setQuickCleanErrors((currentErrors) => ({
            ...currentErrors,
            nettoyee_par_id: undefined,
          }));
        } else {
          setFormData((currentData) => ({
            ...currentData,
            nettoyee_par_id: String(savedEmployee.id),
          }));
          setFormErrors((currentErrors) => ({
            ...currentErrors,
            nettoyee_par_id: undefined,
          }));
        }
      }

      setEmployeeForm(createEmptyEmployeeForm());
      setEmployeeErrors({});
      setEmployeeActionError("");
    } catch (error) {
      if (error.status === 422 && error.data?.errors) {
        setEmployeeErrors(firstValidationMessages(error.data.errors));
        return;
      }
      setEmployeeActionError(
        error.message || "Impossible d'enregistrer l'employé."
      );
    }
  };

  const toggleEmployeeActive = async (employee) => {
    try {
      const result = await requestJson(`${API_URL}/employes/${employee.id}`, {
        method: "PUT",
        body: JSON.stringify({ actif: !employee.actif }),
      });
      const nextEmployees = managedEmployees.map((currentEmployee) =>
        currentEmployee.id === result.employe.id
          ? result.employe
          : currentEmployee
      );
      applyEmployeeCollections(nextEmployees);
      synchronizeEmployeeRelation(result.employe);
      if (employeeForm.id === result.employe.id) {
        setEmployeeForm((currentForm) => ({
          ...currentForm,
          actif: result.employe.actif === true,
        }));
      }
      setEmployeeActionError("");
    } catch (error) {
      setEmployeeActionError(
        error.message || "Impossible de modifier le statut de l'employé."
      );
    }
  };

  const deleteEmployee = async (employee) => {
    if (
      !window.confirm(
        `Supprimer l'employé « ${getEmployeeFullName(employee)} » ?`
      )
    ) {
      return;
    }

    try {
      await requestJson(`${API_URL}/employes/${employee.id}`, {
        method: "DELETE",
      });
      applyEmployeeCollections(
        managedEmployees.filter(
          (currentEmployee) => currentEmployee.id !== employee.id
        )
      );
      if (employeeForm.id === employee.id) {
        setEmployeeForm(createEmptyEmployeeForm());
      }
      setEmployeeActionError("");
    } catch (error) {
      setEmployeeActionError(
        error.message || "Impossible de supprimer l'employé."
      );
    }
  };

  const openMaintenanceTypeModal = () => {
    setMaintenanceTypeForm(createEmptyMaintenanceTypeForm());
    setMaintenanceTypeErrors({});
    setMaintenanceTypeActionError("");
    setShowMaintenanceTypeModal(true);
  };

  const handleMaintenanceTypeChange = (event) => {
    const { name, value } = event.target;
    setMaintenanceTypeForm((currentForm) => ({ ...currentForm, [name]: value }));
    setMaintenanceTypeErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const editMaintenanceType = (maintenanceType) => {
    setMaintenanceTypeForm({
      id: maintenanceType.id,
      code: maintenanceType.code || "",
      types_maintenance: maintenanceType.types_maintenance || "",
      description: maintenanceType.description || "",
    });
    setMaintenanceTypeErrors({});
    setMaintenanceTypeActionError("");
  };

  const submitMaintenanceType = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!maintenanceTypeForm.code.trim()) errors.code = "Le code est obligatoire.";
    if (!maintenanceTypeForm.types_maintenance.trim()) {
      errors.types_maintenance = "Le libellé est obligatoire.";
    }
    if (Object.keys(errors).length > 0) {
      setMaintenanceTypeErrors(errors);
      return;
    }

    const isEditing = Boolean(maintenanceTypeForm.id);
    try {
      const result = await requestJson(
        isEditing
          ? `${API_URL}/maintenance-types/${maintenanceTypeForm.id}`
          : `${API_URL}/maintenance-types`,
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({
            code: maintenanceTypeForm.code.trim(),
            types_maintenance: maintenanceTypeForm.types_maintenance.trim(),
            description: maintenanceTypeForm.description.trim() || null,
          }),
        }
      );

      setMaintenanceTypes((currentTypes) => {
        const nextTypes = isEditing
          ? currentTypes.map((type) =>
              type.id === result.type.id ? result.type : type
            )
          : [...currentTypes, result.type];
        return nextTypes.sort((left, right) =>
          left.code.localeCompare(right.code, "fr")
        );
      });
      setMaintenanceTypeForm(createEmptyMaintenanceTypeForm());
      setMaintenanceTypeErrors({});
      setMaintenanceTypeActionError("");
    } catch (error) {
      if (error.status === 422 && error.data?.errors) {
        setMaintenanceTypeErrors(firstValidationMessages(error.data.errors));
        return;
      }
      setMaintenanceTypeActionError(
        error.message || "Impossible d'enregistrer le type de maintenance."
      );
    }
  };

  const deleteMaintenanceType = async (maintenanceType) => {
    if (
      !window.confirm(
        `Supprimer le type de maintenance « ${getMaintenanceTypeLabel(
          maintenanceType
        )} » ?`
      )
    ) {
      return;
    }

    try {
      await requestJson(`${API_URL}/maintenance-types/${maintenanceType.id}`, {
        method: "DELETE",
      });
      setMaintenanceTypes((currentTypes) =>
        currentTypes.filter((type) => type.id !== maintenanceType.id)
      );
      if (
        String(formData.maintenance_type_id) === String(maintenanceType.id)
      ) {
        setFormData((currentData) => ({
          ...currentData,
          maintenance_type_id: "",
        }));
      }
      if (maintenanceTypeForm.id === maintenanceType.id) {
        setMaintenanceTypeForm(createEmptyMaintenanceTypeForm());
      }
      setMaintenanceTypeActionError("");
    } catch (error) {
      setMaintenanceTypeActionError(
        error.message || "Impossible de supprimer le type de maintenance."
      );
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === "status") setSelectedStatus(value);
    if (key === "maintenance") setSelectedMaintenance(value);
    if (key === "occupation") setSelectedOccupation(value);
    if (key === "date_nettoyage") setDateNettoyage(value);
    if (key === "date_debut_maintenance") setDateDebutMaintenance(value);
    if (key === "date_fin_maintenance") setDateFinMaintenance(value);
    resetPage();
  };

  const filterRoomStates = useCallback(
    (rows, currentSearchTerm) =>
      rows.filter((chambre) => {
      const matchesRoomContext = !contextRoomId
        || String(chambre.chambre?.id ?? "") === String(contextRoomId);
      const maintenanceValue = maintenanceToOuiNon(chambre.maintenance);
      const maintenanceType = getRoomMaintenanceType(
        chambre,
        maintenanceTypes
      );
      const maintenanceTypeLabel = getMaintenanceTypeLabel(maintenanceType);
      const cleanlinessLabel =
        chambre.status === "nettoyée" ? "Nettoyée" : "Non nettoyée";
      const maintenanceLabel =
        maintenanceValue === "oui" ? "En maintenance" : "Aucune maintenance";
      const occupation = getRoomOccupation(chambre);
      const occupationLabel = getOccupationLabel(chambre);
      const currentReservation = occupation.reservation;
      const matchesSearch = matchesNormalizedSearch(currentSearchTerm, [
        chambre.num_chambre,
        chambre.status,
        cleanlinessLabel,
        getCleanerLabel(chambre),
        maintenanceLabel,
        maintenanceTypeLabel,
        occupationLabel,
        currentReservation?.numero,
        currentReservation?.client,
        getDateSearchVariants(currentReservation?.date_debut),
        getDateSearchVariants(currentReservation?.date_fin),
        getDateSearchVariants(chambre.date_nettoyage),
        getDateSearchVariants(chambre.date_debut_maintenance),
        getDateSearchVariants(chambre.date_fin_maintenance),
        chambre.commentaire,
      ]);
      const matchesStatus =
        !selectedStatus || chambre.status === selectedStatus;
      const matchesMaintenance =
        !selectedMaintenance || maintenanceValue === selectedMaintenance;
      const matchesOccupation =
        !selectedOccupation || occupation.statut === selectedOccupation;
      const matchesCleaningDate =
        !dateNettoyage || toInputDate(chambre.date_nettoyage) === dateNettoyage;
      const selectedMaintenanceStart = toInputDate(dateDebutMaintenance);
      const selectedMaintenanceEnd = toInputDate(dateFinMaintenance);
      const maintenanceStart = toInputDate(chambre.date_debut_maintenance);
      const maintenanceEnd = toInputDate(chambre.date_fin_maintenance);
      const hasMaintenanceDateFilter =
        Boolean(selectedMaintenanceStart || selectedMaintenanceEnd);
      const matchesMaintenanceRange = !hasMaintenanceDateFilter
        ? true
        : maintenanceValue === "oui" && maintenanceStart
          ? (!selectedMaintenanceEnd || maintenanceStart <= selectedMaintenanceEnd) &&
            (!selectedMaintenanceStart ||
              !maintenanceEnd ||
              maintenanceEnd >= selectedMaintenanceStart)
          : false;

      return (
        matchesRoomContext &&
        matchesSearch &&
        matchesStatus &&
        matchesMaintenance &&
        matchesOccupation &&
        matchesCleaningDate &&
        matchesMaintenanceRange
      );
    }),
    [
      dateDebutMaintenance,
      dateFinMaintenance,
      dateNettoyage,
      maintenanceTypes,
      contextRoomId,
      selectedMaintenance,
      selectedOccupation,
      selectedStatus,
    ]
  );

  const {
    searchTerm,
    page,
    rowsPerPage,
    filteredRows: filteredChambres,
    visibleRows: visibleChambres,
    totalRows,
    setSearchTerm,
    setPage,
    setRowsPerPage,
    resetPage,
  } = useListControls({
    allRows: chambres,
    filterRows: filterRoomStates,
    storageKey: "rowsPerPageEtatChambre",
  });

  useEffect(() => {
    resetPage();
  }, [contextRoomId, roomContext.raw, resetPage]);

  const contextRoomState = useMemo(
    () => chambres.find((roomState) => String(roomState.chambre?.id ?? "") === String(contextRoomId)),
    [chambres, contextRoomId]
  );
  const hasRoomContext = roomContext.raw !== null;
  const invalidRoomContext = hasRoomContext && (
    !roomContext.valid || (!loading && !loadError && !contextRoomState)
  );
  const clearRoomContext = useCallback(() => {
    setSearchParams(removeSearchParam(searchParams, "room_id"));
  }, [searchParams, setSearchParams]);

  const filtersActive = Boolean(
    searchTerm ||
      selectedStatus ||
      selectedMaintenance ||
      selectedOccupation ||
      dateNettoyage ||
      dateDebutMaintenance ||
      dateFinMaintenance
  );

  const roomStateStats = useMemo(() => [
    { key: "total", title: "Total chambres", value: chambres.length, icon: faBed, variant: "primary" },
    { key: "clean", title: "Nettoyées", value: chambres.filter((room) => room.status === "nettoyée").length, icon: faCheckCircle, variant: "success" },
    { key: "dirty", title: "Non nettoyées", value: chambres.filter((room) => room.status === "non nettoyée").length, icon: faTriangleExclamation, variant: "warning" },
    { key: "maintenance", title: "En maintenance", value: chambres.filter((room) => maintenanceToOuiNon(room.maintenance) === "oui").length, icon: faWrench, variant: "danger" },
    { key: "occupied", title: "Occupées", value: chambres.filter((room) => getRoomOccupation(room).occupee).length, icon: faBed, variant: "warning" },
    { key: "free", title: "Libres", value: chambres.filter((room) => !getRoomOccupation(room).occupee).length, icon: faCheckCircle, variant: "success" },
  ], [chambres]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedMaintenance("");
    setSelectedOccupation("");
    setDateNettoyage("");
    setDateDebutMaintenance("");
    setDateFinMaintenance("");
    resetPage();
  }, [resetPage, setSearchTerm]);

  const exportRows = useMemo(
    () =>
      filteredChambres.map((chambre) => {
        const maintenanceValue = maintenanceToOuiNon(chambre.maintenance);
        const maintenanceType = getRoomMaintenanceType(
          chambre,
          maintenanceTypes
        );
        const maintenanceDetails =
          maintenanceValue === "oui"
            ? [
                "En maintenance",
                getMaintenanceTypeLabel(maintenanceType),
                `${formatFrenchDate(chambre.date_debut_maintenance)} → ${formatFrenchDate(
                  chambre.date_fin_maintenance
                )}`,
              ]
                .filter(Boolean)
                .join(" - ")
            : "Aucune";
        const occupation = getRoomOccupation(chambre);
        const currentReservation = occupation.reservation;

        return {
          roomNumber: chambre.num_chambre || "",
          cleanliness:
            chambre.status === "nettoyée" ? "Nettoyée" : "Non nettoyée",
          occupation: getOccupationLabel(chambre),
          currentReservation: currentReservation?.numero || "—",
          currentClient: currentReservation?.client || "—",
          currentStay: currentReservation ? getCurrentStayLabel(chambre) : "—",
          lastCleaning: formatFrenchDate(chambre.date_nettoyage),
          cleaner: getCleanerLabel(chambre),
          maintenance: maintenanceDetails,
          comment: chambre.commentaire || "",
        };
      }),
    [filteredChambres, maintenanceTypes]
  );

  const exportToExcel = () =>
    exportRowsToExcel({
      rows: exportRows,
      columns: ROOM_STATE_EXPORT_COLUMNS,
      sheetName: "État des Chambres",
      filename: "etat-des-chambres.xlsx",
    });

  const exportToPDF = () =>
    exportRowsToPdf({
      rows: exportRows,
      columns: ROOM_STATE_EXPORT_COLUMNS,
      title: "État des Chambres",
      filename: "etat-des-chambres.pdf",
      orientation: "landscape",
    });

  const printTable = () =>
    printRows({
      rows: exportRows,
      columns: ROOM_STATE_EXPORT_COLUMNS,
      title: "État des Chambres",
      orientation: "landscape",
    });

  return (
    <Box sx={{ ...dynamicStyles }}>
      <Box
        component="main"
        className="app-page etat-chambre-page"
        sx={{ flexGrow: 1, p: 3, mt: 0 }}
      >
        <SearchWithExport
          Title="État des Chambres"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          printTable={printTable}
          exportToPDF={exportToPDF}
          exportToExcel={exportToExcel}
          resultCount={totalRows}
          loading={loading}
          exportsDisabled={loading || totalRows === 0}
        />

        {hasRoomContext && (
          <div className="app-context-filter-row">
            <ContextFilterChip
              label={contextRoomState ? `Chambre ${contextRoomState.num_chambre}` : "Chambre sélectionnée"}
              onClear={clearRoomContext}
              clearLabel="Effacer le filtre de chambre"
            />
          </div>
        )}
        {invalidRoomContext && (
          <Alert variant="warning" className="app-context-warning">
            La chambre demandée est introuvable. Effacez ce contexte pour revenir à la liste complète.
          </Alert>
        )}

        <AppStats items={roomStateStats} loading={loading} />

        <div className="app-controls-row justify-content-end">
          <div className="app-filter-controls etat-chambre-filter-controls">
  <div className="etat-chambre-filter-field">
    <span>Propreté</span>

    <Form.Select
      value={selectedStatus}
      onChange={(event) =>
        handleFilterChange(
          "status",
          event.target.value
        )
      }
      className="app-filter-select"
    >
      <option value="">
        Tous les statuts
      </option>

      <option value="nettoyée">
        Nettoyée
      </option>

      <option value="non nettoyée">
        Non nettoyée
      </option>
    </Form.Select>
  </div>

  <div className="etat-chambre-filter-field">
    <span>Maintenance</span>

    <Form.Select
      value={selectedMaintenance}
      onChange={(event) =>
        handleFilterChange(
          "maintenance",
          event.target.value
        )
      }
      className="app-filter-select"
    >
      <option value="">
        Tous les états
      </option>

      <option value="oui">
        En maintenance
      </option>

      <option value="non">
        Pas en maintenance
      </option>
    </Form.Select>
  </div>

  <div className="etat-chambre-filter-field">
    <span>Occupation</span>

    <Form.Select
      value={selectedOccupation}
      onChange={(event) =>
        handleFilterChange(
          "occupation",
          event.target.value
        )
      }
      className="app-filter-select"
    >
      <option value="">Toutes</option>
      <option value="libre">Libres</option>
      <option value="occupée">Occupées</option>
    </Form.Select>
  </div>

  <div className="etat-chambre-filter-field">
    <span>Dernier nettoyage</span>

    <Form.Control
      type="date"
      value={dateNettoyage}
      onChange={(event) =>
        handleFilterChange(
          "date_nettoyage",
          event.target.value
        )
      }
      className="app-filter-select"
    />
  </div>

  <div className="etat-chambre-filter-field">
    <span>Début maintenance</span>

    <Form.Control
      type="date"
      value={dateDebutMaintenance}
      onChange={(event) =>
        handleFilterChange(
          "date_debut_maintenance",
          event.target.value
        )
      }
      className="app-filter-select"
    />
  </div>

  <div className="etat-chambre-filter-field">
    <span>Fin maintenance</span>

    <Form.Control
      type="date"
      value={dateFinMaintenance}
      onChange={(event) =>
        handleFilterChange(
          "date_fin_maintenance",
          event.target.value
        )
      }
      className="app-filter-select"
    />
  </div>
  <div className="etat-chambre-filter-reset">
    <ListFilterReset active={filtersActive} onReset={resetFilters} />
  </div>
</div>
        </div>

        {actionError && (
          <Alert variant="danger" dismissible onClose={() => setActionError("")}>
            {actionError}
          </Alert>
        )}

        <ListState
          loading={loading}
          error={loadError}
          allRowsCount={chambres.length}
          filteredRowsCount={totalRows}
          emptyDataMessage="Aucun état de chambre disponible."
          onRetry={loadRoomStates}
          onResetFilters={resetFilters}
        />

        {!loading && !loadError && totalRows > 0 && (
          <div className="app-section">
            <ChambreTable
              filteredChambres={visibleChambres}
              searchTerm={searchTerm}
              maintenanceTypes={maintenanceTypes}
              handleEditClick={handleEditClick}
              handleMarkAsClean={openQuickCleanModal}
              paginationComponent={
                <ListPagination
                  page={page}
                  rowsPerPage={rowsPerPage}
                  totalRows={totalRows}
                  onPageChange={setPage}
                  onRowsPerPageChange={setRowsPerPage}
                />
              }
            />
          </div>
        )}

        <div
          id="formContainer"
          className="app-form-drawer"
          style={{
            right: showForm ? "0" : "-100%",
            width: "560px",
            maxWidth: "100%",
          }}
        >
          <Form onSubmit={handleSubmit} noValidate>
            <h4 className="app-form-drawer-title">
              Modifier l’état et la maintenance
            </h4>
            <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
            <div className="row g-3">
              <Form.Group className="col-md-6">
                <Form.Label>Numéro de chambre</Form.Label>
                <Form.Control value={formData.num_chambre} readOnly />
              </Form.Group>
              <Form.Group className="col-md-6">
                <Form.Label><RequiredLabel required>Propreté</RequiredLabel></Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  isInvalid={Boolean(formErrors.status)}
                >
                  <option value="nettoyée">Nettoyée</option>
                  <option value="non nettoyée">Non nettoyée</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {formErrors.status}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="col-md-6">
                <Form.Label><RequiredLabel required={formData.status === "nettoyée"}>Date de nettoyage</RequiredLabel></Form.Label>
                <Form.Control
                  type="date"
                  name="date_nettoyage"
                  value={formData.date_nettoyage}
                  onChange={handleFormChange}
                  isInvalid={Boolean(formErrors.date_nettoyage)}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.date_nettoyage}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="col-md-6">
                <div className="app-label-action etat-chambre-field-heading">
                  <Form.Label><RequiredLabel required={formData.status === "nettoyée"}>Nettoyée par</RequiredLabel></Form.Label>
                  <button
                    type="button"
                    className="etat-chambre-label-action"
                    onClick={() => openEmployeeManagement("edit")}
                    title="Gérer les employés"
                    aria-label="Gérer les employés"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
                <Form.Select
                  name="nettoyee_par_id"
                  value={formData.nettoyee_par_id}
                  onChange={handleFormChange}
                  isInvalid={Boolean(formErrors.nettoyee_par_id)}
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.length === 0 && (
                    <option value="" disabled>
                      Aucun employé disponible
                    </option>
                  )}
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {getEmployeeFullName(employee)}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {formErrors.nettoyee_par_id}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="col-12">
                <Form.Label><RequiredLabel required>Maintenance</RequiredLabel></Form.Label>
                <div className="d-flex gap-4">
                  <Form.Check
                    type="radio"
                    id="maintenance-oui"
                    name="maintenance"
                    value="oui"
                    label="Oui"
                    checked={formData.maintenance === "oui"}
                    onChange={handleFormChange}
                  />
                  <Form.Check
                    type="radio"
                    id="maintenance-non"
                    name="maintenance"
                    value="non"
                    label="Non"
                    checked={formData.maintenance === "non"}
                    onChange={handleFormChange}
                  />
                </div>
                {formErrors.maintenance && (
                  <div className="text-danger small mt-1">
                    {formErrors.maintenance}
                  </div>
                )}
              </Form.Group>

              {formData.maintenance === "oui" && (
                <>
                  <Form.Group className="col-12">
                    <div className="app-label-action etat-chambre-field-heading">
                      <Form.Label><RequiredLabel required>Type de maintenance</RequiredLabel></Form.Label>
                      <button
                        type="button"
                        className="etat-chambre-icon-button"
                        onClick={openMaintenanceTypeModal}
                        title="Gérer les types de maintenance"
                        aria-label="Gérer les types de maintenance"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                    </div>
                    <Form.Select
                      name="maintenance_type_id"
                      value={formData.maintenance_type_id}
                      onChange={handleFormChange}
                      isInvalid={Boolean(formErrors.maintenance_type_id)}
                    >
                      <option value="">Sélectionner le type</option>
                      {maintenanceTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {getMaintenanceTypeLabel(type)}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {formErrors.maintenance_type_id}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="col-md-6">
                    <Form.Label><RequiredLabel required>Date de début de maintenance</RequiredLabel></Form.Label>
                    <Form.Control
                      type="date"
                      name="date_debut_maintenance"
                      value={formData.date_debut_maintenance}
                      onChange={handleFormChange}
                      isInvalid={Boolean(formErrors.date_debut_maintenance)}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.date_debut_maintenance}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="col-md-6">
                    <Form.Label><RequiredLabel required>Date de fin de maintenance</RequiredLabel></Form.Label>
                    <Form.Control
                      type="date"
                      name="date_fin_maintenance"
                      min={formData.date_debut_maintenance || undefined}
                      value={formData.date_fin_maintenance}
                      onChange={handleFormChange}
                      isInvalid={Boolean(formErrors.date_fin_maintenance)}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.date_fin_maintenance}
                    </Form.Control.Feedback>
                  </Form.Group>
                </>
              )}

              <Form.Group className="col-12">
                <Form.Label>Commentaire</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleFormChange}
                  isInvalid={Boolean(formErrors.commentaire)}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.commentaire}
                </Form.Control.Feedback>
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
          show={showQuickCleanModal && !showEmployeeModal}
          onHide={closeQuickCleanModal}
          animation={false}
          centered
        >
          <Form onSubmit={submitQuickClean} noValidate>
            <Modal.Header closeButton>
              <Modal.Title>
                Marquer la chambre {quickCleanRoom?.num_chambre} comme nettoyée
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
              {actionError && <Alert variant="danger">{actionError}</Alert>}
              <p>
                Chambre <strong>{quickCleanRoom?.num_chambre}</strong>
              </p>
              <Form.Group className="mb-3">
                <div className="app-label-action">
                  <Form.Label><RequiredLabel required>Employé</RequiredLabel></Form.Label>
                  <button
                    type="button"
                    className="etat-chambre-label-action"
                    onClick={() => openEmployeeManagement("quick-clean")}
                    title="Gérer les employés"
                    aria-label="Gérer les employés"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
                <Form.Select
                  value={quickCleanData.nettoyee_par_id}
                  onChange={(event) => {
                    setQuickCleanData((currentData) => ({
                      ...currentData,
                      nettoyee_par_id: event.target.value,
                    }));
                    setQuickCleanErrors((currentErrors) => ({
                      ...currentErrors,
                      nettoyee_par_id: undefined,
                    }));
                  }}
                  isInvalid={Boolean(quickCleanErrors.nettoyee_par_id)}
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.length === 0 && (
                    <option value="" disabled>
                      Aucun employé disponible
                    </option>
                  )}
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {getEmployeeFullName(employee)}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {quickCleanErrors.nettoyee_par_id}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label><RequiredLabel required>Date de nettoyage</RequiredLabel></Form.Label>
                <Form.Control
                  type="date"
                  value={quickCleanData.date_nettoyage}
                  onChange={(event) => {
                    setQuickCleanData((currentData) => ({
                      ...currentData,
                      date_nettoyage: event.target.value,
                    }));
                    setQuickCleanErrors((currentErrors) => ({
                      ...currentErrors,
                      date_nettoyage: undefined,
                    }));
                  }}
                  isInvalid={Boolean(quickCleanErrors.date_nettoyage)}
                />
                <Form.Control.Feedback type="invalid">
                  {quickCleanErrors.date_nettoyage}
                </Form.Control.Feedback>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button type="submit" className="app-primary-button">
                Confirmer
              </Button>
              <Button
                type="button"
                className="app-secondary-button"
                onClick={closeQuickCleanModal}
              >
                Annuler
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal
          show={showEmployeeModal}
          onHide={closeEmployeeManagement}
          animation={false}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Gestion des employés</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {employeeActionError && (
              <Alert variant="danger">{employeeActionError}</Alert>
            )}

            <Form onSubmit={submitEmployee} noValidate>
              <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
              <div className="row g-3">
                <Form.Group className="col-md-4">
                  <Form.Label><RequiredLabel required>Matricule</RequiredLabel></Form.Label>
                  <Form.Control
                    name="matricule"
                    value={employeeForm.matricule}
                    onChange={handleEmployeeChange}
                    isInvalid={Boolean(employeeErrors.matricule)}
                  />
                  <Form.Control.Feedback type="invalid">
                    {employeeErrors.matricule}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="col-md-4">
                  <Form.Label><RequiredLabel required>Nom</RequiredLabel></Form.Label>
                  <Form.Control
                    name="nom"
                    value={employeeForm.nom}
                    onChange={handleEmployeeChange}
                    isInvalid={Boolean(employeeErrors.nom)}
                  />
                  <Form.Control.Feedback type="invalid">
                    {employeeErrors.nom}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="col-md-4">
                  <Form.Label><RequiredLabel required>Prénom</RequiredLabel></Form.Label>
                  <Form.Control
                    name="prenom"
                    value={employeeForm.prenom}
                    onChange={handleEmployeeChange}
                    isInvalid={Boolean(employeeErrors.prenom)}
                  />
                  <Form.Control.Feedback type="invalid">
                    {employeeErrors.prenom}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="col-md-4">
                  <Form.Label><RequiredLabel required>Fonction</RequiredLabel></Form.Label>
                  <Form.Select
                    name="fonction"
                    value={employeeForm.fonction}
                    onChange={handleEmployeeChange}
                    isInvalid={Boolean(employeeErrors.fonction)}
                  >
                    <option value="nettoyage">Nettoyage</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="supervision">Supervision</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {employeeErrors.fonction}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="col-md-5">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    name="telephone"
                    value={employeeForm.telephone}
                    onChange={handleEmployeeChange}
                    isInvalid={Boolean(employeeErrors.telephone)}
                  />
                  <Form.Control.Feedback type="invalid">
                    {employeeErrors.telephone}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="col-md-3 d-flex align-items-end">
                  <div>
                    <Form.Check
                      type="switch"
                      name="actif"
                      label="Employé actif"
                      checked={employeeForm.actif}
                      onChange={handleEmployeeChange}
                      isInvalid={Boolean(employeeErrors.actif)}
                    />
                    {employeeErrors.actif && (
                      <div className="text-danger small">
                        {employeeErrors.actif}
                      </div>
                    )}
                  </div>
                </Form.Group>
              </div>

              <div className="app-form-actions">
                <Button type="submit" className="app-primary-button">
                  <FontAwesomeIcon
                    icon={employeeForm.id ? faPen : faPlus}
                  />
                  {employeeForm.id ? "Modifier" : "Ajouter"}
                </Button>
                {employeeForm.id && (
                  <Button
                    type="button"
                    className="app-secondary-button"
                    onClick={() => {
                      setEmployeeForm(createEmptyEmployeeForm());
                      setEmployeeErrors({});
                    }}
                  >
                    Annuler la modification
                  </Button>
                )}
              </div>
            </Form>

            <div className="app-table-scroll mt-3">
              <Table bordered className="app-table mb-0">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Employé</th>
                    <th>Fonction</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center">
                        <Spinner animation="border" size="sm" />
                      </td>
                    </tr>
                  ) : managedEmployees.length > 0 ? (
                    managedEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.matricule}</td>
                        <td>{getEmployeeFullName(employee)}</td>
                        <td>{getEmployeeFunctionLabel(employee.fonction)}</td>
                        <td>
                          <span
                            className={`app-status-badge ${
                              employee.actif ? "is-success" : "is-warning"
                            }`}
                          >
                            {employee.actif ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="etat-chambre-icon-button is-edit"
                            onClick={() => editEmployee(employee)}
                            title="Modifier"
                            aria-label={`Modifier ${getEmployeeFullName(
                              employee
                            )}`}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          <button
                            type="button"
                            className={`etat-chambre-icon-button ${
                              employee.actif ? "is-warning" : "is-success"
                            }`}
                            onClick={() => toggleEmployeeActive(employee)}
                            title={employee.actif ? "Désactiver" : "Activer"}
                            aria-label={`${
                              employee.actif ? "Désactiver" : "Activer"
                            } ${getEmployeeFullName(employee)}`}
                          >
                            <FontAwesomeIcon
                              icon={employee.actif ? faToggleOn : faToggleOff}
                            />
                          </button>
                          <button
                            type="button"
                            className="etat-chambre-icon-button is-delete"
                            onClick={() => deleteEmployee(employee)}
                            title="Supprimer"
                            aria-label={`Supprimer ${getEmployeeFullName(
                              employee
                            )}`}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center">
                        Aucun employé
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              className="app-secondary-button"
              onClick={closeEmployeeManagement}
            >
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showMaintenanceTypeModal}
          onHide={() => setShowMaintenanceTypeModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Types de maintenance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {maintenanceTypeActionError && (
              <Alert variant="danger">{maintenanceTypeActionError}</Alert>
            )}
            <Form onSubmit={submitMaintenanceType} noValidate>
              <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
              <div className="row g-3">
                <Form.Group className="col-md-4">
                  <Form.Label><RequiredLabel required>Code</RequiredLabel></Form.Label>
                  <Form.Control
                    name="code"
                    value={maintenanceTypeForm.code}
                    onChange={handleMaintenanceTypeChange}
                    isInvalid={Boolean(maintenanceTypeErrors.code)}
                  />
                  <Form.Control.Feedback type="invalid">
                    {maintenanceTypeErrors.code}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="col-md-8">
                  <Form.Label><RequiredLabel required>Libellé</RequiredLabel></Form.Label>
                  <Form.Control
                    name="types_maintenance"
                    value={maintenanceTypeForm.types_maintenance}
                    onChange={handleMaintenanceTypeChange}
                    isInvalid={Boolean(
                      maintenanceTypeErrors.types_maintenance
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {maintenanceTypeErrors.types_maintenance}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="col-12">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={maintenanceTypeForm.description}
                    onChange={handleMaintenanceTypeChange}
                    isInvalid={Boolean(maintenanceTypeErrors.description)}
                  />
                  <Form.Control.Feedback type="invalid">
                    {maintenanceTypeErrors.description}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="app-form-actions">
                <Button type="submit" className="app-primary-button">
                  <FontAwesomeIcon
                    icon={maintenanceTypeForm.id ? faPen : faPlus}
                  />
                  {maintenanceTypeForm.id ? "Modifier" : "Ajouter"}
                </Button>
                {maintenanceTypeForm.id && (
                  <Button
                    type="button"
                    className="app-secondary-button"
                    onClick={() =>
                      setMaintenanceTypeForm(
                        createEmptyMaintenanceTypeForm()
                      )
                    }
                  >
                    Annuler la modification
                  </Button>
                )}
              </div>
            </Form>

            <div className="app-table-scroll mt-3">
              <Table bordered className="app-table mb-0">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Libellé</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceTypes.length > 0 ? (
                    maintenanceTypes.map((type) => (
                      <tr key={type.id}>
                        <td>{type.code}</td>
                        <td>{getMaintenanceTypeLabel(type)}</td>
                        <td>
                          <button
                            type="button"
                            className="etat-chambre-icon-button is-edit"
                            onClick={() => editMaintenanceType(type)}
                            title="Modifier"
                            aria-label={`Modifier ${getMaintenanceTypeLabel(
                              type
                            )}`}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          <button
                            type="button"
                            className="etat-chambre-icon-button is-delete"
                            onClick={() => deleteMaintenanceType(type)}
                            title="Supprimer"
                            aria-label={`Supprimer ${getMaintenanceTypeLabel(
                              type
                            )}`}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center">
                        Aucun type de maintenance
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              className="app-secondary-button"
              onClick={() => setShowMaintenanceTypeModal(false)}
            >
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      </Box>
    </Box>
  );
};

export default EtatChambre;
