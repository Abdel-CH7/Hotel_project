import { Button, Form, Modal } from "react-bootstrap";
import { formatMoney } from "../reservationUtils";

const CancelReservationModal = ({ show, reservation, reason, error, saving, onReasonChange, onConfirm, onHide }) => (
  <Modal show={show} onHide={saving ? undefined : onHide} centered>
    <Modal.Header closeButton={!saving}>
      <Modal.Title>Annuler la réservation</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>La réservation <strong>{reservation?.reservation_num}</strong> restera dans l’historique.</p>
      {Number(reservation?.reglement?.montant_paye || 0) > 0 && (
        <div className="reservation-alert is-warning">
          Cette réservation contient {formatMoney(reservation.reglement.montant_paye)} de paiements enregistrés. L’annulation ne rembourse pas automatiquement ces montants.
        </div>
      )}
      <Form.Group>
        <Form.Label>Motif d’annulation</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          isInvalid={Boolean(error)}
        />
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    </Modal.Body>
    <Modal.Footer>
      <Button type="button" className="app-secondary-button" onClick={onHide} disabled={saving}>Retour</Button>
      <Button type="button" className="app-danger-button" onClick={onConfirm} disabled={saving}>
        {saving ? "Annulation…" : "Confirmer l’annulation"}
      </Button>
    </Modal.Footer>
  </Modal>
);

export default CancelReservationModal;
