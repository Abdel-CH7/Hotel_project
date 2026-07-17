import { formatFrenchDate } from "../utils/textUtils";

export const localDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDate = (value) => formatFrenchDate(value, "—");

export const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

export const apiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

export const apiFieldErrors = (error) => error?.response?.data?.errors || {};

export const statusClass = (status) => {
  if (status === "Résolu") return "is-resolved";
  if (status === "Annulé") return "is-cancelled";
  if (status === "Traité") return "is-treated";
  if (status === "En cours") return "is-progress";
  return "is-pending";
};

export const priorityClass = (priority) => `is-${priority || "normale"}`;

export const eventLabel = (type) => ({
  creation: "Création",
  modification: "Modification",
  affectation: "Affectation",
  changement_statut: "Changement de statut",
  reponse: "Réponse",
  liaison_reservation: "Liaison séjour",
  annulation: "Annulation",
}[type] || "Événement");
