import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  clientName,
  clientTypeLabel,
  escapeHtml,
  formatDate,
  formatMoney,
  paymentStatusLabel,
  statusLabel,
} from "../reservationUtils";

const displayValue = (value, fallback = "—") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const normalizePdfText = (value) => displayValue(value).replace(/[\u00A0\u202F]/g, " ");

const generatedAt = () => new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
}).format(new Date());

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? formatDate(value)
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const safeFilenamePart = (value, fallback) => String(value || fallback)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9_-]+/g, "-")
  .replace(/^-+|-+$/g, "") || fallback;

const reservationNumber = (reservation) => displayValue(reservation?.reservation_num);
const paymentNumber = (payment) => displayValue(payment?.numero);
const paymentStatus = (payment) => payment?.statut_label
  || (payment?.statut === "annule" ? "Annulé" : "Validé");

const reservationRows = (reservation) => [
  ["Numéro de réservation", reservationNumber(reservation)],
  ["Date de réservation", formatDate(reservation?.dates?.reservation)],
  ["Date d’arrivée", formatDate(reservation?.dates?.debut)],
  ["Date de départ", formatDate(reservation?.dates?.fin)],
  ["Statut de la réservation", statusLabel(reservation?.status)],
];

const clientRows = (reservation) => [
  ["Code client", displayValue(reservation?.client?.code)],
  ["Type de client", clientTypeLabel(reservation)],
  ["Nom / raison sociale", clientName(reservation)],
  ["Téléphone", displayValue(reservation?.client?.telephone)],
  ["Email", displayValue(reservation?.client?.email)],
];

const roomRows = (reservation) => (reservation?.chambres || []).map((room) => [
  displayValue(room.num_chambre || room.chambre_id),
  displayValue(room.type_chambre?.nom_snapshot),
  room.adultes === null || room.adultes === undefined
    ? "—"
    : `${room.adultes} adulte(s) · ${room.enfants ?? 0} enfant(s)`,
]);

const financialRows = (reservation) => {
  const summary = reservation?.reglement || {};
  return [
    ["Montant total", formatMoney(summary.total)],
    ["Montant payé", formatMoney(summary.montant_paye)],
    ["Reste à payer", formatMoney(summary.reste_a_payer)],
    ["Statut du règlement", summary.statut_label || paymentStatusLabel(summary.statut)],
    ["Politique de paiement", displayValue(reservation?.politique_paiement?.label)],
    ["Date d’échéance", formatDate(reservation?.echeance?.date || reservation?.politique_paiement?.date_limite_paiement)],
  ];
};

const cancellationText = (payment) => payment?.statut === "annule"
  ? [
      `Motif d’annulation : ${displayValue(payment.annulation?.motif)}`,
      `Date d’annulation : ${formatDateTime(payment.annulation?.at)}`,
      `Annulé par : ${displayValue(payment.annulation?.par?.name)}`,
    ].join("\n")
  : "";

const paymentHistoryRows = (reservation) => (reservation?.paiements || []).map((payment) => [
  paymentNumber(payment),
  formatDate(payment.date),
  displayValue(payment.type_label),
  displayValue(payment.mode?.label),
  displayValue(payment.reference),
  formatMoney(payment.montant),
  [paymentStatus(payment), cancellationText(payment)].filter(Boolean).join("\n"),
  displayValue(payment.created_by?.name),
]);

const receiptRows = (reservation, payment) => [
  ["N° paiement", paymentNumber(payment)],
  ["N° réservation", reservationNumber(reservation)],
  ["Client", clientName(reservation)],
  ["Code client", displayValue(reservation?.client?.code)],
  ["Date du paiement", formatDate(payment?.date)],
  ["Type", displayValue(payment?.type_label)],
  ["Mode", displayValue(payment?.mode?.label)],
  ["Référence", displayValue(payment?.reference)],
  ["Montant", formatMoney(payment?.montant)],
  ["Statut", paymentStatus(payment)],
  ["Saisi par", displayValue(payment?.created_by?.name)],
  ...(payment?.statut === "annule" ? [
    ["Motif d’annulation", displayValue(payment.annulation?.motif)],
    ["Date d’annulation", formatDateTime(payment.annulation?.at)],
    ["Annulé par", displayValue(payment.annulation?.par?.name)],
  ] : []),
];

