import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Form, Modal } from "react-bootstrap";
import Box from "@mui/material/Box";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import ListFilterReset from "../components/ListFilterReset";
import ListPagination from "../components/ListPagination";
import ListState from "../components/ListState";
import RequiredLabel from "../components/RequiredLabel";
import SearchWithExport from "../components/SearchWithExport";
import TariffPlanSelector from "../components/TariffPlanSelector";
import useListControls from "../components/useListControls";
import { useOpen } from "../Acceuil/OpenProvider";
import { exportToExcel as exportExcelRows, exportToPdf, printRows } from "../utils/listExportUtils";
import { focusFirstInvalidField } from "../utils/formValidationUtils";
import {
  getNumberSearchVariants,
  highlightText,
  matchesNormalizedSearch,
  normalizeSearchValue,
} from "../utils/textUtils";
import {
  API_URL,
  backendFieldErrors,
  firstBackendMessage,
  formatMoney,
  planUsage,
} from "./tariffUtils";
import "../style.css";

const EMPTY_DETAIL = {
  tarif_reduction_id: "",
  type_reduction_id: "",
  montant_fixe: "0",
  pourcentage: "0",
};
const EMPTY_GRID = { designation: "" };
const EMPTY_TYPE = { code: "", type_reduction: "" };
const EXPORT_COLUMNS = [
  { key: "reductionType", label: "Type de réduction" },
  { key: "fixedAmount", label: "Montant fixe" },
  { key: "percentage", label: "Pourcentage" },
  { key: "plan", label: "Plan de réductions" },
];

const reductionTypeOf = (detail) => detail.reduction_type ?? detail.type_reduction ?? null;
const reductionGridOf = (detail) => detail.reduction_grid ?? detail.tarif_reduction ?? null;
const fixedAmountOf = (detail) => detail.montant_fixe ?? detail.montant ?? "";
const percentageOf = (detail) => detail.pourcentage ?? detail.percentage ?? "";
const formatPercentage = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
    : "-";
};

