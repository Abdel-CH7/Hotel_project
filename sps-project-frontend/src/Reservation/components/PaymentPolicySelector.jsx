import { Button, Form } from "react-bootstrap";
import { formatDate, formatMoney } from "../reservationUtils";
import RequiredLabel from "../../components/RequiredLabel";

const addCalendarDays = (dateValue, days) => {
  if (!dateValue || !Number.isInteger(Number(days)) || Number(days) < 0) return "";
  const date = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + Number(days));
  return date.toISOString().slice(0, 10);
};

const PaymentPolicySelector = ({
  form,
  errors,
  setField,
  selectedClient,
  preview,
  reservationDate,
  creditSummary,
  creditLoading,
  creditError,
  creditProjection,
  retryCreditSummary,
}) => {
  const isCompany = form.client_type === "societe";
  const commercial = selectedClient?.commercial || {};
  const creditDeadline = addCalendarDays(
    form.date_fin,
    creditSummary?.delai_paiement_jours ?? commercial.delai_paiement_jours
  );

  return (
    <section className="reservation-form-section reservation-payment-policy">
      <h3>3. Politique de paiement</h3>
      <Form.Group data-field="politique_paiement">
        <Form.Label><RequiredLabel required>Politique de paiement</RequiredLabel></Form.Label>
        <Form.Select
          value={form.politique_paiement}
          onChange={(event) => setField("politique_paiement", event.target.value)}
          isInvalid={Boolean(errors.politique_paiement)}
          aria-required="true"
          aria-invalid={Boolean(errors.politique_paiement)}
        >
          <option value="">Sélectionner</option>
          <option value="paiement_sur_place">Paiement sur place</option>
          <option value="acompte_requis">Acompte requis</option>
          <option value="paiement_integral_avant_arrivee">Paiement intégral avant l’arrivée</option>
          {isCompany && <option value="credit_societe">Crédit Société</option>}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.politique_paiement}</Form.Control.Feedback>
      </Form.Group>

      {form.politique_paiement === "paiement_sur_place" && (
        <p className="reservation-policy-note">Le solde pourra être réglé à l’arrivée.</p>
      )}

      {form.politique_paiement === "acompte_requis" && (
        <div className="reservation-form-grid reservation-policy-fields">
          <Form.Group data-field="montant_acompte_requis">
            <Form.Label><RequiredLabel required>Montant de l’acompte requis</RequiredLabel></Form.Label>
            <Form.Control
              type="number"
              min="0.01"
              step="0.01"
              max={preview?.montant_total || undefined}
              value={form.montant_acompte_requis}
              onChange={(event) => setField("montant_acompte_requis", event.target.value)}
              isInvalid={Boolean(errors.montant_acompte_requis)}
              aria-required="true"
              aria-invalid={Boolean(errors.montant_acompte_requis)}
            />
            <Form.Control.Feedback type="invalid">{errors.montant_acompte_requis}</Form.Control.Feedback>
            {preview?.montant_total && <Form.Text>Total actuel : {formatMoney(preview.montant_total)}</Form.Text>}
          </Form.Group>
          <Form.Group data-field="date_limite_paiement">
            <Form.Label><RequiredLabel required>Date limite de l’acompte</RequiredLabel></Form.Label>
            <Form.Control
              type="date"
              min={reservationDate}
              max={form.date_debut || undefined}
              value={form.date_limite_paiement}
              onChange={(event) => setField("date_limite_paiement", event.target.value)}
              isInvalid={Boolean(errors.date_limite_paiement)}
              aria-required="true"
              aria-invalid={Boolean(errors.date_limite_paiement)}
            />
            <Form.Control.Feedback type="invalid">{errors.date_limite_paiement}</Form.Control.Feedback>
          </Form.Group>
        </div>
      )}

      {form.politique_paiement === "paiement_integral_avant_arrivee" && (
        <div className="reservation-policy-fields">
          <Form.Group data-field="date_limite_paiement">
            <Form.Label><RequiredLabel required>Date limite du paiement intégral</RequiredLabel></Form.Label>
            <Form.Control
              type="date"
              min={reservationDate}
              max={form.date_debut || undefined}
              value={form.date_limite_paiement}
              onChange={(event) => setField("date_limite_paiement", event.target.value)}
              isInvalid={Boolean(errors.date_limite_paiement)}
              aria-required="true"
              aria-invalid={Boolean(errors.date_limite_paiement)}
            />
            <Form.Control.Feedback type="invalid">{errors.date_limite_paiement}</Form.Control.Feedback>
          </Form.Group>
          <p className="reservation-policy-note">La réservation ne pourra être confirmée qu’après règlement complet.</p>
        </div>
      )}

      {form.politique_paiement === "credit_societe" && (
        <div className="reservation-credit-summary">
          {creditLoading && <div className="reservation-inline-loading">Chargement de la situation de crédit…</div>}
          {creditError && (
            <div className="reservation-alert is-error">
              {creditError}{" "}
              <Button type="button" size="sm" className="app-secondary-button" onClick={retryCreditSummary}>
                Réessayer
              </Button>
            </div>
          )}
          {!creditLoading && !creditError && creditSummary && (
            <>
              <dl className="reservation-client-summary-grid">
                <div><dt>Crédit autorisé</dt><dd>{creditSummary.autorise ? "Oui" : "Non"}</dd></div>
                <div><dt>Plafond de crédit</dt><dd>{formatMoney(creditSummary.plafond)}</dd></div>
                <div><dt>Délai de paiement</dt><dd>{creditSummary.delai_paiement_jours ?? "—"} jour(s)</dd></div>
                <div><dt>Exposition actuelle</dt><dd>{formatMoney(creditSummary.exposition_actuelle)}</dd></div>
                <div><dt>Crédit disponible</dt><dd>{formatMoney(creditSummary.credit_disponible)}</dd></div>
                <div><dt>Montant prévisionnel</dt><dd>{formatMoney(creditProjection?.reservationRemaining)}</dd></div>
                <div><dt>Exposition projetée</dt><dd>{formatMoney(creditProjection?.projected)}</dd></div>
                <div><dt>Date d’échéance</dt><dd>{creditDeadline ? formatDate(creditDeadline) : "Calculée après enregistrement"}</dd></div>
              </dl>
              {!creditSummary.autorise && (
                <div className="reservation-alert is-warning">Le paiement à crédit n’est pas autorisé pour cette société.</div>
              )}
              {creditProjection?.exceeds && (
                <div className="reservation-alert is-warning">L’exposition projetée dépasse le plafond de crédit de cette société.</div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default PaymentPolicySelector;
