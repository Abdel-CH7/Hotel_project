import { Form } from "react-bootstrap";
import { formatMoney } from "../reservationUtils";

const valueOrDash = (value) => (value === null || value === undefined || value === "" ? "—" : value);

const RegisteredChildrenReference = ({ client }) => {
  const children = Array.isArray(client?.enfants_enregistres) ? client.enfants_enregistres : [];
  const visibleChildren = children.slice(0, 4);
  const remaining = Math.max(children.length - visibleChildren.length, 0);

  return (
    <div className="reservation-client-children-reference">
      <div className="reservation-client-children-heading">
        <h4>Enfants enregistrés</h4>
        <span>{children.length}</span>
      </div>
      {children.length > 0 ? (
        <ul>
          {visibleChildren.map((child) => (
            <li key={child.id}>
              {[child.prenom, child.nom].filter(Boolean).join(" ") || "Enfant sans nom"}
              {" — "}
              {child.age === null || child.age === undefined ? "Âge non renseigné" : `${child.age} ans`}
            </li>
          ))}
        </ul>
      ) : (
        <p className="reservation-client-children-empty">Aucun enfant enregistré pour ce client.</p>
      )}
      {remaining > 0 && <p className="reservation-client-children-more">+ {remaining} autre(s)</p>}
      <p className="reservation-client-children-note">
        Ces informations sont uniquement une référence. Indiquez dans chaque chambre les enfants participant réellement à ce séjour.
      </p>
    </div>
  );
};

const ClientSelector = ({ form, clients, loading, errors, setField, fallbackClient }) => {
  const sourceOptions = clients[form.client_type] || [];
  const hasFallback = fallbackClient
    && fallbackClient.type === form.client_type
    && String(fallbackClient.id) === String(form.client_id)
    && !sourceOptions.some((client) => String(client.id) === String(form.client_id));
  const options = hasFallback ? [fallbackClient, ...sourceOptions] : sourceOptions;
  const selectedClient = options.find((client) => String(client.id) === String(form.client_id)) || null;

  return (
    <section className="reservation-form-section reservation-client-selector">
      <h3>1. Client</h3>
      <div className="reservation-form-grid">
        <Form.Group>
          <Form.Label>Type de client</Form.Label>
          <Form.Select
            value={form.client_type}
            onChange={(event) => setField("client_type", event.target.value)}
            isInvalid={Boolean(errors.client_type)}
          >
            <option value="">Sélectionner</option>
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
            disabled={!form.client_type || (loading && options.length === 0)}
            isInvalid={Boolean(errors.client_id)}
          >
            <option value="">
              {!form.client_type ? "Sélectionner d’abord le type" : loading && options.length === 0 ? "Chargement..." : "Sélectionner un client"}
            </option>
            {options.map((client) => (
              <option key={`${client.type}-${client.id}`} value={client.id}>
                {client.select_label || client.display_name}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.client_id}</Form.Control.Feedback>
        </Form.Group>
      </div>

      {selectedClient && (
        <div className="reservation-client-summary">
          <div className="reservation-client-summary-header">
            <strong>{selectedClient.display_name}</strong>
            <span className={`reservation-client-type-badge is-${selectedClient.type}`}>
              {selectedClient.type === "societe" ? "Société" : "Particulier"}
            </span>
          </div>

          {selectedClient.type === "particulier" ? (
            <>
              <dl className="reservation-client-summary-grid">
                <div><dt>Code</dt><dd>{valueOrDash(selectedClient.code)}</dd></div>
                <div><dt>Nom complet</dt><dd>{valueOrDash(selectedClient.display_name)}</dd></div>
                <div><dt>Pièce d’identité</dt><dd>{[selectedClient.type_piece, selectedClient.numero_piece].filter(Boolean).join(" ") || "—"}</dd></div>
                <div><dt>Téléphone</dt><dd>{valueOrDash(selectedClient.telephone)}</dd></div>
                <div><dt>Nationalité</dt><dd>{valueOrDash(selectedClient.nationalite)}</dd></div>
                <div><dt>Pays / Région / Ville</dt><dd>{[selectedClient.pays, selectedClient.region, selectedClient.ville].filter(Boolean).join(" / ") || "—"}</dd></div>
              </dl>
              <RegisteredChildrenReference client={selectedClient} />
            </>
          ) : (
            <>
              <dl className="reservation-client-summary-grid">
                <div><dt>Code</dt><dd>{valueOrDash(selectedClient.code)}</dd></div>
                <div><dt>Raison sociale</dt><dd>{valueOrDash(selectedClient.display_name)}</dd></div>
                <div><dt>ICE</dt><dd>{valueOrDash(selectedClient.ice)}</dd></div>
                <div><dt>Type d’organisation</dt><dd>{valueOrDash(selectedClient.type_organisation_label)}</dd></div>
                <div><dt>Secteur</dt><dd>{valueOrDash(selectedClient.secteur?.label)}</dd></div>
                <div><dt>Téléphone</dt><dd>{valueOrDash(selectedClient.telephone)}</dd></div>
                <div><dt>Email</dt><dd>{valueOrDash(selectedClient.email)}</dd></div>
              </dl>
              <div className="reservation-client-commercial">
                <h4>Conditions commerciales de référence</h4>
                <dl className="reservation-client-summary-grid">
                  <div><dt>Mode de règlement par défaut</dt><dd>{valueOrDash(selectedClient.commercial?.mode_reglement_label)}</dd></div>
                  <div><dt>Paiement à crédit autorisé</dt><dd>{selectedClient.commercial?.credit_autorise ? "Oui" : "Non"}</dd></div>
                  <div><dt>Délai</dt><dd>{selectedClient.commercial?.delai_paiement_jours ? `${selectedClient.commercial.delai_paiement_jours} jours` : "—"}</dd></div>
                  <div><dt>Plafond de crédit</dt><dd>{selectedClient.commercial?.plafond_credit ? formatMoney(selectedClient.commercial.plafond_credit) : "—"}</dd></div>
                </dl>
                <p>Ces conditions sont informatives. Le règlement réel n’est pas enregistré dans cette réservation.</p>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default ClientSelector;
