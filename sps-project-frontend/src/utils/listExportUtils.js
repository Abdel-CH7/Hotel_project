import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const normalizeColumns = (rows, columns) => columns?.length ? columns : Object.keys(rows[0] || {}).map((key) => ({ key, label: key }));
const displayValue = (value) => value === null || value === undefined ? "" : typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value);
const normalizePdfText = (value) => displayValue(value).replace(/[\u00A0\u202F]/g, " ");
const escapeHtml = (value) => displayValue(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const generationLabel = () => new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
}).format(new Date());

const resolveColumnWidths = (columns, widths = {}) => {
  const values = columns.map((column) => Number(widths[column.key]) || 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => `${((value / total) * 100).toFixed(2)}%`);
};

export const exportToExcel = ({ rows, columns, sheetName, filename }) => {
  const finalColumns = normalizeColumns(rows, columns);
  const exportRows = rows.map((row) => Object.fromEntries(finalColumns.map((column) => [column.label, displayValue(row[column.key])])));
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

export const exportToPdf = ({
  rows,
  columns,
  title,
  filename,
  orientation = "landscape",
  columnWidths = {},
  nowrapColumns = [],
}) => {
  const finalColumns = normalizeColumns(rows, columns);
  const document = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pdfColumnStyles = Object.fromEntries(finalColumns.map((column, index) => [
    index,
    {
      ...(columnWidths[column.key] ? { cellWidth: columnWidths[column.key] } : {}),
      overflow: "linebreak",
    },
  ]));

  document.setFontSize(12);
  document.text(normalizePdfText(title), 8, 10);
  document.setFontSize(7.5);
  document.setTextColor(100);
  document.text(`Généré le ${generationLabel()}`, 8, 15);
  document.setTextColor(0);
  document.autoTable({
    startY: 19,
    head: [finalColumns.map((column) => normalizePdfText(column.label))],
    body: rows.map((row) => finalColumns.map((column) => normalizePdfText(row[column.key]))),
    margin: { top: 19, right: 6, bottom: 8, left: 6 },
    showHead: "everyPage",
    rowPageBreak: "avoid",
    styles: {
      fontSize: 7.5,
      cellPadding: 1.15,
      overflow: "linebreak",
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [203, 213, 225],
    },
    headStyles: {
      fillColor: [0, 175, 170],
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: "bold",
      valign: "middle",
    },
    columnStyles: pdfColumnStyles,
  });
  document.save(filename);
};

export const printRows = ({
  rows,
  columns,
  title,
  orientation = "portrait",
  columnWidths = {},
  nowrapColumns = [],
}) => {
  const finalColumns = normalizeColumns(rows, columns);
  const printWindow = window.open("", "_blank", "width=1100,height=750");
  if (!printWindow) return;
  const widths = resolveColumnWidths(finalColumns, columnWidths);
  const colgroup = widths.map((width) => `<col style="width:${width}">`).join("");
  const headers = finalColumns.map((column) => `<th class="${nowrapColumns.includes(column.key) ? "is-nowrap" : ""}">${escapeHtml(column.label)}</th>`).join("");
  const body = rows.map((row) => `<tr>${finalColumns.map((column) => `<td class="${nowrapColumns.includes(column.key) ? "is-nowrap" : ""}">${escapeHtml(row[column.key])}</td>`).join("")}</tr>`).join("");
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>@page{size:A4 ${orientation};margin:8mm}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111827}h1{margin:0 0 2mm;font-size:15px}.print-meta{margin:0 0 3mm;color:#64748b;font-size:8px}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7.75px;line-height:1.25}thead{display:table-header-group}tfoot{display:table-footer-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{border:0.25mm solid #cbd5e1;padding:1.2mm 1mm;text-align:left;vertical-align:middle;white-space:normal;word-break:normal;overflow-wrap:break-word}th{background:#00afaa!important;color:#fff!important;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}.is-nowrap{white-space:nowrap;word-break:keep-all;overflow-wrap:normal}</style></head><body><h1>${escapeHtml(title)}</h1><p class="print-meta">Généré le ${escapeHtml(generationLabel())}</p><table><colgroup>${colgroup}</colgroup><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
