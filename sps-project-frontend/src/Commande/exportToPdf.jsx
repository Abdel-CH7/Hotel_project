import React from "react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf"; // Import jsPDF library
import "jspdf-autotable";

const exportToPdf = (chargementCommandes, selectedItems) => {
  console.log("idc", selectedItems);
  if (
    !chargementCommandes ||
    chargementCommandes.length === 0 ||
    !selectedItems ||
    selectedItems.length === 0
  ) {
    alert("No data to export!");
    return;
  }

  // Map selectedItems to the corresponding chargementCommandes
  const selectedchargementCommandesData = chargementCommandes.filter(
    (chargementCommande) => selectedItems.includes(chargementCommande.id)
  );

  if (
    !selectedchargementCommandesData ||
    selectedchargementCommandesData.length === 0
  ) {
    alert("No selected data to export!");
    return;
  }

  const pdf = new jsPDF();

  // Add heading
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(
    "Liste chargementCommandes",
    pdf.internal.pageSize.width / 2,
    15,
    null,
    null,
    "center"
  );

  // Define the columns for the table
  const columns = [
    { title: "vehicule_id", dataKey: "vehicule_id" },
    { title: "livreur_id", dataKey: "livreur_id" },
    { title: "commande_id", dataKey: "commande_id" },
    { title: "dateLivraisonPrevue", dataKey: "dateLivraisonPrevue" },
    { title: "dateLivraisonReelle", dataKey: "dateLivraisonReelle" },
  ];

  // Convert data to array of objects
  const rows = selectedchargementCommandesData.map((chargementCommande) => ({
    vehicule_id: chargementCommande.vehicule.matricule,
    livreur_id: chargementCommande.livreur.nom,
    commande_id: chargementCommande.commande.reference,
    dateLivraisonPrevue: chargementCommande.dateLivraisonPrevue,
    dateLivraisonReelle: chargementCommande.dateLivraisonReelle,
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
  pdf.save("chargementCommandes.pdf");
};

const ExportPdfButton = ({ chargementCommandes, selectedItems }) => {
  const isDisabled = !selectedItems || selectedItems.length === 0;

  return (
    <FontAwesomeIcon
      disabled={isDisabled}
      onClick={() => exportToPdf(chargementCommandes, selectedItems)}
      icon={faFilePdf}
      style={{
        cursor: "pointer",
        color: "red",
        fontSize: "2rem",
        marginLeft: "15px",

      }}    />
  );
};

export default ExportPdfButton;
