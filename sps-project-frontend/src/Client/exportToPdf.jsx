import React from "react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf"; // Import jsPDF library
import "jspdf-autotable";

const exportToPdf = (clients, selectedItems) => {
  console.log("idc", selectedItems);
  if (
    !clients ||
    clients.length === 0 ||
    !selectedItems ||
    selectedItems.length === 0
  ) {
    alert("No data to export!");
    return;
  }

  const pdf = new jsPDF();

  // Add heading
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(
    "LISTE CLIENTS",
    pdf.internal.pageSize.width / 2,
    15,
    null,
    null,
    "center"
  );

  // Define the columns for the table
  const columns = [
    { title: "Raison Sociale", dataKey: "raison_sociale" },
    { title: "Abréviation", dataKey: "abreviation" },
    { title: "Adresse", dataKey: "adresse" },
    { title: "Téléphone", dataKey: "tele" },
    { title: "Ville", dataKey: "ville" },
    { title: "Code Postal", dataKey: "code_postal" },
    { title: "ICE", dataKey: "ice" },
    { title: "Zone", dataKey: "zone" },
  ];

  // Filter selected clients data
  const selectedClientsData = clients.filter((client) =>
    selectedItems.some((selected) => selected.id === client.id)
  );

  // Convert data to array of objects
  const rows = selectedClientsData.map((client) => ({
    raison_sociale: client.raison_sociale,
    abreviation: client.abreviation,
    adresse: client.adresse,
    tele: client.tele,
    ville: client.ville,
    code_postal: client.code_postal,
    ice: client.ice,
    zone: client.zone.zone,
  }));

  // Set the margin and padding
  const margin = 5;
  const padding = 5;

  // Calculate the width of the columns
  const columnWidths = columns.map(
    (col) => pdf.getStringUnitWidth(col.title) * 5 + padding * 2
  );
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0);

  // Set the table position
  const startX = (pdf.internal.pageSize.width - tableWidth) / 2;
  const startY = 25; // Adjust as needed

  // Add the table
  pdf.autoTable({
    columns,
    body: rows,
    theme: "grid",
    startY,
    startX, // Center the table horizontally
    styles: {
      overflow: "linebreak",
      columnWidth: "wrap",
      fontSize: 8,
    },
    headerStyles: {
      fillColor: [96, 96, 96],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 20 },
  });

  // Save the PDF
  pdf.save("clients.pdf");
};

const ExportPdfButton = ({ clients, selectedItems }) => {
  const isDisabled = !selectedItems || selectedItems.length === 0;
  return (
    <FontAwesomeIcon
      style={{
        cursor: "pointer",
        color: "red",
        fontSize: "2rem",
        marginLeft: "15px",
      }}
      disabled={isDisabled}
      onClick={() => exportToPdf(clients, selectedItems)}
      icon={faFilePdf}
    />
  );
};

export default ExportPdfButton;
