import { formatDate, formatDateTime, eventLabel } from "../reclamationUtils";
import { highlightText } from "../../utils/textUtils";

const value = (candidate) => candidate || "—";

const ReclamationExpandedRow = ({ detail, searchTerm, loading, error, onRetry }) => {
  if (loading) return <div className="reclamation-expanded-state">Chargement du détail…</div>;
  if (error) {
    return <div className="reclamation-expanded-state is-error" role="alert"><span>{error}</span><button type="button" className="app-secondary-button" onClick={onRetry}>Réessayer</button></div>;
  }
  if (!detail) return null;

  const history = Array.isArray(detail.historique) ? detail.historique : [];
  const channel = [detail.canal?.nom, detail.canal?.precision].filter(Boolean).join(" — ");

  return (
    <div className="reclamation-expanded-content">
      <section className="reclamation-detail-section">
        <h3>Détails de la réclamation</h3>
        <dl className="reclamation-detail-grid">
          <div><dt>Description</dt><dd>{highlightText(value(detail.description), searchTerm)}</dd></div>
          <div><dt>Canal</dt><dd>{highlightText(value(channel), searchTerm)}</dd></div>
          <div><dt>Client</dt><dd>{highlightText(value(detail.client?.display_name), searchTerm)}</dd></div>
          <div><dt>Réservation</dt><dd>{highlightText(value(detail.reservation?.numero), searchTerm)}</dd></div>
          <div><dt>Chambre</dt><dd>{highlightText(value(detail.chambre?.numero), searchTerm)}</dd></div>
          <div><dt>Département</dt><dd>{highlightText(value(detail.departement?.nom), searchTerm)}</dd></div>
          <div><dt>Priorité</dt><dd>{highlightText(value(detail.priorite_label), searchTerm)}</dd></div>
          <div><dt>Réponse</dt><dd>{highlightText(value(detail.reponse), searchTerm)}</dd></div>
          <div><dt>Résolution</dt><dd>{highlightText(detail.resolved_at ? formatDate(detail.resolved_at) : "—", searchTerm)}</dd></div>
          <div><dt>Annulation</dt><dd>{highlightText(detail.cancellation?.cancelled_at ? `${formatDate(detail.cancellation.cancelled_at)} — ${value(detail.cancellation.reason)}` : "—", searchTerm)}</dd></div>
        </dl>
      </section>
      <section className="reclamation-timeline-section">
        <h3>Historique complet</h3>
        {history.length === 0 ? <p className="reclamation-empty-note">Aucun événement historique disponible.</p> : (
          <ol className="reclamation-timeline">
            {history.map((entry) => (
              <li key={entry.id}>
                <div className="reclamation-timeline-marker" aria-hidden="true" />
                <div className="reclamation-timeline-body">
                  <div className="reclamation-timeline-heading"><strong>{eventLabel(entry.type)}</strong><time>{formatDateTime(entry.created_at)}</time></div>
                  <p>{entry.description}</p>
                  {(entry.ancien_statut || entry.nouveau_statut) && <span className="reclamation-timeline-transition">{value(entry.ancien_statut)} → {value(entry.nouveau_statut)}</span>}
                  <small>{entry.user?.name ? `Par ${entry.user.name}` : "Utilisateur indisponible"}</small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};

export default ReclamationExpandedRow;
