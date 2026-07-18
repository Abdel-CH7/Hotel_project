import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import RequiredLabel from "../../components/RequiredLabel";
import Swal from "sweetalert2";
import { createReclamationLookup, listReclamationLookups, setReclamationLookupActive, updateReclamationLookup } from "../api/reclamationApi";
import { apiErrorMessage, apiFieldErrors } from "../reclamationUtils";

const labels = {
  type: { title: "Types de réclamation", singular: "type" },
  canal: { title: "Canaux de réception", singular: "canal" },
  departement: { title: "Départements", singular: "département" },
};

const EMPTY = { nom: "", departement_par_defaut_id: "", priorite_par_defaut: "", est_autre: false, photo: null };
const STORAGE_URL = (import.meta.env.VITE_API_URL_BASE_IMAGE || `${(import.meta.env.VITE_API_URL || "/api").replace(/\/api\/?$/, "")}/storage`).replace(/\/$/, "");
const REFRESH_WARNING = "L’opération a été enregistrée, mais l’affichage n’a pas pu être actualisé. Rechargez les données.";

const upsertLookup = (rows, saved) => {
  const withoutSaved = rows.filter((row) => String(row.id) !== String(saved.id));
  return [...withoutSaved, saved].sort((left, right) => (left.nom || "").localeCompare(right.nom || "", "fr"));
};

