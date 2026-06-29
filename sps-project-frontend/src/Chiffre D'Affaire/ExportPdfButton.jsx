import React from 'react';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf"; // Import jsPDF library
import "jspdf-autotable";

const exportToPdf = (chiffreaffaires, selectedItems) => {
    console.log("idc", selectedItems);
    if (!chiffreaffaires || chiffreaffaires.length === 0 || !selectedItems || selectedItems.length === 0) {
        alert("No data to export!");
        return;
    }

    // Map selectedItems to the corresponding chiffre d'affaire
    const selectedchiffreaffairesData = chiffreaffaires.filter(chiffreaffaire => selectedItems.includes(chiffreaffaire.id));

    if (!selectedchiffreaffairesData || selectedchiffreaffairesData.length === 0) {
        alert("No selected data to export!");
        return;
    }

    const pdf = new jsPDF();

    // Add heading
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Liste chiffre d'affaire", pdf.internal.pageSize.width / 2, 15, null, null, "center");

    // Define the columns for the table
    const columns = [
        { title: "Client", dataKey: "client_id" },
        { title: "Numéro de Facture", dataKey: "numero_facture" },
        { title: "Date de Facture", dataKey: "date_facture" },
        { title: "Montant de Facture ", dataKey: "montant_facture" },



    ];

    // Convert data to array of objects
    const rows = selectedchiffreaffairesData.map((chiffreaffaire) => ({
        client_id: chiffreaffaire.client_id,
        numero_facture: chiffreaffaire.numero_facture,
        date_facture: chiffreaffaire.date_facture,
        montant_facture: chiffreaffaire.montant_facture,



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
    pdf.save(".pdf");
};


const ExportPdfButton = ({ chiffreaffaires, selectedItems }) => {
    const isDisabled = !selectedItems || selectedItems.length === 0;

    return (
       
            <FontAwesomeIcon icon={faFilePdf} 
            style={{
                cursor: "pointer",
                color: "red",
                fontSize: "2rem",
                marginLeft: "10px",

              }}
              onClick={() => exportToPdf(chiffreaffaires, selectedItems)}
            disabled={isDisabled} />
    );
}

export default ExportPdfButton;