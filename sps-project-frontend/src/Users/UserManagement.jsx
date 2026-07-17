import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Modal, Form, Button, Alert, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faKey, faUserCheck, faUserLock, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useAuth } from "../AuthContext";
import { useOpen } from "../Acceuil/OpenProvider";
import ListPagination from "../components/ListPagination";
import ListState from "../components/ListState";
import UserAvatar from "../components/UserAvatar";
import { createUser, listUsers, resetUserPassword, updateUser, updateUserStatus } from "./userApi";
import "../style.css";

const EMPTY_USER_FORM = {
  name: "",
  email: "",
  role: "staff",
  password: "",
  password_confirmation: "",
};

const EMPTY_PASSWORD_FORM = { password: "", password_confirmation: "" };
const fieldError = (errors, name) => Array.isArray(errors?.[name]) ? errors[name][0] : errors?.[name] || "";
const requestMessage = (error, fallback) => error?.response?.data?.message || fallback;

const UserManagement = () => {
  const { dynamicStyles } = useOpen();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editor, setEditor] = useState(undefined);
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showEditorPassword, setShowEditorPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await listUsers({
        page: page + 1,
        per_page: rowsPerPage,
        search: searchTerm.trim() || undefined,
        role: roleFilter || undefined,
        is_active: statusFilter || undefined,
      });
      setUsers(Array.isArray(response.data) ? response.data : []);
      setTotalRows(Number(response.meta?.total || 0));
    } catch (error) {
      setLoadError(requestMessage(error, "Impossible de charger les utilisateurs."));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, roleFilter, searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const openCreate = () => {
    setEditor(null);
    setForm(EMPTY_USER_FORM);
    setFormErrors({});
    setShowEditorPassword(false);
  };

  const openEdit = (user) => {
    setEditor(user);
    setForm({ ...EMPTY_USER_FORM, name: user.name, email: user.email, role: user.role });
    setFormErrors({});
  };

  const closeEditor = () => {
    if (submitting) return;
    setEditor(undefined);
    setFormErrors({});
  };

  const handleFormChange = ({ target: { name, value } }) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setFormErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const submitUser = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormErrors({});
    try {
      const response = editor
        ? await updateUser(editor.id, { name: form.name, email: form.email, role: form.role })
        : await createUser(form);
      setEditor(undefined);
      await Swal.fire({ icon: "success", title: "Succès", text: response.message });
      await loadUsers();
    } catch (error) {
      if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
      else await Swal.fire({ icon: "error", title: "Erreur", text: requestMessage(error, "Impossible d’enregistrer cet utilisateur.") });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (target) => {
    const activating = !target.is_active;
    if (!activating) {
      const confirmation = await Swal.fire({
        icon: "warning",
        title: "Désactiver cet utilisateur ?",
        text: "Il ne pourra plus se connecter et ses sessions actives seront fermées.",
        showCancelButton: true,
        confirmButtonText: "Désactiver",
        cancelButtonText: "Annuler",
      });
      if (!confirmation.isConfirmed) return;
    }

    try {
      const response = await updateUserStatus(target.id, activating);
      await Swal.fire({ icon: "success", title: "Succès", text: response.message });
      await loadUsers();
    } catch (error) {
      await Swal.fire({ icon: "error", title: "Action impossible", text: requestMessage(error, "Impossible de modifier le statut de cet utilisateur.") });
    }
  };

  const openPasswordReset = (target) => {
    setPasswordTarget(target);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordErrors({});
    setShowResetPassword(false);
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setPasswordErrors({});
    try {
      const response = await resetUserPassword(passwordTarget.id, passwordForm);
      setPasswordTarget(null);
      await Swal.fire({ icon: "success", title: "Succès", text: response.message });
    } catch (error) {
      if (error.response?.status === 422) setPasswordErrors(error.response.data.errors || {});
      else await Swal.fire({ icon: "error", title: "Erreur", text: requestMessage(error, "Impossible de réinitialiser le mot de passe.") });
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const title = editor ? "Modifier l’utilisateur" : "Ajouter un utilisateur";
  const hasEditor = editor !== undefined;
  const rows = useMemo(() => users, [users]);

  return (
    <Box sx={{ ...dynamicStyles, width: "auto", maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
      <Box component="main" className="app-page user-management-page" sx={{ p: 3, width: "100%", maxWidth: "100%", minWidth: 0 }}>
        <header className="app-page-header user-page-heading">
          <div>
            <h1>Gestion des utilisateurs</h1>
            <p>Créez et administrez les comptes internes de l’hôtel.</p>
          </div>
          <button type="button" className="app-add-button" onClick={openCreate}>
            <FontAwesomeIcon icon={faUserPlus} /> Ajouter un utilisateur
          </button>
        </header>

        <div className="app-controls-row user-filter-row">
          <input className="form-control app-filter-select user-search-input" type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(0); }} placeholder="Rechercher par nom ou e-mail" aria-label="Rechercher un utilisateur" />
          <div className="app-filter-controls">
            <select className="form-select app-filter-select" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(0); }} aria-label="Filtrer par rôle">
              <option value="">Tous les rôles</option><option value="admin">Administrateur</option><option value="staff">Employé</option>
            </select>
            <select className="form-select app-filter-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(0); }} aria-label="Filtrer par statut">
              <option value="">Tous les statuts</option><option value="1">Actif</option><option value="0">Inactif</option>
            </select>
            <button type="button" className="app-filter-reset" onClick={resetFilters}>Réinitialiser</button>
          </div>
        </div>

        <ListState loading={loading} error={loadError} allRowsCount={totalRows} filteredRowsCount={totalRows} emptyDataMessage="Aucun utilisateur enregistré." onRetry={loadUsers} onResetFilters={resetFilters} />

        {!loading && !loadError && totalRows > 0 && (
          <div className="app-table-wrapper user-table-wrapper">
            <div className="app-table-scroll">
              <table className="app-table user-table">
                <thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr></thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td><div className="user-identity-cell"><UserAvatar user={row} /><strong>{row.name}</strong></div></td>
                      <td>{row.email}</td>
                      <td><span className={`app-status-badge ${row.role === "admin" ? "is-info" : "is-neutral"}`}>{row.role_label}</span></td>
                      <td><span className={`app-status-badge ${row.is_active ? "is-success" : "is-danger"}`}>{row.is_active ? "Actif" : "Inactif"}</span></td>
                      <td>{row.created_at ? new Intl.DateTimeFormat("fr-FR").format(new Date(row.created_at)) : "—"}</td>
                      <td><div className="app-table-actions">
                        <button type="button" className="user-action-button" onClick={() => openEdit(row)} title="Modifier" aria-label={`Modifier ${row.name}`}><FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" /></button>
                        <button type="button" className="user-action-button" disabled={row.id === currentUser?.id} onClick={() => toggleStatus(row)} title={row.is_active ? "Désactiver" : "Activer"} aria-label={`${row.is_active ? "Désactiver" : "Activer"} ${row.name}`}><FontAwesomeIcon icon={row.is_active ? faUserLock : faUserCheck} className={`app-table-action ${row.is_active ? "is-danger" : "is-success"}`} /></button>
                        <button type="button" className="user-action-button" disabled={row.id === currentUser?.id} onClick={() => openPasswordReset(row)} title="Réinitialiser le mot de passe" aria-label={`Réinitialiser le mot de passe de ${row.name}`}><FontAwesomeIcon icon={faKey} className="app-table-action is-warning" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="app-table-footer"><span /><ListPagination page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(0); }} /></div>
          </div>
        )}

        <Modal show={hasEditor} onHide={closeEditor} centered dialogClassName="user-editor-modal">
          <Form onSubmit={submitUser}>
            <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
            <Modal.Body>
              {formErrors.general && <Alert variant="danger">{fieldError(formErrors, "general")}</Alert>}
              <Form.Group className="mb-3"><Form.Label>Nom complet *</Form.Label><Form.Control name="name" value={form.name} onChange={handleFormChange} isInvalid={Boolean(fieldError(formErrors, "name"))} disabled={submitting} /><Form.Control.Feedback type="invalid">{fieldError(formErrors, "name")}</Form.Control.Feedback></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Email *</Form.Label><Form.Control type="email" name="email" value={form.email} onChange={handleFormChange} isInvalid={Boolean(fieldError(formErrors, "email"))} disabled={submitting} /><Form.Control.Feedback type="invalid">{fieldError(formErrors, "email")}</Form.Control.Feedback></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Rôle *</Form.Label><Form.Select name="role" value={form.role} onChange={handleFormChange} isInvalid={Boolean(fieldError(formErrors, "role"))} disabled={submitting || editor?.id === currentUser?.id}><option value="staff">Employé</option><option value="admin">Administrateur</option></Form.Select><Form.Control.Feedback type="invalid">{fieldError(formErrors, "role")}</Form.Control.Feedback></Form.Group>
              {!editor && <>
                <Form.Group className="mb-3"><Form.Label>Mot de passe temporaire *</Form.Label><Form.Control type={showEditorPassword ? "text" : "password"} name="password" autoComplete="new-password" value={form.password} onChange={handleFormChange} isInvalid={Boolean(fieldError(formErrors, "password"))} disabled={submitting} /><Form.Control.Feedback type="invalid">{fieldError(formErrors, "password")}</Form.Control.Feedback></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Confirmation du mot de passe *</Form.Label><Form.Control type={showEditorPassword ? "text" : "password"} name="password_confirmation" autoComplete="new-password" value={form.password_confirmation} onChange={handleFormChange} disabled={submitting} /></Form.Group>
                <Form.Check type="checkbox" label="Afficher les mots de passe" checked={showEditorPassword} onChange={(event) => setShowEditorPassword(event.target.checked)} disabled={submitting} />
              </>}
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={closeEditor} disabled={submitting}>Annuler</Button><Button type="submit" className="app-primary-button" disabled={submitting}>{submitting && <Spinner size="sm" className="me-2" />}Valider</Button></Modal.Footer>
          </Form>
        </Modal>

        <Modal show={Boolean(passwordTarget)} onHide={() => !submitting && setPasswordTarget(null)} centered>
          <Form onSubmit={submitPasswordReset}>
            <Modal.Header closeButton><Modal.Title>Réinitialiser le mot de passe</Modal.Title></Modal.Header>
            <Modal.Body>
              <p className="text-muted">Utilisateur : <strong>{passwordTarget?.name}</strong></p>
              <Form.Group className="mb-3"><Form.Label>Nouveau mot de passe *</Form.Label><Form.Control type={showResetPassword ? "text" : "password"} autoComplete="new-password" value={passwordForm.password} onChange={(event) => { setPasswordForm((previous) => ({ ...previous, password: event.target.value })); setPasswordErrors((previous) => ({ ...previous, password: "" })); }} isInvalid={Boolean(fieldError(passwordErrors, "password"))} disabled={submitting} /><Form.Control.Feedback type="invalid">{fieldError(passwordErrors, "password")}</Form.Control.Feedback></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Confirmation *</Form.Label><Form.Control type={showResetPassword ? "text" : "password"} autoComplete="new-password" value={passwordForm.password_confirmation} onChange={(event) => setPasswordForm((previous) => ({ ...previous, password_confirmation: event.target.value }))} disabled={submitting} /></Form.Group>
              <Form.Check type="checkbox" label="Afficher les mots de passe" checked={showResetPassword} onChange={(event) => setShowResetPassword(event.target.checked)} disabled={submitting} />
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={() => setPasswordTarget(null)} disabled={submitting}>Annuler</Button><Button type="submit" className="app-primary-button" disabled={submitting}>{submitting && <Spinner size="sm" className="me-2" />}Réinitialiser</Button></Modal.Footer>
          </Form>
        </Modal>
      </Box>
    </Box>
  );
};

export default UserManagement;
