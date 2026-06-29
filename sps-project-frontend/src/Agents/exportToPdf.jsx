import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf"; // Import jsPDF library
import "jspdf-autotable";

// Fonction pour vérifier si une chaîne est une URL d'image valide
const isValidImageUrl = (url) => {
  return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
};

const exportToPdf = (equipements, selectedItems) => {
  if (
    !equipements ||
    equipements.length === 0 ||
    !selectedItems ||
    selectedItems.length === 0
  ) {
    alert("No data to export!");
    return;
  }

  // Map selectedItems to the corresponding equipements
  const selectedEquipementsData = equipements.filter((equipement) =>
    selectedItems.includes(equipement.id)
  );

  if (!selectedEquipementsData || selectedEquipementsData.length === 0) {
    alert("No selected data to export!");
    return;
  }

  const pdf = new jsPDF();

  // Add heading
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(
    "Liste des Équipements",
    pdf.internal.pageSize.width / 2,
    15,
    null,
    null,
    "center"
  );

  // Define the columns for the table
  const columns = [
    { title: "Désignation", dataKey: "designation" },
    { title: "Référence", dataKey: "reference" },
    { title: "Fiche Technique", dataKey: "fiche_technique" },
    { title: "Mode Opératoire", dataKey: "mode_operatoire" },
    { title: "Photo", dataKey: "photo" },
  ];

  // Convert data to array of objects
  const rows = selectedEquipementsData.map((equipement) => {
    // Si vous avez une URL pour la photo, vous pouvez l'ajouter ici
    const photoUrl = equipement.photo; // L'URL de la photo
    const ficheTechnique = equipement.fiche_technique; // Lien complet pour Fiche Technique
    const modeOperatoire = equipement.mode_operatoire; // Lien complet pour Mode Opératoire

    return {
      designation: equipement.designation,
      reference: equipement.reference,
      fiche_technique: ficheTechnique,
      mode_operatoire: modeOperatoire,
      photo: photoUrl, // Lien de la photo
    };
  });

  // Add the table
  pdf.autoTable({
    columns,
    body: rows,
    theme: "grid",
    startY: 25, // Adjust as needed
    margin: { top: 30, left: 20, right: 20, bottom: 20 }, // Custom margins
    styles: {
      overflow: "linebreak", // Allow text to break into multiple lines
      columnWidth: "wrap", // Enable auto-wrap in columns
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
    columnStyles: {
      mode_operatoire: { cellWidth: 'auto' }, // Allow long text to wrap in this column
      fiche_technique: { cellWidth: 'auto' }, // Allow long text to wrap in this column
      photo: { cellWidth: 30 }, // Adjust the size for the photo column
    },
  });

  // Maintenant, ajoutons l'image dans le PDF
  selectedEquipementsData.forEach((equipement, index) => {
    const photoUrl = equipement.photo;
    if (photoUrl && isValidImageUrl(photoUrl)) {
      // Ajouter l'image si l'URL est valide
      pdf.addImage(photoUrl, "JPEG", 20, 50 + index * 40, 30, 30); // Ajustez la taille et la position selon vos besoins
    }
  });

  // Save the PDF
  pdf.save("equipements.pdf");
};

const ExportPdfButton = ({ equipements, selectedItems }) => {
  const isDisabled = !selectedItems || selectedItems.length === 0;

  return (
    <FontAwesomeIcon
      disabled={isDisabled}
      onClick={() => exportToPdf(equipements, selectedItems)}
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