const addPdfTitle = (document, title, cancelled = false) => {
  document.setFont("helvetica", "bold");
  document.setFontSize(17);
  document.setTextColor(15, 23, 42);
  document.text(normalizePdfText(title), 12, 14);
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.setTextColor(100, 116, 139);
  document.text(normalizePdfText(`Généré le ${generatedAt()}`), 12, 20);
  if (cancelled) {
    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.setTextColor(185, 28, 28);
    document.text("PAIEMENT ANNULÉ", document.internal.pageSize.getWidth() - 12, 14, { align: "right" });
  }
  document.setTextColor(15, 23, 42);
};

const addPdfSection = (document, title, rows, startY) => {
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(11, 77, 84);
  document.text(normalizePdfText(title), 12, startY);
  document.autoTable({
    startY: startY + 3,
    body: rows.map((row) => row.map(normalizePdfText)),
    theme: "grid",
    margin: { left: 12, right: 12 },
    styles: { fontSize: 8, cellPadding: 1.7, lineColor: [203, 213, 225], lineWidth: 0.15 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [71, 85, 105], cellWidth: 46 },
      1: { textColor: [15, 23, 42] },
    },
  });
  return document.lastAutoTable.finalY + 7;
};

const ensurePdfSpace = (document, y, required = 35) => {
  if (y + required <= document.internal.pageSize.getHeight() - 12) return y;
  document.addPage();
  return 14;
};

const addPdfFooter = (document, text, y) => {
  const footerY = ensurePdfSpace(document, y, 10);
  document.setFont("helvetica", "italic");
  document.setFontSize(8);
  document.setTextColor(100, 116, 139);
  document.text(normalizePdfText(text), 12, footerY);
};

