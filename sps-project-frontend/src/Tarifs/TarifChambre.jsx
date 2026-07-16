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
import SearchWithExport from "../components/SearchWithExport";
import TariffPlanSelector from "../components/TariffPlanSelector";
import useListControls from "../components/useListControls";
import { useOpen } from "../Acceuil/OpenProvider";
import { exportToExcel as exportExcelRows, exportToPdf, printRows } from "../utils/listExportUtils";
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
  tarif_chambre_id: "",
  type_chambre_id: "",
  prix_1_personne: "",
  prix_2_personnes: "",
  prix_3_personnes: "",
  prix_lit_supplementaire: "0",
};

const EMPTY_GRID = { designation: "" };
const EXPORT_COLUMNS = [
  { key: "code", label: "Code" },
  { key: "roomType", label: "Type de chambre" },
  { key: "price1", label: "Prix pour 1 personne" },
  { key: "price2", label: "Prix pour 2 personnes" },
  { key: "price3", label: "Prix pour 3 personnes" },
  { key: "extraBed", label: "Lit supplémentaire" },
  { key: "plan", label: "Plan tarifaire" },
];

const roomTypeOf = (detail) => detail.room_type ?? detail.type_chambre ?? null;
const roomGridOf = (detail) => detail.room_rate_grid ?? detail.tarif_chambre ?? null;
const detailPrice = (detail, normalized, legacy) => detail[normalized] ?? detail[legacy] ?? "";
const formatOccupancyMoney = (value) => Number(value) > 0 ? formatMoney(value) : "—";

