import React from "react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf"; // Import jsPDF library
import "jspdf-autotable";

const ExportPdfCommande = (commandes, selectedItems) => {
  console.log("idc", selectedItems);
  if (
    !commandes ||
    commandes.length === 0 ||
    !selectedItems ||
    selectedItems.length === 0
  ) {
    alert("No data to export!");
    return;
  }

  // Map selectedItems to the corresponding chargementCommandes
  const selectedCommandesData = commandes.filter((Commande) =>
    selectedItems.includes(Commande.id)
  );

  if (!selectedCommandesData || selectedCommandesData.length === 0) {
    alert("No selected data to export!");
    return;
  }

  const pdf = new jsPDF();

  // Add heading
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(
    "Liste Commandes",
    pdf.internal.pageSize.width / 2,
    15,
    null,
    null,
    "center"
  );

  // Define the columns for the table
  const columns = [
    { title: "reference", dataKey: "reference" },
    { title: "client_id", dataKey: "client_id" },
    { title: "site_id", dataKey: "site_id" },
    { title: "mode_payement", dataKey: "mode_payement" },
    { title: "dateCommande", dataKey: "dateCommande" },
  ];

  // Convert data to array of objects
  const rows = selectedCommandesData.map((Commande) => ({
    reference: Commande.reference,
    client: Commande.client.raison_sociale,
    site: Commande.site_id,
    mode_payement: Commande.mode_payement,
    dateCommande: Commande.dateCommande,
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
  pdf.save("Commandes.pdf");
};

const ExportPdfButton = ({ commandes, selectedItems }) => {
  const isDisabled = !selectedItems || selectedItems.length === 0;

  return (
    <FontAwesomeIcon
      disabled={isDisabled}
      onClick={() => ExportPdfCommande(commandes, selectedItems)}
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