const escapedCell = (value) => escapeHtml(displayValue(value)).replace(/\n/g, "<br>");
const infoTableHtml = (rows) => `<table class="info-table"><tbody>${rows.map(([label, value]) => (
  `<tr><th>${escapedCell(label)}</th><td>${escapedCell(value)}</td></tr>`
)).join("")}</tbody></table>`;
const dataTableHtml = (headers, rows) => `<div class="table-scroll"><table><thead><tr>${headers.map((header) => (
  `<th>${escapedCell(header)}</th>`
)).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => (
  `<td>${escapedCell(cell)}</td>`
)).join("")}</tr>`).join("")}</tbody></table></div>`;

const printDocument = ({ title, banner, sections, footer }) => {
  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) return false;
  const content = sections.map((section) => `<section><h2>${escapedCell(section.title)}</h2>${
    section.emptyMessage
      ? `<p>${escapedCell(section.emptyMessage)}</p>`
      : section.headers
        ? dataTableHtml(section.headers, section.rows)
        : infoTableHtml(section.rows)
  }</section>`).join("");
  printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapedCell(title)}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{margin:0;color:#0f172a;font-family:Arial,sans-serif;font-size:11px}header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #00afaa;padding-bottom:8px}h1{margin:0;font-size:20px}h2{margin:16px 0 6px;color:#0b4d54;font-size:13px}.generated{color:#64748b;font-size:9px}.banner{color:#b91c1c;font-size:15px;font-weight:700}table{width:100%;border-collapse:collapse;page-break-inside:auto}tr{page-break-inside:avoid}th,td{border:1px solid #cbd5e1;padding:5px;text-align:left;vertical-align:top;white-space:normal;overflow-wrap:anywhere}.info-table th{width:34%;background:#f8fafc;color:#475569}.table-scroll table{font-size:9px}.table-scroll thead th{background:#00afaa!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}footer{margin-top:18px;border-top:1px solid #cbd5e1;padding-top:8px;color:#64748b;font-size:9px;font-style:italic}</style></head><body><header><div><h1>${escapedCell(title)}</h1><div class="generated">Généré le ${escapedCell(generatedAt())}</div></div>${banner ? `<div class="banner">${escapedCell(banner)}</div>` : ""}</header>${content}<footer>${escapedCell(footer)}</footer></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
};

export const downloadReservationPaymentSummary = (reservation) => {
  const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  addPdfTitle(document, "Récapitulatif de règlement");
  let y = addPdfSection(document, "Réservation", reservationRows(reservation), 27);
  y = addPdfSection(document, "Client", clientRows(reservation), ensurePdfSpace(document, y));

  const rooms = roomRows(reservation);
  y = ensurePdfSpace(document, y, 35);
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(11, 77, 84);
  document.text("Chambres", 12, y);
  document.autoTable({
    startY: y + 3,
    head: [["Numéro", "Type", "Occupation"]],
    body: (rooms.length ? rooms : [["—", "—", "—"]]).map((row) => row.map(normalizePdfText)),
    margin: { left: 12, right: 12 },
    styles: { fontSize: 8, cellPadding: 1.7 },
    headStyles: { fillColor: [0, 175, 170], textColor: [255, 255, 255] },
  });
  y = document.lastAutoTable.finalY + 7;
  y = addPdfSection(document, "Synthèse financière", financialRows(reservation), ensurePdfSpace(document, y));

  const payments = paymentHistoryRows(reservation);
  y = ensurePdfSpace(document, y, 40);
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(11, 77, 84);
  document.text("Historique des paiements", 12, y);
  if (payments.length === 0) {
    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.setTextColor(71, 85, 105);
    document.text("Aucun paiement enregistré.", 12, y + 7);
    y += 14;
  } else {
    document.autoTable({
      startY: y + 3,
      head: [["N° paiement", "Date", "Type", "Mode", "Référence", "Montant", "Statut", "Saisi par"]],
      body: payments.map((row) => row.map(normalizePdfText)),
      margin: { left: 8, right: 8 },
      styles: { fontSize: 6.7, cellPadding: 1.25, overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: [0, 175, 170], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 29 }, 4: { cellWidth: 27 }, 6: { cellWidth: 48 }, 7: { cellWidth: 25 } },
      showHead: "everyPage",
    });
    y = document.lastAutoTable.finalY + 7;
  }
  addPdfFooter(document, "Document récapitulatif — ne constitue pas une facture fiscale.", y);
  document.save(`reglement-${safeFilenamePart(reservation?.reservation_num, "reservation")}.pdf`);
};

export const printReservationPaymentSummary = (reservation) => {
  const payments = paymentHistoryRows(reservation);
  return printDocument({
    title: "Récapitulatif de règlement",
    sections: [
      { title: "Réservation", rows: reservationRows(reservation) },
      { title: "Client", rows: clientRows(reservation) },
      { title: "Chambres", headers: ["Numéro", "Type", "Occupation"], rows: roomRows(reservation) },
      { title: "Synthèse financière", rows: financialRows(reservation) },
      payments.length
        ? { title: "Historique des paiements", headers: ["N° paiement", "Date", "Type", "Mode", "Référence", "Montant", "Statut", "Saisi par"], rows: payments }
        : { title: "Historique des paiements", emptyMessage: "Aucun paiement enregistré." },
    ],
    footer: "Document récapitulatif — ne constitue pas une facture fiscale.",
  });
};

export const downloadPaymentReceipt = (reservation, payment) => {
  const cancelled = payment?.statut === "annule";
  const document = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  addPdfTitle(document, "Reçu de paiement", cancelled);
  const y = addPdfSection(document, "Paiement", receiptRows(reservation, payment), 29);
  addPdfFooter(document, "Ce reçu concerne une saisie de paiement liée à la réservation indiquée.", y);
  document.save(`recu-${safeFilenamePart(payment?.numero, "paiement")}.pdf`);
};

export const printPaymentReceipt = (reservation, payment) => printDocument({
  title: "Reçu de paiement",
  banner: payment?.statut === "annule" ? "PAIEMENT ANNULÉ" : "",
  sections: [{ title: "Paiement", rows: receiptRows(reservation, payment) }],
  footer: "Ce reçu concerne une saisie de paiement liée à la réservation indiquée.",
});
