import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button, Form, Spinner } from "react-bootstrap";
import RequiredLabel from "../../components/RequiredLabel";
import { createReclamation, getReclamationReservationContext, updateReclamation } from "../api/reclamationApi";
import { apiErrorMessage, apiFieldErrors, localDateValue } from "../reclamationUtils";

const EMPTY_FORM = {
  reservation_id: "",
  client_type: "",
  client_id: "",
  chambre_id: "",
  reclamation_type_id: "",
  description: "",
  reclamation_canal_id: "",
  canal_precision: "",
  date_reclamation: "",
  priorite: "normale",
  departement_id: "",
};

const idValue = (value) => (value === null || value === undefined ? "" : String(value));

const ReclamationDrawer = ({ show, complaint, initialReservationId, options, optionsError, lookupSelection, onRetryOptions, onClose, onSaved, onManage }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");

  useEffect(() => {
    if (!show) return;
    setForm(complaint ? {
      reservation_id: idValue(complaint.reservation?.id),
      client_type: complaint.reservation ? "" : idValue(complaint.client?.type),
      client_id: complaint.reservation ? "" : idValue(complaint.client?.id),
      chambre_id: idValue(complaint.chambre?.id),
      reclamation_type_id: idValue(complaint.objet?.id),
      description: complaint.description || "",
      reclamation_canal_id: idValue(complaint.canal?.id),
      canal_precision: complaint.canal?.precision || "",
      date_reclamation: complaint.date || "",
      priorite: complaint.priorite || "normale",
      departement_id: idValue(complaint.departement?.id),
    } : {
      ...EMPTY_FORM,
      reservation_id: idValue(initialReservationId),
      date_reclamation: localDateValue(),
    });
    setErrors({});
    setContext(null);
    setContextError("");
  }, [show, complaint, initialReservationId]);

  useEffect(() => {
    if (!show || !form.reservation_id) {
      setContext(null);
      return;
    }
    let active = true;
    setContextLoading(true);
    setContextError("");
    getReclamationReservationContext(form.reservation_id)
      .then((data) => active && setContext(data))
      .catch((error) => active && setContextError(apiErrorMessage(error, "Impossible de charger le contexte de la réservation.")))
      .finally(() => active && setContextLoading(false));
    return () => { active = false; };
  }, [show, form.reservation_id]);

  const currentType = useMemo(() => (options.types || []).find((item) => String(item.id) === form.reclamation_type_id), [options.types, form.reclamation_type_id]);
  const currentChannel = useMemo(() => (options.canaux || []).find((item) => String(item.id) === form.reclamation_canal_id), [options.canaux, form.reclamation_canal_id]);
  const clientOptions = form.client_type ? options.clients?.[form.client_type] || [] : [];

  const withHistorical = (rows, current, labelKey = "nom") => {
    if (!current?.id || rows.some((row) => String(row.id) === String(current.id))) return rows;
    return [...rows, { id: current.id, [labelKey]: `${current[labelKey] || "Valeur historique"} — Inactif` }];
  };
  const typeOptions = withHistorical(options.types || [], complaint?.objet);
  const channelOptions = withHistorical(options.canaux || [], complaint?.canal);
  const departmentOptions = withHistorical(options.departements || [], complaint?.departement);

  const setField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const changeReservation = (value) => {
    setForm((previous) => ({ ...previous, reservation_id: value, client_type: "", client_id: "", chambre_id: "" }));
    setErrors((previous) => ({ ...previous, reservation_id: "", client_type: "", client_id: "", chambre_id: "" }));
  };

  const changeType = (value) => {
    const selected = (options.types || []).find((item) => String(item.id) === value);
    setForm((previous) => ({
      ...previous,
      reclamation_type_id: value,
      departement_id: selected?.departement_par_defaut_id ? String(selected.departement_par_defaut_id) : previous.departement_id,
      priorite: selected?.priorite_par_defaut || previous.priorite || "normale",
    }));
    setErrors((previous) => ({ ...previous, reclamation_type_id: "" }));
  };

  const changeChannel = (value) => {
    const selected = (options.canaux || []).find((item) => String(item.id) === value);
    setForm((previous) => ({ ...previous, reclamation_canal_id: value, canal_precision: selected?.est_autre ? previous.canal_precision : "" }));
    setErrors((previous) => ({ ...previous, reclamation_canal_id: "", canal_precision: "" }));
  };

  useEffect(() => {
    if (!show || !lookupSelection?.lookup) return;

    const { kind, lookup } = lookupSelection;
    if (kind === "type") {
      const suggestedDepartment = lookup.departement_par_defaut;
      const suggestedDepartmentId = suggestedDepartment?.actif === false
        ? ""
        : idValue(lookup.departement_par_defaut_id || suggestedDepartment?.id);

      setForm((previous) => ({
        ...previous,
        reclamation_type_id: idValue(lookup.id),
        departement_id: suggestedDepartmentId || previous.departement_id,
        priorite: lookup.priorite_par_defaut || previous.priorite || "normale",
      }));
      setErrors((previous) => ({
        ...previous,
        reclamation_type_id: "",
        departement_id: suggestedDepartmentId ? "" : previous.departement_id,
        priorite: lookup.priorite_par_defaut ? "" : previous.priorite,
      }));
      return;
    }

    if (kind === "canal") {
      setForm((previous) => ({
        ...previous,
        reclamation_canal_id: idValue(lookup.id),
        canal_precision: lookup.est_autre ? previous.canal_precision : "",
      }));
      setErrors((previous) => ({ ...previous, reclamation_canal_id: "", canal_precision: "" }));
      return;
    }

    if (kind === "departement") {
      setForm((previous) => ({ ...previous, departement_id: idValue(lookup.id) }));
      setErrors((previous) => ({ ...previous, departement_id: "" }));
    }
  }, [show, lookupSelection]);

  const validate = () => {
    const next = {};
    if (!form.reclamation_type_id) next.reclamation_type_id = "Le type de réclamation est obligatoire.";
    if (!form.description.trim()) next.description = "La description détaillée est obligatoire.";
    if (!form.reclamation_canal_id) next.reclamation_canal_id = "Le canal de réception est obligatoire.";
    if (currentChannel?.est_autre && !form.canal_precision.trim()) next.canal_precision = "Veuillez préciser le canal de réception.";
    if (!form.date_reclamation) next.date_reclamation = "La date de réclamation est obligatoire.";
    if (!form.priorite) next.priorite = "La priorité est obligatoire.";
    if (!form.departement_id) next.departement_id = "Le département est obligatoire.";
    if (!form.reservation_id && Boolean(form.client_type) !== Boolean(form.client_id)) next.client_id = "Le type et le client doivent être sélectionnés ensemble.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate() || saving) return;
    const payload = {
      reservation_id: form.reservation_id ? Number(form.reservation_id) : null,
      client_type: form.reservation_id ? null : form.client_type || null,
      client_id: form.reservation_id || !form.client_id ? null : Number(form.client_id),
      chambre_id: form.reservation_id && form.chambre_id ? Number(form.chambre_id) : null,
      reclamation_type_id: Number(form.reclamation_type_id),
      description: form.description.trim(),
      reclamation_canal_id: Number(form.reclamation_canal_id),
      canal_precision: currentChannel?.est_autre ? form.canal_precision.trim() : null,
      date_reclamation: form.date_reclamation,
      departement_id: Number(form.departement_id),
      priorite: form.priorite,
    };
    setSaving(true);
    let saved;
    try {
      saved = complaint ? await updateReclamation(complaint.id, payload) : await createReclamation(payload);
    } catch (error) {
      const fields = apiFieldErrors(error);
      setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages])));
      if (Object.keys(fields).length === 0) setErrors({ _form: apiErrorMessage(error, "Impossible d’enregistrer la réclamation.") });
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
    onSaved(saved, Boolean(complaint));
  };

  const feedback = (name) => errors[name] ? <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback> : null;
  if (!show) return null;

  return (
    <aside className="app-form-drawer reclamation-drawer is-open" aria-label={complaint ? "Modifier la réclamation" : "Ajouter une réclamation"}>
      <div className="reclamation-drawer-header"><h2 className="app-form-drawer-title">{complaint ? `Modifier ${complaint.numero}` : "Ajouter une réclamation"}</h2><button type="button" className="reclamation-close-button" onClick={onClose} aria-label="Fermer"><FontAwesomeIcon icon={faXmark} /></button></div>
      <Form onSubmit={submit} noValidate>
        <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
        {errors._form && <div className="alert alert-danger" role="alert">{errors._form}</div>}
        {optionsError && <div className="alert alert-warning" role="alert">{optionsError} <button type="button" className="btn btn-link btn-sm" onClick={onRetryOptions}>Réessayer</button></div>}

        <section className="reclamation-form-section"><h3>Séjour et client</h3>
          <Form.Group><Form.Label>Réservation</Form.Label><Form.Select value={form.reservation_id} onChange={(event) => changeReservation(event.target.value)} isInvalid={Boolean(errors.reservation_id)}><option value="">Sans réservation</option>{(options.reservations || []).map((row) => <option key={row.id} value={row.id}>{row.select_label}</option>)}</Form.Select>{feedback("reservation_id")}</Form.Group>
          {form.reservation_id ? (
            <div className="reclamation-derived-context">{contextLoading ? <Spinner size="sm" /> : contextError ? <span className="text-danger">{contextError}</span> : <><strong>{context?.client?.display_name || "Client indisponible"}</strong><span>{context?.client?.type_label}</span></>}</div>
          ) : <div className="reclamation-form-grid two-columns">
            <Form.Group><Form.Label>Type de client</Form.Label><Form.Select value={form.client_type} onChange={(event) => setForm((previous) => ({ ...previous, client_type: event.target.value, client_id: "" }))}><option value="">Aucun client</option><option value="particulier">Particulier</option><option value="societe">Société</option></Form.Select></Form.Group>
            <Form.Group><Form.Label>Client</Form.Label><Form.Select value={form.client_id} disabled={!form.client_type} onChange={(event) => setField("client_id", event.target.value)} isInvalid={Boolean(errors.client_id)}><option value="">Sélectionner</option>{clientOptions.map((row) => <option key={`${row.type}-${row.id}`} value={row.id}>{row.select_label}</option>)}</Form.Select>{feedback("client_id")}</Form.Group>
          </div>}
          <Form.Group><Form.Label>Chambre</Form.Label><Form.Select value={form.chambre_id} disabled={!form.reservation_id || contextLoading} onChange={(event) => setField("chambre_id", event.target.value)} isInvalid={Boolean(errors.chambre_id)}><option value="">Aucune chambre</option>{(context?.chambres || []).map((room) => <option key={room.chambre_id} value={room.chambre_id}>{[room.numero, room.type, room.etage, room.vue].filter(Boolean).join(" — ")}</option>)}</Form.Select>{feedback("chambre_id")}</Form.Group>
        </section>

        <section className="reclamation-form-section"><h3>Réclamation</h3>
          <Form.Group><div className="app-label-action reclamation-label-action"><Form.Label><RequiredLabel required>Type de réclamation</RequiredLabel></Form.Label><button type="button" className="app-inline-add" onClick={() => onManage("type")} title="Gérer les types"><FontAwesomeIcon icon={faPlus} /></button></div><Form.Select value={form.reclamation_type_id} onChange={(event) => changeType(event.target.value)} isInvalid={Boolean(errors.reclamation_type_id)} aria-required="true"><option value="">Sélectionner</option>{typeOptions.map((row) => <option key={row.id} value={row.id}>{row.nom}</option>)}</Form.Select>{feedback("reclamation_type_id")}{currentType?.configuration_warning && <Form.Text className="text-warning">{currentType.configuration_warning}</Form.Text>}</Form.Group>
          <Form.Group><Form.Label><RequiredLabel required>Description détaillée</RequiredLabel></Form.Label><Form.Control as="textarea" rows={4} maxLength={5000} value={form.description} onChange={(event) => setField("description", event.target.value)} isInvalid={Boolean(errors.description)} aria-required="true" />{feedback("description")}</Form.Group>
          <Form.Group><div className="app-label-action reclamation-label-action"><Form.Label><RequiredLabel required>Canal de réception</RequiredLabel></Form.Label><button type="button" className="app-inline-add" onClick={() => onManage("canal")} title="Gérer les canaux"><FontAwesomeIcon icon={faPlus} /></button></div><Form.Select value={form.reclamation_canal_id} onChange={(event) => changeChannel(event.target.value)} isInvalid={Boolean(errors.reclamation_canal_id)} aria-required="true"><option value="">Sélectionner</option>{channelOptions.map((row) => <option key={row.id} value={row.id}>{row.nom}</option>)}</Form.Select>{feedback("reclamation_canal_id")}</Form.Group>
          {currentChannel?.est_autre && <Form.Group><Form.Label><RequiredLabel required>Préciser le canal</RequiredLabel></Form.Label><Form.Control value={form.canal_precision} maxLength={255} onChange={(event) => setField("canal_precision", event.target.value)} isInvalid={Boolean(errors.canal_precision)} aria-required="true" />{feedback("canal_precision")}</Form.Group>}
          <div className="reclamation-form-grid two-columns"><Form.Group><Form.Label><RequiredLabel required>Date de réclamation</RequiredLabel></Form.Label><Form.Control type="date" max={localDateValue()} value={form.date_reclamation} onChange={(event) => setField("date_reclamation", event.target.value)} isInvalid={Boolean(errors.date_reclamation)} aria-required="true" />{feedback("date_reclamation")}</Form.Group><Form.Group><Form.Label><RequiredLabel required>Priorité</RequiredLabel></Form.Label><Form.Select value={form.priorite} onChange={(event) => setField("priorite", event.target.value)} isInvalid={Boolean(errors.priorite)} aria-required="true">{(options.priorites || []).map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}</Form.Select>{feedback("priorite")}</Form.Group></div>
        </section>

        <section className="reclamation-form-section"><h3>Affectation</h3><Form.Group><div className="app-label-action reclamation-label-action"><Form.Label><RequiredLabel required>Département</RequiredLabel></Form.Label><button type="button" className="app-inline-add" onClick={() => onManage("departement")} title="Gérer les départements"><FontAwesomeIcon icon={faPlus} /></button></div><Form.Select value={form.departement_id} onChange={(event) => setField("departement_id", event.target.value)} isInvalid={Boolean(errors.departement_id)} aria-required="true"><option value="">Sélectionner</option>{departmentOptions.map((row) => <option key={row.id} value={row.id}>{row.nom}</option>)}</Form.Select>{feedback("departement_id")}</Form.Group></section>

        <div className="app-form-actions"><Button type="submit" className="app-primary-button" disabled={saving}>{saving ? "Enregistrement…" : "Valider"}</Button><Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annuler</Button></div>
      </Form>
    </aside>
  );
};

export default ReclamationDrawer;
