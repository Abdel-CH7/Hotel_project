import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCheck, faEdit, faEye } from "@fortawesome/free-solid-svg-icons";
import ListPagination from "../../components/ListPagination";
import {
  clientName,
  formatDate,
  formatMoney,
  isReservationEditable,
  statusClass,
  statusLabel,
} from "../reservationUtils";

const nightsBetween = (start, end) => {
  if (!start || !end) return "-";
  const milliseconds = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Number.isFinite(milliseconds) ? Math.max(0, milliseconds / 86400000) : "-";
};

const ReservationList = ({
  reservations,
  totalRows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onConfirm,
  onCancel,
}) => (
  <div className="app-card app-table-card reservation-table-card">
    <div className="app-table-wrapper reservation-table-wrapper">
      <table id="reservationsTable" className="table table-bordered app-table reservation-table">
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Client</th>
            <th>Date d’arrivée</th>
            <th>Date de départ</th>
            <th>Nuits</th>
            <th>Chambres</th>
            <th>Statut</th>
            <th>Montant total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reservations.length === 0 ? (
            <tr><td colSpan="9" className="text-center">Aucune réservation disponible</td></tr>
          ) : reservations.map((reservation) => {
            const editable = isReservationEditable(reservation);
            return (
              <tr key={reservation.id}>
                <td>
                  <strong>{reservation.reservation_num}</strong>
                  {reservation.legacy_pricing && <span className="reservation-history-badge">Historique</span>}
                </td>
                <td>{clientName(reservation)}</td>
                <td>{formatDate(reservation.dates?.debut)}</td>
                <td>{formatDate(reservation.dates?.fin)}</td>
                <td>{nightsBetween(reservation.dates?.debut, reservation.dates?.fin)}</td>
                <td>{reservation.room_count}</td>
                <td><span className={`app-status-badge ${statusClass(reservation.status)}`}>{statusLabel(reservation.status)}</span></td>
                <td>{formatMoney(reservation.total)}</td>
                <td>
                  <div className="app-table-actions reservation-table-actions">
                    <button type="button" className="app-table-action is-muted" onClick={() => onView(reservation)} title="Voir" aria-label="Voir">
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    {editable && (
                      <button type="button" className="app-table-action is-edit" onClick={() => onEdit(reservation)} title="Modifier" aria-label="Modifier">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    )}
                    {editable && reservation.status === "en attente" && (
                      <button type="button" className="app-table-action is-success" onClick={() => onConfirm(reservation)} title="Confirmer" aria-label="Confirmer">
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    )}
                    {editable && ["en attente", "confirmé"].includes(reservation.status) && (
                      <button type="button" className="app-table-action is-delete" onClick={() => onCancel(reservation)} title="Annuler" aria-label="Annuler">
                        <FontAwesomeIcon icon={faBan} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <div className="app-table-footer">
      <div />
      <ListPagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={totalRows}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </div>
  </div>
);

export default ReservationList;
