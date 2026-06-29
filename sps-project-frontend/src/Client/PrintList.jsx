import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint } from "@fortawesome/free-solid-svg-icons";

const PrintList = ({ tableId, title, clientList, filteredclients }) => {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "");

    if (printWindow) {
      const tableToPrint = document.getElementById(tableId);
      if (tableToPrint) {
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
                color:black
              }
              .table-header {
                background-color: #fff;
                color: #fff;
              }
              .content-wrapper {
                margin-bottom: 100px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="page-header print-no-date m-2">${title}</div>
              <div class="content-wrapper">
                <table>
                  <thead>
                    <tr class="table-header">
                      <th>Raison Sociale</th>
                      <th>Abreviation</th>
                      <th>Adresse</th>
                      <th>Téléphone</th>
                      <th>Ville</th>
                      <th>Code Postal</th>
                      <th>ICE</th>
                      <th>Zone</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredclients.map((client) => `
                      <tr key=${client.id}>
                        <td>${client.raison_sociale}</td>
                        <td>${client.abreviation ||''}</td>
                        <td>${client.adresse ||''}</td>
                        <td>${client.tele ||''}</td>
                        <td>${client.ville ||''}</td>
                        <td>${client.code_postal ||''}</td>
                        <td>${client.ice ||''}</td>
                        <td>${client.zone.zone ||''}</td>
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
        console.error(`Table with ID '${tableId}' not found.`);
      }
    } else {
      console.error("Error opening print window.");
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