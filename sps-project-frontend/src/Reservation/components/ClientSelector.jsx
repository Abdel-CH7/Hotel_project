import { Form } from "react-bootstrap";

const companyName = (client) => client.raison_sociale || client.CodeClient || `Client ${client.id}`;
const individualName = (client) => {
  const fullName = [client.name, client.prenom].filter(Boolean).join(" ").trim();
  return fullName || client.CodeClient || `Client ${client.id}`;
};

const ClientSelector = ({ form, clients, loading, errors, setField }) => {
  const options = clients[form.client_type] || [];

  return (
    <section className="reservation-form-section">
      <h3>1. Client</h3>
      <div className="reservation-form-grid">
        <Form.Group>
          <Form.Label>Type de client</Form.Label>
          <Form.Select
            value={form.client_type}
            onChange={(event) => setField("client_type", event.target.value)}
            isInvalid={Boolean(errors.client_type)}
          >
            <option value="societe">Société</option>
            <option value="particulier">Particulier</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.client_type}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group>
          <Form.Label>Client</Form.Label>
          <Form.Select
            value={form.client_id}
            onChange={(event) => setField("client_id", event.target.value)}
            disabled={loading}
            isInvalid={Boolean(errors.client_id)}
          >
            <option value="">{loading ? "Chargement..." : "Sélectionner un client"}</option>
            {options.map((client) => (
              <option key={client.id} value={client.id}>
                {form.client_type === "particulier" ? individualName(client) : companyName(client)}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.client_id}</Form.Control.Feedback>
        </Form.Group>
      </div>
    </section>
  );
};

export default ClientSelector;
