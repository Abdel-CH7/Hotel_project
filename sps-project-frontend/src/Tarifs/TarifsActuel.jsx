import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Form } from "react-bootstrap";
import Box from "@mui/material/Box";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faList, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import ListFilterReset from "../components/ListFilterReset";
import ListPagination from "../components/ListPagination";
import ListState from "../components/ListState";
import SearchWithExport from "../components/SearchWithExport";
import useListControls from "../components/useListControls";
import { useOpen } from "../Acceuil/OpenProvider";
import { exportToExcel as exportExcelRows, exportToPdf, printRows } from "../utils/listExportUtils";
import {
  getDateSearchVariants,
  highlightText,
  matchesNormalizedSearch,
  normalizeSearchValue,
} from "../utils/textUtils";
import {
  API_URL,
  backendFieldErrors,
  firstBackendMessage,
  formatMoney,
} from "./tariffUtils";
import "../style.css";

const EMPTY_PERIOD = {
  designation: "",
  date_debut: "",
  date_fin: "",
  tarif_chambre_id: "",
  tarif_repas_id: "",
  tarif_reduction_id: "",
  statut: "brouillon",
};

const STATUS_LABELS = {
  brouillon: "Brouillon",
  actif: "Actif",
  archive: "Archivé",
};
const EXPORT_COLUMNS = [
  { key: "designation", label: "Désignation" },
  { key: "start", label: "Date de début" },
  { key: "end", label: "Date de fin" },
  { key: "status", label: "Statut" },
  { key: "roomPlan", label: "Plan chambre" },
  { key: "mealPlan", label: "Plan repas" },
  { key: "reductionPlan", label: "Plan de réductions" },
];

const roomGridOf = (period) => period.room_rate_grid ?? period.tarif_chambre ?? null;
const mealGridOf = (period) => period.meal_rate_grid ?? period.tarif_repas ?? null;
const reductionGridOf = (period) => period.reduction_grid ?? period.tarif_reduction ?? null;
const roomTypeOf = (detail) => detail.room_type ?? detail.type_chambre ?? null;
const mealTypeOf = (detail) => detail.meal_type ?? detail.type_repas ?? null;
const reductionTypeOf = (detail) => detail.reduction_type ?? detail.type_reduction ?? null;
const dateInputValue = (value) => String(value ?? "").slice(0, 10);
const formatDate = (value) => {
  const normalized = dateInputValue(value);
  const parts = normalized.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : "-";
};
const formatPercentage = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
    : "-";
};
const formatOccupancyMoney = (value) => Number(value) > 0 ? formatMoney(value) : "—";

