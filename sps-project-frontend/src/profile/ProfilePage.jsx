import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import { useAuth } from "../AuthContext";
import { useOpen } from "../Acceuil/OpenProvider";
import UserAvatar from "../components/UserAvatar";
import RequiredLabel from "../components/RequiredLabel";
import { removeProfilePhoto, updateProfile, updateProfilePassword, uploadProfilePhoto } from "./profileApi";
import "../style.css";

const fieldError = (errors, name) => Array.isArray(errors?.[name]) ? errors[name][0] : errors?.[name] || "";
const requestMessage = (error, fallback) => error?.response?.data?.message || fallback;

const ProfilePage = () => {
  const { dynamicStyles } = useOpen();
  const { user, refreshUser, logout } = useAuth();
  const [details, setDetails] = useState({ name: user?.name || "", email: user?.email || "" });
  const [detailsErrors, setDetailsErrors] = useState({});
  const [passwords, setPasswords] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  useEffect(() => {
    setDetails({ name: user?.name || "", email: user?.email || "" });
  }, [user?.email, user?.name]);

  const previewUrl = useMemo(() => photo ? URL.createObjectURL(photo) : "", [photo]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const submitDetails = async (event) => {
    event.preventDefault();
    if (savingDetails) return;
    setSavingDetails(true);
    setDetailsErrors({});
    try {
      const response = await updateProfile(details);
      await refreshUser();
      await Swal.fire({ icon: "success", title: "Succès", text: response.message });
    } catch (error) {
      if (error.response?.status === 422) setDetailsErrors(error.response.data.errors || {});
      else await Swal.fire({ icon: "error", title: "Erreur", text: requestMessage(error, "Impossible de mettre à jour votre profil.") });
    } finally {
      setSavingDetails(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (savingPassword) return;
    setSavingPassword(true);
    setPasswordErrors({});
    try {
      const response = await updateProfilePassword(passwords);
      setPasswords({ current_password: "", password: "", password_confirmation: "" });
      if (response.session_preserved) {
        await refreshUser();
        await Swal.fire({ icon: "success", title: "Succès", text: response.message });
      } else {
        await Swal.fire({ icon: "success", title: "Mot de passe modifié", text: response.message });
        await logout();
      }
    } catch (error) {
      if (error.response?.status === 422) setPasswordErrors(error.response.data.errors || {});
      else await Swal.fire({ icon: "error", title: "Erreur", text: requestMessage(error, "Impossible de modifier votre mot de passe.") });
    } finally {
      setSavingPassword(false);
    }
  };

  const selectPhoto = (event) => {
    const selected = event.target.files?.[0] || null;
    setPhotoError("");
    if (selected && selected.size > 2 * 1024 * 1024) {
      setPhoto(null);
      setPhotoError("La photo ne doit pas dépasser 2 Mo.");
      return;
    }
    setPhoto(selected);
  };

  const submitPhoto = async () => {
    if (!photo || savingPhoto) return;
    setSavingPhoto(true);
    setPhotoError("");
    try {
      const response = await uploadProfilePhoto(photo);
      setPhoto(null);
      await refreshUser();
      await Swal.fire({ icon: "success", title: "Succès", text: response.message });
    } catch (error) {
      const validation = error.response?.data?.errors?.photo;
      if (error.response?.status === 422) setPhotoError(Array.isArray(validation) ? validation[0] : validation || "Photo invalide.");
      else await Swal.fire({ icon: "error", title: "Erreur", text: requestMessage(error, "Impossible de mettre à jour la photo.") });
    } finally {
      setSavingPhoto(false);
    }
  };

  const deletePhoto = async () => {
    if (savingPhoto) return;
    const confirmation = await Swal.fire({ icon: "question", title: "Supprimer la photo ?", showCancelButton: true, confirmButtonText: "Supprimer", cancelButtonText: "Annuler" });
    if (!confirmation.isConfirmed) return;
    setSavingPhoto(true);
    try {
      const response = await removeProfilePhoto();
      await refreshUser();
      await Swal.fire({ icon: "success", title: "Succès", text: response.message });
    } catch (error) {
      await Swal.fire({ icon: "error", title: "Erreur", text: requestMessage(error, "Impossible de supprimer la photo.") });
    } finally {
      setSavingPhoto(false);
    }
  };

  const updatePasswordField = ({ target: { name, value } }) => {
    setPasswords((previous) => ({ ...previous, [name]: value }));
    setPasswordErrors((previous) => ({ ...previous, [name]: "" }));
  };

  return (
    <Box sx={{ ...dynamicStyles, width: "auto", maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
      <Box component="main" className="app-page profile-page" sx={{ p: 3, width: "100%", maxWidth: "100%", minWidth: 0 }}>
        <header className="app-page-header user-page-heading"><div><h1>Mon profil</h1><p>Gérez vos informations personnelles et la sécurité de votre compte.</p></div></header>

        <div className="profile-layout">
          <section className="app-card profile-section profile-photo-section">
            <h2>Photo</h2>
            <div className="profile-photo-preview">
              {previewUrl ? <img src={previewUrl} alt="Aperçu de la nouvelle photo" /> : <UserAvatar user={user} size={96} />}
            </div>
            <Form.Group controlId="profile-photo">
              <Form.Label className="app-secondary-button profile-file-label">Choisir une photo</Form.Label>
              <Form.Control className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} disabled={savingPhoto} />
            </Form.Group>
            <small>JPEG, PNG ou WebP. Taille maximale : 2 Mo.</small>
            {photoError && <Alert variant="danger" className="mt-2 mb-0">{photoError}</Alert>}
            <div className="profile-photo-actions">
              {photo && <Button type="button" className="app-primary-button" onClick={submitPhoto} disabled={savingPhoto}>{savingPhoto && <Spinner size="sm" className="me-2" />}Enregistrer la photo</Button>}
              {user?.photo_url && <Button type="button" variant="outline-danger" onClick={deletePhoto} disabled={savingPhoto}>Supprimer la photo</Button>}
            </div>
          </section>

          <section className="app-card profile-section">
            <h2>Informations personnelles</h2>
            <Form onSubmit={submitDetails}>
              <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
              <Form.Group className="mb-3"><Form.Label><RequiredLabel required>Nom complet</RequiredLabel></Form.Label><Form.Control name="name" value={details.name} onChange={(event) => { setDetails((previous) => ({ ...previous, name: event.target.value })); setDetailsErrors((previous) => ({ ...previous, name: "" })); }} isInvalid={Boolean(fieldError(detailsErrors, "name"))} disabled={savingDetails} aria-required="true" /><Form.Control.Feedback type="invalid">{fieldError(detailsErrors, "name")}</Form.Control.Feedback></Form.Group>
              <Form.Group className="mb-3"><Form.Label><RequiredLabel required>Email</RequiredLabel></Form.Label><Form.Control type="email" name="email" value={details.email} onChange={(event) => { setDetails((previous) => ({ ...previous, email: event.target.value })); setDetailsErrors((previous) => ({ ...previous, email: "" })); }} isInvalid={Boolean(fieldError(detailsErrors, "email"))} disabled={savingDetails} aria-required="true" /><Form.Control.Feedback type="invalid">{fieldError(detailsErrors, "email")}</Form.Control.Feedback></Form.Group>
              <div className="profile-readonly-grid"><div><span>Rôle</span><strong>{user?.role_label || "—"}</strong></div><div><span>Statut</span><strong>{user?.is_active ? "Actif" : "Inactif"}</strong></div></div>
              <Button type="submit" className="app-primary-button" disabled={savingDetails}>{savingDetails && <Spinner size="sm" className="me-2" />}Enregistrer les modifications</Button>
            </Form>
          </section>

          <section className="app-card profile-section profile-security-section">
            <h2>Sécurité</h2>
            <Form onSubmit={submitPassword}>
              <p className="app-required-note"><span className="app-required-mark" aria-hidden="true">*</span> Champs obligatoires</p>
              <Form.Group className="mb-3"><Form.Label><RequiredLabel required>Mot de passe actuel</RequiredLabel></Form.Label><Form.Control type="password" name="current_password" autoComplete="current-password" value={passwords.current_password} onChange={updatePasswordField} isInvalid={Boolean(fieldError(passwordErrors, "current_password"))} disabled={savingPassword} aria-required="true" /><Form.Control.Feedback type="invalid">{fieldError(passwordErrors, "current_password")}</Form.Control.Feedback></Form.Group>
              <Form.Group className="mb-3"><Form.Label><RequiredLabel required>Nouveau mot de passe</RequiredLabel></Form.Label><Form.Control type="password" name="password" autoComplete="new-password" value={passwords.password} onChange={updatePasswordField} isInvalid={Boolean(fieldError(passwordErrors, "password"))} disabled={savingPassword} aria-required="true" /><Form.Control.Feedback type="invalid">{fieldError(passwordErrors, "password")}</Form.Control.Feedback></Form.Group>
              <Form.Group className="mb-3"><Form.Label><RequiredLabel required>Confirmation du nouveau mot de passe</RequiredLabel></Form.Label><Form.Control type="password" name="password_confirmation" autoComplete="new-password" value={passwords.password_confirmation} onChange={updatePasswordField} disabled={savingPassword} aria-required="true" /></Form.Group>
              <Button type="submit" className="app-primary-button" disabled={savingPassword}>{savingPassword && <Spinner size="sm" className="me-2" />}Modifier le mot de passe</Button>
            </Form>
          </section>
        </div>
      </Box>
    </Box>
  );
};

export default ProfilePage;
