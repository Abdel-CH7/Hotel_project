import { Modal } from "react-bootstrap";
import { clientName, formatDate, formatMoney, statusClass, statusLabel } from "../reservationUtils";

const ReservationDetails = ({ show, reservation, loading, error, onHide }) => (
  <Modal show={show} onHide={onHide} size="lg" centered scrollable>
    <Modal.Header closeButton>
      <Modal.Title>Détails de la réservation</Modal.Title>
    </Modal.Header>
    <Modal.Body className="reservation-details">
      {loading && <div className="reservation-inline-loading">Chargement des détails…</div>}
      {error && <div className="reservation-alert is-error">{error}</div>}
      {!loading && reservation && (
        <>
          <div className="reservation-details-header">
            <div>
              <strong>{reservation.reservation_num}</strong>
              {reservation.legacy_pricing && <span className="reservation-history-badge">Historique</span>}
            </div>
            <span className={`app-status-badge ${statusClass(reservation.status)}`}>{statusLabel(reservation.status)}</span>
          </div>

          <dl className="reservation-details-grid">
            <div><dt>Client</dt><dd>{clientName(reservation)}</dd></div>
            <div><dt>Réservation</dt><dd>{formatDate(reservation.dates?.reservation)}</dd></div>
            <div><dt>Arrivée</dt><dd>{formatDate(reservation.dates?.debut)}</dd></div>
            <div><dt>Départ</dt><dd>{formatDate(reservation.dates?.fin)}</dd></div>
            <div><dt>Durée</dt><dd>{reservation.dates?.nuits ?? "-"} nuit(s)</dd></div>
          </dl>

          {reservation.legacy_pricing && (
            <div className="reservation-alert is-warning">
              Réservation historique : le total conservé est disponible, mais le détail ancien des occupations, repas et segments tarifaires peut être incomplet.
            </div>
          )}

          <section className="reservation-details-section">
            <h3>Chambres</h3>
            {(reservation.chambres || []).length === 0 ? <p>Aucune chambre détaillée.</p> : (reservation.chambres || []).map((room) => (
              <article className="reservation-detail-card" key={room.allocation_id}>
                <div className="reservation-preview-block-title">
                  <strong>Chambre {room.num_chambre || room.chambre_id}</strong>
                  <span>{formatMoney(room.montant_total)}</span>
                </div>
                <p>{room.type_chambre?.nom_snapshot || "Type historique non disponible"}</p>
                {room.adultes === null || room.enfants === null
                  ? <p>Occupation historique non renseignée.</p>
                  : <p>{room.adultes} adulte(s), {room.enfants} enfant(s), {room.lits_supplementaires} lit(s) supplémentaire(s)</p>}
                {(room.segments || []).map((segment) => (
                  <div className="reservation-preview-segment" key={segment.id}>
                    <span>{formatDate(segment.date_debut)} → {formatDate(segment.date_fin)} · {segment.periode}</span>
                    <span>{segment.nuits} nuit(s) × {formatMoney(segment.prix_par_nuit)}</span>
                  </div>
                ))}
              </article>
            ))}
          </section>

          {!reservation.legacy_pricing && (
            <>
              <section className="reservation-details-section">
                <h3>Repas</h3>
                {(reservation.repas || []).length === 0 ? <p>Aucun repas.</p> : reservation.repas.map((meal) => (
                  <div className="reservation-detail-card" key={meal.type_repas_id}>
                    <div className="reservation-preview-block-title">
                      <strong>{meal.type_repas}</strong>
                      <span>{formatMoney(meal.montant_total)}</span>
                    </div>
                    <p>{meal.quantite_par_jour} personne(s) par jour</p>
                  </div>
                ))}
              </section>

              <section className="reservation-details-section">
                <h3>Réduction</h3>
                {reservation.reduction
                  ? <p>{reservation.reduction.type_reduction} · {formatMoney(reservation.reduction.montant_applique)}</p>
                  : <p>Aucune réduction.</p>}
              </section>
            </>
          )}

          <dl className="reservation-total-list reservation-details-totals">
            {!reservation.legacy_pricing && <div><dt>Chambres</dt><dd>{formatMoney(reservation.totals?.chambres)}</dd></div>}
            {!reservation.legacy_pricing && <div><dt>Repas</dt><dd>{formatMoney(reservation.totals?.repas)}</dd></div>}
            <div><dt>Réduction</dt><dd>{formatMoney(reservation.totals?.reduction)}</dd></div>
            <div className="is-final"><dt>Montant total</dt><dd>{formatMoney(reservation.totals?.total)}</dd></div>
          </dl>

          {reservation.status === "annulé" && (
            <div className="reservation-alert is-warning">
              <strong>Annulation :</strong> {reservation.cancellation?.reason || "Motif non renseigné"}
            </div>
          )}
        </>
      )}
    </Modal.Body>
  </Modal>
);

export default ReservationDetails;
