import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import {
  cancelReservationPayment,
  createReservationPayment,
  getReservationPaymentOptions,
} from "../api/reservationApi";
import {
  formatDate,
  formatMoney,
  paymentStatusClass,
  paymentStatusLabel,
} from "../reservationUtils";

const localCalendarDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateInputValue = (value) => {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || undefined;
};

const emptyForm = () => ({
  mode_paiement_id: "",
  montant: "",
  date_paiement: localCalendarDate(),
  reference: "",
  commentaire: "",
});

const fieldErrorsFrom = (error) => {
  const validation = error?.response?.data?.errors || {};
  const errors = Object.entries(validation).reduce((result, [field, messages]) => ({
    ...result,
    [field]: Array.isArray(messages) ? messages[0] : messages,
  }), {});
  if (error?.response?.data?.field && error?.response?.data?.message) {
    errors[error.response.data.field] = error.response.data.message;
  }
  return errors;
};

const amountToCents = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) : null;
};

const ReservationPayments = ({ reservation, onChanged }) => {
  const [modes, setModes] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const optionsRequestRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPaymentOptions = useCallback(() => {
    if (optionsRequestRef.current) return optionsRequestRef.current;

    setOptionsLoading(true);
    setOptionsError("");
    const request = getReservationPaymentOptions()
      .then((data) => {
        if (mountedRef.current) {
          setModes(Array.isArray(data?.modes_paiement) ? data.modes_paiement : []);
        }
        return true;
      })
      .catch((error) => {
        if (mountedRef.current) {
          setOptionsError(error?.response?.data?.message || "Impossible de charger les modes de paiement.");
        }
        return false;
      })
      .finally(() => {
        optionsRequestRef.current = null;
        if (mountedRef.current) setOptionsLoading(false);
      });

    optionsRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    loadPaymentOptions();
  }, [loadPaymentOptions, reservation.id]);

  const summary = reservation.reglement || {};
  const remaining = Number(summary.reste_a_payer);
  const total = Number(summary.total);
  const paid = Number(summary.montant_paye || 0);
  const enteredCents = amountToCents(form.montant);
  const remainingCents = amountToCents(summary.reste_a_payer);
  const paidCents = amountToCents(summary.montant_paye) || 0;
  const automaticClassification = !enteredCents || enteredCents <= 0
    ? "—"
    : enteredCents === remainingCents
      ? "Solde"
      : paidCents === 0
        ? "Acompte"
        : "Paiement partiel";
  const localToday = localCalendarDate();
  const reservationDate = dateInputValue(reservation.dates?.reservation);
  const canAddPayment = reservation.status !== "annulé"
    && Number.isFinite(total)
    && total > 0
    && Number.isFinite(remaining)
    && remaining > 0
    && !optionsLoading
    && !optionsError
    && modes.length > 0;

  const defaultCompanyMode = useMemo(() => {
    const modeId = reservation.client?.type === "societe"
      ? reservation.client?.commercial?.mode_reglement_id
      : null;
    return modes.some((mode) => String(mode.id) === String(modeId)) ? String(modeId) : "";
  }, [modes, reservation.client]);

  const openForm = () => {
    setForm({ ...emptyForm(), mode_paiement_id: defaultCompanyMode });
    setErrors({});
    setActionError("");
    setSuccessMessage("");
    setRefreshWarning("");
    setCancelTarget(null);
    setFormOpen(true);
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setActionError("");
  };

  const refreshReservationDisplay = async () => {
    try {
      const result = await onChanged(reservation.id);
      return result?.ok !== false;
    } catch {
      return false;
    }
  };

  const submitPayment = async () => {
    setSaving(true);
    setErrors({});
    setActionError("");
    setSuccessMessage("");
    setRefreshWarning("");
    try {
      await createReservationPayment(reservation.id, form);
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
      setActionError(error?.response?.data?.message || "Impossible d’enregistrer ce paiement.");
      if (error?.response?.status === 409) {
        const refreshed = await refreshReservationDisplay();
        if (!refreshed) {
          setRefreshWarning("Le solde a peut-être changé, mais l’affichage n’a pas pu être actualisé. Rechargez les données.");
        }
      }
      setSaving(false);
      return;
    }

    setFormOpen(false);
    setForm(emptyForm());
    setSuccessMessage("Le paiement a été enregistré.");

    const refreshed = await refreshReservationDisplay();
    if (!refreshed) {
      setRefreshWarning("Le paiement a été enregistré, mais l’affichage n’a pas pu être actualisé. Rechargez les données.");
    }
    setSaving(false);
  };

  const submitCancellation = async () => {
    if (cancelReason.trim().length < 3) {
      setActionError("Le motif d’annulation doit contenir au moins 3 caractères.");
      return;
    }
    setSaving(true);
    setActionError("");
    setSuccessMessage("");
    setRefreshWarning("");
    try {
      await cancelReservationPayment(reservation.id, cancelTarget.id, {
        motif_annulation: cancelReason.trim(),
      });
    } catch (error) {
      setActionError(error?.response?.data?.errors?.motif_annulation?.[0]
        || error?.response?.data?.message
        || "Impossible d’annuler cette saisie de paiement.");
      if (error?.response?.status === 409) {
        const refreshed = await refreshReservationDisplay();
        if (!refreshed) {
          setRefreshWarning("Les données ont peut-être changé, mais l’affichage n’a pas pu être actualisé. Rechargez les données.");
        }
      }
      setSaving(false);
      return;
    }

    setCancelTarget(null);
    setCancelReason("");
    setSuccessMessage("La saisie du paiement a été annulée.");

    const refreshed = await refreshReservationDisplay();
    if (!refreshed) {
      setRefreshWarning("La saisie du paiement a été annulée, mais l’affichage n’a pas pu être actualisé. Rechargez les données.");
    }
    setSaving(false);
  };

  return (
    <section className="reservation-details-section reservation-payment-section">
      <div className="reservation-payment-heading">
        <h3>Règlement</h3>
        {canAddPayment && !formOpen && !cancelTarget && (
          <Button type="button" className="app-primary-button" onClick={openForm}>
            Ajouter un paiement
          </Button>
        )}
      </div>

      <div className="reservation-payment-summary">
        <div><span>Montant total</span><strong>{formatMoney(summary.total)}</strong></div>
        <div><span>Montant payé</span><strong>{formatMoney(summary.montant_paye)}</strong></div>
        <div><span>Reste à payer</span><strong>{formatMoney(summary.reste_a_payer)}</strong></div>
        <div>
          <span>Statut du règlement</span>
          <strong className={`app-status-badge ${paymentStatusClass(summary.statut)}`}>
            {summary.statut_label || paymentStatusLabel(summary.statut)}
          </strong>
        </div>
      </div>

      {successMessage && <div className="reservation-alert is-success">{successMessage}</div>}
      {refreshWarning && <div className="reservation-alert is-warning">{refreshWarning}</div>}
      {actionError && <div className="reservation-alert is-error">{actionError}</div>}
      {optionsError && (
        <div className="reservation-alert is-error">
          {optionsError}{" "}
          <Button type="button" size="sm" className="app-secondary-button" onClick={loadPaymentOptions} disabled={optionsLoading}>
            Réessayer
          </Button>
        </div>
      )}
      {reservation.status === "annulé" && (
        <div className="reservation-alert is-warning">
          Aucun nouveau paiement ne peut être ajouté à une réservation annulée.
          {paid > 0 && " Un remboursement réel ou un ajustement comptable peut être nécessaire."}
        </div>
      )}
      {reservation.status !== "annulé" && Number.isFinite(remaining) && remaining === 0 && (
        <div className="reservation-payment-settled">Solde réglé</div>
      )}
      {reservation.status !== "annulé" && (!Number.isFinite(total) || total <= 0) && (
        <div className="reservation-alert is-warning">
          Le total de cette réservation est indisponible. Aucun paiement ne peut être enregistré.
        </div>
      )}

      {formOpen && (
        <div className="reservation-payment-form">
          <h4>Ajouter un paiement</h4>
          <div className="reservation-payment-form-grid">
            <Form.Group>
              <Form.Label>Classification automatique</Form.Label>
              <div className="reservation-payment-classification">{automaticClassification}</div>
            </Form.Group>
            <Form.Group>
              <Form.Label>Mode de paiement *</Form.Label>
              <Form.Select value={form.mode_paiement_id} onChange={(event) => setField("mode_paiement_id", event.target.value)} isInvalid={Boolean(errors.mode_paiement_id)}>
                <option value="">Sélectionner</option>
                {modes.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.mode_paiement_id}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Form.Label>Montant * <small>Maximum : {formatMoney(summary.reste_a_payer)}</small></Form.Label>
              <Form.Control type="number" min="0.01" max={summary.reste_a_payer || undefined} step="0.01" value={form.montant} onChange={(event) => setField("montant", event.target.value)} isInvalid={Boolean(errors.montant)} />
              <Form.Control.Feedback type="invalid">{errors.montant}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Form.Label>Date du paiement *</Form.Label>
              <Form.Control type="date" min={reservationDate} max={localToday} value={form.date_paiement} onChange={(event) => setField("date_paiement", event.target.value)} isInvalid={Boolean(errors.date_paiement)} />
              <Form.Control.Feedback type="invalid">{errors.date_paiement}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Form.Label>Référence</Form.Label>
              <Form.Control maxLength={120} value={form.reference} onChange={(event) => setField("reference", event.target.value)} isInvalid={Boolean(errors.reference)} />
              <Form.Control.Feedback type="invalid">{errors.reference}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="reservation-payment-comment">
              <Form.Label>Commentaire</Form.Label>
              <Form.Control as="textarea" rows={2} maxLength={1000} value={form.commentaire} onChange={(event) => setField("commentaire", event.target.value)} isInvalid={Boolean(errors.commentaire)} />
              <Form.Control.Feedback type="invalid">{errors.commentaire}</Form.Control.Feedback>
            </Form.Group>
          </div>
          <div className="app-form-actions">
            <Button type="button" className="app-primary-button" onClick={submitPayment} disabled={saving}>Enregistrer</Button>
            <Button type="button" className="app-secondary-button" onClick={() => setFormOpen(false)} disabled={saving}>Retour</Button>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="reservation-payment-cancel-panel">
          <h4>Annuler la saisie</h4>
          <p><strong>{cancelTarget.numero}</strong> · {formatMoney(cancelTarget.montant)} · {cancelTarget.mode?.label || "—"} · {formatDate(cancelTarget.date)}</p>
          <div className="reservation-alert is-warning">
            Cette action annule uniquement la saisie du paiement. Elle ne représente pas un remboursement au client.
          </div>
          <Form.Group>
            <Form.Label>Motif d’annulation *</Form.Label>
            <Form.Control as="textarea" rows={3} value={cancelReason} onChange={(event) => { setCancelReason(event.target.value); setActionError(""); }} />
          </Form.Group>
          <div className="app-form-actions">
            <Button type="button" className="app-danger-button" onClick={submitCancellation} disabled={saving}>Confirmer l’annulation</Button>
            <Button type="button" className="app-secondary-button" onClick={() => { setCancelTarget(null); setCancelReason(""); }} disabled={saving}>Retour</Button>
          </div>
        </div>
      )}

      <div className="reservation-payment-history">
        <h4>Historique des paiements</h4>
        {(reservation.paiements || []).length === 0 ? (
          <p>Aucun paiement enregistré pour cette réservation.</p>
        ) : (
          <div className="reservation-payment-table-scroll">
            <table className="table table-bordered reservation-payment-table">
              <thead><tr><th>N° paiement</th><th>Date</th><th>Type</th><th>Mode</th><th>Référence</th><th>Montant</th><th>Statut</th><th>Saisi par</th><th>Action</th></tr></thead>
              <tbody>
                {reservation.paiements.map((payment) => (
                  <Fragment key={payment.id}>
                    <tr className={payment.statut === "annule" ? "is-cancelled" : ""}>
                      <td>{payment.numero}</td><td>{formatDate(payment.date)}</td><td>{payment.type_label}</td><td>{payment.mode?.label || "—"}</td><td>{payment.reference || "—"}</td><td>{formatMoney(payment.montant)}</td>
                      <td><span className={`app-status-badge ${payment.statut === "valide" ? "is-success" : "is-danger"}`}>{payment.statut_label}</span></td>
                      <td>{payment.created_by?.name || "—"}</td>
                      <td>{payment.statut === "valide" ? <button type="button" className="reservation-payment-cancel-action" onClick={() => { setCancelTarget(payment); setFormOpen(false); setCancelReason(""); setActionError(""); }}>Annuler la saisie</button> : "—"}</td>
                    </tr>
                    {payment.statut === "annule" && (
                      <tr className="is-cancelled">
                        <td className="reservation-payment-cancellation-details" colSpan="9">
                          Motif : {payment.annulation?.motif || "—"} · Annulé le {payment.annulation?.at ? formatDate(payment.annulation.at) : "—"} par {payment.annulation?.par?.name || "—"}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReservationPayments;
