import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button, Form } from "react-bootstrap";
import Box from "@mui/material/Box";
import PeopleIcon from "@mui/icons-material/People";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import SearchWithExport from "../components/SearchWithExport";
import ExpandRTable from "../components/ExpandRTable";
import ListFilterReset from "../components/ListFilterReset";
import ListPagination from "../components/ListPagination";
import ListState from "../components/ListState";
import useListControls from "../components/useListControls";
import { useOpen } from "../Acceuil/OpenProvider";
import { highlightText, normalizeSearchValue } from "../utils/textUtils";
import { exportToExcel as exportToExcelRows, exportToPdf, printRows } from "../utils/listExportUtils";
import "../style.css";

const API_URL = "http://localhost:8000/api";
const OTHER_CITY = "Autre ville";
const DOCUMENT_TYPES = ["CIN", "Passeport", "Carte de séjour", "Autre"];
const CIVILITIES = ["Monsieur", "Madame", "Mademoiselle"];

const INITIAL_FORM = {
  CodeClient: "",
  name: "",
  prenom: "",
  type_piece: "",
  cin: "",
  civilite: "",
  nationalite: "",
  tele: "",
  pays_code: "",
  region_nom: "",
  ville: "",
  adresse: "",
  code_postal: "",
};

const REQUIRED_MESSAGES = {
  name: "Le nom est obligatoire.",
  prenom: "Le prénom est obligatoire.",
  type_piece: "Le type de pièce est obligatoire.",
  cin: "Le numéro de pièce est obligatoire.",
  nationalite: "La nationalité est obligatoire.",
  tele: "Le téléphone est obligatoire.",
  pays_code: "Le pays de résidence est obligatoire.",
  ville: "La ville est obligatoire.",
};

const CLIENT_EXPORT_COLUMNS = [
  { key: "code", label: "Code" },
  { key: "name", label: "Nom" },
  { key: "prenom", label: "Prénom" },
  { key: "typePiece", label: "Type de pièce" },
  { key: "numeroPiece", label: "Numéro de pièce" },
  { key: "civilite", label: "Civilité" },
  { key: "nationalite", label: "Nationalité" },
  { key: "telephone", label: "Téléphone" },
  { key: "pays", label: "Pays" },
  { key: "region", label: "Région / Province" },
  { key: "ville", label: "Ville" },
  { key: "adresse", label: "Adresse" },
  { key: "codePostal", label: "Code postal" },
];

const CLIENT_EXPORT_WIDTHS = {
  code: 13,
  name: 15,
  prenom: 15,
  typePiece: 17,
  numeroPiece: 18,
  civilite: 13,
  nationalite: 17,
  telephone: 18,
  pays: 18,
  region: 24,
  ville: 18,
  adresse: 30,
  codePostal: 15,
};

const CLIENT_EXPORT_NOWRAP = [
  "code", "name", "prenom", "typePiece", "numeroPiece", "civilite",
  "nationalite", "telephone", "pays", "ville", "codePostal",
];

const GuestField = ({ label, required = false, error, children, className = "" }) => (
  <Form.Group className={`client-guest-field ${className}`.trim()}>
    <Form.Label>
      {label}{required && <span className="client-required-mark" aria-hidden="true"> *</span>}
    </Form.Label>
    <div className="client-form-control-stack">
      {children}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  </Form.Group>
);

const getClientChildren = (client) => (
  Array.isArray(client?.info_clients) ? client.info_clients : []
);

const normalizeClientRows = (rows) => (
  Array.isArray(rows)
    ? rows.map((client) => ({
      ...client,
      info_clients: Array.isArray(client?.info_clients)
        ? client.info_clients
        : Array.isArray(client?.infoClients)
          ? client.infoClients
          : [],
    }))
    : []
);

const showValue = (value, required = false) => value || (required ? "À compléter" : "—");

const safeCachedClients = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem("clients") || "null");
    return Array.isArray(parsed) ? normalizeClientRows(parsed) : null;
  } catch {
    localStorage.removeItem("clients");
    return null;
  }
};

