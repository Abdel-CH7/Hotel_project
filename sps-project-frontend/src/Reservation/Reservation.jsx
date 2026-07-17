import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import ListFilterReset from "../components/ListFilterReset";
import ListState from "../components/ListState";
import SearchWithExport from "../components/SearchWithExport";
import useListControls from "../components/useListControls";
import { useOpen } from "../Acceuil/OpenProvider";
import CancelReservationModal from "./components/CancelReservationModal";
import ReservationDetails from "./components/ReservationDetails";
import ReservationDrawer from "./components/ReservationDrawer";
import ReservationList from "./components/ReservationList";
import {
  getReservation,
  listReservations,
  updateReservationStatus,
} from "./api/reservationApi";
import { useReservationForm } from "./hooks/useReservationForm";
import { clientName, clientTypeLabel, formatDate, formatMoney, paymentStatusLabel, statusLabel } from "./reservationUtils";
import { exportToExcel, exportToPdf, printRows } from "../utils/listExportUtils";
import { normalizeSearchValue } from "../utils/textUtils";
import "../style.css";
import "./Reservation.css";

const RESERVATION_EXPORT_COLUMNS = [
  { key: "number", label: "Numéro" },
  { key: "clientType", label: "Type de client" },
  { key: "clientCode", label: "Code client" },
  { key: "client", label: "Client" },
  { key: "arrival", label: "Arrivée" },
  { key: "departure", label: "Départ" },
  { key: "nights", label: "Nuits" },
  { key: "rooms", label: "Chambres" },
  { key: "status", label: "Statut réservation" },
  { key: "total", label: "Montant total" },
  { key: "paymentStatus", label: "Statut règlement" },
  { key: "paid", label: "Montant payé" },
  { key: "remaining", label: "Reste à payer" },
  { key: "paymentPolicy", label: "Politique de paiement" },
  { key: "paymentDeadline", label: "Date d’échéance" },
  { key: "deadlineStatus", label: "Statut échéance" },
];

const nightsBetween = (start, end) => {
  if (!start || !end) return "";
  const duration = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Number.isFinite(duration) ? Math.max(0, duration / 86400000) : "";
};

