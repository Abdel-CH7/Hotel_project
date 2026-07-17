import { Form } from "react-bootstrap";

const ReductionSelector = ({ options, value, error, onChange }) => (
  <section className="reservation-form-section">
    <h3>6. Réduction</h3>
    <Form.Group>
      <Form.Label>Réduction appliquée</Form.Label>
      <Form.Select value={value} onChange={(event) => onChange(event.target.value)} isInvalid={Boolean(error)}>
        <option value="">Aucune réduction</option>
        {options.map((option) => (
          <option key={option.type_reduction_id} value={option.type_reduction_id}>{option.nom}</option>
        ))}
      </Form.Select>
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      <Form.Text>Le montant est calculé uniquement par le serveur.</Form.Text>
    </Form.Group>
  </section>
);

export default ReductionSelector;
