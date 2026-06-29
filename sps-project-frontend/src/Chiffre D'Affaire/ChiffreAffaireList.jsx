import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button } from "react-bootstrap";
import "../style.css";
import Navigation from "../Acceuil/Navigation";
import Search from "../Acceuil/Search";
import TablePagination from '@mui/material/TablePagination';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faTrash, faFilePdf, faFileExcel, faPrint, faPlus, faMinus, faFilter,} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Toolbar } from "@mui/material";
import {IoIosPersonAdd} from "react-icons/io";
import PrintList from "./PrintList";
import ExportPdfButton from "./ExportPdfButton";
import { useOpen } from "../Acceuil/OpenProvider"; // Importer le hook personnalisé

const ChiffreAffaireList = () => {





    const [clients, setClients] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [filteredChiffreaffaires, setFilteredChiffreaffaires] = useState([]);
    const [factures, setFactures] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [chiffreaffaires, setChiffreaffaires] = useState([]);
    const [user, setUser] = useState({});
    // const [users, setUsers] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    //-------------------edit-----------------------//
    const [editingChiffreaffaire, setEditingChiffreaffaire] = useState(null); // State to hold the chiffreaffaire being edited
    const [editingChiffreaffaireId, setEditingChiffreaffaireId] = useState(null);

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterFormData, setFilterFormData] = useState({
       client_id:"",
    });
    const [isFiltering, setIsFiltering] = useState(false);

    const [isFilter, setIsFilter] = useState(false);

console.log('filterFormData',filterFormData)

    //---------------form-------------------//

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        client_id: "",
    });

    const [expandedDetailsRows, setExpandedDetailsRows] = useState([]);
    const [expandedRows , setExpandedRows]=useState([]);
    const [formContainerStyle, setFormContainerStyle] = useState({ right: "-500px", });
    const [tableContainerStyle, setTableContainerStyle] = useState({ marginRight: "0px", });
    const tableHeaderStyle = {
        background: "#007bff",
        padding: "10px",
        textAlign: "left",
        borderBottom: "1px solid #ddd",
    };
    const { open } = useOpen();
    const { dynamicStyles } = useOpen();
    const getClientNameById = (clientId) => {
        console.log("clients", clients);
        const client = clients.find((c) => c.id === clientId);
        return client ? client.raison_sociale : "";
    };
    const fetchChiffreaffaires = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/chiffre-affaire");
    
            const { factures, chiffres_affaires, clients } = response.data;
           
            // Stocker les données dans le localStorage et mettre à jour les états
            setFactures(factures);
            localStorage.setItem('factures', JSON.stringify(factures));
    
            setChiffreaffaires(chiffres_affaires);
            localStorage.setItem('chiffreaffaires', JSON.stringify(chiffres_affaires));
    
            setClients(clients);
            localStorage.setItem('clients', JSON.stringify(clients));
    
            console.log("Factures:", factures);
            console.log("Chiffre d'affaire:", chiffres_affaires);
            console.log("Clients:", clients);
    
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    

useEffect(() => {
    const facturesFromStorage = localStorage.getItem('factures');
    const chiffreaffairesFromStorage = localStorage.getItem('chiffreaffaires');
    const clientsFromStorage = localStorage.getItem('clients');

    if (facturesFromStorage && chiffreaffairesFromStorage && clientsFromStorage) {
        setFactures(JSON.parse(facturesFromStorage));
        setChiffreaffaires(JSON.parse(chiffreaffairesFromStorage)); // Correction: utiliser JSON.parse
        setClients(JSON.parse(clientsFromStorage)); // Correction: utiliser JSON.parse
    }

    fetchChiffreaffaires();
}, []);

