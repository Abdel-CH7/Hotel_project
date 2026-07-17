export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

export const planUsage = (plan) => {
  const state = plan?.usage?.state ?? "unused";
  const labels = {
    draft: "Utilisé dans un brouillon",
    active: "Verrouillé — période active",
    archive: "Verrouillé — historique",
    unused: "Libre",
  };

  return {
    state,
    label: plan?.usage?.label ?? labels[state] ?? labels.unused,
    referenced: plan?.usage?.referenced ?? state !== "unused",
    locked: plan?.usage?.locked ?? ["active", "archive"].includes(state),
  };
};

export const firstBackendMessage = (error, fallback = "Une erreur est survenue.") => {
  const errors = error?.response?.data?.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().find(Boolean);
    if (first) return String(first);
  }

  return error?.response?.data?.message || fallback;
};

export const backendFieldErrors = normalizeBackendFieldErrors;

export const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "-";

  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} DH`
    : "-";
};

export const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
import { normalizeBackendFieldErrors } from "../utils/formValidationUtils";