const ClientParticulierr = () => {
  const { dynamicStyles } = useOpen();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [locationOptions, setLocationOptions] = useState({ countries: [], moroccoRegions: [] });
  const [locationError, setLocationError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [otherCity, setOtherCity] = useState("");
  const [errors, setErrors] = useState({});
  const [childrenRows, setChildrenRows] = useState([]);
  const [expandedRowsInfo, setExpandedRowsInfo] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const countries = locationOptions.countries || [];
  const moroccoRegions = locationOptions.moroccoRegions || [];
  const countryNames = useMemo(
    () => Object.fromEntries(countries.map((country) => [country.code, country.name])),
    [countries]
  );

  const fetchClients = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setLoadError("");
    try {
      const response = await axios.get(`${API_URL}/all-data-client-particulier`);
      const rows = normalizeClientRows(response.data?.clients);
      setClients(rows);
      localStorage.setItem("clients", JSON.stringify(rows));
    } catch (error) {
      if (!background) {
        setLoadError(error?.response?.data?.message || "Impossible de charger les clients particuliers.");
      }
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  const fetchLocationOptions = useCallback(async () => {
    setLocationError("");
    try {
      const response = await axios.get(`${API_URL}/client-particulier/location-options`);
      setLocationOptions({
        countries: Array.isArray(response.data?.countries) ? response.data.countries : [],
        moroccoRegions: Array.isArray(response.data?.moroccoRegions) ? response.data.moroccoRegions : [],
      });
    } catch (error) {
      setLocationError(error?.response?.data?.message || "Impossible de charger les pays et régions.");
    }
  }, []);

  useEffect(() => {
    const cached = safeCachedClients();
    if (cached) {
      setClients(cached);
      setLoading(false);
    }
    fetchClients(Boolean(cached?.length));
    fetchLocationOptions();
  }, [fetchClients, fetchLocationOptions]);

  const getFieldError = useCallback((field) => {
    const value = errors?.[field];
    return Array.isArray(value) ? value[0] || "" : value || "";
  }, [errors]);

  const clearFieldErrors = (...fields) => {
    setErrors((previous) => {
      const next = { ...previous };
      fields.forEach((field) => { next[field] = ""; });
      return next;
    });
  };

  const currentMoroccoRegion = useMemo(
    () => moroccoRegions.find((region) => region.name === formData.region_nom),
    [formData.region_nom, moroccoRegions]
  );
  const currentMoroccoCities = currentMoroccoRegion?.cities || [];
  const legacyMoroccoRegion = formData.pays_code === "MA"
    && formData.region_nom
    && !moroccoRegions.some((region) => region.name === formData.region_nom);
  const legacyMoroccoCity = formData.pays_code === "MA"
    && formData.ville
    && formData.ville !== OTHER_CITY
    && !currentMoroccoCities.includes(formData.ville);
  const legacyCivilite = formData.civilite
    && !CIVILITIES.includes(formData.civilite);

  const openCreate = () => {
    setEditingClient(null);
    setFormData(INITIAL_FORM);
    setOtherCity("");
    setChildrenRows([]);
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (client) => {
    const paysCode = client.pays_code ?? "";
    const regionName = client.region_nom ?? client.region?.region ?? "";
    const configuredRegion = moroccoRegions.find((region) => region.name === regionName);
    const storedCity = client.ville ?? "";
    const isCustomMoroccoCity = paysCode === "MA"
      && storedCity
      && configuredRegion
      && !configuredRegion.cities.includes(storedCity);

    setEditingClient(client);
    setFormData({
      CodeClient: client.CodeClient ?? "",
      name: client.name ?? "",
      prenom: client.prenom ?? "",
      type_piece: client.type_piece ?? "",
      cin: client.cin ?? "",
      civilite: client.civilite ?? "",
      nationalite: client.nationalite ?? "",
      tele: client.tele ?? "",
      pays_code: paysCode,
      region_nom: regionName,
      ville: isCustomMoroccoCity ? OTHER_CITY : storedCity,
      adresse: client.adresse ?? "",
      code_postal: client.code_postal ?? "",
    });
    setOtherCity(isCustomMoroccoCity ? storedCity : "");
    setChildrenRows((client.info_clients || []).map((child) => ({ ...child })));
    setErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingClient(null);
    setFormData(INITIAL_FORM);
    setOtherCity("");
    setChildrenRows([]);
    setErrors({});
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    clearFieldErrors(name);
  };

  const handleCountryChange = (event) => {
    const paysCode = event.target.value || "";
    setFormData((previous) => ({
      ...previous,
      pays_code: paysCode,
      region_nom: "",
      ville: "",
    }));
    setOtherCity("");
    clearFieldErrors("pays_code", "region_nom", "ville", "ville_autre");
  };

  const handleRegionChange = (event) => {
    setFormData((previous) => ({ ...previous, region_nom: event.target.value, ville: "" }));
    setOtherCity("");
    clearFieldErrors("region_nom", "ville", "ville_autre");
  };

  const handleCityChange = (event) => {
    setFormData((previous) => ({ ...previous, ville: event.target.value }));
    setOtherCity("");
    clearFieldErrors("ville", "ville_autre");
  };

  const validateForm = () => {
    const nextErrors = {};
    Object.entries(REQUIRED_MESSAGES).forEach(([field, message]) => {
      if (!String(formData[field] ?? "").trim()) nextErrors[field] = message;
    });
    if (formData.pays_code === "MA" && !String(formData.region_nom || "").trim()) {
      nextErrors.region_nom = "La région est obligatoire pour une adresse au Maroc.";
    }
    if (formData.pays_code === "MA" && formData.ville === OTHER_CITY && !otherCity.trim()) {
      nextErrors.ville_autre = "La ville est obligatoire.";
    }

    const normalizedDocument = normalizeSearchValue(formData.cin);
    const editingId = String(editingClient?.id ?? "");
    if (normalizedDocument && clients.some((client) =>
      String(client.id) !== editingId && normalizeSearchValue(client.cin) === normalizedDocument
    )) {
      nextErrors.cin = "Ce numéro de pièce existe déjà.";
    }

    childrenRows.forEach((child, index) => {
      const value = child.age;
      if (value === "" || value === null || value === undefined) return;
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 17) {
        nextErrors[`infos.${index}.age`] = "L’âge de l’enfant doit être compris entre 0 et 17 ans.";
      }
    });

    setErrors(nextErrors);
    const firstField = Object.keys(nextErrors)[0];
    if (firstField) {
      requestAnimationFrame(() => {
        document.querySelector(`[name="${firstField}"]`)?.focus();
      });
    }
    return Object.keys(nextErrors).length === 0;
  };

  const syncChildren = async (clientId) => {
    const infos = childrenRows
      .filter((child) => String(child.prenom || "").trim())
      .map((child) => ({
        ...(child.id ? { id: child.id } : {}),
        idClient: clientId,
        type: "C",
        name: String(formData.name || "").trim(),
        prenom: String(child.prenom || "").trim(),
        age: child.age === "" || child.age === null || child.age === undefined ? null : Number(child.age),
      }));
    await axios.post(`${API_URL}/infoClient`, { client_id: clientId, infos });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      prenom: formData.prenom.trim(),
      type_piece: formData.type_piece,
      cin: formData.cin.trim(),
      civilite: formData.civilite.trim() || null,
      nationalite: formData.nationalite.trim(),
      tele: formData.tele.trim(),
      pays_code: formData.pays_code,
      region_nom: formData.region_nom.trim() || null,
      ville: formData.ville,
      ville_autre: formData.ville === OTHER_CITY ? otherCity.trim() : null,
      adresse: formData.adresse.trim() || null,
      code_postal: formData.code_postal.trim() || null,
    };

    try {
      const isCreating = !editingClient;
      const response = editingClient
        ? await axios.put(`${API_URL}/clients_particulier/${editingClient.id}`, payload)
        : await axios.post(`${API_URL}/clients_particulier`, payload);
      const clientId = response.data?.client?.id;
      const generatedCode = response.data?.client?.CodeClient;
      await syncChildren(clientId);
      await fetchClients(true);
      closeDrawer();
      await Swal.fire({
        icon: "success",
        title: "Succès",
        text: isCreating
          ? generatedCode
            ? `Client particulier créé avec succès. Code client : ${generatedCode}`
            : "Client particulier créé avec succès."
          : response.data?.message || "Le client a été enregistré.",
      });
    } catch (error) {
      if (error?.response?.status === 422) {
        setErrors(error.response.data?.errors || {});
        return;
      }
      await Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error?.response?.data?.message || error?.response?.data?.error || "Impossible d’enregistrer ce client.",
      });
    }
  };

  const addChild = () => {
    setChildrenRows((previous) => [...previous, { name: formData.name, prenom: "", age: "" }]);
  };

  const changeChild = (index, field, value) => {
    setChildrenRows((previous) => previous.map((child, childIndex) =>
      childIndex === index ? { ...child, name: formData.name, [field]: value } : child
    ));
    clearFieldErrors(`infos.${index}.${field}`);
  };

  const removeChild = async (index) => {
    const child = childrenRows[index];
    try {
      if (child?.id) await axios.delete(`${API_URL}/infoClient/${child.id}`);
      setChildrenRows((previous) => previous.filter((_, childIndex) => childIndex !== index));
      if (child?.id) await fetchClients(true);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error?.response?.data?.message || "Impossible de supprimer cet enfant.",
      });
    }
  };

  const deleteErrorMessage = (error) => error?.response?.data?.message
    || error?.response?.data?.error
    || "Impossible de supprimer ce client.";

  const handleDelete = async (id) => {
    const confirmation = await Swal.fire({
      title: "Supprimer ce client ?",
      showCancelButton: true,
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/clients_particulier/${id}`);
      setSelectedItems((previous) => previous.filter((selectedId) => String(selectedId) !== String(id)));
      await fetchClients(true);
      await Swal.fire({ icon: "success", title: "Succès", text: "Client supprimé avec succès." });
    } catch (error) {
      await Swal.fire({ icon: "error", title: "Erreur", text: deleteErrorMessage(error) });
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedItems.length) {
      await Swal.fire({ icon: "info", title: "Aucune sélection", text: "Sélectionnez au moins un client à supprimer." });
      return;
    }
    const confirmation = await Swal.fire({
      title: "Supprimer les clients sélectionnés ?",
      showCancelButton: true,
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    });
    if (!confirmation.isConfirmed) return;

    const selectedIds = [...selectedItems];
    const results = await Promise.allSettled(
      selectedIds.map((id) => axios.delete(`${API_URL}/clients_particulier/${id}`))
    );
    const successfulIds = results.flatMap((result, index) => result.status === "fulfilled" ? [selectedIds[index]] : []);
    const failedMessages = [...new Set(results.flatMap((result) =>
      result.status === "rejected" ? [deleteErrorMessage(result.reason)] : []
    ))];

    if (successfulIds.length) {
      setSelectedItems((previous) => previous.filter((id) =>
        !successfulIds.some((successfulId) => String(successfulId) === String(id))
      ));
      await fetchClients(true);
    }
    const failedCount = selectedIds.length - successfulIds.length;
    const detail = failedMessages.length ? ` ${failedMessages.join(" ")}` : "";
    await Swal.fire({
      icon: failedCount === 0 ? "success" : successfulIds.length ? "warning" : "error",
      title: failedCount === 0 ? "Succès" : successfulIds.length ? "Suppression partielle" : "Suppression impossible",
      text: `${successfulIds.length} client(s) supprimé(s), ${failedCount} échec(s).${detail}`,
    });
  };

  const regionFilterOptions = useMemo(() => {
    if (countryFilter === "MA") return moroccoRegions.map((region) => region.name);
    return [...new Set(clients
      .filter((client) => !countryFilter || client.pays_code === countryFilter)
      .map((client) => client.region_nom)
      .filter(Boolean))].sort((left, right) => left.localeCompare(right, "fr"));
  }, [clients, countryFilter, moroccoRegions]);

  const cityFilterOptions = useMemo(() => [...new Set(clients
    .filter((client) => !countryFilter || client.pays_code === countryFilter)
    .filter((client) => !regionFilter || client.region_nom === regionFilter)
    .map((client) => client.ville)
    .filter(Boolean))].sort((left, right) => left.localeCompare(right, "fr")), [clients, countryFilter, regionFilter]);

  const filterClients = useCallback((rows, currentSearchTerm) => {
    const needle = normalizeSearchValue(currentSearchTerm);
    return rows.filter((client) => {
      if (countryFilter && String(client.pays_code || "") !== String(countryFilter)) return false;
      if (regionFilter && String(client.region_nom || "") !== String(regionFilter)) return false;
      if (cityFilter && String(client.ville || "") !== String(cityFilter)) return false;
      if (!needle) return true;
      return [
        client.CodeClient, client.name, client.prenom, client.type_piece, client.cin,
        client.civilite, client.nationalite, client.tele, countryNames[client.pays_code],
        client.region_nom, client.ville, client.adresse, client.code_postal,
      ].some((value) => normalizeSearchValue(value).includes(needle));
    });
  }, [cityFilter, countryFilter, countryNames, regionFilter]);

  const {
    searchTerm, page, rowsPerPage, filteredRows, visibleRows, totalRows,
    setSearchTerm, setPage, setRowsPerPage, resetPage,
  } = useListControls({
    allRows: clients,
    filterRows: filterClients,
    storageKey: "rowsPerPageClientsParticulier",
  });

  const filtersActive = Boolean(searchTerm || countryFilter || regionFilter || cityFilter);
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setCountryFilter("");
    setRegionFilter("");
    setCityFilter("");
    resetPage();
  }, [resetPage, setSearchTerm]);

  const changeCountryFilter = (event) => {
    setCountryFilter(event.target.value);
    setRegionFilter("");
    setCityFilter("");
    resetPage();
  };
  const changeRegionFilter = (event) => {
    setRegionFilter(event.target.value);
    setCityFilter("");
    resetPage();
  };
  const changeCityFilter = (event) => {
    setCityFilter(event.target.value);
    resetPage();
  };

  const exportRows = useMemo(() => filteredRows.map((client) => ({
    code: client.CodeClient || "",
    name: client.name || "",
    prenom: client.prenom || "",
    typePiece: client.type_piece || "À compléter",
    numeroPiece: client.cin || "",
    civilite: client.civilite || "—",
    nationalite: client.nationalite || "",
    telephone: client.tele || "",
    pays: countryNames[client.pays_code] || "À compléter",
    region: client.region_nom || "—",
    ville: client.ville || "À compléter",
    adresse: client.adresse || "—",
    codePostal: client.code_postal || "—",
  })), [countryNames, filteredRows]);

  const exportToExcel = () => exportToExcelRows({
    rows: exportRows,
    columns: CLIENT_EXPORT_COLUMNS,
    sheetName: "Clients",
    filename: "clients_particuliers.xlsx",
  });
  const exportToPDF = () => exportToPdf({
    rows: exportRows,
    columns: CLIENT_EXPORT_COLUMNS,
    title: "Liste des Clients Particulier",
    filename: "clients_particuliers.pdf",
    orientation: "landscape",
    columnWidths: CLIENT_EXPORT_WIDTHS,
    nowrapColumns: CLIENT_EXPORT_NOWRAP,
  });
  const printTable = () => printRows({
    rows: exportRows,
    columns: CLIENT_EXPORT_COLUMNS,
    title: "Liste des Clients Particulier",
    orientation: "landscape",
    columnWidths: CLIENT_EXPORT_WIDTHS,
    nowrapColumns: CLIENT_EXPORT_NOWRAP,
  });

  const visibleIds = visibleRows.map((client) => client.id);
  const allVisibleClientsSelected = visibleIds.length > 0
    && visibleIds.every((id) => selectedItems.includes(id));
  const handleSelectAllChange = () => {
    setSelectedItems((previous) => allVisibleClientsSelected
      ? previous.filter((id) => !visibleIds.includes(id))
      : [...new Set([...previous, ...visibleIds])]
    );
  };
  const handleCheckboxChange = (id) => {
    setSelectedItems((previous) => previous.includes(id)
      ? previous.filter((selectedId) => selectedId !== id)
      : [...previous, id]
    );
  };
  const toggleRowInfo = (id) => {
    setExpandedRowsInfo((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const columns = useMemo(() => [
    {
      key: "CodeClient",
      label: "Code",
      minWidth: 140,
      render: (client, term) => highlightText(showValue(client.CodeClient, true), term),
    },
    {
      key: "name",
      label: "Nom",
      minWidth: 110,
      render: (client, term) => highlightText(showValue(client.name, true), term),
    },
    {
      key: "prenom",
      label: "Prénom",
      minWidth: 110,
      render: (client, term) => highlightText(showValue(client.prenom, true), term),
    },
    {
      key: "type_piece",
      label: "Type de pièce",
      minWidth: 130,
      render: (client, term) => highlightText(showValue(client.type_piece, true), term),
    },
    {
      key: "cin",
      label: "Numéro de pièce",
      minWidth: 150,
      render: (client, term) => highlightText(showValue(client.cin, true), term),
    },
    {
      key: "civilite",
      label: "Civilité",
      minWidth: 100,
      render: (client, term) => highlightText(showValue(client.civilite), term),
    },
    {
      key: "nationalite",
      label: "Nationalité",
      minWidth: 130,
      render: (client, term) => highlightText(showValue(client.nationalite, true), term),
    },
    {
      key: "tele",
      label: "Téléphone",
      minWidth: 130,
      render: (client, term) => highlightText(showValue(client.tele, true), term),
    },
    {
      key: "pays_code",
      label: "Pays",
      minWidth: 110,
      render: (client, term) => highlightText(countryNames[client.pays_code] || "À compléter", term),
    },
    {
      key: "region_nom",
      label: "Région / Province",
      minWidth: 210,
      render: (client, term) => highlightText(showValue(client.region_nom), term),
    },
    {
      key: "ville",
      label: "Ville",
      minWidth: 120,
      render: (client, term) => highlightText(showValue(client.ville, true), term),
    },
    {
      key: "adresse",
      label: "Adresse",
      minWidth: 220,
      render: (client, term) => highlightText(showValue(client.adresse), term),
    },
    {
      key: "code_postal",
      label: "Code postal",
      minWidth: 120,
      render: (client, term) => highlightText(showValue(client.code_postal), term),
    },
    {
      key: "children",
      label: "Enfants",
      width: 100,
      minWidth: 100,
      stickyRight: true,
      stickyRightOffset: 92,
      render: (client, _term, toggleRowExpansion) => {
        const count = getClientChildren(client).length;
        return (
          <button
            type="button"
            className={`client-enfants-count ${count ? "has-enfants" : ""}`}
            onClick={() => toggleRowExpansion(client.id)}
            aria-expanded={Boolean(expandedRowsInfo[client.id])}
            title={count ? "Afficher les enfants" : "Afficher le détail des enfants"}
          >
            <PeopleIcon style={{ fontSize: 16 }} />
            <span>{count}</span>
          </button>
        );
      },
    },
  ], [countryNames, expandedRowsInfo]);

  const renderClientChildren = (client) => {
    const children = getClientChildren(client);

    return (
      <div className="client-expanded-children">
        <div className="client-enfants-details-header">
          Enfants de {showValue(client.name)} {showValue(client.prenom)}
        </div>
        {children.length > 0 ? (
          <table className="app-table client-enfants-details-table">
            <thead>
              <tr><th>Nom</th><th>Prénom</th><th>Âge</th></tr>
            </thead>
            <tbody>
              {children.map((child, index) => (
                <tr key={child.id || `${client.id}-child-${index}`}>
                  <td>{child.name || client.name || "—"}</td>
                  <td>{child.prenom || "—"}</td>
                  <td>{child.age ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="client-expanded-children-empty">Aucun enfant renseigné pour ce client.</p>
        )}
      </div>
    );
  };

  return (
    <Box
      sx={{
        ...dynamicStyles,
        width: "auto",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Box
        component="main"
        className="app-page clients-particulier-page"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 0,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
      <SearchWithExport
        Title="Liste des Clients Particuliers"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        printTable={printTable}
        exportToPDF={exportToPDF}
        exportToExcel={exportToExcel}
        resultCount={totalRows}
        loading={loading}
        exportsDisabled={loading || totalRows === 0}
      />

      <div className="app-controls-row">
        <button type="button" className="app-add-button" onClick={openCreate}>
          <FontAwesomeIcon icon={faPlus} /> Ajouter un client
        </button>
        <div className="app-filter-controls client-guest-filter-controls">
          <Form.Select className="app-filter-select" value={countryFilter} onChange={changeCountryFilter} aria-label="Filtrer par pays">
            <option value="">Tous les pays</option>
            {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </Form.Select>
          <Form.Select className="app-filter-select" value={regionFilter} onChange={changeRegionFilter} aria-label="Filtrer par région">
            <option value="">Toutes les régions / provinces</option>
            {regionFilterOptions.map((region) => <option key={region} value={region}>{region}</option>)}
          </Form.Select>
          <Form.Select className="app-filter-select" value={cityFilter} onChange={changeCityFilter} aria-label="Filtrer par ville">
            <option value="">Toutes les villes</option>
            {cityFilterOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </Form.Select>
          <ListFilterReset active={filtersActive} onReset={resetFilters} />
        </div>
      </div>

      {locationError && <div className="app-list-state is-error" role="alert">{locationError}</div>}

      <aside className={`app-form-drawer client-guest-drawer ${drawerOpen ? "is-open" : ""}`} aria-hidden={!drawerOpen}>
        <Form onSubmit={handleSubmit} noValidate>
          <h4 className="app-form-drawer-title">{editingClient ? "Modifier" : "Ajouter"} un client particulier</h4>

          <section className="client-guest-form-section">
            <h5>Identité</h5>
            {!editingClient && (
              <p className="client-generated-code-note">
                Le code client sera généré automatiquement après l’enregistrement.
              </p>
            )}
            <div className="client-guest-form-grid">
              {editingClient && (
                <GuestField label="Code client">
                  <Form.Control
                    name="CodeClient"
                    value={formData.CodeClient}
                    readOnly
                    aria-readonly="true"
                  />
                </GuestField>
              )}
              <GuestField label="Nom" required error={getFieldError("name")}>
                <Form.Control name="name" value={formData.name} onChange={handleChange} isInvalid={Boolean(getFieldError("name"))} />
              </GuestField>
              <GuestField label="Prénom" required error={getFieldError("prenom")}>
                <Form.Control name="prenom" value={formData.prenom} onChange={handleChange} isInvalid={Boolean(getFieldError("prenom"))} />
              </GuestField>
              <GuestField label="Type de pièce" required error={getFieldError("type_piece")}>
                <Form.Select name="type_piece" value={formData.type_piece} onChange={handleChange} isInvalid={Boolean(getFieldError("type_piece"))}>
                  <option value="">Sélectionner</option>
                  {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </Form.Select>
              </GuestField>
              <GuestField label="Numéro de pièce" required error={getFieldError("cin")}>
                <Form.Control name="cin" value={formData.cin} onChange={handleChange} isInvalid={Boolean(getFieldError("cin"))} />
              </GuestField>
              <GuestField label="Civilité" error={getFieldError("civilite")}>
                <Form.Select name="civilite" value={formData.civilite} onChange={handleChange} isInvalid={Boolean(getFieldError("civilite"))}>
                  <option value="">Sélectionner une civilité</option>
                  {legacyCivilite && <option value={formData.civilite}>{formData.civilite} (ancienne valeur)</option>}
                  {CIVILITIES.map((civilite) => <option key={civilite} value={civilite}>{civilite}</option>)}
                </Form.Select>
              </GuestField>
              <GuestField label="Nationalité" required error={getFieldError("nationalite")}>
                <Form.Control name="nationalite" value={formData.nationalite} onChange={handleChange} isInvalid={Boolean(getFieldError("nationalite"))} />
              </GuestField>
              <GuestField label="Téléphone" required error={getFieldError("tele")}>
                <Form.Control name="tele" type="tel" value={formData.tele} onChange={handleChange} isInvalid={Boolean(getFieldError("tele"))} />
              </GuestField>
            </div>
          </section>

          <section className="client-guest-form-section">
            <h5>Résidence et adresse</h5>
            <div className="client-guest-form-grid">
              <GuestField label="Pays de résidence" required error={getFieldError("pays_code")}>
                <Form.Select name="pays_code" value={formData.pays_code} onChange={handleCountryChange} isInvalid={Boolean(getFieldError("pays_code"))} disabled={!countries.length}>
                  <option value="">Sélectionner un pays</option>
                  {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                </Form.Select>
              </GuestField>

              {formData.pays_code === "MA" ? (
                <GuestField label="Région" required error={getFieldError("region_nom")}>
                  <Form.Select name="region_nom" value={formData.region_nom} onChange={handleRegionChange} isInvalid={Boolean(getFieldError("region_nom"))}>
                    <option value="">Sélectionner une région</option>
                    {legacyMoroccoRegion && <option value={formData.region_nom}>{formData.region_nom} (à corriger)</option>}
                    {moroccoRegions.map((region) => <option key={region.name} value={region.name}>{region.name}</option>)}
                  </Form.Select>
                </GuestField>
              ) : (
                <GuestField label="Région / Province" error={getFieldError("region_nom")}>
                  <Form.Control name="region_nom" value={formData.region_nom} onChange={handleChange} isInvalid={Boolean(getFieldError("region_nom"))} />
                </GuestField>
              )}

              {formData.pays_code === "MA" ? (
                <GuestField label="Ville" required error={getFieldError("ville") || getFieldError("ville_autre")}>
                  <Form.Select name="ville" value={formData.ville} onChange={handleCityChange} isInvalid={Boolean(getFieldError("ville") || getFieldError("ville_autre"))} disabled={!currentMoroccoRegion}>
                    <option value="">Sélectionner une ville</option>
                    {legacyMoroccoCity && <option value={formData.ville}>{formData.ville} (à corriger)</option>}
                    {currentMoroccoCities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </Form.Select>
                  {formData.ville === OTHER_CITY && (
                    <Form.Control
                      className="mt-2"
                      name="ville_autre"
                      value={otherCity}
                      onChange={(event) => { setOtherCity(event.target.value); clearFieldErrors("ville", "ville_autre"); }}
                      placeholder="Préciser la ville"
                      isInvalid={Boolean(getFieldError("ville_autre"))}
                    />
                  )}
                </GuestField>
              ) : (
                <GuestField label="Ville" required error={getFieldError("ville")}>
                  <Form.Control name="ville" value={formData.ville} onChange={handleChange} isInvalid={Boolean(getFieldError("ville"))} />
                </GuestField>
              )}

              <GuestField label="Adresse" error={getFieldError("adresse")}>
                <Form.Control name="adresse" value={formData.adresse} onChange={handleChange} isInvalid={Boolean(getFieldError("adresse"))} />
              </GuestField>
              <GuestField label="Code postal" error={getFieldError("code_postal")}>
                <Form.Control name="code_postal" value={formData.code_postal} onChange={handleChange} isInvalid={Boolean(getFieldError("code_postal"))} />
              </GuestField>
            </div>
          </section>

          <section className="client-guest-form-section">
            <div className="client-guest-section-heading">
              <h5>Enfants</h5>
              <button type="button" className="app-secondary-button" onClick={addChild}>
                <FontAwesomeIcon icon={faPlus} /> Ajouter un enfant
              </button>
            </div>
            <div className="app-table-wrapper client-children-editor client-form-children-table">
              <table className="app-table">
                <colgroup>
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead><tr><th>Nom</th><th>Prénom</th><th>Âge</th><th>Action</th></tr></thead>
                <tbody>
                  {childrenRows.length === 0 && <tr><td colSpan={4}>Aucun enfant renseigné.</td></tr>}
                  {childrenRows.map((child, index) => (
                    <tr key={child.id || `new-child-${index}`}>
                      <td><Form.Control value={formData.name} disabled /></td>
                      <td><Form.Control value={child.prenom ?? ""} onChange={(event) => changeChild(index, "prenom", event.target.value)} /></td>
                      <td>
                        <div className="client-child-age-field">
                          <Form.Control
                            name={`infos.${index}.age`}
                            type="number"
                            min="0"
                            max="17"
                            step="1"
                            value={child.age ?? ""}
                            onChange={(event) => changeChild(index, "age", event.target.value)}
                            isInvalid={Boolean(getFieldError(`infos.${index}.age`))}
                          />
                          {getFieldError(`infos.${index}.age`) && (
                            <div className="invalid-feedback d-block">
                              {getFieldError(`infos.${index}.age`)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td><button type="button" className="app-table-action is-delete" title="Supprimer" aria-label="Supprimer" onClick={() => removeChild(index)}><FontAwesomeIcon icon={faTrash} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="app-form-actions">
            <Button type="submit" className="app-primary-button">Valider</Button>
            <Button type="button" className="app-secondary-button" onClick={closeDrawer}>Annuler</Button>
          </div>
        </Form>
      </aside>

      <ListState
        loading={loading}
        error={loadError}
        allRowsCount={clients.length}
        filteredRowsCount={totalRows}
        emptyDataMessage="Aucun client particulier enregistré."
        onRetry={() => fetchClients(false)}
        onResetFilters={resetFilters}
      />

      {!loading && !loadError && totalRows > 0 && (
        <div
          id="tableContainer"
          className="app-table-wrapper client-guest-table-wrapper"
          style={{ marginTop: "20px" }}
        >
          <ExpandRTable
            columns={columns}
            data={clients}
            filteredData={visibleRows}
            searchTerm={searchTerm}
            highlightText={highlightText}
            selectAll={allVisibleClientsSelected}
            selectedItems={selectedItems}
            handleSelectAllChange={handleSelectAllChange}
            handleCheckboxChange={handleCheckboxChange}
            handleEdit={openEdit}
            handleDelete={handleDelete}
            handleDeleteSelected={handleDeleteSelected}
            rowsPerPage={rowsPerPage}
            page={page}
            expandedRows={expandedRowsInfo}
            toggleRowExpansion={toggleRowInfo}
            renderExpandedRow={renderClientChildren}
            renderCustomActions={null}
            uiVariant="app"
            forceHorizontalScroll
            externalPagination
            paginationComponent={(
              <ListPagination
                page={page}
                rowsPerPage={rowsPerPage}
                totalRows={totalRows}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
              />
            )}
          />
        </div>
      )}
      </Box>
    </Box>
  );
};

export default ClientParticulierr;
