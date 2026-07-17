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
  tarif_repas_id: "",
  type_repas_id: "",
  prix_par_personne: "",
};
const EMPTY_GRID = { designation: "" };
const EMPTY_TYPE = { code: "", type_repas: "" };
const EXPORT_COLUMNS = [
  { key: "mealType", label: "Type de repas" },
  { key: "price", label: "Prix par personne" },
  { key: "plan", label: "Plan tarifaire" },
];

const mealTypeOf = (detail) => detail.meal_type ?? detail.type_repas ?? null;
const mealGridOf = (detail) => detail.meal_rate_grid ?? detail.tarif_repas ?? null;
const mealPrice = (detail) => detail.prix_par_personne ?? detail.montant ?? "";

const TarifRepas = () => {
  const { dynamicStyles } = useOpen();
  const [details, setDetails] = useState([]);
  const [grids, setGrids] = useState([]);
  const [mealTypes, setMealTypes] = useState([]);
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
      const tariffResponse = await axios.get(`${API_URL}/tarifs-repas`);
      const payload = tariffResponse.data || {};
      const nextDetails = Array.isArray(payload.tarifRepas) ? payload.tarifRepas : [];
      const nextGrids = Array.isArray(payload.tarifsRepas) ? payload.tarifsRepas : [];

      setDetails(nextDetails);
      setGrids(nextGrids);
      setMealTypes(Array.isArray(payload.typesRepas) ? payload.typesRepas : []);
      setSelectedItems((current) =>
        current.filter((id) => nextDetails.some((detail) => Number(detail.id) === Number(id))),
      );
      setSelectedGridId((current) =>
        current !== "" && !nextGrids.some((grid) => Number(grid.id) === Number(current)) ? "" : current,
      );
    } catch (error) {
      setLoadError(firstBackendMessage(error, "Impossible de charger les tarifs repas."));
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
      if (selectedGridId !== "" && String(detail.tarif_repas_id) !== String(selectedGridId)) return false;
      if (!term) return true;

      const type = mealTypeOf(detail);
      const grid = mealGridOf(detail);
      return matchesNormalizedSearch(term, [
        grid?.designation,
        type?.code,
        type?.type_repas,
        getNumberSearchVariants(mealPrice(detail), "DH"),
      ]);
    });
  }, [selectedGridId]);

  const {
    searchTerm, page, rowsPerPage, filteredRows: filteredDetails, visibleRows: visibleDetails,
    totalRows, setSearchTerm, setPage, setRowsPerPage, resetPage,
  } = useListControls({ allRows: details, filterRows: filterDetails, storageKey: "rowsPerPageTarifsRepas" });
  const visibleIds = visibleDetails.map((detail) => detail.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedItems.includes(id));
  const selectedPlan = grids.find((grid) => Number(grid.id) === Number(selectedGridId));
  const selectedGridLocked = planUsage(selectedPlan).locked;
  const isDetailLocked = (detail) => planUsage(
    grids.find((grid) => Number(grid.id) === Number(detail.tarif_repas_id)) ?? mealGridOf(detail),
  ).locked;

  const availableMealTypes = useMemo(() => {
    if (!detailForm.tarif_repas_id) return mealTypes;
    const configured = new Set(
      details
        .filter(
          (detail) =>
            Number(detail.tarif_repas_id) === Number(detailForm.tarif_repas_id) &&
            Number(detail.id) !== Number(editingDetail?.id),
        )
        .map((detail) => Number(detail.type_repas_id)),
    );
    return mealTypes.filter((type) => !configured.has(Number(type.id)));
  }, [detailForm.tarif_repas_id, details, editingDetail, mealTypes]);

  const resetDetailForm = () => {
    setEditingDetail(null);
    setDetailForm(EMPTY_DETAIL);
    setDetailErrors({});
    setDetailSaving(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    resetDetailForm();
  };

  const openAddDrawer = () => {
    if (selectedGridLocked) {
      Swal.fire("Plan verrouillé", planUsage(selectedPlan).label, "info");
      return;
    }
    setEditingDetail(null);
    setDetailForm({ ...EMPTY_DETAIL, tarif_repas_id: selectedGridId || "" });
    setDetailErrors({});
    setDrawerOpen(true);
  };

  const openEditDrawer = (detail) => {
    if (isDetailLocked(detail)) return;
    setEditingDetail(detail);
    setDetailForm({
      tarif_repas_id: detail.tarif_repas_id ?? mealGridOf(detail)?.id ?? "",
      type_repas_id: detail.type_repas_id ?? mealTypeOf(detail)?.id ?? "",
      prix_par_personne: mealPrice(detail),
    });
    setDetailErrors({});
    setDrawerOpen(true);
  };

  const handleDetailChange = ({ target }) => {
    setDetailForm((current) => ({ ...current, [target.name]: target.value }));
    setDetailErrors((current) => ({ ...current, [target.name]: "" }));
  };

  const validateDetail = () => {
    const nextErrors = {};
    if (!detailForm.tarif_repas_id) nextErrors.tarif_repas_id = "Le plan tarifaire est obligatoire.";
    if (!detailForm.type_repas_id) nextErrors.type_repas_id = "Le type de repas est obligatoire.";
    if (detailForm.prix_par_personne === "") {
      nextErrors.prix_par_personne = "Le prix par personne est obligatoire.";
    } else if (Number(detailForm.prix_par_personne) < 0) {
      nextErrors.prix_par_personne = "Le prix ne peut pas être négatif.";
    }
    setDetailErrors(nextErrors);
    if (Object.keys(nextErrors).length) focusFirstInvalidField(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveDetail = async (event) => {
    event.preventDefault();
    if (!validateDetail()) return;

    const payload = {
      tarif_repas_id: Number(detailForm.tarif_repas_id),
      type_repas_id: Number(detailForm.type_repas_id),
      prix_par_personne: Number(detailForm.prix_par_personne),
    };
    setDetailSaving(true);

    try {
      if (editingDetail) {
        await axios.put(`${API_URL}/tarifs-repas/${editingDetail.id}`, payload);
      } else {
        await axios.post(`${API_URL}/tarifs-repas`, payload);
      }
      await refreshData();
      await Swal.fire("Succès", `Tarif repas ${editingDetail ? "modifié" : "ajouté"} avec succès.`, "success");
      closeDrawer();
    } catch (error) {
      if (error.response?.status === 422) {
        const fieldErrors = backendFieldErrors(error);
        setDetailErrors(fieldErrors);
        focusFirstInvalidField(fieldErrors);
        return;
      }
      if (error.response?.status === 409) await refreshData();
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible d'enregistrer ce tarif repas."), "error");
    } finally {
      setDetailSaving(false);
    }
  };

  const deleteDetail = async (detail) => {
    const confirmation = await Swal.fire({
      title: "Supprimer ce tarif repas ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/tarifs-repas/${detail.id}`);
      await refreshData();
      setSelectedItems((current) => current.filter((id) => id !== detail.id));
      await Swal.fire("Succès", "Tarif repas supprimé avec succès.", "success");
    } catch (error) {
      if (error.response?.status === 409) await refreshData();
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible de supprimer ce tarif repas."), "error");
    }
  };

  const deleteSelected = async () => {
    if (!selectedItems.length) return;
    const confirmation = await Swal.fire({
      title: `Supprimer ${selectedItems.length} tarif(s) ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;

    const ids = [...selectedItems];
    const results = await Promise.allSettled(ids.map((id) => axios.delete(`${API_URL}/tarifs-repas/${id}`)));
    const failedIds = ids.filter((_, index) => results[index].status === "rejected");
    const firstFailure = results.find((result) => result.status === "rejected");
    setSelectedItems(failedIds);
    await refreshData();

    const succeeded = ids.length - failedIds.length;
    const failureMessage = firstFailure
      ? ` ${firstBackendMessage(firstFailure.reason, "Certaines suppressions ont échoué.")}`
      : "";
    await Swal.fire(
      failedIds.length ? "Suppression partielle" : "Succès",
      `${succeeded} suppression(s) réussie(s), ${failedIds.length} échec(s).${failureMessage}`,
      failedIds.length ? "warning" : "success",
    );
  };

  const toggleSelectAll = () => {
    setSelectedItems((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return [...new Set([...current, ...visibleIds])];
    });
  };
  const toggleSelection = (id) => {
    setSelectedItems((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
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
        await axios.put(`${API_URL}/desigs-repas/${editingGrid.id}`, { designation });
      } else {
        await axios.post(`${API_URL}/desigs-repas`, { designation });
      }
      await refreshData();
      await Swal.fire("Succès", `Plan tarifaire ${editingGrid ? "modifié" : "ajouté"} avec succès.`, "success");
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
      await axios.delete(`${API_URL}/desigs-repas/${grid.id}`);
      await refreshData();
      await Swal.fire("Succès", "Plan tarifaire supprimé avec succès.", "success");
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
    setTypeForm({ code: type.code ?? "", type_repas: type.type_repas ?? "" });
    setTypeErrors({});
  };

  const saveType = async (event) => {
    event.preventDefault();
    const payload = { code: typeForm.code.trim(), type_repas: typeForm.type_repas.trim() };
    const nextErrors = {};
    if (!payload.code) nextErrors.code = "Le code est obligatoire.";
    if (!payload.type_repas) nextErrors.type_repas = "Le type de repas est obligatoire.";
    if (Object.keys(nextErrors).length) {
      setTypeErrors(nextErrors);
      focusFirstInvalidField(nextErrors);
      return;
    }

    setTypeSaving(true);
    try {
      const response = editingType
        ? await axios.put(`${API_URL}/types-repas/${editingType.id}`, payload)
        : await axios.post(`${API_URL}/types-repas`, payload);
      await refreshData();
      if (!editingType && drawerOpen) {
        setDetailForm((current) => ({ ...current, type_repas_id: response.data.id }));
      }
      setEditingType(null);
      setTypeForm(EMPTY_TYPE);
      setTypeErrors({});
      await Swal.fire("Succès", `Type de repas ${editingType ? "modifié" : "ajouté"} avec succès.`, "success");
    } catch (error) {
      if (error.response?.status === 422) {
        const fieldErrors = backendFieldErrors(error);
        setTypeErrors(fieldErrors);
        focusFirstInvalidField(fieldErrors);
        return;
      }
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible d'enregistrer ce type de repas."), "error");
    } finally {
      setTypeSaving(false);
    }
  };

  const deleteType = async (type) => {
    const confirmation = await Swal.fire({
      title: `Supprimer le type « ${type.type_repas} » ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/types-repas/${type.id}`);
      await refreshData();
      if (Number(detailForm.type_repas_id) === Number(type.id)) {
        setDetailForm((current) => ({ ...current, type_repas_id: "" }));
      }
      await Swal.fire("Succès", "Type de repas supprimé avec succès.", "success");
    } catch (error) {
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible de supprimer ce type de repas."), "error");
    }
  };

  const filtersActive = Boolean(searchTerm || selectedGridId !== "");
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedGridId("");
    resetPage();
  }, [resetPage, setSearchTerm]);

  const exportRows = useMemo(() => filteredDetails.map((detail) => ({
    mealType: mealTypeOf(detail)?.type_repas ?? "",
    price: formatMoney(mealPrice(detail)),
    plan: mealGridOf(detail)?.designation ?? "",
  })), [filteredDetails]);

  const exportToExcel = () => {
    exportExcelRows({ rows: exportRows, columns: EXPORT_COLUMNS, sheetName: "Tarifs Repas", filename: "tarifs-repas.xlsx" });
  };
  const exportToPDF = () => {
    exportToPdf({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Tarifs Repas", filename: "tarifs-repas.pdf", orientation: "portrait" });
  };
  const printTable = () => {
    printRows({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Tarifs Repas", orientation: "portrait" });
  };

  const columnCount = 5;

  return (
    <Box sx={{ ...dynamicStyles }}>
      <Box component="main" className="app-page tariff-page tarif-repas-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>
        <SearchWithExport searchValue={searchTerm} onSearchChange={setSearchTerm} exportToExcel={exportToExcel} exportToPDF={exportToPDF} printTable={printTable} Title="Tarifs Repas" resultCount={totalRows} loading={loading} exportsDisabled={totalRows === 0} />

        <TariffPlanSelector
          label="Plan tarifaire repas"
          plans={grids}
          selectedPlanId={selectedGridId}
          onSelect={(id) => { setSelectedGridId(id === "" ? "" : Number(id)); resetPage(); }}
          onManage={openGridModal}
          onAddDetail={openAddDrawer}
          addLabel="Ajouter un prix de repas"
          extraActions={<button type="button" className="app-secondary-button" onClick={openTypeModal}>Gérer les types de repas</button>}
          filterActions={<ListFilterReset active={filtersActive} onReset={resetFilters} />}
        />

        <ListState loading={loading} error={loadError} allRowsCount={details.length} filteredRowsCount={totalRows} emptyDataMessage="Aucun tarif repas enregistré." onRetry={refreshData} onResetFilters={resetFilters} />

        <div id="formContainer" className="app-form-drawer tariff-form-drawer" style={{ right: drawerOpen ? 0 : "-100%" }} aria-hidden={!drawerOpen}>
          <Form onSubmit={saveDetail} noValidate>
            <h2 className="app-form-drawer-title">{editingDetail ? "Modifier" : "Ajouter"} un tarif repas</h2>
            <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
            <p className="tariff-form-hint">Le montant correspond au prix facturé pour une personne.</p>
            <div className="tariff-form-grid">
              <Form.Group className="tariff-form-wide" data-field="tarif_repas_id">
                <Form.Label><RequiredLabel required={selectedGridId === ""}>Plan tarifaire repas</RequiredLabel></Form.Label>
                {selectedGridId !== "" ? <Form.Control value={selectedPlan?.designation ?? ""} readOnly /> : <Form.Select name="tarif_repas_id" value={detailForm.tarif_repas_id} onChange={handleDetailChange} isInvalid={!!detailErrors.tarif_repas_id}><option value="">Sélectionner un plan</option>{grids.map((grid) => <option key={grid.id} value={grid.id} disabled={planUsage(grid).locked}>{grid.designation}</option>)}</Form.Select>}
                <Form.Control.Feedback type="invalid">{detailErrors.tarif_repas_id}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="tariff-form-wide" data-field="type_repas_id">
                <Form.Label><RequiredLabel required>Type de repas</RequiredLabel></Form.Label>
                <Form.Select name="type_repas_id" value={detailForm.type_repas_id} onChange={handleDetailChange} isInvalid={!!detailErrors.type_repas_id}>
                  <option value="">Sélectionner un type de repas</option>
                  {availableMealTypes.map((type) => <option key={type.id} value={type.id}>{type.type_repas}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{detailErrors.type_repas_id}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="tariff-form-wide" data-field="prix_par_personne">
                <Form.Label><RequiredLabel required>Prix par personne</RequiredLabel></Form.Label>
                <Form.Control type="number" min="0" step="0.01" name="prix_par_personne" value={detailForm.prix_par_personne} onChange={handleDetailChange} isInvalid={!!detailErrors.prix_par_personne} />
                <Form.Control.Feedback type="invalid">{detailErrors.prix_par_personne}</Form.Control.Feedback>
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
            <table id="tarifRepasTable" className="table table-bordered app-table">
              <thead><tr>
                <th><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} aria-label="Sélectionner les lignes visibles" /></th>
                <th>Type de repas</th>
                <th>Prix par personne</th>
                <th>Plan tarifaire</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {visibleDetails.map((detail) => {
                  const locked = isDetailLocked(detail);
                  return <tr key={detail.id}>
                    <td><input type="checkbox" checked={selectedItems.includes(detail.id)} onChange={() => toggleSelection(detail.id)} aria-label={`Sélectionner ${mealTypeOf(detail)?.type_repas ?? detail.id}`} /></td>
                    <td>{highlightText(mealTypeOf(detail)?.type_repas ?? "-", searchTerm)}</td>
                    <td>{formatMoney(mealPrice(detail))}</td>
                    <td>{highlightText(mealGridOf(detail)?.designation ?? "-", searchTerm)}</td>
                    <td><div className="app-table-actions">
                      <button type="button" className="tariff-action-button" onClick={() => openEditDrawer(detail)} disabled={locked} title={locked ? "Plan verrouillé" : "Modifier le prix"} aria-label="Modifier le prix"><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button>
                      <button type="button" className="tariff-action-button" onClick={() => deleteDetail(detail)} disabled={locked} title={locked ? "Plan verrouillé" : "Supprimer le prix"} aria-label="Supprimer le prix"><FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" /></button>
                    </div></td>
                  </tr>;
                })}
                {!visibleDetails.length && <tr><td colSpan={columnCount} className="text-center">Aucun tarif repas disponible</td></tr>}
              </tbody>
            </table>
            <div className="app-table-footer">
              <Button type="button" className="app-danger-button" onClick={deleteSelected} disabled={!selectedItems.length}><FontAwesomeIcon icon={faTrash} /> Supprimer la sélection</Button>
              <ListPagination page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
            </div>
          </div>
        )}

        <Modal show={gridModalOpen} onHide={closeGridModal} size="lg" centered>
          <Modal.Header closeButton><Modal.Title>Gérer les plans tarifaires repas</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={saveGrid} className="tariff-plan-form" noValidate><p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p><Form.Group data-field="designation"><Form.Label><RequiredLabel required>Désignation</RequiredLabel></Form.Label><Form.Control value={gridForm.designation} onChange={(event) => { setGridForm({ designation: event.target.value }); setGridErrors({}); }} isInvalid={!!gridErrors.designation} placeholder="Ex. Tarif repas été 2026" /><Form.Control.Feedback type="invalid">{gridErrors.designation}</Form.Control.Feedback></Form.Group><div className="app-form-actions"><Button type="submit" className="app-primary-button" disabled={gridSaving}>{editingGrid ? "Modifier" : "Ajouter"}</Button>{editingGrid && <Button type="button" className="app-secondary-button" onClick={() => { setEditingGrid(null); setGridForm(EMPTY_GRID); setGridErrors({}); }}>Annuler la modification</Button>}</div></Form>
            <div className="app-table-wrapper tariff-modal-table"><table className="table table-bordered app-table"><thead><tr><th>Désignation</th><th>Utilisation</th><th>Actions</th></tr></thead><tbody>{grids.map((grid) => { const usage = planUsage(grid); return <tr key={grid.id}><td>{grid.designation}</td><td><span className={`tariff-plan-usage is-${usage.state}`}>{usage.label}</span></td><td><div className="app-table-actions"><button type="button" className="tariff-action-button" onClick={() => editGrid(grid)} disabled={usage.locked} title={usage.locked ? usage.label : "Modifier le plan"} aria-label="Modifier le plan"><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button><button type="button" className="tariff-action-button" onClick={() => deleteGrid(grid)} disabled={usage.referenced} title={usage.referenced ? usage.label : "Supprimer le plan"} aria-label="Supprimer le plan"><FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" /></button></div></td></tr>; })}{!grids.length && <tr><td colSpan="3" className="text-center">Aucun plan tarifaire</td></tr>}</tbody></table></div>
          </Modal.Body>
          <Modal.Footer><Button type="button" className="app-secondary-button" onClick={closeGridModal}>Fermer</Button></Modal.Footer>
        </Modal>

        <Modal show={typeModalOpen} onHide={closeTypeModal} size="lg" centered>
          <Modal.Header closeButton><Modal.Title>Gestion des types de repas</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={saveType} className="tariff-type-form" noValidate>
              <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
              <Form.Group data-field="code"><Form.Label><RequiredLabel required>Code</RequiredLabel></Form.Label><Form.Control value={typeForm.code} onChange={(event) => { setTypeForm((current) => ({ ...current, code: event.target.value })); setTypeErrors((current) => ({ ...current, code: "" })); }} isInvalid={!!typeErrors.code} /><Form.Control.Feedback type="invalid">{typeErrors.code}</Form.Control.Feedback></Form.Group>
              <Form.Group data-field="type_repas"><Form.Label><RequiredLabel required>Type de repas</RequiredLabel></Form.Label><Form.Control value={typeForm.type_repas} onChange={(event) => { setTypeForm((current) => ({ ...current, type_repas: event.target.value })); setTypeErrors((current) => ({ ...current, type_repas: "" })); }} isInvalid={!!typeErrors.type_repas} /><Form.Control.Feedback type="invalid">{typeErrors.type_repas}</Form.Control.Feedback></Form.Group>
              <div className="app-form-actions"><Button type="submit" className="app-primary-button" disabled={typeSaving}>{editingType ? "Modifier" : "Ajouter"}</Button>{editingType && <Button type="button" className="app-secondary-button" onClick={() => { setEditingType(null); setTypeForm(EMPTY_TYPE); setTypeErrors({}); }}>Annuler la modification</Button>}</div>
            </Form>
            <div className="app-table-wrapper tariff-modal-table"><table className="table table-bordered app-table"><thead><tr><th>Code</th><th>Type de repas</th><th>Actions</th></tr></thead><tbody>
              {mealTypes.map((type) => <tr key={type.id}><td>{type.code}</td><td>{type.type_repas}</td><td><div className="app-table-actions"><button type="button" className="tariff-action-button" onClick={() => editType(type)} title="Modifier le type"><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button><button type="button" className="tariff-action-button" onClick={() => deleteType(type)} title="Supprimer le type"><FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" /></button></div></td></tr>)}
              {!mealTypes.length && <tr><td colSpan="3" className="text-center">Aucun type de repas</td></tr>}
            </tbody></table></div>
          </Modal.Body>
          <Modal.Footer><Button type="button" className="app-secondary-button" onClick={closeTypeModal}>Fermer</Button></Modal.Footer>
        </Modal>
      </Box>
    </Box>
  );
};

export default TarifRepas;
