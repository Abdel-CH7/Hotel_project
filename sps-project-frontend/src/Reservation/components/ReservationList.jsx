import { Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faChevronDown,
  faChevronUp,
  faEdit,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import ListPagination from "../../components/ListPagination";
import { highlightText } from "../../utils/textUtils";
import {
  clientName,
  clientTypeLabel,
  formatDate,
  formatMoney,
  isReservationEditable,
  paymentStatusClass,
  paymentStatusLabel,
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
  searchTerm,
  totalRows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onConfirm,
  onCancel,
  expandedRoomRows,
  roomDetailsCache,
  onToggleRooms,
  onRetryRooms,
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
            <th>Règlement</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reservations.length === 0 ? (
            <tr><td colSpan="10" className="text-center">Aucune réservation disponible</td></tr>
          ) : reservations.map((reservation) => {
            const editable = isReservationEditable(reservation);
            const confirmationAllowed = reservation.confirmation?.autorisee !== false;
            const cacheKey = String(reservation.id);
            const expanded = Boolean(expandedRoomRows[cacheKey]);
            const roomState = roomDetailsCache[cacheKey] || {};
            const rooms = roomState.data?.chambres || [];

            return (
              <Fragment key={reservation.id}>
                <tr>
                  <td>
                    <strong>{highlightText(reservation.reservation_num, searchTerm)}</strong>
                    {reservation.legacy_pricing && <span className="reservation-history-badge">Historique</span>}
                  </td>
                  <td>
                    <div className="reservation-client-cell">
                      <strong>{highlightText(clientName(reservation), searchTerm)}</strong>
                      <span className={`reservation-client-type-badge is-${reservation.client?.type}`}>
                        {highlightText(clientTypeLabel(reservation), searchTerm)}
                      </span>
                      {reservation.client?.code && <small>{highlightText(reservation.client.code, searchTerm)}</small>}
                    </div>
                  </td>
                  <td>{highlightText(formatDate(reservation.dates?.debut), searchTerm)}</td>
                  <td>{highlightText(formatDate(reservation.dates?.fin), searchTerm)}</td>
                  <td>{nightsBetween(reservation.dates?.debut, reservation.dates?.fin)}</td>
                  <td>
                    <button
                      type="button"
                      className="reservation-room-count-button"
                      onClick={() => onToggleRooms(reservation)}
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "Masquer" : "Afficher"} les chambres de la réservation ${reservation.reservation_num}`}
                    >
                      <span>{reservation.room_count}</span>
                      <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
                    </button>
                  </td>
                  <td><span className={`app-status-badge ${statusClass(reservation.status)}`}>{highlightText(statusLabel(reservation.status), searchTerm)}</span></td>
                  <td>{highlightText(formatMoney(reservation.total), searchTerm)}</td>
                  <td>
                    <div className="reservation-payment-cell">
                      <span className={`app-status-badge ${paymentStatusClass(reservation.reglement?.statut)}`}>
                        {highlightText(
                          reservation.reglement?.statut_label || paymentStatusLabel(reservation.reglement?.statut),
                          searchTerm
                        )}
                      </span>
                      <small>
                        {highlightText(formatMoney(reservation.reglement?.montant_paye), searchTerm)}
                        {" / "}
                        {highlightText(formatMoney(reservation.reglement?.total), searchTerm)}
                      </small>
                      <small>{highlightText(reservation.politique_paiement?.label || "—", searchTerm)}</small>
                      {["du_aujourdhui", "en_retard"].includes(reservation.echeance?.statut) && (
                        <span className={`app-status-badge ${reservation.echeance.statut === "en_retard" ? "is-danger" : "is-warning"}`}>
                          {highlightText(reservation.echeance.statut_label, searchTerm)}
                        </span>
                      )}
                    </div>
                  </td>
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
                        <button
                          type="button"
                          className={`app-table-action ${confirmationAllowed ? "is-success" : "is-muted"}`}
                          onClick={() => onConfirm(reservation)}
                          title={confirmationAllowed ? "Confirmer" : reservation.confirmation?.message}
                          aria-label={confirmationAllowed ? "Confirmer" : "Afficher la condition de confirmation"}
                        >
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

                {expanded && (
                  <tr className="reservation-expanded-room-row">
                    <td colSpan="10">
                      <div className="reservation-expanded-room-content">
                        {roomState.loading && <div className="reservation-inline-loading">Chargement des chambres…</div>}

                        {!roomState.loading && roomState.error && (
                          <div className="reservation-expanded-room-error" role="alert">
                            <span>{roomState.error}</span>
                            <button type="button" className="app-secondary-button" onClick={() => onRetryRooms(reservation.id)}>
                              Réessayer
                            </button>
                          </div>
                        )}

                        {!roomState.loading && !roomState.error && roomState.data && (
                          rooms.length === 0 ? (
                            <p className="reservation-expanded-room-empty">Aucune chambre détaillée pour cette réservation.</p>
                          ) : (
                            <div className="reservation-expanded-room-table-wrapper">
                              <table className="app-table reservation-expanded-room-table">
                                <thead>
                                  <tr>
                                    <th>Numéro de chambre</th>
                                    <th>Type</th>
                                    <th>Étage</th>
                                    <th>Vue</th>
                                    <th>Adultes</th>
                                    <th>Enfants occupants</th>
                                    <th>Lits supplémentaires</th>
                                    <th>Montant de la chambre</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rooms.map((room) => (
                                    <tr key={room.allocation_id || room.chambre_id}>
                                      <td>{highlightText(room.num_chambre || room.chambre_id || "—", searchTerm)}</td>
                                      <td>{highlightText(room.type_chambre?.nom_snapshot || "—", searchTerm)}</td>
                                      <td>{highlightText(room.etage || "—", searchTerm)}</td>
                                      <td>{highlightText(room.vue || "—", searchTerm)}</td>
                                      <td>{highlightText(room.adultes ?? "—", searchTerm)}</td>
                                      <td>{highlightText(room.enfants ?? "—", searchTerm)}</td>
                                      <td>{highlightText(room.lits_supplementaires ?? "—", searchTerm)}</td>
                                      <td>{highlightText(formatMoney(room.montant_total), searchTerm)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
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