console.log('factures',factures)
useEffect(() => {
    const searchString = searchTerm.toLowerCase();
    
    const filtered = factures.filter((facture) => {
        const client = clients.find((client) => client.id == facture.client_id);

        console.log('client',client,clients.id,facture.client_id )
      return (
        (client.raison_sociale && client.raison_sociale.toLowerCase().includes(searchString)) ||
        (facture.reference && facture.reference.toLowerCase().includes(searchString)) ||
        (facture.date && facture.date.toLowerCase().includes(searchString)) ||
        (facture.total_ttc && String(facture.total_ttc).toLowerCase().includes(searchString))
      );
    });
    setFilteredChiffreaffaires(filtered);
  }, [factures, searchTerm]);

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleCheckboxChange = (itemId) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter((id) => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };


    const handleSelectAllChange = () => {
        setSelectAll(!selectAll);
        if (selectAll) {
            setSelectedItems([]);
        } else {
            setSelectedItems(chiffreaffaires.map((chiffreaffaire) => chiffreaffaire.id));
        }
    };
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterFormData({
            ...filterFormData,
            [name]: value,
        });
    };

    const handleClientNameFilterSubmit = (e) => {
        e.preventDefault();

        const { clientName } = filterFormData;

        const filteredChiffreAffaires = factures.filter((chiffreaffaire) => {
            const client = getClientNameById(chiffreaffaire.client_id);
            return !clientName || client.toLowerCase().includes(clientName.toLowerCase());
        });

        setFilteredChiffreaffaires(filteredChiffreAffaires);
setFactures(filteredChiffreAffaires)
        if (filteredChiffreAffaires.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Aucun résultat trouvé",
                text: "Veuillez ajuster vos filtres.",
            });
        }