const ReclamationLookupManager = ({ kind, options, onClose, onSavedLookup }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [changingId, setChangingId] = useState(null);

  const load = async () => {
    if (!kind) return;
    setLoading(true);
    setLoadError("");
    try { setRows(await listReclamationLookups(kind)); }
    catch (error) { setLoadError(apiErrorMessage(error, "Impossible de charger les valeurs.")); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (kind) { setEditing(null); setForm(EMPTY); setErrors({}); load(); } }, [kind]);

  const edit = (row) => {
    setEditing(row);
    setForm({
      nom: row.nom || "",
      departement_par_defaut_id: String(row.departement_par_defaut_id || row.departement_par_defaut?.id || ""),
      priorite_par_defaut: row.priorite_par_defaut || "",
      est_autre: Boolean(row.est_autre),
      photo: null,
    });
    setErrors({});
  };

  const reset = () => { setEditing(null); setForm(EMPTY); setErrors({}); };

  const reconcileLookup = async (saved, wasEdit) => {
    const results = await Promise.allSettled([
      listReclamationLookups(kind).then((freshRows) => {
        setRows(freshRows);
        setLoadError("");
      }),
      onSavedLookup ? onSavedLookup(kind, saved, wasEdit) : Promise.resolve(),
    ]);

    if (results.some((result) => result.status === "rejected")) {
      await Swal.fire("Actualisation incomplète", REFRESH_WARNING, "warning");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.nom.trim()) { setErrors({ nom: "Le nom est obligatoire." }); return; }
    let payload;
    if (kind === "departement") {
      payload = new FormData();
      payload.append("nom", form.nom.trim());
      if (form.photo) payload.append("photo", form.photo);
    } else if (kind === "type") {
      payload = { nom: form.nom.trim(), departement_par_defaut_id: form.departement_par_defaut_id ? Number(form.departement_par_defaut_id) : null, priorite_par_defaut: form.priorite_par_defaut || null };
    } else {
      payload = { nom: form.nom.trim(), est_autre: form.est_autre };
    }
    setSaving(true);
    const wasEdit = Boolean(editing);
    let saved;
    try {
      saved = editing
        ? await updateReclamationLookup(kind, editing.id, payload)
        : await createReclamationLookup(kind, payload);
    } catch (error) {
      const fields = apiFieldErrors(error);
      setErrors(Object.keys(fields).length ? Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])) : { _form: apiErrorMessage(error, `Impossible d’enregistrer ce ${labels[kind].singular}.`) });
      setSaving(false);
      return;
    }

    setRows((previous) => upsertLookup(previous, saved));
    reset();
    setSaving(false);
    await Swal.fire({ icon: "success", title: "Enregistré", timer: 1200, showConfirmButton: false });
    await reconcileLookup(saved, wasEdit);
  };

  const toggle = async (row) => {
    if (changingId) return;
    setChangingId(row.id);
    let saved;
    try {
      saved = await setReclamationLookupActive(kind, row.id, !row.actif);
    } catch (error) {
      await Swal.fire("Erreur", apiErrorMessage(error, "Impossible de modifier le statut."), "error");
      setChangingId(null);
      return;
    }

    setRows((previous) => upsertLookup(previous, saved));
    setChangingId(null);
    await Swal.fire({ icon: "success", title: "Statut mis à jour", timer: 1200, showConfirmButton: false });
    await reconcileLookup(saved, true);
  };

  const departmentName = (row) => row.departement_par_defaut?.nom || row.departement_par_defaut?.nom || "—";
  return (
    <Modal show={Boolean(kind)} onHide={onClose} centered size="lg" dialogClassName="reclamation-lookup-modal">
      <Modal.Header closeButton><Modal.Title>{labels[kind]?.title}</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form onSubmit={submit} className="reclamation-lookup-form">
          <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
          {errors._form && <div className="alert alert-danger">{errors._form}</div>}
          <Form.Group><Form.Label><RequiredLabel required>Nom</RequiredLabel></Form.Label><Form.Control value={form.nom} onChange={(event) => setForm((previous) => ({ ...previous, nom: event.target.value }))} isInvalid={Boolean(errors.nom)} aria-required="true" /><Form.Control.Feedback type="invalid">{errors.nom}</Form.Control.Feedback></Form.Group>
          {kind === "type" && <><Form.Group><Form.Label>Département suggéré</Form.Label><Form.Select value={form.departement_par_defaut_id} onChange={(event) => setForm((previous) => ({ ...previous, departement_par_defaut_id: event.target.value }))}><option value="">Aucun</option>{(options.departements || []).map((row) => <option key={row.id} value={row.id}>{row.nom}</option>)}</Form.Select></Form.Group><Form.Group><Form.Label>Priorité suggérée</Form.Label><Form.Select value={form.priorite_par_defaut} onChange={(event) => setForm((previous) => ({ ...previous, priorite_par_defaut: event.target.value }))}><option value="">Normale par défaut</option>{(options.priorites || []).map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}</Form.Select></Form.Group></>}
          {kind === "canal" && <Form.Check type="checkbox" label="Canal « Autre »" checked={form.est_autre} onChange={(event) => setForm((previous) => ({ ...previous, est_autre: event.target.checked }))} />}
          {kind === "departement" && <Form.Group><Form.Label>Photo optionnelle</Form.Label><Form.Control type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setForm((previous) => ({ ...previous, photo: event.target.files?.[0] || null }))} /></Form.Group>}
          <div className="reclamation-lookup-form-actions"><Button type="submit" className="app-primary-button" disabled={saving}>{editing ? "Mettre à jour" : <><FontAwesomeIcon icon={faPlus} /> Ajouter</>}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Annuler la modification</Button>}</div>
        </Form>

        {loading ? <div className="reclamation-manager-state"><Spinner size="sm" /> Chargement…</div> : loadError ? <div className="reclamation-manager-state is-error">{loadError}<button type="button" className="app-secondary-button" onClick={load}>Réessayer</button></div> : (
          <div className="reclamation-manager-table"><Table responsive hover><thead><tr><th>Nom</th>{kind === "type" && <><th>Département suggéré</th><th>Priorité</th></>}{kind === "canal" && <th>Autre</th>}{kind === "departement" && <th>Photo</th>}<th>Statut</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.nom}</td>{kind === "type" && <><td>{departmentName(row)}</td><td>{(options.priorites || []).find((item) => item.value === row.priorite_par_defaut)?.label || "—"}</td></>}{kind === "canal" && <td>{row.est_autre ? "Oui" : "Non"}</td>}{kind === "departement" && <td>{row.photo ? <img className="reclamation-department-photo" src={`${STORAGE_URL}/${String(row.photo).replace(/^\/+|^storage\//g, "")}`} alt="" /> : "—"}</td>}<td><span className={`reclamation-lookup-state ${row.actif ? "is-active" : "is-inactive"}`}>{row.actif ? "Actif" : "Inactif"}</span></td><td><div className="app-table-actions"><button type="button" className="reclamation-manager-action" onClick={() => edit(row)} title="Modifier"><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button><button type="button" className="reclamation-active-toggle" onClick={() => toggle(row)} disabled={changingId === row.id}>{row.actif ? "Désactiver" : "Activer"}</button></div></td></tr>)}</tbody></Table></div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ReclamationLookupManager;
