import { useCallback, useMemo, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBellConcierge,
  faBroom,
  faBuilding,
  faCalendarCheck,
  faCircleExclamation,
  faClock,
  faComments,
  faPlus,
  faScrewdriverWrench,
  faShieldHalved,
  faSpinner,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useOpen } from "../Acceuil/OpenProvider";
import SearchWithExport from "../components/SearchWithExport";
import AppStats from "../components/AppStats";
import ListFilterReset from "../components/ListFilterReset";
import ListState from "../components/ListState";
import VisualFilterCarousel from "../components/VisualFilterCarousel";
import useListControls from "../components/useListControls";
import { exportToExcel, exportToPdf, printRows } from "../utils/listExportUtils";
import { matchesNormalizedSearch, normalizeSearchValue } from "../utils/textUtils";
import {
  cancelReclamation,
  changeReclamationStatus,
  getReclamation,
  getReclamationFormOptions,
  listReclamations,
} from "./api/reclamationApi";
import ReclamationDrawer from "./components/ReclamationDrawer";
import ReclamationList from "./components/ReclamationList";
import ReclamationLookupManager from "./components/ReclamationLookupManager";
import { apiErrorMessage, formatDate } from "./reclamationUtils";
import "../style.css";
import "./Reclamation.css";

const EMPTY_OPTIONS = { types: [], canaux: [], departements: [], priorites: [], reservations: [], clients: { societe: [], particulier: [] } };

const EXPORT_COLUMNS = [
  { key: "numero", label: "N° Réclamation" },
  { key: "date", label: "Date" },
  { key: "type", label: "Type de réclamation" },
  { key: "description", label: "Description" },
  { key: "canal", label: "Canal de réception" },
  { key: "precision", label: "Précision du canal" },
  { key: "client", label: "Client" },
  { key: "reservation", label: "N° Réservation" },
  { key: "chambre", label: "Chambre" },
  { key: "departement", label: "Département" },
  { key: "priorite", label: "Priorité" },
  { key: "statut", label: "Statut" },
  { key: "reponse", label: "Réponse" },
  { key: "resolution", label: "Date de résolution" },
  { key: "annulation", label: "Date d’annulation" },
  { key: "motif", label: "Motif d’annulation" },
];

const arrayWithoutKey = (source, key) => Object.fromEntries(Object.entries(source).filter(([entryKey]) => String(entryKey) !== String(key)));
const REFRESH_WARNING = "L’opération a été enregistrée, mais l’affichage n’a pas pu être actualisé. Rechargez les données.";

const upsertRow = (rows, saved) => {
  const index = rows.findIndex((row) => String(row.id) === String(saved.id));
  if (index < 0) return [saved, ...rows];
  return rows.map((row, rowIndex) => (rowIndex === index ? saved : row));
};

const lookupCollection = { type: "types", canal: "canaux", departement: "departements" };

const departmentIcon = (name) => {
  const normalizedName = normalizeSearchValue(name);

  if (normalizedName.includes("reception")) return faBellConcierge;
  if (normalizedName.includes("maintenance")) return faScrewdriverWrench;
  if (normalizedName.includes("menage") || normalizedName.includes("nettoyage") || normalizedName.includes("housekeeping")) return faBroom;
  if (normalizedName.includes("restaur")) return faUtensils;
  if (normalizedName.includes("conciergerie")) return faBellConcierge;
  if (normalizedName.includes("securite")) return faShieldHalved;
  if (normalizedName.includes("reservation")) return faCalendarCheck;

  return faBuilding;
};

const mergeLookupOption = (current, kind, saved) => {
  const key = lookupCollection[kind];
  if (!key) return current;

  const withoutSaved = (current[key] || []).filter((row) => String(row.id) !== String(saved.id));
  const rows = saved.actif === false ? withoutSaved : [...withoutSaved, saved];
  rows.sort((left, right) => (left.nom || "").localeCompare(right.nom || "", "fr"));
  return { ...current, [key]: rows };
};