const TarifReduction = () => {
  const { dynamicStyles } = useOpen();
  const [details, setDetails] = useState([]);
  const [grids, setGrids] = useState([]);
  const [reductionTypes, setReductionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedGridId, setSelectedGridId] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailForm, setDetailForm] = useState(EMPTY_DETAIL);
  const [detailErrors, setDetailErrors] = useState({});
  const [detailSaving, setDetailSaving] = useState(false);

  const [gridModalOpen, setGridModalOpen] = useState(false);
  const [editingGrid, setEditingGrid] = useState(null);
  const [gridForm, setGridForm] = useState(EMPTY_GRID);
  const [gridErrors, setGridErrors] = useState({});
  const [gridSaving, setGridSaving] = useState(false);

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState(EMPTY_TYPE);
  const [typeErrors, setTypeErrors] = useState({});
  const [typeSaving, setTypeSaving] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const tariffResponse = await axios.get(`${API_URL}/tarifs-reduction`);
      const payload = tariffResponse.data || {};
      const nextDetails = Array.isArray(payload.tarifsReductionDetail)
        ? payload.tarifsReductionDetail
        : [];
      const nextGrids = Array.isArray(payload.tarifsReduction) ? payload.tarifsReduction : [];

      setDetails(nextDetails);
      setGrids(nextGrids);
      setReductionTypes(Array.isArray(payload.typesReduction) ? payload.typesReduction : []);
      setSelectedItems((current) =>
        current.filter((id) => nextDetails.some((detail) => Number(detail.id) === Number(id))),
      );
      setSelectedGridId((current) =>
        current !== "" && !nextGrids.some((grid) => Number(grid.id) === Number(current)) ? "" : current,
      );
    } catch (error) {
      setLoadError(firstBackendMessage(error, "Impossible de charger les tarifs de réduction."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filterDetails = useCallback((rows, currentSearchTerm) => {
    const term = normalizeSearchValue(currentSearchTerm);
    return rows.filter((detail) => {
      if (selectedGridId !== "" && String(detail.tarif_reduction_id) !== String(selectedGridId)) return false;
      if (!term) return true;
      const type = reductionTypeOf(detail);
      const grid = reductionGridOf(detail);
      return matchesNormalizedSearch(term, [
        grid?.designation,
        type?.code,
        type?.type_reduction,
        getNumberSearchVariants(fixedAmountOf(detail), "DH"),
        getNumberSearchVariants(percentageOf(detail), "%"),
      ]);
    });
  }, [selectedGridId]);

  const {
    searchTerm, page, rowsPerPage, filteredRows: filteredDetails, visibleRows: visibleDetails,
    totalRows, setSearchTerm, setPage, setRowsPerPage, resetPage,
  } = useListControls({ allRows: details, filterRows: filterDetails, storageKey: "rowsPerPageTarifsReduction" });
  const visibleIds = visibleDetails.map((detail) => detail.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedItems.includes(id));
  const selectedPlan = grids.find((grid) => Number(grid.id) === Number(selectedGridId));
  const selectedGridLocked = planUsage(selectedPlan).locked;
  const isDetailLocked = (detail) => planUsage(
    grids.find((grid) => Number(grid.id) === Number(detail.tarif_reduction_id)) ?? reductionGridOf(detail),
  ).locked;

  const availableReductionTypes = useMemo(() => {
    if (!detailForm.tarif_reduction_id) return reductionTypes;
    const configured = new Set(
      details
        .filter(
          (detail) =>
            Number(detail.tarif_reduction_id) === Number(detailForm.tarif_reduction_id) &&
            Number(detail.id) !== Number(editingDetail?.id),
        )
        .map((detail) => Number(detail.type_reduction_id)),
    );
    return reductionTypes.filter((type) => !configured.has(Number(type.id)));
  }, [detailForm.tarif_reduction_id, details, editingDetail, reductionTypes]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingDetail(null);
    setDetailForm(EMPTY_DETAIL);
    setDetailErrors({});
    setDetailSaving(false);
  };

  const openAddDrawer = () => {
    if (selectedGridLocked) {
      Swal.fire("Plan verrouillé", planUsage(selectedPlan).label, "info");
      return;
    }
    setEditingDetail(null);
    setDetailForm({ ...EMPTY_DETAIL, tarif_reduction_id: selectedGridId || "" });
    setDetailErrors({});
    setDrawerOpen(true);
  };

  const openEditDrawer = (detail) => {
    if (isDetailLocked(detail)) return;
    setEditingDetail(detail);
    setDetailForm({
      tarif_reduction_id: detail.tarif_reduction_id ?? reductionGridOf(detail)?.id ?? "",
      type_reduction_id: detail.type_reduction_id ?? reductionTypeOf(detail)?.id ?? "",
      montant_fixe: fixedAmountOf(detail),
      pourcentage: percentageOf(detail),
    });
    setDetailErrors({});
    setDrawerOpen(true);
  };

  const handleDetailChange = ({ target }) => {
    setDetailForm((current) => ({ ...current, [target.name]: target.value }));
    setDetailErrors((current) => ({ ...current, [target.name]: "", reduction_value: "" }));
  };

  const validateDetail = () => {
    const nextErrors = {};
    const fixed = Number(detailForm.montant_fixe);
    const percentage = Number(detailForm.pourcentage);
    if (!detailForm.tarif_reduction_id) nextErrors.tarif_reduction_id = "Le plan de réductions est obligatoire.";
    if (!detailForm.type_reduction_id) nextErrors.type_reduction_id = "Le type de réduction est obligatoire.";
    if (detailForm.montant_fixe === "" || !Number.isFinite(fixed) || fixed < 0) {
      nextErrors.montant_fixe = "Le montant fixe doit être positif ou nul.";
    }
    if (detailForm.pourcentage === "" || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      nextErrors.pourcentage = "Le pourcentage doit être compris entre 0 et 100.";
    }
    if (!nextErrors.montant_fixe && !nextErrors.pourcentage && fixed === 0 && percentage === 0) {
      nextErrors.reduction_value = "Le montant fixe ou le pourcentage doit être supérieur à zéro.";
    }
    setDetailErrors(nextErrors);
    if (Object.keys(nextErrors).length) focusFirstInvalidField(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveDetail = async (event) => {
    event.preventDefault();
    if (!validateDetail()) return;
    const payload = {
      tarif_reduction_id: Number(detailForm.tarif_reduction_id),
      type_reduction_id: Number(detailForm.type_reduction_id),
      montant_fixe: Number(detailForm.montant_fixe),
      pourcentage: Number(detailForm.pourcentage),
    };
    setDetailSaving(true);
    try {
      if (editingDetail) {
        await axios.put(`${API_URL}/tarifs-reduction/${editingDetail.id}`, payload);
      } else {
        await axios.post(`${API_URL}/tarifs-reduction`, payload);
      }
      await refreshData();
      await Swal.fire("Succès", `Règle de réduction ${editingDetail ? "modifiée" : "ajoutée"} avec succès.`, "success");
      closeDrawer();
    } catch (error) {
      if (error.response?.status === 422) {
        const fieldErrors = backendFieldErrors(error);
        setDetailErrors(fieldErrors);
        focusFirstInvalidField(fieldErrors);
        return;
      }
      if (error.response?.status === 409) await refreshData();
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible d'enregistrer cette réduction."), "error");
    } finally {
      setDetailSaving(false);
    }
  };

  const deleteDetail = async (detail) => {
    const confirmation = await Swal.fire({
      title: "Supprimer cette règle de réduction ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/tarifs-reduction/${detail.id}`);
      await refreshData();
      setSelectedItems((current) => current.filter((id) => id !== detail.id));
      await Swal.fire("Succès", "Règle de réduction supprimée avec succès.", "success");
    } catch (error) {
      if (error.response?.status === 409) await refreshData();
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible de supprimer cette réduction."), "error");
    }
  };

  const deleteSelected = async () => {
    if (!selectedItems.length) return;
    const confirmation = await Swal.fire({
      title: `Supprimer ${selectedItems.length} règle(s) ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;
    const ids = [...selectedItems];
    const results = await Promise.allSettled(
      ids.map((id) => axios.delete(`${API_URL}/tarifs-reduction/${id}`)),
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
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  };

  const openGridModal = () => {
    setEditingGrid(null);
    setGridForm(EMPTY_GRID);
    setGridErrors({});
    setGridModalOpen(true);
  };
  const editGrid = (grid) => {
    if (planUsage(grid).locked) return;
    setEditingGrid(grid);
    setGridForm({ designation: grid.designation ?? "" });
    setGridErrors({});
  };
  const closeGridModal = () => {
    setGridModalOpen(false);
    setEditingGrid(null);
    setGridForm(EMPTY_GRID);
    setGridErrors({});
  };

  const saveGrid = async (event) => {
    event.preventDefault();
    const designation = gridForm.designation.trim();
    if (!designation) {
      const fieldErrors = { designation: "La désignation est obligatoire." };
      setGridErrors(fieldErrors);
      focusFirstInvalidField(fieldErrors);
      return;
    }
    setGridSaving(true);
    try {
      if (editingGrid) {
        await axios.put(`${API_URL}/desigs-reduction/${editingGrid.id}`, { designation });
      } else {
        await axios.post(`${API_URL}/desigs-reduction`, { designation });
      }
      await refreshData();
      await Swal.fire("Succès", `Plan de réductions ${editingGrid ? "modifié" : "ajouté"} avec succès.`, "success");
      setEditingGrid(null);
      setGridForm(EMPTY_GRID);
      setGridErrors({});
    } catch (error) {
      if (error.response?.status === 422) {
        const fieldErrors = backendFieldErrors(error);
        setGridErrors(fieldErrors);
        focusFirstInvalidField(fieldErrors);
        return;
      }
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible d'enregistrer ce plan."), "error");
    } finally {
      setGridSaving(false);
    }
  };

  const deleteGrid = async (grid) => {
    const confirmation = await Swal.fire({
      title: `Supprimer le plan « ${grid.designation} » ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/desigs-reduction/${grid.id}`);
      await refreshData();
      await Swal.fire("Succès", "Plan de réductions supprimé avec succès.", "success");
    } catch (error) {
      if (error.response?.status === 409) await refreshData();
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible de supprimer ce plan."), "error");
    }
  };

  const openTypeModal = () => {
    setEditingType(null);
    setTypeForm(EMPTY_TYPE);
    setTypeErrors({});
    setTypeModalOpen(true);
  };
  const closeTypeModal = () => {
    setTypeModalOpen(false);
    setEditingType(null);
    setTypeForm(EMPTY_TYPE);
    setTypeErrors({});
  };
  const editType = (type) => {
    setEditingType(type);
    setTypeForm({ code: type.code ?? "", type_reduction: type.type_reduction ?? "" });
    setTypeErrors({});
  };

  const saveType = async (event) => {
    event.preventDefault();
    const payload = { code: typeForm.code.trim(), type_reduction: typeForm.type_reduction.trim() };
    const nextErrors = {};
    if (!payload.code) nextErrors.code = "Le code est obligatoire.";
    if (!payload.type_reduction) nextErrors.type_reduction = "Le type de réduction est obligatoire.";
    if (Object.keys(nextErrors).length) {
      setTypeErrors(nextErrors);
      focusFirstInvalidField(nextErrors);
      return;
    }
    setTypeSaving(true);
    try {
      const response = editingType
        ? await axios.put(`${API_URL}/types-reduction/${editingType.id}`, payload)
        : await axios.post(`${API_URL}/types-reduction`, payload);
      await refreshData();
      if (!editingType && drawerOpen) {
        setDetailForm((current) => ({ ...current, type_reduction_id: response.data.id }));
      }
      const wasEditing = Boolean(editingType);
      setEditingType(null);
      setTypeForm(EMPTY_TYPE);
      setTypeErrors({});
      await Swal.fire("Succès", `Type de réduction ${wasEditing ? "modifié" : "ajouté"} avec succès.`, "success");
    } catch (error) {
      if (error.response?.status === 422) {
        const fieldErrors = backendFieldErrors(error);
        setTypeErrors(fieldErrors);
        focusFirstInvalidField(fieldErrors);
        return;
      }
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible d'enregistrer ce type de réduction."), "error");
    } finally {
      setTypeSaving(false);
    }
  };

  const deleteType = async (type) => {
    const confirmation = await Swal.fire({
      title: `Supprimer le type « ${type.type_reduction} » ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/types-reduction/${type.id}`);
      await refreshData();
      if (Number(detailForm.type_reduction_id) === Number(type.id)) {
        setDetailForm((current) => ({ ...current, type_reduction_id: "" }));
      }
      await Swal.fire("Succès", "Type de réduction supprimé avec succès.", "success");
    } catch (error) {
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible de supprimer ce type de réduction."), "error");
    }
  };

  const filtersActive = Boolean(searchTerm || selectedGridId !== "");
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedGridId("");
    resetPage();
  }, [resetPage, setSearchTerm]);

  const exportRows = useMemo(() => filteredDetails.map((detail) => ({
    reductionType: reductionTypeOf(detail)?.type_reduction ?? "",
    fixedAmount: formatMoney(fixedAmountOf(detail)),
    percentage: formatPercentage(percentageOf(detail)),
    plan: reductionGridOf(detail)?.designation ?? "",
  })), [filteredDetails]);

  const exportToExcel = () => {
    exportExcelRows({ rows: exportRows, columns: EXPORT_COLUMNS, sheetName: "Tarifs Réduction", filename: "tarifs-reduction.xlsx" });
  };
  const exportToPDF = () => {
    exportToPdf({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Tarifs Réduction", filename: "tarifs-reduction.pdf", orientation: "portrait" });
  };
  const printTable = () => {
    printRows({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Tarifs Réduction", orientation: "portrait" });
  };

  const columnCount = 6;

  return (
    <Box sx={{ ...dynamicStyles }}>
      <Box component="main" className="app-page tariff-page tarif-reduction-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>
        <SearchWithExport searchValue={searchTerm} onSearchChange={setSearchTerm} exportToExcel={exportToExcel} exportToPDF={exportToPDF} printTable={printTable} Title="Tarifs Réduction" resultCount={totalRows} loading={loading} exportsDisabled={totalRows === 0} />

        <TariffPlanSelector
          label="Plan de réductions"
          plans={grids}
          selectedPlanId={selectedGridId}
          onSelect={(id) => { setSelectedGridId(id === "" ? "" : Number(id)); resetPage(); }}
          onManage={openGridModal}
          onAddDetail={openAddDrawer}
          addLabel="Ajouter une règle de réduction"
          extraActions={<button type="button" className="app-secondary-button" onClick={openTypeModal}>Gérer les types de réduction</button>}
          filterActions={<ListFilterReset active={filtersActive} onReset={resetFilters} />}
        />

        <ListState loading={loading} error={loadError} allRowsCount={details.length} filteredRowsCount={totalRows} emptyDataMessage="Aucune réduction tarifaire enregistrée." onRetry={refreshData} onResetFilters={resetFilters} />

        <div id="formContainer" className="app-form-drawer tariff-form-drawer" style={{ right: drawerOpen ? 0 : "-100%" }} aria-hidden={!drawerOpen}>
          <Form onSubmit={saveDetail} noValidate>
            <h2 className="app-form-drawer-title">{editingDetail ? "Modifier" : "Ajouter"} une réduction</h2>
            <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
            <p className="tariff-form-hint">Le montant fixe est soustrait en DH. Le pourcentage est soustrait du sous-total éligible. Les deux peuvent être combinés.</p>
            <div className="tariff-form-grid">
              <Form.Group className="tariff-form-wide" data-field="tarif_reduction_id">
                <Form.Label><RequiredLabel required={selectedGridId === ""}>Plan de réductions</RequiredLabel></Form.Label>
                {selectedGridId !== "" ? <Form.Control value={selectedPlan?.designation ?? ""} readOnly /> : <Form.Select name="tarif_reduction_id" value={detailForm.tarif_reduction_id} onChange={handleDetailChange} isInvalid={!!detailErrors.tarif_reduction_id}><option value="">Sélectionner un plan</option>{grids.map((grid) => <option key={grid.id} value={grid.id} disabled={planUsage(grid).locked}>{grid.designation}</option>)}</Form.Select>}
                <Form.Control.Feedback type="invalid">{detailErrors.tarif_reduction_id}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="tariff-form-wide" data-field="type_reduction_id">
                <Form.Label><RequiredLabel required>Type de réduction</RequiredLabel></Form.Label>
                <Form.Select name="type_reduction_id" value={detailForm.type_reduction_id} onChange={handleDetailChange} isInvalid={!!detailErrors.type_reduction_id}>
                  <option value="">Sélectionner un type de réduction</option>
                  {availableReductionTypes.map((type) => <option key={type.id} value={type.id}>{type.type_reduction}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{detailErrors.type_reduction_id}</Form.Control.Feedback>
              </Form.Group>
              <div className="tariff-form-wide"><Form.Label><RequiredLabel required>Valeur de la réduction</RequiredLabel></Form.Label><Form.Text>Renseignez un montant fixe, un pourcentage, ou les deux.</Form.Text></div>
              <Form.Group data-field="montant_fixe">
                <Form.Label>Montant fixe</Form.Label>
                <Form.Control type="number" min="0" step="0.01" name="montant_fixe" value={detailForm.montant_fixe} onChange={handleDetailChange} isInvalid={!!detailErrors.montant_fixe} />
                <Form.Text>Montant soustrait en DH.</Form.Text>
                <Form.Control.Feedback type="invalid">{detailErrors.montant_fixe}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group data-field={detailErrors.reduction_value ? "reduction_value" : "pourcentage"}>
                <Form.Label>Pourcentage</Form.Label>
                <Form.Control type="number" min="0" max="100" step="0.01" name="pourcentage" value={detailForm.pourcentage} onChange={handleDetailChange} isInvalid={!!detailErrors.pourcentage || !!detailErrors.reduction_value} />
                <Form.Text>Pourcentage soustrait du sous-total éligible.</Form.Text>
                <Form.Control.Feedback type="invalid">{detailErrors.pourcentage || detailErrors.reduction_value}</Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="app-form-actions">
              <Button type="submit" className="app-primary-button" disabled={detailSaving}>{detailSaving ? "Enregistrement..." : "Valider"}</Button>
              <Button type="button" className="app-secondary-button" onClick={closeDrawer}>Annuler</Button>
            </div>
          </Form>
        </div>

        {!loading && !loadError && totalRows > 0 && (
          <div id="tableContainer" className="app-table-wrapper tariff-table-wrapper">
            <table id="tarifReductionTable" className="table table-bordered app-table">
              <thead><tr>
                <th><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} aria-label="Sélectionner les lignes visibles" /></th>
                <th>Type de réduction</th><th>Montant fixe</th><th>Pourcentage</th>
                <th>Plan de réductions</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {visibleDetails.map((detail) => {
                  const locked = isDetailLocked(detail);
                  return <tr key={detail.id}>
                    <td><input type="checkbox" checked={selectedItems.includes(detail.id)} onChange={() => toggleSelection(detail.id)} aria-label={`Sélectionner ${reductionTypeOf(detail)?.type_reduction ?? detail.id}`} /></td>
                    <td>{highlightText(reductionTypeOf(detail)?.type_reduction ?? "-", searchTerm)}</td>
                    <td>{formatMoney(fixedAmountOf(detail))}</td>
                    <td>{formatPercentage(percentageOf(detail))}</td>
                    <td>{highlightText(reductionGridOf(detail)?.designation ?? "-", searchTerm)}</td>
                    <td><div className="app-table-actions">
                      <button type="button" className="tariff-action-button" onClick={() => openEditDrawer(detail)} disabled={locked} title={locked ? "Plan verrouillé" : "Modifier la règle"} aria-label="Modifier la règle"><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button>
                      <button type="button" className="tariff-action-button" onClick={() => deleteDetail(detail)} disabled={locked} title={locked ? "Plan verrouillé" : "Supprimer la règle"} aria-label="Supprimer la règle"><FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" /></button>
                    </div></td>
                  </tr>;
                })}
                {!visibleDetails.length && <tr><td colSpan={columnCount} className="text-center">Aucune réduction disponible</td></tr>}
              </tbody>
            </table>
            <div className="app-table-footer">
              <Button type="button" className="app-danger-button" onClick={deleteSelected} disabled={!selectedItems.length}><FontAwesomeIcon icon={faTrash} /> Supprimer la sélection</Button>
              <ListPagination page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
            </div>
          </div>
        )}

        <Modal show={gridModalOpen} onHide={closeGridModal} size="lg" centered>
          <Modal.Header closeButton><Modal.Title>Gérer les plans de réductions</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={saveGrid} className="tariff-plan-form" noValidate><p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p><Form.Group data-field="designation"><Form.Label><RequiredLabel required>Désignation</RequiredLabel></Form.Label><Form.Control value={gridForm.designation} onChange={(event) => { setGridForm({ designation: event.target.value }); setGridErrors({}); }} isInvalid={!!gridErrors.designation} placeholder="Ex. Réductions fidélité 2026" /><Form.Control.Feedback type="invalid">{gridErrors.designation}</Form.Control.Feedback></Form.Group><div className="app-form-actions"><Button type="submit" className="app-primary-button" disabled={gridSaving}>{editingGrid ? "Modifier" : "Ajouter"}</Button>{editingGrid && <Button type="button" className="app-secondary-button" onClick={() => { setEditingGrid(null); setGridForm(EMPTY_GRID); setGridErrors({}); }}>Annuler la modification</Button>}</div></Form>
            <div className="app-table-wrapper tariff-modal-table"><table className="table table-bordered app-table"><thead><tr><th>Désignation</th><th>Utilisation</th><th>Actions</th></tr></thead><tbody>{grids.map((grid) => { const usage = planUsage(grid); return <tr key={grid.id}><td>{grid.designation}</td><td><span className={`tariff-plan-usage is-${usage.state}`}>{usage.label}</span></td><td><div className="app-table-actions"><button type="button" className="tariff-action-button" onClick={() => editGrid(grid)} disabled={usage.locked} title={usage.locked ? usage.label : "Modifier le plan"} aria-label="Modifier le plan"><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button><button type="button" className="tariff-action-button" onClick={() => deleteGrid(grid)} disabled={usage.referenced} title={usage.referenced ? usage.label : "Supprimer le plan"} aria-label="Supprimer le plan"><FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" /></button></div></td></tr>; })}{!grids.length && <tr><td colSpan="3" className="text-center">Aucun plan de réductions</td></tr>}</tbody></table></div>
          </Modal.Body>
          <Modal.Footer><Button type="button" className="app-secondary-button" onClick={closeGridModal}>Fermer</Button></Modal.Footer>
        </Modal>

        <Modal show={typeModalOpen} onHide={closeTypeModal} size="lg" centered>
          <Modal.Header closeButton><Modal.Title>Gestion des types de réduction</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={saveType} className="tariff-type-form" noValidate>
              <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
              <Form.Group data-field="code"><Form.Label><RequiredLabel required>Code</RequiredLabel></Form.Label><Form.Control value={typeForm.code} onChange={(event) => { setTypeForm((current) => ({ ...current, code: event.target.value })); setTypeErrors((current) => ({ ...current, code: "" })); }} isInvalid={!!typeErrors.code} /><Form.Control.Feedback type="invalid">{typeErrors.code}</Form.Control.Feedback></Form.Group>
              <Form.Group data-field="type_reduction"><Form.Label><RequiredLabel required>Type de réduction</RequiredLabel></Form.Label><Form.Control value={typeForm.type_reduction} onChange={(event) => { setTypeForm((current) => ({ ...current, type_reduction: event.target.value })); setTypeErrors((current) => ({ ...current, type_reduction: "" })); }} isInvalid={!!typeErrors.type_reduction} /><Form.Control.Feedback type="invalid">{typeErrors.type_reduction}</Form.Control.Feedback></Form.Group>
              <div className="app-form-actions"><Button type="submit" className="app-primary-button" disabled={typeSaving}>{editingType ? "Modifier" : "Ajouter"}</Button>{editingType && <Button type="button" className="app-secondary-button" onClick={() => { setEditingType(null); setTypeForm(EMPTY_TYPE); setTypeErrors({}); }}>Annuler la modification</Button>}</div>
            </Form>
            <div className="app-table-wrapper tariff-modal-table"><table className="table table-bordered app-table"><thead><tr><th>Code</th><th>Type de réduction</th><th>Actions</th></tr></thead><tbody>
              {reductionTypes.map((type) => <tr key={type.id}><td>{type.code}</td><td>{type.type_reduction}</td><td><div className="app-table-actions"><button type="button" className="tariff-action-button" onClick={() => editType(type)} title="Modifier le type" aria-label="Modifier le type"><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button><button type="button" className="tariff-action-button" onClick={() => deleteType(type)} title="Supprimer le type" aria-label="Supprimer le type"><FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" /></button></div></td></tr>)}
              {!reductionTypes.length && <tr><td colSpan="3" className="text-center">Aucun type de réduction</td></tr>}
            </tbody></table></div>
          </Modal.Body>
          <Modal.Footer><Button type="button" className="app-secondary-button" onClick={closeTypeModal}>Fermer</Button></Modal.Footer>
        </Modal>
      </Box>
    </Box>
  );
};

export default TarifReduction;
