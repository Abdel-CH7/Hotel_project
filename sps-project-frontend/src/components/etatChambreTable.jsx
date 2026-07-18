import React from "react";
import { Table } from "react-bootstrap";
// import { FaBroom, FaEdit } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faBroom,
} from "@fortawesome/free-solid-svg-icons";
import { highlightText } from "../utils/textUtils";

export const maintenanceToOuiNon = (value) => {
  if (value === true || value === 1) return "oui";
  if (value === false || value === 0 || value == null) return "non";

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "oui"].includes(normalized) ? "oui" : "non";
};

export const toInputDate = (value) => {
  if (!value) return "";

  const text = String(value);
  const isoDate = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return isoDate || "";
};

export const formatFrenchDate = (value) => {
  const inputDate = toInputDate(value);
  if (!inputDate) return "-";

  const [year, month, day] = inputDate.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR").format(
    new Date(year, month - 1, day)
  );
};

export const getEmployeeFullName = (employee) => {
  if (!employee) return "";
  return [employee.nom, employee.prenom].filter(Boolean).join(" ").trim();
};

export const getMaintenanceTypeLabel = (maintenanceType) => {
  if (!maintenanceType) return "";
  if (typeof maintenanceType === "string") return maintenanceType;
  return maintenanceType.types_maintenance || maintenanceType.code || "";
};

export const getCleanerLabel = (roomState) =>
  getEmployeeFullName(roomState?.nettoyee_par) ||
  roomState?.["nettoyée_par"] ||
  "-";

export const getRoomMaintenanceType = (roomState, maintenanceTypes = []) =>
  maintenanceTypes.find(
    (type) => String(type.id) === String(roomState?.maintenance_type_id)
  ) || roomState?.maintenance_type;

export const getRoomOccupation = (roomState) => ({
  statut: roomState?.occupation?.occupee ? "occupée" : "libre",
  occupee: roomState?.occupation?.occupee === true,
  reservation: roomState?.occupation?.reservation || null,
});

export const getOccupationLabel = (roomState) =>
  getRoomOccupation(roomState).occupee ? "Occupée" : "Libre";

export const getCurrentStayLabel = (roomState) => {
  const reservation = getRoomOccupation(roomState).reservation;
  if (!reservation) return "—";

  return `${formatFrenchDate(reservation.date_debut)} → ${formatFrenchDate(
    reservation.date_fin
  )}`;
};

const shortenComment = (comment, limit = 48) => {
  if (!comment) return "-";
  return comment.length > limit ? `${comment.slice(0, limit)}...` : comment;
};

const ChambreTable = ({
  filteredChambres,
  searchTerm,
  maintenanceTypes,
  totalRows,
  rowsPerPage,
  page,
  handleChangePage,
  handleChangeRowsPerPage,
  handleEditClick,
  handleMarkAsClean,
  paginationComponent,
}) => {
  const startRow = totalRows > 0 ? page * rowsPerPage + 1 : 0;
  const endRow = Math.min((page + 1) * rowsPerPage, totalRows);

  return (
    <div className="app-table-wrapper">
      <div className="app-table-scroll">
        <Table bordered hover id="exportTable" className="app-table mb-0">
          <thead>
            <tr>
              <th>N° Chambre</th>
              <th>Propreté</th>
              <th>Occupation</th>
              <th>Dernier nettoyage</th>
              <th>Nettoyée par</th>
              <th>Maintenance</th>
              <th>Commentaire</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredChambres.length > 0 ? (
              filteredChambres.map((chambre) => {
                const isClean = chambre.status === "nettoyée";
                const isUnderMaintenance =
                  maintenanceToOuiNon(chambre.maintenance) === "oui";
                const maintenanceType = getRoomMaintenanceType(
                  chambre,
                  maintenanceTypes
                );
                const occupation = getRoomOccupation(chambre);
                const currentReservation = occupation.reservation;

                return (
                  <tr key={chambre.id || chambre.num_chambre}>
                    <td>{highlightText(chambre.num_chambre, searchTerm)}</td>
                    <td>
                      <span
                        className={`app-status-badge ${
                          isClean ? "is-success" : "is-warning"
                        }`}
                      >
                        {highlightText(isClean ? "Nettoyée" : "Non nettoyée", searchTerm)}
                      </span>
                    </td>
                    <td>
                      <div className="etat-chambre-occupation-cell">
                        <span
                          className={`app-status-badge ${
                            occupation.occupee ? "is-warning" : "is-success"
                          }`}
                        >
                          {highlightText(
                            occupation.occupee ? "Occupée" : "Libre",
                            searchTerm
                          )}
                        </span>
                        {currentReservation && (
                          <>
                            <strong>
                              {highlightText(
                                currentReservation.numero || "—",
                                searchTerm
                              )}
                            </strong>
                            <span
                              className="etat-chambre-occupation-client"
                              title={currentReservation.client || ""}
                            >
                              {highlightText(
                                currentReservation.client || "—",
                                searchTerm
                              )}
                            </span>
                            <span className="etat-chambre-occupation-period">
                              {highlightText(
                                getCurrentStayLabel(chambre),
                                searchTerm
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>{highlightText(formatFrenchDate(chambre.date_nettoyage), searchTerm)}</td>
                    <td>{highlightText(getCleanerLabel(chambre), searchTerm)}</td>
                    <td>
                      {isUnderMaintenance ? (
                        <div className="etat-chambre-maintenance-cell">
                          <span className="app-status-badge is-danger">
                            {highlightText("En maintenance", searchTerm)}
                          </span>
                          <strong>
                            {highlightText(getMaintenanceTypeLabel(maintenanceType) || "-", searchTerm)}
                          </strong>
                          <span className="etat-chambre-maintenance-period">
                            {highlightText(
                              `${formatFrenchDate(chambre.date_debut_maintenance)} → ${formatFrenchDate(
                                chambre.date_fin_maintenance
                              )}`,
                              searchTerm
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="app-status-badge is-success">
                          {highlightText("Aucune", searchTerm)}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className="etat-chambre-comment"
                        title={chambre.commentaire || ""}
                      >
                        {highlightText(shortenComment(chambre.commentaire), searchTerm)}
                      </span>
                    </td>
                    <td>
                      <div className="app-table-actions">
                        <FontAwesomeIcon
                          icon={faEdit}
                          onClick={() => handleEditClick(chambre)}
                          title="Modifier l’état et la maintenance"
                          aria-label="Modifier l’état et la maintenance"
                          className="app-table-action is-edit"
                        />
                        {!isClean && (
                          <FontAwesomeIcon
                            icon={faBroom}
                            onClick={() => handleMarkAsClean(chambre)}
                            title="Marquer comme nettoyée"
                            aria-label="Marquer comme nettoyée"
                            className="app-table-action is-success"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center">
                  Aucun état de chambre disponible
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="app-table-footer">
        {paginationComponent || <div className="app-table-pagination">
          <span>Lignes par page:</span>
          <select value={rowsPerPage} onChange={handleChangeRowsPerPage}>
            {[5, 10, 15, 20, 25].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span>
            {startRow}-{endRow} sur {totalRows}
          </span>
          <button
            type="button"
            className="app-pagination-arrow"
            disabled={page === 0}
            onClick={() => handleChangePage(page - 1)}
            aria-label="Page précédente"
          >
            ‹
          </button>
          <button
            type="button"
            className="app-pagination-arrow"
            disabled={(page + 1) * rowsPerPage >= totalRows}
            onClick={() => handleChangePage(page + 1)}
            aria-label="Page suivante"
          >
            ›
          </button>
        </div>}
      </div>
    </div>
  );
};

export default ChambreTable;
