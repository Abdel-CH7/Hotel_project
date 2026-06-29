import React from "react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf"; // Import jsPDF library
import "jspdf-autotable";

const exportToPdf = (fournisseurs, selectedItems) => {
  console.log("idc", selectedItems);
  if (
    !fournisseurs ||
    fournisseurs.length === 0 ||
    !selectedItems ||
    selectedItems.length === 0
  ) {
    alert("No data to export!");
    return;
  }

  // Map selectedItems to the corresponding fournisseurs
  const selectedfournisseursData = fournisseurs.filter((fournisseur) =>
    selectedItems.includes(fournisseur.id)
  );

  if (!selectedfournisseursData || selectedfournisseursData.length === 0) {
    alert("No selected data to export!");
    return;
  }

  const pdf = new jsPDF();

  // Add heading
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(
    "Liste fournisseurs",
    pdf.internal.pageSize.width / 2,
    15,
    null,
    null,
    "center"
  );

  // Define the columns for the table
  const columns = [
    { title: "CodeFournisseur", dataKey: "CodeFournisseur" },
    { title: "raison_sociale", dataKey: "raison_sociale" },
    { title: "abreviation", dataKey: "abreviation" },
    { title: "adresse", dataKey: "adresse" },
    { title: "tele", dataKey: "tele" },
    { title: "ice", dataKey: "ice" },
    { title: "code_postal", dataKey: "code_postal" },
    { title: "ville", dataKey: "ville" },
  ];

  // Convert data to array of objects
  const rows = selectedfournisseursData.map((fournisseur) => ({
    CodeFournisseur: fournisseur.CodeFournisseur,
    raison_sociale: fournisseur.raison_sociale,
    abreviation: fournisseur.abreviation,
    adresse: fournisseur.adresse,
    tele: fournisseur.tele,
    ice: fournisseur.ice,
    code_postal: fournisseur.code_postal,
    ville: fournisseur.ville,
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
  pdf.save("fournisseurs.pdf");
};

const ExportPdfButton = ({ fournisseurs, selectedItems }) => {
  const isDisabled = !selectedItems || selectedItems.length === 0;

  return (
    <FontAwesomeIcon
      disabled={isDisabled}
      onClick={() => exportToPdf(fournisseurs, selectedItems)}
      icon={faFilePdf}
      style={{
        cursor: "pointer",
        color: "red",
        fontSize: "2rem",
        marginLeft: "15px",

      }}
    />
  );
};

export default ExportPdfButton;