console.log(chiffreaffaires)
        console.log("filterFormData:", filterFormData);
        console.log("filteredChiffreAffaires:", filteredChiffreAffaires);
        setShowFilterModal(false);
    };

    //------------------------- fournisseur print ---------------------//

    const PrintList = ({ tableId, title, recouvrementList , filtredrecouvrements  }) => {
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
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                margin-bottom: 60px;
              }
              .page-header {
                text-align: center;
                font-size: 24px;
                margin-bottom: 20px;
              }
              .h1 {
                text-align: center;
              }
              .list-title {
                font-size: 18px;
                margin-bottom: 10px;
              }
              .header {
                font-size: 16px;
                margin-bottom: 10px;
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
              .footer {
                position: fixed;
                bottom: 0;
                width: 100%;
                text-align: center;
                font-size: 14px;
                margin-top: 30px;
                background-color: #fff;
              }
              @media print {
                .footer {
                  position: fixed;
                  bottom: 0;
                }
                body {
                  margin-bottom: 0;
                }
                .no-print {
                  display: none;
                }
              }
              .content-wrapper {
                margin-bottom: 100px;
              }
              .extra-space {
                margin-bottom: 30px;
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
                   
                      <th>Client</th>
                      <th>Numéro de Facture</th>
                      <th>Date De Facture</th>
                      <th>Montant de Facture</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${factures.map((facture) => `
                      <tr key=${facture.id}>
                        <td>${getClientNameById(
                            facture.client_id)}</td>
                        <td>${facture.reference}</td>
                        <td>${facture.date}</td>
                        <td>${facture.total_ttc}</td>

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
                <FontAwesomeIcon icon={faPrint} className="me-2" onClick={handlePrint} 
                style={{
                    cursor: "pointer",
                    color: "grey",
                    fontSize: "2rem",

                  }}/>
            
        );
    };
    //------------------------- fournisseur export to pdf ---------------------//

    const exportToPdf = () => {
        const pdf = new jsPDF();

        // Define the columns and rows for the table
        const columns = [
            "Client",
            "Numéro Facture",
            "Date de Facture",
            "Montant de Facture",
        ];
        const selectedChiffreaffaires = chiffreaffaires.filter((chiffreaffaire) =>
            selectedItems.includes(chiffreaffaire.numero_facture)
        );
        const rows = selectedChiffreaffaires.map((chiffreaffaire) => [
            chiffreaffaire.client_id,
            chiffreaffaire.numero_facture,
            chiffreaffaire.date_facture,
            chiffreaffaire.montant_facture,
        ]);

        // Set the margin and padding
        const margin = 10;
        const padding = 5;

        // Calculate the width of the columns
        const columnWidths = columns.map(
            (col) => pdf.getStringUnitWidth(col) * 5 + padding * 2
        );
        const tableWidth = columnWidths.reduce((total, width) => total + width, 0);

        // Calculate the height of the rows
        const rowHeight = 10;
        const tableHeight = rows.length * rowHeight;

        // Set the table position
        const startX = (pdf.internal.pageSize.width - tableWidth) / 2;
        const startY = margin;

        // Add the table headers
        pdf.setFont("helvetica", "bold");
        pdf.setFillColor(200, 220, 255);
        pdf.rect(startX, startY, tableWidth, rowHeight, "F");
        pdf.autoTable({
            head: [columns],
            startY: startY + padding,
            styles: {
                fillColor: [200, 220, 255],
                textColor: [0, 0, 0],
                fontSize: 10,
            },
            columnStyles: {
                0: { cellWidth: columnWidths[0] },
                1: { cellWidth: columnWidths[1] },
                2: { cellWidth: columnWidths[2] },
                3: { cellWidth: columnWidths[3] },
                4: { cellWidth: columnWidths[4] },
                5: { cellWidth: columnWidths[5] },
                6: { cellWidth: columnWidths[6] },
                7: { cellWidth: columnWidths[7] },
            },
        });

        // Add the table rows
        pdf.setFont("helvetica", "");
        pdf.autoTable({
            body: rows,
            startY: startY + rowHeight + padding * 2,
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: columnWidths[0] },
                1: { cellWidth: columnWidths[1] },
                2: { cellWidth: columnWidths[2] },
                3: { cellWidth: columnWidths[3] },
                4: { cellWidth: columnWidths[4] },
                5: { cellWidth: columnWidths[5] },
                6: { cellWidth: columnWidths[6] },
                7: { cellWidth: columnWidths[7] },
            },
        });

        // Save the PDF
        pdf.save("chiffreaffaires.pdf");
    };
    //------------------------- fournisseur export to excel ---------------------//

    const exportToExcel = () => {
        const selectedRecouvrements = chiffreaffaires.filter((chiffreaffaire) =>
            selectedItems.includes(chiffreaffaire.id)
        );
        const ws = XLSX.utils.json_to_sheet(selectedRecouvrements);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Recouvrements");
        XLSX.writeFile(wb, "chiffreaffaires.xlsx");
    };


let tChef=0
{factures.map((factures) => {
tChef+=Number(factures.total_ttc)
})}
console.log('tChef',tChef)
    return (
        <ThemeProvider theme={createTheme()}>
            <Box sx={{...dynamicStyles }}>
                <Box component="main" sx={{ flexGrow: 1, p: 3, }}>
                    <Toolbar />

                    <div >
                        <h3 className="titreColore">Chiffre D'Affaire </h3>
                        <div className=""
                        style={{
                            marginLeft:'1000px',
                            width:"30%",
                            marginTop:'-40px'



                        }}>
                            <Search onSearch={handleSearch} />
                        </div>


                        <div className="align-items-start" style={{
                            marginTop:'0px'
                        }}>
                            {isFilter && (
                                <div className="filter-container">
                                    <Form onSubmit={handleClientNameFilterSubmit}>
                                        <table className="table table-borderless bgtab">
                                            <thead>
                                            <tr>
                                                <th>Nom du Client</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            <tr>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        name="clientName"
                                                        value={filterFormData.clientName}
                                                        onChange={handleFilterChange}
                                                        className="form-control form-control-sm"
                                                    />
                                                </td>
                                                <td>
                                                    <Button
                            style={{color:'white',backgroundColor:'#00afaa',border:'none'}}
                            type="submit"
                                                        className="btn-sm"
                                                    >
                                                        Appliquer le filtre par nom du client
                                                    </Button>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </Form>
                                </div>
                            )}
                        </div>
                        <Button
                            variant=""
                            className="col-2 btn btn-sm m-2 "
                            id="filterButton"
                            onClick={() => {
                                if (isFilter) {
                                    // Annuler le filtrage
                                    setIsFilter(false);
                                    // Réinitialiser les données filtrées et les données de formulaire
                                    
                                    setFilterFormData({
                                       client_id: "",
                                    });
                                    setFactures(factures)
                                    fetchChiffreaffaires()
                                } else {
                                    // Activer le filtrage
                                    setIsFilter(true);
                                    setFilterFormData({
                                        client_id: "",
                                     });
                                }
                            }}
                            style={{color:'white',backgroundColor:'#00afaa',border:'none'}}
                            onChange={handleFilterChange}
                            disabled={isFiltering && filterFormData.length === 0}
                        >
                            <FontAwesomeIcon
                                icon={faFilter}
                                style={{ verticalAlign: "middle" ,color:'white'}}
                            />{" "}
                            {isFilter ? "Annuler le filtre" : "Filtrer"}
                        </Button>


                        <div className=""
                        style={{
                            marginLeft:'200px'
                        }}
                        >
                            <div className="btn-group col-2"
                            style={{
                                marginTop:"-160px",
                                marginLeft:'1400px'
                            }}
                                >
                                <PrintList
                                    tableId="chiffreaffaireTable"
                                    title="Liste des chiffre d'affaire"
                                    ChiffreAffaireList={chiffreaffaires}
                                    filtredchiffreaffaires={filteredChiffreaffaires}
                                />

                                <ExportPdfButton
                                    chiffreaffaires={chiffreaffaires}
                                    selectedItems={selectedItems}
                                />
                                    <FontAwesomeIcon
                                    style={{
                                        cursor: "pointer",
                                        color: "green",
                                        fontSize: "2rem",
                                        marginLeft: "10px",

                                        
                                      }}
                                     icon={faFileExcel}  onClick={exportToExcel}/>
                                
                                
                            </div>
                        </div>
                        

                        <div id="tableContainer" className="table-responsive-sm" style={{
                            width:'100%',
                            marginTop:"-70px"
                        }} >
                            <table className="table table-responsive  table-bordered" id="chiffreaffaireTable">
                                <thead>
                                <tr>
                                        <th className="tableHead widthDetails">
                                        <input type="checkbox" onChange={handleSelectAllChange} />
                                    </th>
                                    <th className="tableHead">Client</th>
                                    <th className="tableHead">N° Facture</th>
                                    <th className="tableHead">Date de Facture</th>
                                    <th className="tableHead">Total TTC</th>
                                    
                                    {/*<th style={tableHeaderStyle}>Action</th>*/}
                                </tr>
                                </thead>
                                <tbody>
                                {filteredChiffreaffaires.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((factures) => (

                                        <tr>
                                            <td></td>
                                            <td>

                                                {getClientNameById(
                                                    factures.client_id
                                                )}
                                            </td>
                                            <td>{factures.reference}</td>
                                             <td>{factures.date}</td>
                                            <td>{factures.total_ttc}Dh</td>
                                           

                                        </tr>


                                ))}
                                 <tr>
                                 
                                 <td colSpan={4} style={{backgroundColor:'#f5f5f5'}}></td>

                                            <td style={{backgroundColor:'#ff0000'}} >
                                            Chiffre D'Affaire : {tChef}DH</td>
                                           
                                        </tr>
                                </tbody>
                            </table>
                            {/*<Button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>*/}
                            {/*    <FontAwesomeIcon icon={faTrash} />*/}
                            {/*</Button>*/}
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                component="div"
                                count={filteredChiffreaffaires.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </div>

                    </div>
                    {/*     <div className="mt-4"> /!* Ajout de la classe mt-4 pour ajouter de la marge au-dessus *!/*/}
                    {/*    <div className="border p-3"> /!* Utilisation de la classe border et p-3 pour encadrer et ajouter du padding *!/*/}
                    {/*        <p><strong>Total des Montants des Factures:</strong> <span>{calculateTotalMontantfacture(chiffreaffaires)}</span></p>*/}
                    {/*    </div>*/}
                    {/*</div>*/}

                </Box>
            </Box>
        </ThemeProvider>

    );
};


export default ChiffreAffaireList;