const TarifChambre = () => {
  const { dynamicStyles } = useOpen();
  const [details, setDetails] = useState([]);
  const [grids, setGrids] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
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

  const refreshData = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const tariffResponse = await axios.get(`${API_URL}/tarifs-chambre`);
      const payload = tariffResponse.data || {};
      const nextDetails = Array.isArray(payload.tarifsChambreDetail)
        ? payload.tarifsChambreDetail
        : [];
      const nextGrids = Array.isArray(payload.tarifsChambre) ? payload.tarifsChambre : [];

      setDetails(nextDetails);
      setGrids(nextGrids);
      setRoomTypes(Array.isArray(payload.typesChambre) ? payload.typesChambre : []);
      setSelectedItems((current) =>
        current.filter((id) => nextDetails.some((detail) => Number(detail.id) === Number(id))),
      );
      setSelectedGridId((current) =>
        current !== "" && !nextGrids.some((grid) => Number(grid.id) === Number(current)) ? "" : current,
      );
    } catch (error) {
      setLoadError(firstBackendMessage(error, "Impossible de charger les tarifs chambre."));
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
      if (selectedGridId !== "" && String(detail.tarif_chambre_id) !== String(selectedGridId)) return false;
      if (!term) return true;
      const type = roomTypeOf(detail);
      const grid = roomGridOf(detail);
      return matchesNormalizedSearch(term, [
        detail.code,
        grid?.designation,
        type?.code,
        type?.type_chambre,
        getNumberSearchVariants(detailPrice(detail, "prix_1_personne", "single"), "DH"),
        getNumberSearchVariants(detailPrice(detail, "prix_2_personnes", "double"), "DH"),
        getNumberSearchVariants(detailPrice(detail, "prix_3_personnes", "triple"), "DH"),
        getNumberSearchVariants(detailPrice(detail, "prix_lit_supplementaire", "lit_supp"), "DH"),
      ]);
    });
  }, [selectedGridId]);

  const {
    searchTerm, page, rowsPerPage, filteredRows: filteredDetails, visibleRows: visibleDetails,
    totalRows, setSearchTerm, setPage, setRowsPerPage, resetPage,
  } = useListControls({ allRows: details, filterRows: filterDetails, storageKey: "rowsPerPageTarifsChambre" });
  const visibleIds = visibleDetails.map((detail) => detail.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedItems.includes(id));
  const selectedPlan = grids.find((grid) => Number(grid.id) === Number(selectedGridId));
  const selectedGridLocked = planUsage(selectedPlan).locked;
  const isDetailLocked = (detail) => planUsage(
    grids.find((grid) => Number(grid.id) === Number(detail.tarif_chambre_id)) ?? roomGridOf(detail),
  ).locked;

  const availableRoomTypes = useMemo(() => {
    if (!detailForm.tarif_chambre_id) return roomTypes;

    const configured = new Set(
      details
        .filter(
          (detail) =>
            Number(detail.tarif_chambre_id) === Number(detailForm.tarif_chambre_id) &&
            Number(detail.id) !== Number(editingDetail?.id),
        )
        .map((detail) => Number(detail.type_chambre_id)),
    );
    return roomTypes.filter((type) => !configured.has(Number(type.id)));
  }, [detailForm.tarif_chambre_id, details, editingDetail, roomTypes]);

  const handleGridSelect = (id) => {
    setSelectedGridId(id === "" ? "" : Number(id));
    resetPage();
  };

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
    setDetailForm({ ...EMPTY_DETAIL, tarif_chambre_id: selectedGridId || "" });
    setDetailErrors({});
    setDrawerOpen(true);
  };

  const openEditDrawer = (detail) => {
    if (isDetailLocked(detail)) return;

    setEditingDetail(detail);
    setDetailForm({
      tarif_chambre_id: detail.tarif_chambre_id ?? roomGridOf(detail)?.id ?? "",
      type_chambre_id: detail.type_chambre_id ?? roomTypeOf(detail)?.id ?? "",
      prix_1_personne: detailPrice(detail, "prix_1_personne", "single"),
      prix_2_personnes: detailPrice(detail, "prix_2_personnes", "double"),
      prix_3_personnes: detailPrice(detail, "prix_3_personnes", "triple"),
      prix_lit_supplementaire: detailPrice(detail, "prix_lit_supplementaire", "lit_supp") || "0",
    });
    setDetailErrors({});
    setDrawerOpen(true);
  };

  const handleDetailChange = ({ target }) => {
    const { name, value } = target;
    setDetailForm((current) => ({ ...current, [name]: value }));
    setDetailErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateDetail = () => {
    const nextErrors = {};
    if (!detailForm.tarif_chambre_id) nextErrors.tarif_chambre_id = "Le plan tarifaire est obligatoire.";
    if (!detailForm.type_chambre_id) nextErrors.type_chambre_id = "Le type de chambre est obligatoire.";

    const occupancyFields = ["prix_1_personne", "prix_2_personnes", "prix_3_personnes"];
    if (occupancyFields.every((field) => detailForm[field] === "" || Number(detailForm[field]) <= 0)) {
      nextErrors.prix_1_personne = "Au moins un prix d'occupation doit être strictement supérieur à zéro.";
    }
    occupancyFields.forEach((field) => {
      if (detailForm[field] !== "" && Number(detailForm[field]) < 0) {
        nextErrors[field] = "Le prix ne peut pas être négatif.";
      }
    });
    if (detailForm.prix_lit_supplementaire === "" || Number(detailForm.prix_lit_supplementaire) < 0) {
      nextErrors.prix_lit_supplementaire = "Le prix doit être supérieur ou égal à zéro.";
    }

    setDetailErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleDetailSubmit = async (event) => {
    event.preventDefault();
    if (!validateDetail()) return;

    const payload = {
      tarif_chambre_id: Number(detailForm.tarif_chambre_id),
      type_chambre_id: Number(detailForm.type_chambre_id),
      prix_1_personne: detailForm.prix_1_personne === "" ? null : Number(detailForm.prix_1_personne),
      prix_2_personnes: detailForm.prix_2_personnes === "" ? null : Number(detailForm.prix_2_personnes),
      prix_3_personnes: detailForm.prix_3_personnes === "" ? null : Number(detailForm.prix_3_personnes),
      prix_lit_supplementaire: Number(detailForm.prix_lit_supplementaire || 0),
    };

    setDetailSaving(true);
    try {
      if (editingDetail) {
        await axios.put(`${API_URL}/tarifs-chambre/${editingDetail.id}`, payload);
      } else {
        await axios.post(`${API_URL}/tarifs-chambre`, payload);
      }
      await refreshData();
      await Swal.fire("Succès", `Tarif chambre ${editingDetail ? "modifié" : "ajouté"} avec succès.`, "success");
      closeDrawer();
    } catch (error) {
      if (error.response?.status === 422) setDetailErrors(backendFieldErrors(error));
      if (error.response?.status === 409) await refreshData();
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible d'enregistrer ce tarif chambre."), "error");
    } finally {
      setDetailSaving(false);
    }
  };

  const deleteDetail = async (detail) => {
    const confirmation = await Swal.fire({
      title: "Supprimer ce tarif chambre ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!confirmation.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/tarifs-chambre/${detail.id}`);
      await refreshData();
      setSelectedItems((current) => current.filter((id) => id !== detail.id));
      await Swal.fire("Succès", "Tarif chambre supprimé avec succès.", "success");
    } catch (error) {
      if (error.response?.status === 409) await refreshData();
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible de supprimer ce tarif chambre."), "error");
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
    const results = await Promise.allSettled(
      ids.map((id) => axios.delete(`${API_URL}/tarifs-chambre/${id}`)),
    );
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
      setGridErrors({ designation: "La désignation est obligatoire." });
      return;
    }

    setGridSaving(true);
    try {
      if (editingGrid) {
        await axios.put(`${API_URL}/desigs-chambre/${editingGrid.id}`, { designation });
      } else {
        await axios.post(`${API_URL}/desigs-chambre`, { designation });
      }
      await refreshData();
      await Swal.fire("Succès", `Plan tarifaire ${editingGrid ? "modifié" : "ajouté"} avec succès.`, "success");
      setEditingGrid(null);
      setGridForm(EMPTY_GRID);
      setGridErrors({});
    } catch (error) {
      if (error.response?.status === 422) setGridErrors(backendFieldErrors(error));
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
      await axios.delete(`${API_URL}/desigs-chambre/${grid.id}`);
      await refreshData();
      await Swal.fire("Succès", "Plan tarifaire supprimé avec succès.", "success");
    } catch (error) {
      if (error.response?.status === 409) await refreshData();
      await Swal.fire("Erreur", firstBackendMessage(error, "Impossible de supprimer ce plan."), "error");
    }
  };

  const filtersActive = Boolean(searchTerm || selectedGridId !== "");
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedGridId("");
    resetPage();
  }, [resetPage, setSearchTerm]);

  const exportRows = useMemo(() => filteredDetails.map((detail) => ({
    code: detail.code ?? "",
    roomType: roomTypeOf(detail)?.type_chambre ?? "",
    price1: formatOccupancyMoney(detailPrice(detail, "prix_1_personne", "single")),
    price2: formatOccupancyMoney(detailPrice(detail, "prix_2_personnes", "double")),
    price3: formatOccupancyMoney(detailPrice(detail, "prix_3_personnes", "triple")),
    extraBed: formatMoney(detailPrice(detail, "prix_lit_supplementaire", "lit_supp")),
    plan: roomGridOf(detail)?.designation ?? "",
  })), [filteredDetails]);

  const exportToExcel = () => {
    exportExcelRows({ rows: exportRows, columns: EXPORT_COLUMNS, sheetName: "Tarifs Chambre", filename: "tarifs-chambre.xlsx" });
  };

  const exportToPDF = () => {
    exportToPdf({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Tarifs Chambre", filename: "tarifs-chambre.pdf", orientation: "landscape" });
  };

  const printTable = () => {
    printRows({ rows: exportRows, columns: EXPORT_COLUMNS, title: "Tarifs Chambre", orientation: "landscape" });
  };

  const columnCount = 9;

  return (
    <Box sx={{ ...dynamicStyles }}>
      <Box component="main" className="app-page tariff-page tarif-chambre-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>
        <SearchWithExport
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          exportToExcel={exportToExcel}
          exportToPDF={exportToPDF}
          printTable={printTable}
          Title="Tarifs Chambre"
          resultCount={totalRows}
          loading={loading}
          exportsDisabled={totalRows === 0}
        />

        <TariffPlanSelector
          label="Plan tarifaire chambre"
          plans={grids}
          selectedPlanId={selectedGridId}
          onSelect={handleGridSelect}
          onManage={openGridModal}
          onAddDetail={openAddDrawer}
          addLabel="Ajouter un prix de chambre"
          filterActions={<ListFilterReset active={filtersActive} onReset={resetFilters} />}
        />

        <ListState loading={loading} error={loadError} allRowsCount={details.length} filteredRowsCount={totalRows} emptyDataMessage="Aucun tarif chambre enregistré." onRetry={refreshData} onResetFilters={resetFilters} />

        <div
          id="formContainer"
          className="app-form-drawer tariff-form-drawer"
          style={{ right: drawerOpen ? 0 : "-100%" }}
          aria-hidden={!drawerOpen}
        >
          <Form onSubmit={handleDetailSubmit}>
            <h2 className="app-form-drawer-title">
              {editingDetail ? "Modifier" : "Ajouter"} un tarif chambre
            </h2>
            <p className="tariff-form-hint">Les montants correspondent au nombre de personnes occupant la chambre.</p>

            <div className="tariff-form-grid">
              <Form.Group className="tariff-form-wide">
                <Form.Label>Plan tarifaire chambre</Form.Label>
                {selectedGridId !== "" ? (
                  <Form.Control value={selectedPlan?.designation ?? ""} readOnly />
                ) : (
                  <Form.Select name="tarif_chambre_id" value={detailForm.tarif_chambre_id} onChange={handleDetailChange} isInvalid={!!detailErrors.tarif_chambre_id}>
                    <option value="">Sélectionner un plan</option>
                    {grids.map((grid) => <option key={grid.id} value={grid.id} disabled={planUsage(grid).locked}>{grid.designation}</option>)}
                  </Form.Select>
                )}
                <Form.Control.Feedback type="invalid">{detailErrors.tarif_chambre_id}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="tariff-form-wide">
                <Form.Label>Type de chambre</Form.Label>
                <Form.Select name="type_chambre_id" value={detailForm.type_chambre_id} onChange={handleDetailChange} isInvalid={!!detailErrors.type_chambre_id}>
                  <option value="">Sélectionner un type de chambre</option>
                  {availableRoomTypes.map((type) => <option key={type.id} value={type.id}>{type.type_chambre}{type.nb_lit ? ` — ${type.nb_lit} lit${Number(type.nb_lit) > 1 ? "s" : ""}` : ""}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{detailErrors.type_chambre_id}</Form.Control.Feedback>
                <Form.Text>Les types de chambre sont gérés dans le module Chambre.</Form.Text>
              </Form.Group>
              {[
                ["prix_1_personne", "Prix pour 1 personne"],
                ["prix_2_personnes", "Prix pour 2 personnes"],
                ["prix_3_personnes", "Prix pour 3 personnes"],
                ["prix_lit_supplementaire", "Prix du lit supplémentaire"],
              ].map(([name, label]) => (
                <Form.Group key={name}>
                  <Form.Label>{label}</Form.Label>
                  <Form.Control type="number" min="0" step="0.01" name={name} value={detailForm[name]} onChange={handleDetailChange} isInvalid={!!detailErrors[name]} />
                  <Form.Control.Feedback type="invalid">{detailErrors[name]}</Form.Control.Feedback>
                </Form.Group>
              ))}
            </div>

            <div className="app-form-actions">
              <Button type="submit" className="app-primary-button" disabled={detailSaving}>{detailSaving ? "Enregistrement..." : "Valider"}</Button>
              <Button type="button" className="app-secondary-button" onClick={closeDrawer}>Annuler</Button>
            </div>
          </Form>
        </div>

        {!loading && !loadError && totalRows > 0 && (
          <div id="tableContainer" className="app-table-wrapper tariff-table-wrapper">
            <table id="tarifChambreTable" className="table table-bordered app-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} aria-label="Sélectionner les lignes visibles" /></th>
                  <th>Code</th>
                  <th>Type de chambre</th>
                  <th>1 personne</th>
                  <th>2 personnes</th>
                  <th>3 personnes</th>
                  <th>Lit supplémentaire</th>
                  <th>Plan tarifaire</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDetails.map((detail) => {
                  const locked = isDetailLocked(detail);
                  return (
                    <tr key={detail.id}>
                      <td><input type="checkbox" checked={selectedItems.includes(detail.id)} onChange={() => toggleSelection(detail.id)} aria-label={`Sélectionner ${detail.code}`} /></td>
                      <td>{highlightText(detail.code ?? "", searchTerm)}</td>
                      <td>{highlightText(roomTypeOf(detail)?.type_chambre ?? "-", searchTerm)}</td>
                      <td>{formatOccupancyMoney(detailPrice(detail, "prix_1_personne", "single"))}</td>
                      <td>{formatOccupancyMoney(detailPrice(detail, "prix_2_personnes", "double"))}</td>
                      <td>{formatOccupancyMoney(detailPrice(detail, "prix_3_personnes", "triple"))}</td>
                      <td>{formatMoney(detailPrice(detail, "prix_lit_supplementaire", "lit_supp"))}</td>
                      <td>{highlightText(roomGridOf(detail)?.designation ?? "-", searchTerm)}</td>
                      <td>
                        <div className="app-table-actions">
                          <button type="button" className="tariff-action-button" onClick={() => openEditDrawer(detail)} disabled={locked} title={locked ? "Plan verrouillé" : "Modifier le prix"} aria-label="Modifier le prix">
                            <FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" />
                          </button>
                          <button type="button" className="tariff-action-button" onClick={() => deleteDetail(detail)} disabled={locked} title={locked ? "Plan verrouillé" : "Supprimer le prix"} aria-label="Supprimer le prix">
                            <FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!visibleDetails.length && <tr><td colSpan={columnCount} className="text-center">Aucun tarif chambre disponible</td></tr>}
              </tbody>
            </table>

            <div className="app-table-footer">
              <Button type="button" className="app-danger-button" onClick={deleteSelected} disabled={!selectedItems.length}>
                <FontAwesomeIcon icon={faTrash} /> Supprimer la sélection
              </Button>
              <ListPagination page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
            </div>
          </div>
        )}

        <Modal show={gridModalOpen} onHide={closeGridModal} size="lg" centered>
          <Modal.Header closeButton><Modal.Title>Gérer les plans tarifaires chambre</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={saveGrid} className="tariff-plan-form">
              <Form.Group><Form.Label>Désignation</Form.Label><Form.Control value={gridForm.designation} onChange={(event) => { setGridForm({ designation: event.target.value }); setGridErrors({}); }} isInvalid={!!gridErrors.designation} placeholder="Ex. Tarif hébergement été 2026" /><Form.Control.Feedback type="invalid">{gridErrors.designation}</Form.Control.Feedback></Form.Group>
              <div className="app-form-actions"><Button type="submit" className="app-primary-button" disabled={gridSaving}>{editingGrid ? "Modifier" : "Ajouter"}</Button>{editingGrid && <Button type="button" className="app-secondary-button" onClick={() => { setEditingGrid(null); setGridForm(EMPTY_GRID); setGridErrors({}); }}>Annuler la modification</Button>}</div>
            </Form>
            <div className="app-table-wrapper tariff-modal-table"><table className="table table-bordered app-table"><thead><tr><th>Désignation</th><th>Utilisation</th><th>Actions</th></tr></thead><tbody>
              {grids.map((grid) => { const usage = planUsage(grid); return <tr key={grid.id}><td>{grid.designation}</td><td><span className={`tariff-plan-usage is-${usage.state}`}>{usage.label}</span></td><td><div className="app-table-actions"><button type="button" className="tariff-action-button" onClick={() => editGrid(grid)} disabled={usage.locked} title={usage.locked ? usage.label : "Modifier le plan"} aria-label="Modifier le plan"><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button><button type="button" className="tariff-action-button" onClick={() => deleteGrid(grid)} disabled={usage.referenced} title={usage.referenced ? usage.label : "Supprimer le plan"} aria-label="Supprimer le plan"><FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" /></button></div></td></tr>; })}
              {!grids.length && <tr><td colSpan="3" className="text-center">Aucun plan tarifaire</td></tr>}
            </tbody></table></div>
          </Modal.Body>
          <Modal.Footer><Button type="button" className="app-secondary-button" onClick={closeGridModal}>Fermer</Button></Modal.Footer>
        </Modal>
      </Box>
    </Box>
  );
};

export default TarifChambre;
