import { formatDate, formatMoney } from "../reservationUtils";

const PricingPreview = ({ preview, loading, error }) => (
  <section className="reservation-form-section reservation-pricing-preview">
    <h3>7. Résumé tarifaire</h3>
    {loading && <div className="reservation-preview-loading">Calcul du tarif…</div>}
    {error && <div className="reservation-alert is-error">{error}</div>}
    {!loading && !error && !preview && (
      <p className="reservation-muted">Complétez les dates, les chambres et l’occupation pour obtenir le tarif.</p>
    )}
    {!loading && preview && (
      <>
        <div className="reservation-preview-meta">
          <span>{preview.nuits} nuit(s)</span>
          <span>{preview.occupants_total} occupant(s)</span>
        </div>

        {(preview.chambres || []).map((room) => (
          <div className="reservation-preview-block" key={room.chambre_id}>
            <div className="reservation-preview-block-title">
              <strong>Chambre {room.num_chambre}</strong>
              <span>{formatMoney(room.montant_total)}</span>
            </div>
            <p>{room.adultes} adulte(s), {room.enfants} enfant(s), {room.lits_supplementaires} lit(s) supplémentaire(s)</p>
            {(room.segments || []).map((segment) => (
              <div className="reservation-preview-segment" key={`${room.chambre_id}-${segment.segment_date_debut}`}>
                <span>{formatDate(segment.segment_date_debut)} → {formatDate(segment.segment_date_fin)}</span>
                <span>{segment.nuits} nuit(s) × {formatMoney(segment.prix_par_nuit_snapshot)}</span>
              </div>
            ))}
          </div>
        ))}

        {(preview.repas || []).map((meal) => (
          <div className="reservation-preview-block" key={meal.type_repas_id}>
            <div className="reservation-preview-block-title">
              <strong>{meal.type_repas}</strong>
              <span>{formatMoney(meal.montant_total)}</span>
            </div>
            <p>{meal.quantite_par_jour} personne(s) par jour</p>
          </div>
        ))}

        <dl className="reservation-total-list">
          <div><dt>Chambres</dt><dd>{formatMoney(preview.montant_chambres)}</dd></div>
          <div><dt>Repas</dt><dd>{formatMoney(preview.montant_repas)}</dd></div>
          <div><dt>Sous-total</dt><dd>{formatMoney(preview.sous_total_avant_reduction)}</dd></div>
          <div><dt>Réduction</dt><dd>- {formatMoney(preview.montant_reduction)}</dd></div>
          <div className="is-final"><dt>Total</dt><dd>{formatMoney(preview.montant_total)}</dd></div>
        </dl>
      </>
    )}
  </section>
);

export default PricingPreview;
