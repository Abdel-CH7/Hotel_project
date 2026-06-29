import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint } from "@fortawesome/free-solid-svg-icons";

const PrintList = ({ tableId, title, filteredEquipements }) => {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "");

    if (printWindow) {
      const newWindowDocument = printWindow.document;
      newWindowDocument.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
            }
            .page-header {
              text-align: center;
              font-size: 24px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              font-weight: bold;
              text-align: center;
              color: black;
            }
            .table-header {
              background-color: #007bff;
              color: #fff;
            }
            .content-wrapper {
              margin-bottom: 100px;
            }
            img {
              width: 100px;
              height: 100px;
              object-fit: cover;
            }
            .long-text {
              word-wrap: break-word;
              white-space: normal;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="page-header">${title}</div>
            <div class="content-wrapper">
              <table id="${tableId}">
                <thead>
                  <tr class="table-header">
                    <th>Désignation</th>
                    <th>Réference</th>
                    <th>Fiche Technique</th>
                    <th>Mode Operatoire</th>
                    <th>Photo</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredEquipements.map((equipement) => `
                    <tr>
                      <td class="long-text">${equipement.designation}</td>
                      <td class="long-text">${equipement.reference}</td>
                      <td class="long-text">
                        <a href="${equipement.fiche_technique}" target="_blank">${equipement.fiche_technique}</a>
                      </td>
                      <td class="long-text">
                        <a href="${equipement.mode_operatoire}" target="_blank">${equipement.mode_operatoire}</a>
                      </td>
                      <td>
                        <img src="http://localhost:8000/storage/equipements/${equipement.photo}" alt="Photo de l'équipement" />
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.onafterprint = function () {
                window.close();
              };
            }, 1000);
          </script>
        </body>
        </html>
      `);

      newWindowDocument.close();
    } else {
      console.error("Erreur lors de l'ouverture de la fenêtre d'impression.");
    }
  };

  return (
    <FontAwesomeIcon
      style={{
        cursor: "pointer",
        color: "grey",
        fontSize: "2rem",
      }}
      onClick={handlePrint}
      icon={faPrint}
      className="me-2"
    />
  );
};

export default PrintList;
