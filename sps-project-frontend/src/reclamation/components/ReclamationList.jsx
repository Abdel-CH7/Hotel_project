import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { faBan, faCheck, faChevronDown, faChevronRight, faPlay, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import ExpandRTable from "../../components/ExpandRTable";
import ListPagination from "../../components/ListPagination";
import { highlightText } from "../../utils/textUtils";
import { formatDate, formatDateTime, priorityClass, statusClass } from "../reclamationUtils";
import ReclamationExpandedRow from "./ReclamationExpandedRow";

const statusAction = (row) => {
  if (row.statut === "En attente") return { icon: faPlay, label: "Commencer le traitement" };
  if (row.statut === "En cours") return { icon: faCheck, label: "Marquer comme traité" };
  if (row.statut === "Traité") return { icon: faRotateLeft, label: "Résoudre ou rouvrir" };
  return null;
};

const ReclamationList = ({ rows, searchTerm, page, rowsPerPage, totalRows, setPage, setRowsPerPage, expandedRows, toggleRow, details, detailLoading, detailErrors, retryDetail, onEdit, onStatusAction, onCancel }) => {
  const columns = [
    { key: "numero", label: "N° Réclamation", width: 180, render: (row) => <button type="button" className="reclamation-expand-button" onClick={() => toggleRow(row)} aria-expanded={Boolean(expandedRows[row.id])}><FontAwesomeIcon icon={expandedRows[row.id] ? faChevronDown : faChevronRight} /><span>{highlightText(row.numero, searchTerm)}</span></button> },
    { key: "date", label: "Date", width: 105, render: (row) => highlightText(formatDate(row.date), searchTerm) },
    { key: "objet", label: "Type / Objet", width: 175, render: (row) => highlightText(row.objet?.nom || "—", searchTerm) },
    { key: "client", label: "Client / Réservation", width: 220, render: (row) => <div className="reclamation-cell-stack"><strong>{highlightText(row.client?.display_name || "—", searchTerm)}</strong><small>{row.reservation?.id ? <Link className="app-context-link" to={`/reservation?open=${row.reservation.id}`} aria-label={`Ouvrir la réservation ${row.reservation.numero}`}>{highlightText(row.reservation.numero, searchTerm)}</Link> : highlightText(row.client?.type_label || "Sans liaison", searchTerm)}</small></div> },
    { key: "chambre", label: "Chambre", width: 145, render: (row) => row.chambre?.id ? <div className="reclamation-cell-stack"><Link className="app-context-link" to={`/chambre?room_id=${row.chambre.id}`} aria-label={`Voir la chambre ${row.chambre.numero}`}>{highlightText(`Chambre ${row.chambre.numero}`, searchTerm)}</Link><small><Link className="app-context-link" to={`/etat-chambre?room_id=${row.chambre.id}`} aria-label={`Voir l’état de la chambre ${row.chambre.numero}`}>Voir l’état</Link></small></div> : highlightText("—", searchTerm) },
    { key: "departement", label: "Département", width: 155, render: (row) => highlightText(row.departement?.nom || "—", searchTerm) },
    { key: "priorite", label: "Priorité", width: 105, render: (row) => <span className={`reclamation-priority-badge ${priorityClass(row.priorite)}`}>{highlightText(row.priorite_label || "—", searchTerm)}</span> },
    { key: "statut", label: "Statut", width: 110, render: (row) => <span className={`reclamation-status-badge ${statusClass(row.statut)}`}>{highlightText(row.statut || "—", searchTerm)}</span> },
    { key: "derniere_mise_a_jour", label: "Dernière mise à jour", width: 155, render: (row) => highlightText(formatDateTime(row.derniere_mise_a_jour), searchTerm) },
  ];

  const renderActions = (row) => {
    const next = statusAction(row);
    const cancellable = ["En attente", "En cours", "Traité"].includes(row.statut);
    return <>{next && <button type="button" className="reclamation-action-icon is-status" onClick={() => onStatusAction(row)} title={next.label} aria-label={next.label}><FontAwesomeIcon icon={next.icon} /></button>}{cancellable && <button type="button" className="reclamation-action-icon is-cancel" onClick={() => onCancel(row)} title="Annuler la réclamation" aria-label="Annuler la réclamation"><FontAwesomeIcon icon={faBan} /></button>}</>;
  };

  return (
    <div className="app-table-wrapper reclamation-table-wrapper">
      <ExpandRTable
        columns={columns}
        data={rows}
        filteredData={rows}
        searchTerm={searchTerm}
        highlightText={highlightText}
        handleEdit={onEdit}
        canEdit={(row) => !row.read_only}
        renderCustomActions={renderActions}
        rowsPerPage={rowsPerPage}
        page={page}
        expandedRows={expandedRows}
        toggleRowExpansion={() => {}}
        renderExpandedRow={(row) => <ReclamationExpandedRow detail={details[row.id]} searchTerm={searchTerm} loading={Boolean(detailLoading[row.id])} error={detailErrors[row.id]} onRetry={() => retryDetail(row.id)} />}
        uiVariant="app"
        externalPagination
        forceHorizontalScroll
        selectionEnabled={false}
        showBulkDelete={false}
        paginationComponent={<ListPagination page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />}
      />
    </div>
  );
};

export default ReclamationList;