const ReclamationPage = () => {
  const { dynamicStyles } = useOpen();
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [optionsError, setOptionsError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [managerKind, setManagerKind] = useState(null);
  const [lookupSelection, setLookupSelection] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [details, setDetails] = useState({});
  const [detailLoading, setDetailLoading] = useState({});
  const [detailErrors, setDetailErrors] = useState({});
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try { setReclamations(await listReclamations()); }
    catch (error) { setLoadError(apiErrorMessage(error, "Échec du chargement des réclamations.")); }
    finally { setLoading(false); }
  }, []);

  const fetchOptions = useCallback(async (refresh = false) => {
    setOptionsError("");
    try { setOptions(await getReclamationFormOptions({ refresh })); }
    catch (error) { setOptionsError(apiErrorMessage(error, "Impossible de charger les options du formulaire.")); }
  }, []);

  useEffect(() => { fetchRows(); fetchOptions(); }, [fetchRows, fetchOptions]);

  const filterRows = useCallback((rows, searchTerm) => rows.filter((row) => {
    const searchMatch = matchesNormalizedSearch(searchTerm, [
      row.numero, row.objet?.nom, row.description, row.client?.display_name,
      row.reservation?.numero, row.chambre?.numero, row.canal?.nom,
      row.canal?.precision, row.departement?.nom, row.priorite_label,
      row.statut, row.reponse,
    ]);
    return searchMatch
      && (!departmentFilter || String(row.departement?.id) === departmentFilter)
      && (!statusFilter || row.statut === statusFilter)
      && (!priorityFilter || row.priorite === priorityFilter)
      && (!typeFilter || String(row.objet?.id) === typeFilter)
      && (!channelFilter || String(row.canal?.id) === channelFilter)
      && (!dateFrom || row.date >= dateFrom)
      && (!dateTo || row.date <= dateTo);
  }), [departmentFilter, statusFilter, priorityFilter, typeFilter, channelFilter, dateFrom, dateTo]);

  const { searchTerm, page, rowsPerPage, filteredRows, visibleRows, totalRows, setSearchTerm, setPage, setRowsPerPage, resetPage } = useListControls({ allRows: reclamations, filterRows, storageKey: "reclamations.rowsPerPage" });

  const setFilter = (setter) => (event) => { setter(event.target.value); resetPage(); };
  const filtersActive = Boolean(searchTerm || departmentFilter || statusFilter || priorityFilter || typeFilter || channelFilter || dateFrom || dateTo);
  const reclamationStats = useMemo(() => [
    { key: "total", title: "Total réclamations", value: reclamations.length, icon: faComments, variant: "primary" },
    { key: "pending", title: "En attente", value: reclamations.filter((row) => row.statut === "En attente").length, icon: faClock, variant: "warning" },
    { key: "progress", title: "En cours", value: reclamations.filter((row) => row.statut === "En cours").length, icon: faSpinner, variant: "info" },
    { key: "urgent-open", title: "Urgentes ouvertes", value: reclamations.filter((row) => row.priorite === "urgente" && !["Résolu", "Annulé"].includes(row.statut)).length, icon: faCircleExclamation, variant: "danger" },
  ], [reclamations]);
  const resetFilters = () => {
    setSearchTerm(""); setDepartmentFilter(""); setStatusFilter(""); setPriorityFilter("");
    setTypeFilter(""); setChannelFilter(""); setDateFrom(""); setDateTo(""); resetPage();
  };

  const filterOptions = useMemo(() => ({
    types: [...new Map(reclamations.map((row) => [row.objet?.id, row.objet]).filter(([id]) => id)).values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    channels: [...new Map(reclamations.map((row) => [row.canal?.id, row.canal]).filter(([id]) => id)).values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
  }), [reclamations]);

  const departmentOptions = useMemo(
    () => (options.departements || [])
      .filter((department) => department.actif !== false)
      .slice()
      .sort((left, right) => (left.nom || "").localeCompare(right.nom || "", "fr")),
    [options.departements]
  );

  const exportRows = useMemo(() => filteredRows.map((row) => ({
    numero: row.numero || "—", date: formatDate(row.date), type: row.objet?.nom || "—",
    description: row.description || "—", canal: row.canal?.nom || "—", precision: row.canal?.precision || "—",
    client: row.client?.display_name || "—", reservation: row.reservation?.numero || "—", chambre: row.chambre?.numero || "—",
    departement: row.departement?.nom || "—", priorite: row.priorite_label || "—", statut: row.statut || "—",
    reponse: row.reponse || "—", resolution: formatDate(row.resolved_at), annulation: formatDate(row.cancellation?.cancelled_at), motif: row.cancellation?.reason || "—",
  })), [filteredRows]);

  const loadDetail = useCallback(async (id, force = false) => {
    if (!force && (details[id] || detailLoading[id])) return;
    setDetailLoading((previous) => ({ ...previous, [id]: true }));
    setDetailErrors((previous) => arrayWithoutKey(previous, id));
    try {
      const detail = await getReclamation(id);
      setDetails((previous) => ({ ...previous, [id]: detail }));
    }
    catch (error) { setDetailErrors((previous) => ({ ...previous, [id]: apiErrorMessage(error, "Impossible de charger le détail.") })); }
    finally { setDetailLoading((previous) => arrayWithoutKey(previous, id)); }
  }, [details, detailLoading]);

  const toggleRow = (row) => {
    const opening = !expandedRows[row.id];
    setExpandedRows((previous) => ({ ...previous, [row.id]: opening }));
    if (opening) loadDetail(row.id);
  };

  const applySavedReclamation = useCallback((saved) => {
    setReclamations((previous) => upsertRow(previous, saved));
    setDetails((previous) => ({ ...previous, [saved.id]: saved }));
    setDetailErrors((previous) => arrayWithoutKey(previous, saved.id));
  }, []);

  const reconcileComplaint = useCallback(async (id) => {
    const refreshes = [
      listReclamations().then((rows) => {
        setReclamations(rows);
        setLoadError("");
      }),
    ];

    if (expandedRows[id]) {
      refreshes.push(
        getReclamation(id).then((detail) => {
          setDetails((previous) => ({ ...previous, [id]: detail }));
          setDetailErrors((previous) => arrayWithoutKey(previous, id));
        })
      );
    }

    const results = await Promise.allSettled(refreshes);
    return results.every((result) => result.status === "fulfilled");
  }, [expandedRows]);

  const finishSuccessfulMutation = useCallback(async (saved, successAlert) => {
    applySavedReclamation(saved);
    await Swal.fire(successAlert);
    const refreshed = await reconcileComplaint(saved.id);
    if (!refreshed) {
      await Swal.fire("Actualisation incomplète", REFRESH_WARNING, "warning");
    }
  }, [applySavedReclamation, reconcileComplaint]);

  const handleSaved = (saved, wasEdit) => {
    void finishSuccessfulMutation(saved, {
      icon: "success",
      title: wasEdit ? "Réclamation modifiée" : "Réclamation enregistrée",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const performStatus = async (row, payload) => {
    let saved;
    try { saved = await changeReclamationStatus(row.id, payload); }
    catch (error) {
      await Swal.fire("Action impossible", apiErrorMessage(error, "Impossible de modifier le statut."), "error");
      return;
    }
    await finishSuccessfulMutation(saved, { icon: "success", title: "Succès", text: "Le statut a été mis à jour." });
  };

  const handleStatusAction = async (row) => {
    if (row.statut === "En attente") {
      const result = await Swal.fire({ title: "Commencer le traitement ?", icon: "question", showCancelButton: true, confirmButtonText: "Commencer", cancelButtonText: "Annuler" });
      if (result.isConfirmed) await performStatus(row, { statut: "En cours" });
      return;
    }
    if (row.statut === "En cours") {
      const result = await Swal.fire({ title: "Réponse de traitement", input: "textarea", inputValue: row.reponse || "", inputAttributes: { maxlength: 5000 }, showCancelButton: true, confirmButtonText: "Marquer comme traité", cancelButtonText: "Annuler", inputValidator: (value) => !value?.trim() && "Une réponse est obligatoire." });
      if (result.isConfirmed) await performStatus(row, { statut: "Traité", reponse: result.value.trim() });
      return;
    }
    if (row.statut === "Traité") {
      const choice = await Swal.fire({ title: "Suite du traitement", text: "Résoudre définitivement ou rouvrir le traitement ?", icon: "question", showCancelButton: true, showDenyButton: true, confirmButtonText: "Marquer résolu", denyButtonText: "Rouvrir", cancelButtonText: "Fermer" });
      if (choice.isConfirmed) await performStatus(row, { statut: "Résolu" });
      if (choice.isDenied) {
        const note = await Swal.fire({ title: "Motif de réouverture", input: "textarea", inputAttributes: { maxlength: 1000 }, showCancelButton: true, confirmButtonText: "Rouvrir", inputValidator: (value) => (!value || value.trim().length < 3) && "Une note d’au moins 3 caractères est obligatoire." });
        if (note.isConfirmed) await performStatus(row, { statut: "En cours", note: note.value.trim() });
      }
    }
  };

  const handleCancel = async (row) => {
    const result = await Swal.fire({ title: "Annuler la réclamation", text: "La réclamation et son historique resteront conservés.", input: "textarea", inputLabel: "Motif d’annulation", inputAttributes: { maxlength: 1000 }, showCancelButton: true, confirmButtonText: "Annuler la réclamation", cancelButtonText: "Retour", confirmButtonColor: "#dc3545", inputValidator: (value) => (!value || value.trim().length < 3) && "Le motif doit contenir au moins 3 caractères." });
    if (!result.isConfirmed) return;
    let saved;
    try { saved = await cancelReclamation(row.id, result.value.trim()); }
    catch (error) {
      await Swal.fire("Action impossible", apiErrorMessage(error, "Impossible d’annuler la réclamation."), "error");
      return;
    }
    await finishSuccessfulMutation(saved, { icon: "success", title: "Réclamation annulée", text: "Le dossier et son historique sont conservés." });
  };

  const handleLookupSaved = useCallback(async (kind, saved, wasEdit) => {
    setOptions((previous) => mergeLookupOption(previous, kind, saved));
    if (!wasEdit) setLookupSelection({ kind, lookup: saved });

    try {
      const refreshed = await getReclamationFormOptions({ refresh: true });
      setOptions(refreshed);
      setOptionsError("");
    } catch (error) {
      throw error;
    }
  }, []);

  const openCreate = async () => { await fetchOptions(true); setLookupSelection(null); setEditing(null); setDrawerOpen(true); };
  const openEdit = async (row) => { await fetchOptions(true); setLookupSelection(null); setEditing(row); setDrawerOpen(true); };
  const exportsDisabled = loading || totalRows === 0;

  return (
    <Box sx={{ ...dynamicStyles, width: "auto", maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
      <Box component="main" className="app-page reclamation-page" sx={{ flexGrow: 1, p: 3, mt: 0, width: "100%", maxWidth: "100%", minWidth: 0 }}>
        <SearchWithExport Title="Liste des Réclamations" searchValue={searchTerm} onSearchChange={setSearchTerm} resultCount={totalRows} loading={loading} exportsDisabled={exportsDisabled} printTable={() => printRows({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Liste des Réclamations", orientation: "landscape" })} exportToPDF={() => exportToPdf({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Liste des Réclamations", filename: "reclamations.pdf", orientation: "landscape" })} exportToExcel={() => exportToExcel({ rows: exportRows, columns: EXPORT_COLUMNS, sheetName: "Réclamations", filename: "reclamations.xlsx" })} />

        <AppStats items={reclamationStats} loading={loading} />

        <VisualFilterCarousel
          title="Départements"
          ariaLabel="Filtrer les réclamations par département"
          className="reclamation-department-filter app-section"
          items={departmentOptions.map((department) => ({
            id: department.id,
            label: department.nom,
            photo: department.photo,
          }))}
          value={departmentFilter}
          onChange={(departmentId) => {
            setDepartmentFilter(String(departmentId ?? ""));
            resetPage();
          }}
          renderAllIcon={() => <FontAwesomeIcon icon={faBuilding} />}
          renderIcon={(item) => <FontAwesomeIcon icon={departmentIcon(item.label)} />}
        />

        <div className="app-controls-row reclamation-controls-row">
          <button type="button" className="app-add-button" onClick={openCreate}><FontAwesomeIcon icon={faPlus} /> Ajouter une réclamation</button>
          <div className="app-filter-controls reclamation-filter-controls">
            <select className="app-filter-select" value={statusFilter} onChange={setFilter(setStatusFilter)} aria-label="Statut"><option value="">Tous les statuts</option>{["En attente", "En cours", "Traité", "Résolu", "Annulé"].map((status) => <option key={status} value={status}>{status}</option>)}</select>
            <select className="app-filter-select" value={priorityFilter} onChange={setFilter(setPriorityFilter)} aria-label="Priorité"><option value="">Toutes les priorités</option>{[{ value: "faible", label: "Faible" }, { value: "normale", label: "Normale" }, { value: "elevee", label: "Élevée" }, { value: "urgente", label: "Urgente" }].map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}</select>
            <select className="app-filter-select" value={typeFilter} onChange={setFilter(setTypeFilter)} aria-label="Type"><option value="">Tous les types</option>{filterOptions.types.map((row) => <option key={row.id} value={row.id}>{row.nom}</option>)}</select>
            <select className="app-filter-select" value={channelFilter} onChange={setFilter(setChannelFilter)} aria-label="Canal"><option value="">Tous les canaux</option>{filterOptions.channels.map((row) => <option key={row.id} value={row.id}>{row.nom}</option>)}</select>
            <input className="app-filter-select" type="date" value={dateFrom} onChange={setFilter(setDateFrom)} aria-label="Date de début" />
            <input className="app-filter-select" type="date" value={dateTo} onChange={setFilter(setDateTo)} aria-label="Date de fin" />
            <ListFilterReset active={filtersActive} onReset={resetFilters} />
          </div>
        </div>

        <ListState loading={loading} error={loadError} allRowsCount={reclamations.length} filteredRowsCount={totalRows} emptyDataMessage="Aucune réclamation enregistrée." onRetry={fetchRows} onResetFilters={resetFilters} />
        {!loading && !loadError && totalRows > 0 && <ReclamationList rows={visibleRows} searchTerm={searchTerm} page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} setPage={setPage} setRowsPerPage={setRowsPerPage} expandedRows={expandedRows} toggleRow={toggleRow} details={details} detailLoading={detailLoading} detailErrors={detailErrors} retryDetail={(id) => loadDetail(id, true)} onEdit={openEdit} onStatusAction={handleStatusAction} onCancel={handleCancel} />}

        <ReclamationDrawer show={drawerOpen} complaint={editing} options={options} optionsError={optionsError} lookupSelection={lookupSelection} onRetryOptions={() => fetchOptions(true)} onClose={() => { setDrawerOpen(false); setEditing(null); }} onSaved={handleSaved} onManage={setManagerKind} />
        <ReclamationLookupManager kind={managerKind} options={options} onClose={() => setManagerKind(null)} onSavedLookup={handleLookupSaved} />
      </Box>
    </Box>
  );
};

export default ReclamationPage;
