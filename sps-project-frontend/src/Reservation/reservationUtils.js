export const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`
    : "-";
};

export const formatDate = (value) => {
  if (!value) return "-";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

export const statusLabel = (status) => ({
  "en attente": "En attente",
  "confirmé": "Confirmé",
  "annulé": "Annulé",
}[status] || status || "-");

export const statusClass = (status) => ({
  "en attente": "is-warning",
  "confirmé": "is-success",
  "annulé": "is-danger",
}[status] || "is-neutral");

export const clientName = (reservation) => reservation?.client?.display_name || "Client indisponible";

export const clientTypeLabel = (reservation) => reservation?.client?.type_label || ({
  societe: "Société",
  particulier: "Particulier",
}[reservation?.client?.type] || "-");

export const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
}[character]));

export const isReservationEditable = (reservation) => {
  const today = new Date().toISOString().slice(0, 10);
  return reservation?.status !== "annulé" && Boolean(reservation?.dates?.fin && reservation.dates.fin > today);
};
