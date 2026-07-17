import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Form, Modal } from "react-bootstrap";
import Box from "@mui/material/Box";
import PeopleIcon from "@mui/icons-material/People";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import SearchWithExport from "../components/SearchWithExport";
import ExpandRTable from "../components/ExpandRTable";
import ListFilterReset from "../components/ListFilterReset";
import ListPagination from "../components/ListPagination";
import ListState from "../components/ListState";
import RequiredLabel from "../components/RequiredLabel";
import useListControls from "../components/useListControls";
import { useOpen } from "../Acceuil/OpenProvider";
import {
  getNumberSearchVariants,
  highlightText,
  normalizeSearchValue,
} from "../utils/textUtils";
import {
  exportToExcel as exportToExcelRows,
  exportToPdf,
  printRows,
} from "../utils/listExportUtils";
import { fieldError, setValidationErrors } from "../utils/formValidationUtils";
import "../style.css";

const API_URL = "http://localhost:8000/api";
const OTHER_CITY = "Autre ville";

const INITIAL_FORM = {
  CodeClient: "",
  raison_sociale: "",
  ice: "",
  type_organisation: "",
  abreviation: "",
  secteur_id: "",
  tele: "",
  email: "",
  pays_code: "",
  region_nom: "",
  ville: "",
  adresse: "",
  code_postal: "",
  mod_id: "",
  credit_autorise: false,
  delai_paiement_jours: "",
  plafond_credit: "",
};

const REQUIRED_MESSAGES = {
  raison_sociale: "La raison sociale est obligatoire.",
  ice: "L’ICE / identifiant fiscal est obligatoire.",
  type_organisation: "Le type d’organisation est obligatoire.",
  tele: "Le téléphone est obligatoire.",
  email: "L’email général est obligatoire.",
  pays_code: "Le pays est obligatoire.",
  ville: "La ville est obligatoire.",
  adresse: "L’adresse est obligatoire.",
};

const EXPORT_COLUMNS = [
  { key: "code", label: "Code" },
  { key: "raisonSociale", label: "Raison sociale" },
  { key: "ice", label: "ICE / Identifiant fiscal" },
  { key: "typeOrganisation", label: "Type d’organisation" },
  { key: "abreviation", label: "Abréviation" },
  { key: "secteur", label: "Secteur d’activité" },
  { key: "telephone", label: "Téléphone" },
  { key: "email", label: "Email" },
  { key: "pays", label: "Pays" },
  { key: "region", label: "Région / Province" },
  { key: "ville", label: "Ville" },
  { key: "adresse", label: "Adresse" },
  { key: "codePostal", label: "Code postal" },
  { key: "modeReglement", label: "Mode de règlement par défaut" },
  { key: "creditAutorise", label: "Paiement à crédit autorisé" },
  { key: "delai", label: "Délai de paiement" },
  { key: "plafond", label: "Plafond de crédit" },
];

const EXPORT_WIDTHS = {
  code: 13,
  raisonSociale: 24,
  ice: 22,
  typeOrganisation: 24,
  abreviation: 15,
  secteur: 20,
  telephone: 18,
  email: 25,
  pays: 16,
  region: 24,
  ville: 18,
  adresse: 30,
  codePostal: 15,
  modeReglement: 25,
  creditAutorise: 18,
  delai: 16,
  plafond: 18,
};

const CompanyField = ({ label, required = false, error, children, className = "", field = "" }) => {
  const directControl = React.Children.toArray(children).find((child) => React.isValidElement(child) && child.props?.name);
  const fieldName = field || directControl?.props?.name || "";
  const errorId = fieldName ? `${fieldName.replace(/[^a-zA-Z0-9_-]/g, "-")}-error` : undefined;

  return (
  <Form.Group className={`company-form-field ${className}`.trim()} data-field={fieldName || undefined}>
    <Form.Label>
      <RequiredLabel required={required}>{label}</RequiredLabel>
    </Form.Label>
    <div className="company-form-control-stack">
      {React.Children.map(children, (child) => (
        React.isValidElement(child) && child.props?.name
          ? React.cloneElement(child, {
            "aria-required": required || undefined,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": error ? errorId : child.props["aria-describedby"],
          })
          : child
      ))}
      {error && <div id={errorId} className="invalid-feedback d-block app-field-error">{error}</div>}
    </div>
  </Form.Group>
  );
};

const normalizeRows = (rows) => Array.isArray(rows)
  ? rows.map((client) => ({
    ...client,
    contact_clients: Array.isArray(client?.contact_clients) ? client.contact_clients : [],
  }))
  : [];

const getCompanyContacts = (client) => (
  Array.isArray(client?.contact_clients) ? client.contact_clients : []
);