const TarifsActuel = () => {
  const { dynamicStyles } = useOpen();
  const [periods, setPeriods] = useState([]);
  const [roomGrids, setRoomGrids] = useState([]);
  const [mealGrids, setMealGrids] = useState([]);
  const [reductionGrids, setReductionGrids] = useState([]);
  const [roomDetails, setRoomDetails] = useState([]);
  const [mealDetails, setMealDetails] = useState([]);
  const [reductionDetails, setReductionDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedPeriodId, setExpandedPeriodId] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [periodForm, setPeriodForm] = useState(EMPTY_PERIOD);
  const [periodErrors, setPeriodErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await axios.get(`${API_URL}/tarifs-actuel`);
      const payload = response.data || {};
      const nextPeriods = Array.isArray(payload.tarifsActuel) ? payload.tarifsActuel : [];
      setPeriods(nextPeriods);
      setRoomGrids(Array.isArray(payload.tarifChambre) ? payload.tarifChambre : []);
      setMealGrids(Array.isArray(payload.tarifRepas) ? payload.tarifRepas : []);
      setReductionGrids(Array.isArray(payload.tarifReduction) ? payload.tarifReduction : []);
      setRoomDetails(Array.isArray(payload.tarifsChambreDetail) ? payload.tarifsChambreDetail : []);
      setMealDetails(Array.isArray(payload.tarifsRepasDetail) ? payload.tarifsRepasDetail : []);
      setReductionDetails(Array.isArray(payload.tarifsReductionDetail) ? payload.tarifsReductionDetail : []);
      setSelectedItems((current) =>
        current.filter((id) => nextPeriods.some((period) => Number(period.id) === Number(id) && period.statut === "brouillon")),
      );
      setExpandedPeriodId((current) =>
        current !== null && !nextPeriods.some((period) => Number(period.id) === Number(current)) ? null : current,
      );
    } catch (error) {
      setLoadError(firstBackendMessage(error, "Impossible de charger les périodes tarifaires."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filterPeriods = useCallback((rows, currentSearchTerm) => {
    const term = normalizeSearchValue(currentSearchTerm);
    return rows.filter((period) => {
      if (statusFilter && period.statut !== statusFilter) return false;
      if (filterStart && dateInputValue(period.date_fin) < filterStart) return false;
      if (filterEnd && dateInputValue(period.date_debut) > filterEnd) return false;
      if (!term) return true;
      return matchesNormalizedSearch(term, [
        period.designation,
        getDateSearchVariants(period.date_debut),
        getDateSearchVariants(period.date_fin),
        STATUS_LABELS[period.statut] ?? period.statut,
        roomGridOf(period)?.designation,
        mealGridOf(period)?.designation,
        reductionGridOf(period)?.designation,
      ]);
    });
  }, [filterEnd, filterStart, statusFilter]);

  const {
    searchTerm, page, rowsPerPage, filteredRows: filteredPeriods, visibleRows: visiblePeriods,
    totalRows, setSearchTerm, setPage, setRowsPerPage, resetPage,
  } = useListControls({ allRows: periods, filterRows: filterPeriods, storageKey: "rowsPerPageTariffPeriods" });
  const visibleDraftIds = visiblePeriods
    .filter((period) => period.statut === "brouillon")
    .map((period) => period.id);
  const allVisibleDraftsSelected =
    visibleDraftIds.length > 0 && visibleDraftIds.every((id) => selectedItems.includes(id));

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingPeriod(null);
    setPeriodForm(EMPTY_PERIOD);
    setPeriodErrors({});
    setSaving(false);
  };

  const openAddDrawer = () => {
    setEditingPeriod(null);
    setPeriodForm(EMPTY_PERIOD);
    setPeriodErrors({});
    setDrawerOpen(true);
  };

  const openEditDrawer = (period) => {
    setEditingPeriod(period);
    setPeriodForm({
      designation: period.designation ?? "",
      date_debut: dateInputValue(period.date_debut),
      date_fin: dateInputValue(period.date_fin),
      tarif_chambre_id: period.tarif_chambre_id ?? roomGridOf(period)?.id ?? "",
      tarif_repas_id: period.tarif_repas_id ?? mealGridOf(period)?.id ?? "",
      tarif_reduction_id: period.tarif_reduction_id ?? reductionGridOf(period)?.id ?? "",
      statut: period.statut ?? "brouillon",
    });
    setPeriodErrors({});
    setDrawerOpen(true);
  };

  const handlePeriodChange = ({ target }) => {
    setPeriodForm((current) => ({ ...current, [target.name]: target.value }));
    setPeriodErrors((current) => ({ ...current, [target.name]: "" }));
  };

  const validatePeriod = () => {
    const nextErrors = {};
    if (!periodForm.designation.trim()) nextErrors.designation = "La désignation est obligatoire.";
    if (!periodForm.date_debut) nextErrors.date_debut = "La date de début est obligatoire.";
    if (!periodForm.date_fin) nextErrors.date_fin = "La date de fin est obligatoire.";
    if (periodForm.date_debut && periodForm.date_fin && periodForm.date_fin < periodForm.date_debut) {
      nextErrors.date_fin = "La date de fin doit être postérieure ou égale à la date de début.";
    }
    if (!periodForm.tarif_chambre_id) nextErrors.tarif_chambre_id = "Le plan tarifaire chambre est obligatoire.";
    if (!periodForm.statut) nextErrors.statut = "Le statut est obligatoire.";
    setPeriodErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePeriod = async (event) => {
    event.preventDefault();
    if (!validatePeriod()) return;
    const payload = {
      designation: periodForm.designation.trim(),
      date_debut: periodForm.date_debut,
      date_fin: periodForm.date_fin,
      tarif_chambre_id: Number(periodForm.tarif_chambre_id),
      tarif_repas_id: periodForm.tarif_repas_id ? Number(periodForm.tarif_repas_id) : null,
      tarif_reduction_id: periodForm.tarif_reduction_id ? Number(periodForm.tarif_reduction_id) : null,
      statut: editingPeriod ? periodForm.statut : "brouillon",
    };
    setSaving(true);
    try {
      if (editingPeriod) {
        await axios.put(`${API_URL}/tarifs-actuel/${editingPeriod.id}`, payload);
      } else {
        await axios.post(`${API_URL}/tarifs-actuel`, payload);
      }
      await refreshData();
      await Swal.fire("Succès", `Période tarifaire ${editingPeriod ? "modifiée" : "ajoutée"} avec succès.`, "success");
      closeDrawer();
    } catch (error) {
      if (error.response?.status === 422) setPeriodErrors(backendFieldErrors(error));
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible d'enregistrer cette période tarifaire."), "error");
    } finally {
      setSaving(false);
    }
  };

  const deletePeriod = async (period) => {
    if (period.statut !== "brouillon") {
      await Swal.fire("Suppression indisponible", "Seule une période brouillon non utilisée peut être supprimée.", "info");
      return;
    }
    const confirmation = await Swal.fire({
      title: `Supprimer la période « ${period.designation} » ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/tarifs-actuel/${period.id}`);
      await refreshData();
      setSelectedItems((current) => current.filter((id) => id !== period.id));
      await Swal.fire("Succès", "Période tarifaire supprimée avec succès.", "success");
    } catch (error) {
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible de supprimer cette période tarifaire."), "error");
    }
  };

  const deleteSelected = async () => {
    if (!selectedItems.length) return;
    const confirmation = await Swal.fire({
      title: `Supprimer ${selectedItems.length} période(s) brouillon ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;
    const ids = [...selectedItems];
    const results = await Promise.allSettled(
      ids.map((id) => axios.delete(`${API_URL}/tarifs-actuel/${id}`)),
    );
    const failedIds = ids.filter((_, index) => results[index].status === "rejected");
    const firstFailure = results.find((result) => result.status === "rejected");
    setSelectedItems(failedIds);
    await refreshData();
    const succeeded = ids.length - failedIds.length;
    const reason = firstFailure
      ? ` ${firstBackendMessage(firstFailure.reason, "Certaines suppressions ont échoué.")}`
      : "";
    await Swal.fire(
      failedIds.length ? "Suppression partielle" : "Succès",
      `${succeeded} suppression(s) réussie(s), ${failedIds.length} échec(s).${reason}`,
      failedIds.length ? "warning" : "success",
    );
  };

  const toggleSelection = (id) => {
    setSelectedItems((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  };
  const toggleSelectAll = () => {
    setSelectedItems((current) =>
      allVisibleDraftsSelected
        ? current.filter((id) => !visibleDraftIds.includes(id))
        : [...new Set([...current, ...visibleDraftIds])],
    );
  };

  const periodRoomDetails = (period) => {
    const nested = roomGridOf(period)?.details;
    if (Array.isArray(nested)) return nested;
    return roomDetails.filter((detail) => Number(detail.tarif_chambre_id) === Number(period.tarif_chambre_id));
  };
  const periodMealDetails = (period) => {
    const nested = mealGridOf(period)?.details;
    if (Array.isArray(nested)) return nested;
    return mealDetails.filter((detail) => Number(detail.tarif_repas_id) === Number(period.tarif_repas_id));
  };
  const periodReductionDetails = (period) => {
    const nested = reductionGridOf(period)?.details;
    if (Array.isArray(nested)) return nested;
    return reductionDetails.filter(
      (detail) => Number(detail.tarif_reduction_id) === Number(period.tarif_reduction_id),
    );
  };

  const filtersActive = Boolean(searchTerm || statusFilter || filterStart || filterEnd);
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("");
    setFilterStart("");
    setFilterEnd("");
    resetPage();
  }, [resetPage, setSearchTerm]);

  const exportRows = useMemo(() => filteredPeriods.map((period) => ({
    designation: period.designation ?? "",
    start: formatDate(period.date_debut),
    end: formatDate(period.date_fin),
    status: STATUS_LABELS[period.statut] ?? period.statut ?? "",
    roomPlan: roomGridOf(period)?.designation ?? "Aucune",
    mealPlan: mealGridOf(period)?.designation ?? "Aucune",
    reductionPlan: reductionGridOf(period)?.designation ?? "Aucune",
  })), [filteredPeriods]);

  const exportToExcel = () => {
    exportExcelRows({ rows: exportRows, columns: EXPORT_COLUMNS, sheetName: "Périodes tarifaires", filename: "periodes-tarifaires.xlsx" });
  };
  const exportToPDF = () => {
    exportToPdf({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Périodes tarifaires", filename: "periodes-tarifaires.pdf", orientation: "landscape" });
  };
  const printTable = () => {
    printRows({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Périodes tarifaires", orientation: "landscape" });
  };

  const activeEditing = editingPeriod?.statut === "actif";
  const periodStructureReadOnly = activeEditing || editingPeriod?.statut === "archive";

  return (
    <Box sx={{ ...dynamicStyles }}>
      <Box component="main" className="app-page tariff-page tarifs-actuel-page tariff-periods-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>
        <SearchWithExport searchValue={searchTerm} onSearchChange={setSearchTerm} exportToExcel={exportToExcel} exportToPDF={exportToPDF} printTable={printTable} Title="Périodes tarifaires" resultCount={totalRows} loading={loading} exportsDisabled={totalRows === 0} />

        <div className="app-controls-row tariff-period-controls">
          <button type="button" className="app-add-button" onClick={openAddDrawer}><FontAwesomeIcon icon={faPlus} /> Ajouter une période</button>
          <div className="app-filter-controls tariff-period-filters">
            <Form.Group><Form.Label>Statut</Form.Label><Form.Select className="app-filter-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); resetPage(); }}><option value="">Tous les statuts</option><option value="brouillon">Brouillon</option><option value="actif">Actif</option><option value="archive">Archivé</option></Form.Select></Form.Group>
            <Form.Group><Form.Label>Du</Form.Label><Form.Control type="date" value={filterStart} onChange={(event) => { setFilterStart(event.target.value); resetPage(); }} /></Form.Group>
            <Form.Group><Form.Label>Au</Form.Label><Form.Control type="date" min={filterStart || undefined} value={filterEnd} onChange={(event) => { setFilterEnd(event.target.value); resetPage(); }} /></Form.Group>
            <div className="tariff-period-reset">
              <ListFilterReset active={filtersActive} onReset={resetFilters} />
            </div>
          </div>
        </div>

        <ListState loading={loading} error={loadError} allRowsCount={periods.length} filteredRowsCount={totalRows} emptyDataMessage="Aucune période tarifaire enregistrée." onRetry={refreshData} onResetFilters={resetFilters} />

        <div id="formContainer" className="app-form-drawer tariff-form-drawer tariff-period-drawer" style={{ right: drawerOpen ? 0 : "-100%" }} aria-hidden={!drawerOpen}>
          <Form onSubmit={savePeriod}>
            <h2 className="app-form-drawer-title">{editingPeriod ? "Modifier" : "Ajouter"} une période tarifaire</h2>
            <div className="tariff-form-grid">
              <Form.Group className="tariff-form-wide"><Form.Label>Désignation</Form.Label><Form.Control name="designation" value={periodForm.designation} onChange={handlePeriodChange} isInvalid={!!periodErrors.designation} /><Form.Control.Feedback type="invalid">{periodErrors.designation}</Form.Control.Feedback></Form.Group>
              <Form.Group><Form.Label>Date de début</Form.Label><Form.Control type="date" name="date_debut" value={periodForm.date_debut} onChange={handlePeriodChange} disabled={periodStructureReadOnly} isInvalid={!!periodErrors.date_debut} /><Form.Control.Feedback type="invalid">{periodErrors.date_debut}</Form.Control.Feedback></Form.Group>
              <Form.Group><Form.Label>Date de fin</Form.Label><Form.Control type="date" name="date_fin" min={periodForm.date_debut || undefined} value={periodForm.date_fin} onChange={handlePeriodChange} disabled={periodStructureReadOnly} isInvalid={!!periodErrors.date_fin} /><Form.Control.Feedback type="invalid">{periodErrors.date_fin}</Form.Control.Feedback></Form.Group>
              <Form.Group className="tariff-form-wide"><Form.Label>Plan tarifaire chambre</Form.Label><Form.Select name="tarif_chambre_id" value={periodForm.tarif_chambre_id} onChange={handlePeriodChange} disabled={periodStructureReadOnly} isInvalid={!!periodErrors.tarif_chambre_id}><option value="">Sélectionner un plan chambre</option>{roomGrids.map((grid) => <option key={grid.id} value={grid.id}>{grid.designation}</option>)}</Form.Select><Form.Text>Un plan actif doit couvrir tous les types de chambres utilisés.</Form.Text><Form.Control.Feedback type="invalid">{periodErrors.tarif_chambre_id}</Form.Control.Feedback></Form.Group>
              <Form.Group className="tariff-form-wide"><Form.Label>Plan tarifaire repas</Form.Label><Form.Select name="tarif_repas_id" value={periodForm.tarif_repas_id} onChange={handlePeriodChange} disabled={periodStructureReadOnly} isInvalid={!!periodErrors.tarif_repas_id}><option value="">Aucun plan de repas</option>{mealGrids.map((grid) => <option key={grid.id} value={grid.id}>{grid.designation}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{periodErrors.tarif_repas_id}</Form.Control.Feedback></Form.Group>
              <Form.Group className="tariff-form-wide"><Form.Label>Plan de réductions</Form.Label><Form.Select name="tarif_reduction_id" value={periodForm.tarif_reduction_id} onChange={handlePeriodChange} disabled={periodStructureReadOnly} isInvalid={!!periodErrors.tarif_reduction_id}><option value="">Aucun plan de réductions</option>{reductionGrids.map((grid) => <option key={grid.id} value={grid.id}>{grid.designation}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{periodErrors.tarif_reduction_id}</Form.Control.Feedback></Form.Group>
              <Form.Group className="tariff-form-wide"><Form.Label>Statut</Form.Label>{!editingPeriod ? <Form.Control value="Brouillon" readOnly /> : <Form.Select name="statut" value={periodForm.statut} onChange={handlePeriodChange} isInvalid={!!periodErrors.statut}>{activeEditing ? <><option value="actif">Actif</option><option value="archive">Archivé</option></> : <><option value="brouillon">Brouillon</option><option value="actif">Actif</option></>}</Form.Select>}<Form.Control.Feedback type="invalid">{periodErrors.statut}</Form.Control.Feedback></Form.Group>
            </div>
            <div className="app-form-actions"><Button type="submit" className="app-primary-button" disabled={saving}>{saving ? "Enregistrement..." : "Valider"}</Button><Button type="button" className="app-secondary-button" onClick={closeDrawer}>Annuler</Button></div>
          </Form>
        </div>

        {!loading && !loadError && totalRows > 0 && (
          <div id="tableContainer" className="app-table-wrapper tariff-table-wrapper tariff-period-table-wrapper">
            <table id="tarifsActuelTable" className="table table-bordered app-table tariff-period-table">
              <thead><tr><th><input type="checkbox" checked={allVisibleDraftsSelected} onChange={toggleSelectAll} aria-label="Sélectionner les brouillons visibles" /></th><th>Désignation</th><th>Date de début</th><th>Date de fin</th><th>Plan chambre</th><th>Plan repas</th><th>Plan de réductions</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {visiblePeriods.map((period) => (
                  <React.Fragment key={period.id}>
                    <tr>
                      <td><input type="checkbox" checked={selectedItems.includes(period.id)} disabled={period.statut !== "brouillon"} onChange={() => toggleSelection(period.id)} aria-label={`Sélectionner ${period.designation}`} title={period.statut !== "brouillon" ? "Seuls les brouillons peuvent être supprimés" : "Sélectionner la période"} /></td>
                      <td>{highlightText(period.designation || "-", searchTerm)}</td><td>{highlightText(formatDate(period.date_debut), searchTerm)}</td><td>{highlightText(formatDate(period.date_fin), searchTerm)}</td><td>{highlightText(roomGridOf(period)?.designation ?? "Aucune", searchTerm)}</td><td>{highlightText(mealGridOf(period)?.designation ?? "Aucune", searchTerm)}</td><td>{highlightText(reductionGridOf(period)?.designation ?? "Aucune", searchTerm)}</td>
                      <td><span className={`tariff-status-badge is-${period.statut}`}>{highlightText(STATUS_LABELS[period.statut] ?? period.statut, searchTerm)}</span></td>
                      <td><div className="app-table-actions">
                        <button type="button" className="tariff-action-button" onClick={() => setExpandedPeriodId((current) => Number(current) === Number(period.id) ? null : period.id)} title="Afficher les détails des plans" aria-label="Afficher les détails des plans"><FontAwesomeIcon icon={faList} className="app-table-action is-muted" /></button>
                        <button type="button" className="tariff-action-button" onClick={() => openEditDrawer(period)} disabled={period.statut === "archive"} title={period.statut === "archive" ? "Période archivée en lecture seule" : period.statut === "actif" ? "Archiver la période" : "Modifier ou activer la période"} aria-label="Modifier la période"><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button>
                        <button type="button" className="tariff-action-button" onClick={() => deletePeriod(period)} disabled={period.statut !== "brouillon"} title={period.statut === "brouillon" ? "Supprimer la période" : "Seule une période brouillon peut être supprimée"} aria-label="Supprimer la période"><FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" /></button>
                      </div></td>
                    </tr>
                    {Number(expandedPeriodId) === Number(period.id) && (
                      <tr className="tariff-period-detail-row"><td colSpan="9"><div className="tariff-period-details">
                        <section><h3>Plan chambre</h3><div className="app-table-wrapper"><table className="table table-bordered app-table"><thead><tr><th>Type de chambre</th><th>Prix 1 personne</th><th>Prix 2 personnes</th><th>Prix 3 personnes</th><th>Lit supplémentaire</th></tr></thead><tbody>{periodRoomDetails(period).map((detail) => <tr key={detail.id}><td>{roomTypeOf(detail)?.type_chambre ?? "-"}</td><td>{formatOccupancyMoney(detail.prix_1_personne ?? detail.single)}</td><td>{formatOccupancyMoney(detail.prix_2_personnes ?? detail.double)}</td><td>{formatOccupancyMoney(detail.prix_3_personnes ?? detail.triple)}</td><td>{formatMoney(detail.prix_lit_supplementaire ?? detail.lit_supp)}</td></tr>)}{!periodRoomDetails(period).length && <tr><td colSpan="5" className="text-center">Aucun prix de chambre</td></tr>}</tbody></table></div></section>
                        <section><h3>Plan repas</h3>{mealGridOf(period) ? <div className="app-table-wrapper"><table className="table table-bordered app-table"><thead><tr><th>Type de repas</th><th>Prix par personne</th></tr></thead><tbody>{periodMealDetails(period).map((detail) => <tr key={detail.id}><td>{mealTypeOf(detail)?.type_repas ?? "-"}</td><td>{formatMoney(detail.prix_par_personne ?? detail.montant)}</td></tr>)}{!periodMealDetails(period).length && <tr><td colSpan="2" className="text-center">Aucun prix de repas</td></tr>}</tbody></table></div> : <p className="tariff-empty-detail">Aucun plan de repas</p>}</section>
                        <section><h3>Plan de réductions</h3>{reductionGridOf(period) ? <div className="app-table-wrapper"><table className="table table-bordered app-table"><thead><tr><th>Type de réduction</th><th>Montant fixe</th><th>Pourcentage</th></tr></thead><tbody>{periodReductionDetails(period).map((detail) => <tr key={detail.id}><td>{reductionTypeOf(detail)?.type_reduction ?? "-"}</td><td>{formatMoney(detail.montant_fixe ?? detail.montant)}</td><td>{formatPercentage(detail.pourcentage ?? detail.percentage)}</td></tr>)}{!periodReductionDetails(period).length && <tr><td colSpan="3" className="text-center">Aucune réduction</td></tr>}</tbody></table></div> : <p className="tariff-empty-detail">Aucun plan de réductions</p>}</section>
                      </div></td></tr>
                    )}
                  </React.Fragment>
                ))}
                {!visiblePeriods.length && <tr><td colSpan="9" className="text-center">Aucune période tarifaire disponible</td></tr>}
              </tbody>
            </table>
            <div className="app-table-footer">
              <Button type="button" className="app-danger-button" onClick={deleteSelected} disabled={!selectedItems.length}><FontAwesomeIcon icon={faTrash} /> Supprimer la sélection</Button>
              <ListPagination page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
            </div>
          </div>
        )}
      </Box>
    </Box>
  );
};

export default TarifsActuel;