const Reservation = () => {
  const { dynamicStyles } = useOpen();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [expandedRoomRows, setExpandedRoomRows] = useState({});
  const [roomDetailsCache, setRoomDetailsCache] = useState({});
  const roomDetailRequests = useRef(new Map());

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setReservations(await listReservations());
    } catch (error) {
      setLoadError(error?.response?.data?.message || "Impossible de charger les réservations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const cacheReservationDetails = useCallback((reservation) => {
    if (!reservation?.id || !Array.isArray(reservation.chambres)) return;
    const cacheKey = String(reservation.id);
    setRoomDetailsCache((current) => ({
      ...current,
      [cacheKey]: { data: reservation, loading: false, error: "" },
    }));
  }, []);

  const loadExpandedRoomDetails = useCallback(async (reservationId) => {
    const cacheKey = String(reservationId);
    if (roomDetailRequests.current.has(cacheKey)) {
      return roomDetailRequests.current.get(cacheKey);
    }

    setRoomDetailsCache((current) => ({
      ...current,
      [cacheKey]: { ...current[cacheKey], loading: true, error: "" },
    }));

    const request = getReservation(reservationId)
      .then((reservation) => {
        cacheReservationDetails(reservation);
        return reservation;
      })
      .catch((error) => {
        setRoomDetailsCache((current) => ({
          ...current,
          [cacheKey]: {
            ...current[cacheKey],
            loading: false,
            error: error?.response?.data?.message || "Impossible de charger les chambres de cette réservation.",
          },
        }));
        return null;
      })
      .finally(() => {
        roomDetailRequests.current.delete(cacheKey);
      });

    roomDetailRequests.current.set(cacheKey, request);
    return request;
  }, [cacheReservationDetails]);

  const toggleRoomDetails = useCallback((reservation) => {
    const cacheKey = String(reservation.id);
    const willOpen = !expandedRoomRows[cacheKey];
    setExpandedRoomRows((current) => ({ ...current, [cacheKey]: !current[cacheKey] }));
    if (willOpen && !roomDetailsCache[cacheKey]?.data) {
      loadExpandedRoomDetails(reservation.id);
    }
  }, [expandedRoomRows, loadExpandedRoomDetails, roomDetailsCache]);

  const handleSaved = useCallback(async (reservation) => {
    cacheReservationDetails(reservation);
    await loadReservations();
    await Swal.fire({
      icon: "success",
      title: "Succès",
      text: `La réservation ${reservation.reservation_num} a été enregistrée.`,
    });
  }, [cacheReservationDetails, loadReservations]);

  const formState = useReservationForm({ onSaved: handleSaved });

  const filterReservations = useCallback((rows, currentSearchTerm) => {
    const needle = normalizeSearchValue(currentSearchTerm);
    return rows.filter((reservation) => {
      if (statusFilter && reservation.status !== statusFilter) return false;
      if (clientTypeFilter && reservation.client?.type !== clientTypeFilter) return false;
      if (paymentFilter && reservation.reglement?.statut !== paymentFilter) return false;
      if (deadlineFilter && reservation.echeance?.statut !== deadlineFilter) return false;
      if (!needle) return true;
      return [
        reservation.reservation_num,
        clientName(reservation),
        reservation.client?.current_display_name,
        reservation.client?.code,
        clientTypeLabel(reservation),
        reservation.dates?.debut,
        reservation.dates?.fin,
        statusLabel(reservation.status),
        reservation.total,
        reservation.reglement?.statut_label,
        reservation.reglement?.montant_paye,
        reservation.reglement?.reste_a_payer,
        reservation.politique_paiement?.label,
        reservation.echeance?.statut_label,
        reservation.echeance?.date,
      ].some((value) => normalizeSearchValue(value).includes(needle));
    });
  }, [clientTypeFilter, deadlineFilter, paymentFilter, statusFilter]);

  const {
    searchTerm, page, rowsPerPage, filteredRows, visibleRows, totalRows,
    setSearchTerm, setPage, setRowsPerPage, resetPage,
  } = useListControls({
    allRows: reservations,
    filterRows: filterReservations,
    storageKey: "rowsPerPageReservations",
  });

  const filtersActive = Boolean(searchTerm || statusFilter || clientTypeFilter || paymentFilter || deadlineFilter);
  const resetFilters = useCallback(() => {
    setStatusFilter("");
    setClientTypeFilter("");
    setPaymentFilter("");
    setDeadlineFilter("");
    setSearchTerm("");
    resetPage();
  }, [resetPage, setSearchTerm]);

  const exportRows = useMemo(() => filteredRows.map((reservation) => ({
    number: reservation.reservation_num,
    clientType: clientTypeLabel(reservation),
    clientCode: reservation.client?.code || "-",
    client: clientName(reservation),
    arrival: formatDate(reservation.dates?.debut),
    departure: formatDate(reservation.dates?.fin),
    nights: nightsBetween(reservation.dates?.debut, reservation.dates?.fin),
    rooms: reservation.room_count,
    status: statusLabel(reservation.status),
    total: formatMoney(reservation.total),
    paymentStatus: reservation.reglement?.statut_label || paymentStatusLabel(reservation.reglement?.statut),
    paid: formatMoney(reservation.reglement?.montant_paye),
    remaining: formatMoney(reservation.reglement?.reste_a_payer),
    paymentPolicy: reservation.politique_paiement?.label || "-",
    paymentDeadline: formatDate(reservation.echeance?.date),
    deadlineStatus: reservation.echeance?.statut_label || "-",
  })), [filteredRows]);

  const exportExcel = () => exportToExcel({ rows: exportRows, columns: RESERVATION_EXPORT_COLUMNS, sheetName: "Réservations", filename: "reservations.xlsx" });
  const exportPdf = () => exportToPdf({ rows: exportRows, columns: RESERVATION_EXPORT_COLUMNS, title: "Liste des Réservations", filename: "reservations.pdf" });
  const printTable = () => printRows({ rows: exportRows, columns: RESERVATION_EXPORT_COLUMNS, title: "Liste des Réservations" });

  const openDetails = async (reservation) => {
    setDetailsOpen(true);
    setDetails(null);
    setDetailsError("");
    setDetailsLoading(true);
    try {
      const completeReservation = await getReservation(reservation.id);
      setDetails(completeReservation);
      cacheReservationDetails(completeReservation);
    } catch (error) {
      setDetailsError(error?.response?.data?.message || "Impossible de charger cette réservation.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshAfterPayment = useCallback(async (reservationId) => {
    const [detailsResult, listResult] = await Promise.allSettled([
      getReservation(reservationId),
      listReservations(),
    ]);

    const detailsUpdated = detailsResult.status === "fulfilled";
    const listUpdated = listResult.status === "fulfilled";

    if (detailsUpdated) {
      setDetails(detailsResult.value);
      cacheReservationDetails(detailsResult.value);
    }

    if (listUpdated) {
      setReservations(listResult.value);
    }

    return {
      ok: detailsUpdated && listUpdated,
      partial: detailsUpdated !== listUpdated,
      detailsUpdated,
      listUpdated,
    };
  }, [cacheReservationDetails]);

  const openEdit = async (reservation) => {
    try {
      const completeReservation = await getReservation(reservation.id);
      cacheReservationDetails(completeReservation);
      formState.openEdit(completeReservation);
    } catch (error) {
      Swal.fire("Erreur", error?.response?.data?.message || "Impossible de charger cette réservation.", "error");
    }
  };

  const confirmReservation = async (reservation) => {
    if (reservation.confirmation?.autorisee === false) {
      await Swal.fire({
        icon: "warning",
        title: "Confirmation impossible",
        text: reservation.confirmation.message || "Les conditions de paiement ne permettent pas la confirmation.",
      });
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Confirmer la réservation ?",
      text: [
        reservation.reservation_num,
        reservation.politique_paiement?.label,
        reservation.confirmation?.message,
      ].filter(Boolean).join(" · "),
      showCancelButton: true,
      confirmButtonText: "Confirmer",
      cancelButtonText: "Retour",
    });
    if (!confirmation.isConfirmed) return;

    setStatusSaving(true);
    try {
      const updated = await updateReservationStatus(reservation.id, { status: "confirmé" });
      await loadReservations();
      if (details?.id === updated.id) setDetails(updated);
      await Swal.fire("Succès", "La réservation est confirmée.", "success");
    } catch (error) {
      await Swal.fire("Erreur", error?.response?.data?.message || "La réservation ne peut pas être confirmée.", "error");
    } finally {
      setStatusSaving(false);
    }
  };

  const showCancel = (reservation) => {
    setCancelTarget(reservation);
    setCancelReason("");
    setCancelError("");
  };

  const cancelReservation = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Le motif d’annulation est obligatoire.");
      return;
    }

    setStatusSaving(true);
    setCancelError("");
    try {
      const updated = await updateReservationStatus(cancelTarget.id, {
        status: "annulé",
        cancellation_reason: cancelReason.trim(),
      });
      setCancelTarget(null);
      await loadReservations();
      if (details?.id === updated.id) setDetails(updated);
      await Swal.fire("Succès", "La réservation a été annulée et conservée dans l’historique.", "success");
    } catch (error) {
      const validationMessage = error?.response?.data?.errors?.cancellation_reason?.[0];
      if (validationMessage) setCancelError(validationMessage);
      else setCancelError(error?.response?.data?.message || "La réservation ne peut pas être annulée.");
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <Box sx={{ ...dynamicStyles }}>
      <Box component="main" className="app-page reservation-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>
        <SearchWithExport
          Title="Liste des Réservations"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          exportToExcel={exportExcel}
          exportToPDF={exportPdf}
          printTable={printTable}
          resultCount={totalRows}
          loading={loading}
          exportsDisabled={totalRows === 0}
        />

        <div className="app-controls-row reservation-controls">
          <button type="button" className="app-add-button" onClick={formState.openCreate}>
            <FontAwesomeIcon icon={faPlus} /> Ajouter une réservation
          </button>
          <div className="app-filter-controls">
            <Form.Select className="app-filter-select" value={clientTypeFilter} onChange={(event) => { setClientTypeFilter(event.target.value); resetPage(); }}>
              <option value="">Tous les clients</option>
              <option value="societe">Sociétés</option>
              <option value="particulier">Particuliers</option>
            </Form.Select>
            <Form.Select className="app-filter-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); resetPage(); }}>
              <option value="">Tous les statuts</option>
              <option value="en attente">En attente</option>
              <option value="confirmé">Confirmé</option>
              <option value="annulé">Annulé</option>
            </Form.Select>
            <Form.Select className="app-filter-select" value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); resetPage(); }}>
              <option value="">Tous les règlements</option>
              <option value="non_payee">Non payées</option>
              <option value="partiellement_payee">Partiellement payées</option>
              <option value="payee">Payées</option>
            </Form.Select>
            <Form.Select className="app-filter-select" value={deadlineFilter} onChange={(event) => { setDeadlineFilter(event.target.value); resetPage(); }}>
              <option value="">Toutes les échéances</option>
              <option value="a_jour">À jour</option>
              <option value="du_aujourdhui">Dues aujourd’hui</option>
              <option value="en_retard">En retard</option>
              <option value="solde_regle">Soldes réglés</option>
            </Form.Select>
            <ListFilterReset active={filtersActive} onReset={resetFilters} />
          </div>
        </div>

        <ListState
          loading={loading}
          error={loadError}
          allRowsCount={reservations.length}
          filteredRowsCount={totalRows}
          emptyDataMessage="Aucune réservation enregistrée."
          onRetry={loadReservations}
          onResetFilters={resetFilters}
        />
        {!loading && !loadError && totalRows > 0 && (
          <ReservationList
            reservations={visibleRows}
            totalRows={totalRows}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onView={openDetails}
            onEdit={openEdit}
            onConfirm={confirmReservation}
            onCancel={showCancel}
            expandedRoomRows={expandedRoomRows}
            roomDetailsCache={roomDetailsCache}
            onToggleRooms={toggleRoomDetails}
            onRetryRooms={loadExpandedRoomDetails}
          />
        )}

        {formState.isOpen && <button type="button" className="reservation-drawer-backdrop" onClick={formState.close} aria-label="Fermer le formulaire" />}
        <ReservationDrawer formState={formState} />

        <ReservationDetails
          show={detailsOpen}
          reservation={details}
          loading={detailsLoading}
          error={detailsError}
          onHide={() => setDetailsOpen(false)}
          onPaymentChanged={refreshAfterPayment}
        />

        <CancelReservationModal
          show={Boolean(cancelTarget)}
          reservation={cancelTarget}
          reason={cancelReason}
          error={cancelError}
          saving={statusSaving}
          onReasonChange={(value) => {
            setCancelReason(value);
            setCancelError("");
          }}
          onConfirm={cancelReservation}
          onHide={() => setCancelTarget(null)}
        />
      </Box>
    </Box>
  );
};

export default Reservation;