const showValue = (value, required = false) => value || (required ? "À compléter" : "—");

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed).replace(/\u202f/g, " ")} DH`;
};

const readCache = (key, validator) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return validator(parsed) ? parsed : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const ClientList = () => {
  const { dynamicStyles } = useOpen();
  const [clients, setClients] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [formOptions, setFormOptions] = useState({
    countries: [],
    moroccoRegions: [],
    organizationTypes: [],
    paymentDelays: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [otherCity, setOtherCity] = useState("");
  const [contacts, setContacts] = useState([]);
  const [errors, setErrors] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [organizationFilter, setOrganizationFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [lookupManager, setLookupManager] = useState(null);
  const [lookupDraft, setLookupDraft] = useState("");
  const [editingLookupId, setEditingLookupId] = useState(null);
  const [lookupSaving, setLookupSaving] = useState(false);

  const countries = formOptions.countries || [];
  const moroccoRegions = formOptions.moroccoRegions || [];
  const organizationTypes = formOptions.organizationTypes || [];
  const paymentDelays = formOptions.paymentDelays || [];
  const countryNames = useMemo(
    () => Object.fromEntries(countries.map((country) => [country.code, country.name])),
    [countries]
  );
  const organizationLabels = useMemo(
    () => Object.fromEntries(organizationTypes.map((type) => [type.value, type.label])),
    [organizationTypes]
  );
  const sectorLabels = useMemo(
    () => Object.fromEntries(sectors.map((sector) => [String(sector.id), sector.secteurClient])),
    [sectors]
  );
  const paymentLabels = useMemo(
    () => Object.fromEntries(paymentModes.map((mode) => [String(mode.id), mode.mode_paimants])),
    [paymentModes]
  );

  const fetchClients = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setLoadError("");
    try {
      const response = await axios.get(`${API_URL}/all-data-client`);
      const rows = normalizeRows(response.data?.clients);
      const nextSectors = Array.isArray(response.data?.secteurClients) ? response.data.secteurClients : [];
      const nextModes = Array.isArray(response.data?.modpai) ? response.data.modpai : [];
      setClients(rows);
      setSectors(nextSectors);
      setPaymentModes(nextModes);
      localStorage.setItem("clients_societe", JSON.stringify(rows));
      localStorage.setItem("secteurs_societe", JSON.stringify(nextSectors));
      localStorage.setItem("modes_societe", JSON.stringify(nextModes));
    } catch (error) {
      if (!background) {
        setLoadError(error?.response?.data?.message || "Impossible de charger les clients société.");
      }
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  const fetchFormOptions = useCallback(async () => {
    setOptionsError("");
    try {
      const response = await axios.get(`${API_URL}/client-societe/form-options`);
      const nextOptions = {
        countries: Array.isArray(response.data?.countries) ? response.data.countries : [],
        moroccoRegions: Array.isArray(response.data?.moroccoRegions) ? response.data.moroccoRegions : [],
        organizationTypes: Array.isArray(response.data?.organizationTypes) ? response.data.organizationTypes : [],
        paymentDelays: Array.isArray(response.data?.paymentDelays) ? response.data.paymentDelays : [],
      };
      setFormOptions(nextOptions);
      localStorage.setItem("company_form_options", JSON.stringify(nextOptions));
    } catch (error) {
      setOptionsError(error?.response?.data?.message || "Impossible de charger les options du formulaire société.");
    }
  }, []);

  useEffect(() => {
    const cachedClients = readCache("clients_societe", Array.isArray);
    const cachedSectors = readCache("secteurs_societe", Array.isArray);
    const cachedModes = readCache("modes_societe", Array.isArray);
    const cachedOptions = readCache("company_form_options", (value) => value && typeof value === "object");

    if (cachedClients) {
      setClients(normalizeRows(cachedClients));
      setLoading(false);
    }
    if (cachedSectors) setSectors(cachedSectors);
    if (cachedModes) setPaymentModes(cachedModes);
    if (cachedOptions) setFormOptions(cachedOptions);

    fetchClients(Boolean(cachedClients?.length));
    fetchFormOptions();
  }, [fetchClients, fetchFormOptions]);

  const getFieldError = useCallback((field) => fieldError(errors, field), [errors]);

  const clearErrors = (...fields) => {
    setErrors((previous) => {
      const next = { ...previous };
      fields.forEach((field) => { delete next[field]; });
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
  const legacyOrganizationType = formData.type_organisation
    && !organizationTypes.some((type) => type.value === formData.type_organisation);
  const legacyCountry = formData.pays_code
    && !countries.some((country) => country.code === formData.pays_code);
  const legacyPaymentDelay = formData.credit_autorise
    && formData.delai_paiement_jours !== ""
    && !paymentDelays.some((delay) => String(delay.value) === String(formData.delai_paiement_jours));

  const openCreate = () => {
    setEditingClient(null);
    setFormData(INITIAL_FORM);
    setOtherCity("");
    setContacts([]);
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (client) => {
    const paysCode = client.pays_code ?? "";
    const regionName = client.region_nom ?? client.region?.region ?? "";
    const region = moroccoRegions.find((item) => item.name === regionName);
    const storedCity = client.ville ?? "";
    const customMoroccoCity = paysCode === "MA"
      && storedCity
      && region
      && !region.cities.includes(storedCity);

    setEditingClient(client);
    setFormData({
      CodeClient: client.CodeClient ?? "",
      raison_sociale: client.raison_sociale ?? "",
      ice: client.ice ?? "",
      type_organisation: client.type_organisation ?? "",
      abreviation: client.abreviation ?? "",
      secteur_id: client.secteur_id ?? "",
      tele: client.tele ?? "",
      email: client.email ?? "",
      pays_code: paysCode,
      region_nom: regionName,
      ville: customMoroccoCity ? OTHER_CITY : storedCity,
      adresse: client.adresse ?? "",
      code_postal: client.code_postal ?? "",
      mod_id: client.mod_id ?? "",
      credit_autorise: Boolean(client.credit_autorise),
      delai_paiement_jours: client.delai_paiement_jours ?? "",
      plafond_credit: client.plafond_credit ?? "",
    });
    setOtherCity(customMoroccoCity ? storedCity : "");
    setContacts(getCompanyContacts(client).map((contact) => ({ ...contact })));
    setErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingClient(null);
    setFormData(INITIAL_FORM);
    setOtherCity("");
    setContacts([]);
    setErrors({});
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    clearErrors(name);
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
    clearErrors("pays_code", "region_nom", "ville", "ville_autre", "ice");
  };

  const handleRegionChange = (event) => {
    setFormData((previous) => ({ ...previous, region_nom: event.target.value, ville: "" }));
    setOtherCity("");
    clearErrors("region_nom", "ville", "ville_autre");
  };

  const handleCreditChange = (event) => {
    const enabled = event.target.checked;
    setFormData((previous) => ({
      ...previous,
      credit_autorise: enabled,
      delai_paiement_jours: enabled ? previous.delai_paiement_jours : "",
      plafond_credit: enabled ? previous.plafond_credit : "",
    }));
    clearErrors("credit_autorise", "delai_paiement_jours", "plafond_credit");
  };

  const addContact = () => setContacts((previous) => [
    ...previous,
    { name: "", prenom: "", telephone: "", email: "" },
  ]);

  const changeContact = (index, field, value) => {
    setContacts((previous) => previous.map((contact, contactIndex) => (
      contactIndex === index ? { ...contact, [field]: value } : contact
    )));
    clearErrors(`contacts.${index}.${field}`);
    if (field === "telephone" || field === "email") {
      clearErrors(`contacts.${index}.telephone`, `contacts.${index}.email`);
    }
  };

  const removeContact = (index) => {
    setContacts((previous) => previous.filter((_, contactIndex) => contactIndex !== index));
    setErrors((previous) => Object.fromEntries(
      Object.entries(previous).filter(([key]) => !key.startsWith("contacts."))
    ));
  };

  const isBlankContact = (contact) => [
    contact.name,
    contact.prenom,
    contact.telephone,
    contact.email,
  ].every((value) => !String(value ?? "").trim());

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
    if (formData.pays_code === "MA" && formData.ice && !/^\d{15}$/.test(formData.ice.trim())) {
      nextErrors.ice = "L’ICE doit contenir exactement 15 chiffres.";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "L’email général doit être une adresse valide.";
    }
    if (formData.type_organisation && !organizationTypes.some((type) => type.value === formData.type_organisation)) {
      nextErrors.type_organisation = "Le type d’organisation sélectionné est invalide.";
    }
    if (formData.pays_code && !countries.some((country) => country.code === formData.pays_code)) {
      nextErrors.pays_code = "Le pays sélectionné est invalide.";
    }
    if (formData.credit_autorise) {
      if (!String(formData.delai_paiement_jours).trim()) {
        nextErrors.delai_paiement_jours = "Le délai de paiement est obligatoire lorsque le crédit est autorisé.";
      } else if (!paymentDelays.some((delay) => String(delay.value) === String(formData.delai_paiement_jours))) {
        nextErrors.delai_paiement_jours = "Le délai de paiement sélectionné est invalide.";
      }
      if (!String(formData.plafond_credit).trim() || Number(formData.plafond_credit) <= 0) {
        nextErrors.plafond_credit = "Le plafond de crédit doit être supérieur à zéro.";
      }
    }

    const editingId = String(editingClient?.id ?? "");
    const normalizedIce = normalizeSearchValue(formData.ice);
    if (normalizedIce && clients.some((client) => (
      String(client.id) !== editingId && normalizeSearchValue(client.ice) === normalizedIce
    ))) nextErrors.ice = "Cet ICE / identifiant fiscal existe déjà.";

    contacts.forEach((contact, index) => {
      if (isBlankContact(contact)) return;
      if (!String(contact.name || "").trim()) {
        nextErrors[`contacts.${index}.name`] = "Le nom du contact est obligatoire.";
      }
      if (!String(contact.telephone || "").trim() && !String(contact.email || "").trim()) {
        nextErrors[`contacts.${index}.telephone`] = "Renseignez au moins un téléphone ou un email.";
      }
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
        nextErrors[`contacts.${index}.email`] = "L’email du contact doit être une adresse valide.";
      }
    });

    setValidationErrors(setErrors, nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const submittedContacts = contacts
      .map((contact, visibleIndex) => ({ contact, visibleIndex }))
      .filter(({ contact }) => !isBlankContact(contact));

    const payload = {
      raison_sociale: formData.raison_sociale.trim(),
      ice: formData.ice.trim(),
      type_organisation: formData.type_organisation,
      abreviation: formData.abreviation.trim() || null,
      secteur_id: formData.secteur_id || null,
      tele: formData.tele.trim(),
      email: formData.email.trim(),
      pays_code: formData.pays_code,
      region_nom: formData.region_nom.trim() || null,
      ville: formData.ville,
      ville_autre: formData.ville === OTHER_CITY ? otherCity.trim() : null,
      adresse: formData.adresse.trim(),
      code_postal: formData.code_postal.trim() || null,
      mod_id: formData.mod_id || null,
      credit_autorise: Boolean(formData.credit_autorise),
      delai_paiement_jours: formData.credit_autorise ? Number(formData.delai_paiement_jours) : null,
      plafond_credit: formData.credit_autorise ? formData.plafond_credit : null,
      contacts: submittedContacts.map(({ contact }) => ({
        ...(contact.id ? { id: contact.id } : {}),
        name: String(contact.name || "").trim(),
        prenom: String(contact.prenom || "").trim() || null,
        telephone: String(contact.telephone || "").trim() || null,
        email: String(contact.email || "").trim() || null,
      })),
    };

    try {
      const isCreating = !editingClient;
      const response = editingClient
        ? await axios.put(`${API_URL}/clients/${editingClient.id}`, payload)
        : await axios.post(`${API_URL}/clients`, payload);
      const generatedCode = response.data?.client?.CodeClient;
      await fetchClients(true);
      closeDrawer();
      await Swal.fire({
        icon: "success",
        title: "Succès",
        text: isCreating
          ? generatedCode
            ? `Client société créé avec succès. Code client : ${generatedCode}`
            : "Client société créé avec succès."
          : response.data?.message || "Le client société a été enregistré.",
      });
    } catch (error) {
      if (error?.response?.status === 422) {
        const backendErrors = error.response.data?.errors || {};
        const mappedErrors = Object.fromEntries(Object.entries(backendErrors).map(([field, messages]) => {
          const contactMatch = field.match(/^contacts\.(\d+)\.(.+)$/);
          if (!contactMatch) return [field, messages];
          const payloadIndex = Number(contactMatch[1]);
          const visibleIndex = submittedContacts[payloadIndex]?.visibleIndex ?? payloadIndex;
          return [`contacts.${visibleIndex}.${contactMatch[2]}`, messages];
        }));
        setValidationErrors(setErrors, mappedErrors);
        return;
      }
      await Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error?.response?.data?.message || error?.response?.data?.error || "Impossible d’enregistrer ce client société.",
      });
    }
  };

  const deleteErrorMessage = (error) => error?.response?.data?.message
    || error?.response?.data?.error
    || "Impossible de supprimer ce client société.";

  const handleDelete = async (id) => {
    const confirmation = await Swal.fire({
      title: "Supprimer ce client société ?",
      showCancelButton: true,
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/clients/${id}`);
      setSelectedItems((previous) => previous.filter((selectedId) => String(selectedId) !== String(id)));
      await fetchClients(true);
      await Swal.fire({ icon: "success", title: "Succès", text: "Client société supprimé avec succès." });
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
    const results = await Promise.allSettled(selectedIds.map((id) => axios.delete(`${API_URL}/clients/${id}`)));
    const successfulIds = results.flatMap((result, index) => result.status === "fulfilled" ? [selectedIds[index]] : []);
    const failureMessages = [...new Set(results.flatMap((result) => (
      result.status === "rejected" ? [deleteErrorMessage(result.reason)] : []
    )))];

    if (successfulIds.length) {
      setSelectedItems((previous) => previous.filter((id) => (
        !successfulIds.some((successfulId) => String(successfulId) === String(id))
      )));
      await fetchClients(true);
    }
    const failedCount = selectedIds.length - successfulIds.length;
    const detail = failureMessages.length ? ` ${failureMessages.join(" ")}` : "";
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
      if (organizationFilter && String(client.type_organisation || "") !== String(organizationFilter)) return false;
      if (sectorFilter && String(client.secteur_id || "") !== String(sectorFilter)) return false;
      if (countryFilter && String(client.pays_code || "") !== String(countryFilter)) return false;
      if (regionFilter && String(client.region_nom || "") !== String(regionFilter)) return false;
      if (cityFilter && String(client.ville || "") !== String(cityFilter)) return false;
      if (!needle) return true;

      const contactsSearch = getCompanyContacts(client).flatMap((contact) => [
        contact.name,
        contact.prenom,
        contact.telephone,
        contact.email,
      ]);
      const creditLabel = client.credit_autorise ? "Oui paiement à crédit autorisé" : "Non paiement à crédit non autorisé";
      const values = [
        client.CodeClient,
        client.raison_sociale,
        client.ice,
        organizationLabels[client.type_organisation],
        client.abreviation,
        sectorLabels[String(client.secteur_id)],
        client.tele,
        client.email,
        countryNames[client.pays_code],
        client.region_nom,
        client.ville,
        client.adresse,
        client.code_postal,
        paymentLabels[String(client.mod_id)],
        creditLabel,
        client.delai_paiement_jours,
        ...getNumberSearchVariants(client.plafond_credit, { suffixes: ["DH"] }),
        ...contactsSearch,
      ];
      return values.some((value) => normalizeSearchValue(value).includes(needle));
    });
  }, [cityFilter, countryFilter, countryNames, organizationFilter, organizationLabels, paymentLabels, regionFilter, sectorFilter, sectorLabels]);

  const {
    searchTerm, page, rowsPerPage, filteredRows, visibleRows, totalRows,
    setSearchTerm, setPage, setRowsPerPage, resetPage,
  } = useListControls({
    allRows: clients,
    filterRows: filterClients,
    storageKey: "rowsPerPageClientsSociete",
  });

  const filtersActive = Boolean(
    searchTerm || organizationFilter || sectorFilter || countryFilter || regionFilter || cityFilter
  );
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setOrganizationFilter("");
    setSectorFilter("");
    setCountryFilter("");
    setRegionFilter("");
    setCityFilter("");
    resetPage();
  }, [resetPage, setSearchTerm]);

  const exportRows = useMemo(() => filteredRows.map((client) => ({
    code: client.CodeClient || "",
    raisonSociale: client.raison_sociale || "",
    ice: client.ice || "À compléter",
    typeOrganisation: organizationLabels[client.type_organisation] || "À compléter",
    abreviation: client.abreviation || "—",
    secteur: sectorLabels[String(client.secteur_id)] || client.secteur?.secteurClient || "—",
    telephone: client.tele || "À compléter",
    email: client.email || "À compléter",
    pays: countryNames[client.pays_code] || "À compléter",
    region: client.region_nom || "—",
    ville: client.ville || "À compléter",
    adresse: client.adresse || "À compléter",
    codePostal: client.code_postal || "—",
    modeReglement: paymentLabels[String(client.mod_id)] || "—",
    creditAutorise: client.credit_autorise ? "Oui" : "Non",
    delai: client.credit_autorise && client.delai_paiement_jours ? `${client.delai_paiement_jours} jours` : "—",
    plafond: client.credit_autorise ? formatMoney(client.plafond_credit) : "—",
  })), [countryNames, filteredRows, organizationLabels, paymentLabels, sectorLabels]);

  const exportToExcel = () => exportToExcelRows({
    rows: exportRows,
    columns: EXPORT_COLUMNS,
    sheetName: "Clients société",
    filename: "clients_societe.xlsx",
  });
  const exportToPDF = () => exportToPdf({
    rows: exportRows,
    columns: EXPORT_COLUMNS,
    title: "Liste des Clients Société",
    filename: "clients_societe.pdf",
    orientation: "landscape",
    columnWidths: EXPORT_WIDTHS,
  });
  const printTable = () => printRows({
    rows: exportRows,
    columns: EXPORT_COLUMNS,
    title: "Liste des Clients Société",
    orientation: "landscape",
    columnWidths: EXPORT_WIDTHS,
  });

  const visibleIds = visibleRows.map((client) => client.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedItems.includes(id));
  const handleSelectAllChange = () => setSelectedItems((previous) => allVisibleSelected
    ? previous.filter((id) => !visibleIds.includes(id))
    : [...new Set([...previous, ...visibleIds])]
  );
  const handleCheckboxChange = (id) => setSelectedItems((previous) => previous.includes(id)
    ? previous.filter((selectedId) => selectedId !== id)
    : [...previous, id]
  );
  const toggleContacts = (id) => setExpandedRows((previous) => ({ ...previous, [id]: !previous[id] }));

  const columns = useMemo(() => [
    { key: "CodeClient", label: "Code", width: 140, render: (client, term) => highlightText(showValue(client.CodeClient, true), term) },
    { key: "raison_sociale", label: "Raison sociale", width: 210, render: (client, term) => highlightText(showValue(client.raison_sociale, true), term) },
    { key: "ice", label: "ICE / Identifiant fiscal", width: 180, render: (client, term) => highlightText(showValue(client.ice, true), term) },
    { key: "type_organisation", label: "Type d’organisation", width: 190, render: (client, term) => highlightText(organizationLabels[client.type_organisation] || "À compléter", term) },
    { key: "secteur_id", label: "Secteur d’activité", width: 170, render: (client, term) => highlightText(sectorLabels[String(client.secteur_id)] || client.secteur?.secteurClient || "—", term) },
    { key: "tele", label: "Téléphone", width: 140, render: (client, term) => highlightText(showValue(client.tele, true), term) },
    { key: "email", label: "Email", width: 220, render: (client, term) => highlightText(showValue(client.email, true), term) },
    { key: "pays_code", label: "Pays", width: 120, render: (client, term) => highlightText(countryNames[client.pays_code] || "À compléter", term) },
    { key: "region_nom", label: "Région / Province", width: 210, render: (client, term) => highlightText(showValue(client.region_nom), term) },
    { key: "ville", label: "Ville", width: 130, render: (client, term) => highlightText(showValue(client.ville, true), term) },
    {
      key: "contacts",
      label: "Contacts",
      width: 100,
      stickyRight: true,
      stickyRightOffset: 92,
      render: (client, _term, toggleRowExpansion) => {
        const count = getCompanyContacts(client).length;
        return (
          <button
            type="button"
            className={`company-contacts-count ${count ? "has-contacts" : ""}`}
            onClick={() => toggleRowExpansion(client.id)}
            aria-expanded={Boolean(expandedRows[client.id])}
            title="Afficher les contacts"
          >
            <PeopleIcon style={{ fontSize: 16 }} />
            <span>{count}</span>
          </button>
        );
      },
    },
  ], [countryNames, expandedRows, organizationLabels, sectorLabels]);

  const renderCompanyContacts = (client) => {
    const rows = getCompanyContacts(client);
    return (
      <div className="company-expanded-contacts">
        <div className="company-contacts-details-header">Contacts de {showValue(client.raison_sociale)}</div>
        {rows.length ? (
          <table className="app-table company-contacts-details-table">
            <thead><tr><th>Nom</th><th>Prénom</th><th>Téléphone</th><th>Email</th></tr></thead>
            <tbody>
              {rows.map((contact, index) => (
                <tr key={contact.id || `${client.id}-contact-${index}`}>
                  <td>{contact.name || "—"}</td>
                  <td>{contact.prenom || "—"}</td>
                  <td>{contact.telephone || "—"}</td>
                  <td>{contact.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="company-expanded-contacts-empty">Aucun contact renseigné pour cette société.</p>}
      </div>
    );
  };

  const lookupConfig = lookupManager === "sector"
    ? { title: "Secteurs d’activité", field: "secteurClient", endpoint: "secteur_clients", rows: sectors }
    : { title: "Modes de règlement", field: "mode_paimants", endpoint: "mode-paimants", rows: paymentModes };

  const openLookupManager = (type) => {
    setLookupManager(type);
    setLookupDraft("");
    setEditingLookupId(null);
  };
  const closeLookupManager = () => {
    setLookupManager(null);
    setLookupDraft("");
    setEditingLookupId(null);
  };
  const lookupLabel = (row) => row?.[lookupConfig.field] || "";
  const editLookup = (row) => {
    setEditingLookupId(row.id);
    setLookupDraft(lookupLabel(row));
  };
  const saveLookup = async () => {
    const value = lookupDraft.trim();
    if (!value) {
      await Swal.fire({ icon: "error", title: "Champ obligatoire", text: "Le nom ne peut pas être vide." });
      return;
    }
    setLookupSaving(true);
    try {
      const payload = { [lookupConfig.field]: value };
      if (editingLookupId) await axios.put(`${API_URL}/${lookupConfig.endpoint}/${editingLookupId}`, payload);
      else await axios.post(`${API_URL}/${lookupConfig.endpoint}`, payload);
      await fetchClients(true);
      setLookupDraft("");
      setEditingLookupId(null);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error?.response?.data?.message || error?.response?.data?.error || "Impossible d’enregistrer cette valeur.",
      });
    } finally {
      setLookupSaving(false);
    }
  };
  const deleteLookup = async (row) => {
    const confirmation = await Swal.fire({
      title: `Supprimer « ${lookupLabel(row)} » ?`,
      showCancelButton: true,
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/${lookupConfig.endpoint}/${row.id}`);
      await fetchClients(true);
      await Swal.fire({ icon: "success", title: "Succès", text: "La valeur a été supprimée." });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Suppression impossible",
        text: error?.response?.data?.message || error?.response?.data?.error || "Impossible de supprimer cette valeur.",
      });
    }
  };

  return (
    <Box sx={{ ...dynamicStyles, width: "auto", maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
      <Box
        component="main"
        className="app-page clients-societe-page"
        sx={{ flexGrow: 1, p: 3, mt: 0, width: "100%", maxWidth: "100%", minWidth: 0 }}
      >
        <SearchWithExport
          Title="Liste des Clients Société"
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
          <div className="app-filter-controls company-filter-controls">
            <Form.Select className="app-filter-select" value={organizationFilter} onChange={(event) => { setOrganizationFilter(event.target.value); resetPage(); }}>
              <option value="">Tous les types d’organisation</option>
              {organizationTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </Form.Select>
            <Form.Select className="app-filter-select" value={sectorFilter} onChange={(event) => { setSectorFilter(event.target.value); resetPage(); }}>
              <option value="">Tous les secteurs</option>
              {sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.secteurClient}</option>)}
            </Form.Select>
            <Form.Select className="app-filter-select" value={countryFilter} onChange={(event) => { setCountryFilter(event.target.value); setRegionFilter(""); setCityFilter(""); resetPage(); }}>
              <option value="">Tous les pays</option>
              {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
            </Form.Select>
            <Form.Select className="app-filter-select" value={regionFilter} onChange={(event) => { setRegionFilter(event.target.value); setCityFilter(""); resetPage(); }}>
              <option value="">Toutes les régions / provinces</option>
              {regionFilterOptions.map((region) => <option key={region} value={region}>{region}</option>)}
            </Form.Select>
            <Form.Select className="app-filter-select" value={cityFilter} onChange={(event) => { setCityFilter(event.target.value); resetPage(); }}>
              <option value="">Toutes les villes</option>
              {cityFilterOptions.map((city) => <option key={city} value={city}>{city}</option>)}
            </Form.Select>
            <ListFilterReset active={filtersActive} onReset={resetFilters} />
          </div>
        </div>

        {optionsError && <div className="app-list-state is-error" role="alert">{optionsError}</div>}

        <aside className={`app-form-drawer company-drawer ${drawerOpen ? "is-open" : ""}`} aria-hidden={!drawerOpen}>
          <Form onSubmit={handleSubmit} noValidate>
            <h4 className="app-form-drawer-title">{editingClient ? "Modifier" : "Ajouter"} un client société</h4>
            <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>

            <section className="company-form-section">

              <div className="company-form-grid">
                {editingClient && (
                  <CompanyField label="Code client">
                    <Form.Control
                      name="CodeClient"
                      value={formData.CodeClient}
                      readOnly
                      aria-readonly="true"
                    />
                  </CompanyField>
                )}
                <CompanyField label="Raison sociale" required error={getFieldError("raison_sociale")}>
                  <Form.Control name="raison_sociale" value={formData.raison_sociale} onChange={handleChange} isInvalid={Boolean(getFieldError("raison_sociale"))} />
                </CompanyField>
                <CompanyField label="ICE / Identifiant fiscal" required error={getFieldError("ice")}>
                  <Form.Control name="ice" value={formData.ice} onChange={handleChange} isInvalid={Boolean(getFieldError("ice"))} />
                </CompanyField>
                <CompanyField label="Type d’organisation" required error={getFieldError("type_organisation")}>
                  <Form.Select name="type_organisation" value={formData.type_organisation} onChange={handleChange} isInvalid={Boolean(getFieldError("type_organisation"))}>
                    <option value="">Sélectionner</option>
                    {legacyOrganizationType && <option value={formData.type_organisation}>{formData.type_organisation} (à corriger)</option>}
                    {organizationTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </Form.Select>
                </CompanyField>
                <CompanyField label="Abréviation" error={getFieldError("abreviation")}>
                  <Form.Control name="abreviation" value={formData.abreviation} onChange={handleChange} isInvalid={Boolean(getFieldError("abreviation"))} />
                </CompanyField>
                <CompanyField label="Secteur d’activité" error={getFieldError("secteur_id")}>
                  <div className="company-lookup-control">
                    <Form.Select name="secteur_id" value={formData.secteur_id} onChange={handleChange} isInvalid={Boolean(getFieldError("secteur_id"))}>
                      <option value="">Aucun</option>
                      {sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.secteurClient}</option>)}
                    </Form.Select>
                    <button type="button" className="app-secondary-button" onClick={() => openLookupManager("sector")} title="Gérer les secteurs"><FontAwesomeIcon icon={faPlus} /></button>
                  </div>
                </CompanyField>
              </div>
            </section>

            <section className="company-form-section">
              <h5>Coordonnées et siège social</h5>
              <div className="company-form-grid">
                <CompanyField label="Téléphone" required error={getFieldError("tele")}>
                  <Form.Control name="tele" type="tel" value={formData.tele} onChange={handleChange} isInvalid={Boolean(getFieldError("tele"))} />
                </CompanyField>
                <CompanyField label="Email général" required error={getFieldError("email")}>
                  <Form.Control name="email" type="email" value={formData.email} onChange={handleChange} isInvalid={Boolean(getFieldError("email"))} />
                </CompanyField>
                <CompanyField label="Pays" required error={getFieldError("pays_code")}>
                  <Form.Select name="pays_code" value={formData.pays_code} onChange={handleCountryChange} isInvalid={Boolean(getFieldError("pays_code"))}>
                    <option value="">Sélectionner un pays</option>
                    {legacyCountry && <option value={formData.pays_code}>{formData.pays_code} (à corriger)</option>}
                    {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                  </Form.Select>
                </CompanyField>
                {formData.pays_code === "MA" ? (
                  <CompanyField label="Région" required error={getFieldError("region_nom")}>
                    <Form.Select name="region_nom" value={formData.region_nom} onChange={handleRegionChange} isInvalid={Boolean(getFieldError("region_nom"))}>
                      <option value="">Sélectionner une région</option>
                      {legacyMoroccoRegion && <option value={formData.region_nom}>{formData.region_nom} (à corriger)</option>}
                      {moroccoRegions.map((region) => <option key={region.name} value={region.name}>{region.name}</option>)}
                    </Form.Select>
                  </CompanyField>
                ) : (
                  <CompanyField label="Région / Province" error={getFieldError("region_nom")}>
                    <Form.Control name="region_nom" value={formData.region_nom} onChange={handleChange} isInvalid={Boolean(getFieldError("region_nom"))} />
                  </CompanyField>
                )}
                {formData.pays_code === "MA" ? (
                  <CompanyField label="Ville" required field={formData.ville === OTHER_CITY ? "ville_autre" : "ville"} error={getFieldError("ville") || getFieldError("ville_autre")}>
                    <Form.Select name="ville" value={formData.ville} onChange={(event) => { setFormData((previous) => ({ ...previous, ville: event.target.value })); setOtherCity(""); clearErrors("ville", "ville_autre"); }} disabled={!currentMoroccoRegion} isInvalid={Boolean(getFieldError("ville") || getFieldError("ville_autre"))}>
                      <option value="">Sélectionner une ville</option>
                      {legacyMoroccoCity && <option value={formData.ville}>{formData.ville} (à corriger)</option>}
                      {currentMoroccoCities.map((city) => <option key={city} value={city}>{city}</option>)}
                    </Form.Select>
                    {formData.ville === OTHER_CITY && <Form.Control className="mt-2" name="ville_autre" value={otherCity} onChange={(event) => { setOtherCity(event.target.value); clearErrors("ville", "ville_autre"); }} placeholder="Préciser la ville" isInvalid={Boolean(getFieldError("ville_autre"))} />}
                  </CompanyField>
                ) : (
                  <CompanyField label="Ville" required error={getFieldError("ville")}>
                    <Form.Control name="ville" value={formData.ville} onChange={handleChange} isInvalid={Boolean(getFieldError("ville"))} />
                  </CompanyField>
                )}
                <CompanyField label="Adresse" required error={getFieldError("adresse")}>
                  <Form.Control name="adresse" value={formData.adresse} onChange={handleChange} isInvalid={Boolean(getFieldError("adresse"))} />
                </CompanyField>
                <CompanyField label="Code postal" error={getFieldError("code_postal")}>
                  <Form.Control name="code_postal" value={formData.code_postal} onChange={handleChange} isInvalid={Boolean(getFieldError("code_postal"))} />
                </CompanyField>
              </div>
            </section>

            <section className="company-form-section">
              <h5>Conditions commerciales</h5>
              <div className="company-form-grid">
                <CompanyField label="Mode de règlement par défaut" error={getFieldError("mod_id")}>
                  <div className="company-lookup-control">
                    <Form.Select name="mod_id" value={formData.mod_id} onChange={handleChange} isInvalid={Boolean(getFieldError("mod_id"))}>
                      <option value="">Aucun</option>
                      {paymentModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.mode_paimants}</option>)}
                    </Form.Select>
                    <button type="button" className="app-secondary-button" onClick={() => openLookupManager("payment")} title="Gérer les modes de règlement"><FontAwesomeIcon icon={faPlus} /></button>
                  </div>
                </CompanyField>
                <CompanyField label="Paiement à crédit autorisé" error={getFieldError("credit_autorise")}>
                  <Form.Check type="switch" name="credit_autorise" checked={formData.credit_autorise} onChange={handleCreditChange} label={formData.credit_autorise ? "Oui" : "Non"} />
                </CompanyField>
                {formData.credit_autorise && (
                  <>
                    <CompanyField label="Délai de paiement" required error={getFieldError("delai_paiement_jours")}>
                      <Form.Select name="delai_paiement_jours" value={formData.delai_paiement_jours} onChange={handleChange} isInvalid={Boolean(getFieldError("delai_paiement_jours"))}>
                        <option value="">Sélectionner</option>
                        {legacyPaymentDelay && <option value={formData.delai_paiement_jours}>{formData.delai_paiement_jours} jours (à corriger)</option>}
                        {paymentDelays.map((delay) => <option key={delay.value} value={delay.value}>{delay.label}</option>)}
                      </Form.Select>
                    </CompanyField>
                    <CompanyField label="Plafond de crédit (DH)" required error={getFieldError("plafond_credit")}>
                      <Form.Control name="plafond_credit" type="number" min="0.01" step="0.01" value={formData.plafond_credit} onChange={handleChange} isInvalid={Boolean(getFieldError("plafond_credit"))} />
                    </CompanyField>
                  </>
                )}
              </div>
            </section>

            <section className="company-form-section">
              <div className="company-section-heading">
                <h5>Contacts</h5>
                <button type="button" className="app-secondary-button" onClick={addContact}><FontAwesomeIcon icon={faPlus} /> Ajouter un contact</button>
              </div>
              {contacts.length > 0 && (
                <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Pour chaque contact ajouté : nom et au moins un téléphone ou un email.</p>
              )}
              <div className="app-table-wrapper company-contact-editor">
                <table className="app-table">
                  <colgroup><col style={{ width: "22%" }} /><col style={{ width: "20%" }} /><col style={{ width: "20%" }} /><col style={{ width: "30%" }} /><col style={{ width: "8%" }} /></colgroup>
                  <thead><tr><th><RequiredLabel required>Nom</RequiredLabel></th><th>Prénom</th><th>Téléphone</th><th>Email</th><th>Action</th></tr></thead>
                  <tbody>
                    {contacts.length === 0 && <tr><td colSpan={5}>Aucun contact renseigné.</td></tr>}
                    {contacts.map((contact, index) => (
                      <tr key={contact.id || `new-contact-${index}`}>
                        {[
                          ["name", "text"],
                          ["prenom", "text"],
                          ["telephone", "tel"],
                          ["email", "email"],
                        ].map(([field, type]) => (
                          <td key={field}>
                            <Form.Control data-field={`contacts.${index}.${field}`} name={`contacts.${index}.${field}`} type={type} value={contact[field] ?? ""} onChange={(event) => changeContact(index, field, event.target.value)} isInvalid={Boolean(getFieldError(`contacts.${index}.${field}`))} aria-invalid={Boolean(getFieldError(`contacts.${index}.${field}`))} />
                            {getFieldError(`contacts.${index}.${field}`) && <div className="invalid-feedback d-block app-field-error">{getFieldError(`contacts.${index}.${field}`)}</div>}
                          </td>
                        ))}
                        <td><button type="button" className="app-table-action is-delete" title="Supprimer" onClick={() => removeContact(index)}><FontAwesomeIcon icon={faTrash} /></button></td>
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

        <Modal
          show={Boolean(lookupManager)}
          onHide={closeLookupManager}
          centered
          size="lg"
          dialogClassName="company-lookup-modal"
        >
          <Modal.Header closeButton><Modal.Title>{lookupConfig.title}</Modal.Title></Modal.Header>
          <Modal.Body>
            <div className="company-lookup-editor">
              <Form.Control value={lookupDraft} onChange={(event) => setLookupDraft(event.target.value)} placeholder="Nom" />
              <Button className="app-primary-button" onClick={saveLookup} disabled={lookupSaving}>{editingLookupId ? "Modifier" : "Ajouter"}</Button>
              {editingLookupId && <Button className="app-secondary-button" onClick={() => { setEditingLookupId(null); setLookupDraft(""); }}>Annuler</Button>}
            </div>
            <div className="app-table-wrapper company-lookup-table">
              <table className="app-table">
                <thead><tr><th>Nom</th><th>Actions</th></tr></thead>
                <tbody>
                  {lookupConfig.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{lookupLabel(row)}</td>
                      <td>
                        <div className="app-table-actions">
                          <button
                            type="button"
                            className="company-lookup-action-button"
                            onClick={() => editLookup(row)}
                            title="Modifier"
                            aria-label={`Modifier ${lookupLabel(row)}`}
                          >
                            <FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" />
                          </button>
                          <button
                            type="button"
                            className="company-lookup-action-button"
                            onClick={() => deleteLookup(row)}
                            title="Supprimer"
                            aria-label={`Supprimer ${lookupLabel(row)}`}
                          >
                            <FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Modal.Body>
        </Modal>

        <ListState
          loading={loading}
          error={loadError}
          allRowsCount={clients.length}
          filteredRowsCount={totalRows}
          emptyDataMessage="Aucun client société enregistré."
          onRetry={() => fetchClients(false)}
          onResetFilters={resetFilters}
        />

        {!loading && !loadError && totalRows > 0 && (
          <div className="app-table-wrapper company-table-wrapper" style={{ marginTop: 20 }}>
            <ExpandRTable
              columns={columns}
              data={clients}
              filteredData={visibleRows}
              searchTerm={searchTerm}
              highlightText={highlightText}
              selectAll={allVisibleSelected}
              selectedItems={selectedItems}
              handleSelectAllChange={handleSelectAllChange}
              handleCheckboxChange={handleCheckboxChange}
              handleEdit={openEdit}
              handleDelete={handleDelete}
              handleDeleteSelected={handleDeleteSelected}
              rowsPerPage={rowsPerPage}
              page={page}
              expandedRows={expandedRows}
              toggleRowExpansion={toggleContacts}
              renderExpandedRow={renderCompanyContacts}
              renderCustomActions={null}
              uiVariant="app"
              forceHorizontalScroll
              externalPagination
              paginationComponent={<ListPagination page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />}
            />
          </div>
        )}
      </Box>
    </Box>
  );
};

export default ClientList;
