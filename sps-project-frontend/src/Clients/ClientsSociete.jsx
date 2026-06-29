import React, { useState, useEffect } from 'react';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useOpen } from "../Acceuil/OpenProvider";
import SearchWithExport from '../components/SearchWithExport';
import DynamicFilter from "../components/DynamicFilter";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './ClientsSociete.css';

const ClientsSociete = () => {
  const { open } = useOpen();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReg, setSelectedReg] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedVille, setSelectedVille] = useState("");

  const exportToExcel = () => {
    try {
      const table = document.getElementById('exportTable');
      if (!table) {
        throw new Error("Table element not found!");
      }
      const workbook = XLSX.utils.table_to_book(table, { sheet: 'Clients Societe' });
      XLSX.writeFile(workbook, 'clients_societe.xlsx');
    } catch (error) {
      setError("Erreur lors de l'exportation Excel: " + error.message);
    }
  };

  const exportToPDF = () => {
    try {
      const table = document.getElementById('exportTable');
      if (!table) {
        throw new Error("Table element not found!");
      }
      const doc = new jsPDF();
      doc.text("Liste des Clients Societe", 14, 16);
      doc.autoTable({
        html: '#exportTable',
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8, overflow: 'linebreak' },
        headStyles: { fillColor: '#00afaa' }
      });
      doc.save("clients_societe.pdf");
    } catch (error) {
      setError("Erreur lors de l'exportation PDF: " + error.message);
    }
  };

  const printTable = () => {
    try {
      const tableElement = document.getElementById('exportTable');
      if (!tableElement) {
        throw new Error("Table element not found!");
      }
      const tableHtml = tableElement.outerHTML;
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) {
        throw new Error("Impossible d'ouvrir la fenêtre d'impression");
      }
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Table</title>
            <style>
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #00afaa; color: #fff; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h2 style="text-align: center; color: #00afaa;">Liste des Clients Societe</h2>
            ${tableHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      setError("Erreur lors de l'impression: " + error.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/clients-societe');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        const data = await response.json();
        setClients(data.clients);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Erreur lors du chargement des données: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (key, value) => {
    if (key === "reg") {
      setSelectedReg(value);
    } else if (key === "zone") {
      setSelectedZone(value);
    } else if (key === "ville") {
      setSelectedVille(value);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.raison_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReg = !selectedReg || client.region === selectedReg;
    const matchesZone = !selectedZone || client.zone === selectedZone;
    const matchesVille = !selectedVille || client.ville === selectedVille;

    return matchesSearch && matchesReg && matchesZone && matchesVille;
  });

  return (
    <div className={`clients-societe-container ${!open ? 'collapsed' : ''}`}>
      <div className="search-export-section">
        <SearchWithExport 
          onSearch={handleSearch}
          exportToExcel={exportToExcel}
          exportToPDF={exportToPDF}
          printTable={printTable}
          Title="Liste des Clients Societe"
        />
      </div>

      <div className="filter-section">
        <DynamicFilter
          filters={[
            {
              label: "Région",
              key: "reg",
              options: [
                { value: "", label: "Toutes" },
                { value: "nord", label: "Nord" },
                { value: "sud", label: "Sud" },
                { value: "est", label: "Est" },
                { value: "ouest", label: "Ouest" },
              ],
            },
            {
              label: "Zone",
              key: "zone",
              options: [
                { value: "", label: "Toutes" },
                { value: "urbaine", label: "Urbaine" },
                { value: "rurale", label: "Rurale" },
              ],
            },
            {
              label: "Ville",
              key: "ville",
              options: [
                { value: "", label: "Toutes" },
                { value: "casablanca", label: "Casablanca" },
                { value: "rabat", label: "Rabat" },
                { value: "marrakech", label: "Marrakech" },
              ],
            }
          ]}
          onFilterChange={handleFilterChange}
          onAddClick={() => {/* Add client logic */}}
          addButtonLabel="Ajouter Client"
        />
      </div>

      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" style={{ color: '#00afaa' }} />
          <p className="mt-2">Chargement des données...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="my-3">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      <div className="table-container">
        <table className="table" id="exportTable">
          <thead>
            <tr>
              <th>
                <Form.Check type="checkbox" />
              </th>
              <th>Logo</th>
              <th>Code</th>
              <th>Raison Sociale</th>
              <th>Abréviation</th>
              <th>Adresse</th>
              <th>Téléphone</th>
              <th>Ville</th>
              <th>Code Postal</th>
              <th>ICE</th>
              <th>Zone</th>
              <th>Région</th>
              <th>Catégorie</th>
              <th>Secteur d'activité</th>
              <th>Séance</th>
              <th>Montant plafond</th>
              <th>Mode de paiement</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <Form.Check type="checkbox" />
                </td>
                <td>{client.logo}</td>
                <td>{client.code}</td>
                <td>{client.raison_sociale}</td>
                <td>{client.abreviation}</td>
                <td>{client.adresse}</td>
                <td>{client.telephone}</td>
                <td>{client.ville}</td>
                <td>{client.code_postal}</td>
                <td>{client.ice}</td>
                <td>{client.zone}</td>
                <td>{client.region}</td>
                <td>{client.categorie}</td>
                <td>{client.secteur_activite}</td>
                <td>{client.seance}</td>
                <td>{client.montant_plafond}</td>
                <td>{client.mode_paiement}</td>
                <td>
                  <div className="action-buttons">
                    <Button variant="warning" size="sm">
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button variant="danger" size="sm">
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsSociete; 