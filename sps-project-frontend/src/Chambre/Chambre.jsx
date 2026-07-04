import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { sanitizeInput } from '../utils/sanitizeInput';
import { Form, Button, Modal, Carousel, Table } from "react-bootstrap";
import Navigation from "../Acceuil/Navigation";
import { highlightText } from '../utils/textUtils';
import TablePagination from "@mui/material/TablePagination";
import "jspdf-autotable";
import Search from "../Acceuil/Search";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PeopleIcon from "@mui/icons-material/People";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { storeDataInIndexedDB } from "../indexDB";
import ExpandRTable from "../components/ExpandRTable";

import {
  faTrash,
  faFileExcel,
  faPlus,
  faMinus,
  faCircleInfo,
  faSquarePlus,
  faEdit,
  faList,
  faPrint,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import "../style.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Checkbox, Fab, Toolbar } from "@mui/material";
import { useOpen } from "../Acceuil/OpenProvider"; // Importer le hook personnalisé
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

//------------------------- Chambres ---------------------//
const Chambre = () => {
  const [chambres, setChambres] = useState([]);
  const [vueErrors, setVueErrors] = useState({ vue: "", photo: "", vueAdd: "" });
  const [typeErrors, setTypeErrors] = useState({
    codeAdd: "", nb_litAdd: "", nb_salleAdd: "", type_chambreAdd: "", commentaireAdd: ""
  });
  const [etageErrors, setEtageErrors] = useState({ photo: "", etageAdd: "" });
  const [vues, setVues] = useState([]);
  const [etages, setEtages] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedVue, setSelectedVue] = useState(null);
  const [selectedEtage, setSelectedEtage] = useState(null);
  const emptyTypeChambre = {
  code: "",
  type_chambre: "",
  nb_lit: "",
  nb_salle: "",
  commentaire: "",
  codeAdd: "",
  type_chambreAdd: "",
  nb_litAdd: "",
  nb_salleAdd: "",
  commentaireAdd: "",
};
  const [typeCreationMode, setTypeCreationMode] = useState("preset");
  const roomTypePresets = {
  "Chambre simple": {
    nb_lit: 1,
    nb_salle: 1,
    commentaire: "Chambre simple avec un lit.",
  },
  "Chambre double": {
    nb_lit: 2,
    nb_salle: 1,
    commentaire: "Chambre double avec deux lits.",
  },
  "Chambre triple": {
    nb_lit: 3,
    nb_salle: 1,
    commentaire: "Chambre triple avec trois lits.",
  },
  "Suite junior": {
    nb_lit: 2,
    nb_salle: 2,
    commentaire: "Suite junior avec deux lits et deux salles.",
  },
  "Chambre familiale": {
    nb_lit: 4,
    nb_salle: 1,
    commentaire: "Chambre familiale avec quatre lits.",
  },
};
  const [newTypeChambre, setNewTypeChambre] = useState(emptyTypeChambre);
  const [submitted, setSubmitted] = useState(false);

  //---------------form-------------------//
  const [newCategory, setNewCategory] = useState({ categorie: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditModalSite, setShowEditModalSite] = useState(false);
  const [showAddVue, setShowAddVue] = useState(false); 
  const [showAddEtage, setShowAddEtage] = useState(false); 
  const [newVue, setNewVue] = useState({
    vue: "",
    vueAdd: "",
    photo: "",
  });
  const [newEtage, setNewEtage] = useState({
    etage: "",
    photo: "",
    etageAdd: ""
  });

  const [showEditModalSecteur, setShowEditModalSecteur] = useState(false);
  const [showEditModalmod, setShowEditModalmod] = useState(false);


  const [selectedCategoryId, setSelectedCategoryId] = useState([]);
  const [categorieId, setCategorie] = useState();

const [typeFilter, setTypeFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  
  
  const [formData, setFormData] = useState({
    type_chambre: "",
    num_chambre: "",
    etage: "",
    nb_lit: "",
    nb_salle: "",
    climat: "",
    wifi: "",
    vue: "",
  });
  const [errors, setErrors] = useState({
    type_chambre: "",
    nb_lit: "",
    nb_salle: "",
    climat: "",
    wifi: "",
    vue: "",
    etage: "",
  });
  const [showEditModalVue, setShowEditModalVue] = useState(false);
  const [showEditModalEtage, setShowEditModalEtage] = useState(false);
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  //-------------------edit-----------------------//
  const [editingChambre, setEditingChambre] = useState(null); // State to hold the client being edited
  const [editingType, setEditingType] = useState([]);
  const [editingEtage, setEditingEtage] = useState([]);
  const [editingVue, setEditingVue] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false); // Gère l'affichage du formulaire
  const [showAddCategorySite, setShowAddCategorySite] = useState(false); // Gère l'affichage du formulaire

  const [showAddRegein, setShowAddRegein] = useState(false); // Gère l'affichage du formulaire
  const [showAddRegeinSite, setShowAddRegeinSite] = useState(false); // Gère l'affichage du formulaire

  const [showAddSecteur, setShowAddSecteur] = useState(false); // Gère l'affichage du formulaire

  const [showAddMod, setShowAddMod] = useState(false); // Gère l'affichage du formulaire

  //-------------------Pagination-----------------------/
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [filteredchambres, setFilteredChambres] = useState([]);
  // Pagination calculations
  const indexOfLastChambre = (page + 1) * rowsPerPage;
  const indexOfFirstChambre = indexOfLastChambre - rowsPerPage;
  const currentChambres = chambres?.slice(indexOfFirstChambre, indexOfLastChambre);
  //-------------------Selected-----------------------/
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  //-------------------Search-----------------------/
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  //------------------------Site-Client---------------------
  const [showFormSC, setShowFormSC] = useState(false);
  const [editingsitechambre, setEditingsitechambre] = useState(null);
  const [editingsitechambreId, setEditingsitechambreId] = useState(null);
  const [formContainerStyleSC, setFormContainerStyleSC] = useState({
    right: "-100%",
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedRowsContact, setExpandedRowsContact] = useState([]);
  const [expandedRowsContactSite, setExpandedRowsContactsite] = useState([]);


  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [selectedProductsDataRep, setSelectedProductsDataRep] = useState([]);


  const fetchChambres = async () => {
    try {
    
      // Now, fetch actual application data
      const response = await axios.get("http://localhost:8000/api/chambres");
      const data = response.data;
      setChambres(data.chambres || []);
      await storeDataInIndexedDB(data.chambres || [], 'chambres');
      setVues(data.vues || []);
      setEtages(data.etages || []);
      setTypes(data.types || []);
  
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    // Check if data exists in local storage and set the state variables accordingly


      fetchChambres();
    
  }, []);


  const toggleRow = (chambreId) => {
    setExpandedRows((prevExpandedRows) =>
      prevExpandedRows.includes(chambreId)
        ? prevExpandedRows?.filter((id) => id !== chambreId)
        : [...prevExpandedRows, chambreId]
    );
  };
  const toggleRowContact = (chambreId) => {
    setExpandedRowsContact((prevExpandedRows) =>
      prevExpandedRows.includes(chambreId)
        ? prevExpandedRows?.filter((id) => id !== chambreId)
        : [...prevExpandedRows, chambreId]
    );
  };
  const toggleRowContactSite = (chambreId) => {
    setExpandedRowsContactsite((prevExpandedRows) =>
      prevExpandedRows.includes(chambreId)
        ? prevExpandedRows?.filter((id) => id !== chambreId)
        : [...prevExpandedRows, chambreId]
    );
  };
  //---------------------------------------------
  useEffect(() => {
    const filtered = chambres?.filter((chambre) =>
      Object.values(chambre).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (typeof value === "number") {
          return value.toString().includes(searchTerm.toLowerCase());
        }
        return false;
      })
    );
    setFilteredChambres(filtered);
  }, [chambres, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

const handleChange = (e) => {
  const { name, value, type, files } = e.target;

  if (name === "type_chambre") {
    const selectedType = types.find((type) => String(type.id) === String(value));

    setFormData((prev) => ({
      ...prev,
      type_chambre: value,
      nb_lit: selectedType ? selectedType.nb_lit : "",
      nb_salle: selectedType ? selectedType.nb_salle : "",
    }));

    return;
  }

  setFormData((prev) => ({
    ...prev,
    [name]: type === "file" ? files[0] : value,
  }));
};
  // const handleChange = (e) => {
  //   setUser({
  //     ...user,
  //     [e.target.name]:
  //       e.target.type === "file" ? e.target.files[0] : e.target.value,
  //   });
  // };
  //------------------------- CHAMBRE EDIT---------------------//
  const handleEdit = (chambre) => {
    setSubmitted(false);
    // Populate form with the chambre's data
    setEditingChambre(chambre);
  
    // Update formData with the chambre's data to fill the form inputs
    setFormData({
      type_chambre: chambre.type_chambre?.id || chambre.type_chambres?.id || chambre.type_chambre || '',
      num_chambre: chambre.num_chambre,
      etage: chambre.etage_id,
      nb_lit: chambre.nb_lit,
      nb_salle: chambre.nb_salle,
      climat: (chambre.climat === true || chambre.climat === 1) ? 'oui' : (chambre.climat === false || chambre.climat === 0 ? 'non' : (chambre.climat || '')),
      wifi: (chambre.wifi === true || chambre.wifi === 1) ? 'oui' : (chambre.wifi === false || chambre.wifi === 0 ? 'non' : (chambre.wifi || '')),
      vue: chambre.vue_id,
    });
  
    // Keep the form open by modifying formContainerStyle if not already opened
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    }
  };
  

  useEffect(() => {
    if (!submitted) {
      // Clear all errors if the form has not been submitted yet.
      setErrors({
        type_chambre: "",
        etage: "",
        nb_lit: "",
        nb_salle: "",
        climat: "",
        wifi: "",
        vue: "",
      });
      setVueErrors({ vue: "", photo: "", vueAdd: "" });
      setEtageErrors({ photo: "", etageAdd: "" });
      setTypeErrors({
        codeAdd: "",
        nb_litAdd: "",
        nb_salleAdd: "",
        type_chambreAdd: "",
        commentaireAdd: ""
      });
    } else {
      const validateData = () => {
        const newErrors = { ...errors };
        const newVueErrors = { ...vueErrors };
        const newEtageErrors = { ...etageErrors };
        const newTypeErrors = { ...typeErrors };
        // Chambre Validation
        const num_chambres = chambres.filter((chambre) => chambre.num_chambre);
        newErrors.vue = (selectedVue || formData.vue) === "";
        newErrors.etage = (selectedEtage || formData.etage) === "";
        newErrors.num_chambre =
          formData.num_chambre === "" ||
          (num_chambres.some(
            (chambre) =>
              sanitizeInput(chambre.num_chambre) === sanitizeInput(formData.num_chambre)
          ) &&
            sanitizeInput(formData.num_chambre) !== sanitizeInput(editingChambre?.num_chambre));
        newErrors.type_chambre = formData.type_chambre === "";
        newErrors.nb_salle = formData.nb_salle === "";
        newErrors.nb_lit = formData.nb_lit === "";
        newErrors.wifi = formData.wifi === "";
        newErrors.climat = formData.climat === "";
        // Vue Validation
        newVueErrors.vue = newVue.vue === "";
        newVueErrors.vueAdd = newVue.vueAdd ? false : true;
        // Etage Validation
        const etagesData = etages.filter((etage) => etage?.etage);
        if (editingEtage.length > 0) {
          newEtageErrors.etage =
            newEtage.etage === "" ||
            (etagesData.some((etage) => sanitizeInput(etage?.etage) === sanitizeInput(newEtage.etage)) &&
              sanitizeInput(newEtage.etage) !== sanitizeInput(editingEtage?.etage));
        }
        newEtageErrors.etageAdd =
          newEtage.etageAdd === "" ||
          etagesData.some((etage) => sanitizeInput(etage?.etage) === sanitizeInput(newEtage.etageAdd));
        // Type Chambre Validation
        const types_chambre = types.filter((type) => type?.code);
        newTypeErrors.codeAdd =
          newTypeChambre.codeAdd === "" ||
          types_chambre.some((type) => sanitizeInput(type?.code) === sanitizeInput(newTypeChambre.codeAdd));
        newTypeErrors.nb_litAdd = newTypeChambre.nb_litAdd === "";
        newTypeErrors.nb_salleAdd = newTypeChambre.nb_salleAdd === "";
        newTypeErrors.commentaire = false;
        if (editingType) {
          newTypeErrors.code =
            newTypeChambre.code === "" ||
            (types_chambre.some((type) => sanitizeInput(type?.code) === sanitizeInput(newTypeChambre.code)) &&
              sanitizeInput(newTypeChambre.code) !== sanitizeInput(editingType?.code));
          newTypeErrors.nb_salle = newTypeChambre.nb_salle === "";
          newTypeErrors.nb_lit = newTypeChambre.nb_lit === "";
          newTypeErrors.commentaire = false;
          newTypeErrors.type_chambre =
            newTypeChambre.type_chambre === "" ||
            (types_chambre.some((type) => sanitizeInput(type?.type_chambre) === sanitizeInput(newTypeChambre.type_chambre)) &&
              sanitizeInput(newTypeChambre.type_chambre) !== sanitizeInput(editingType?.type_chambre));
        }
        newTypeErrors.type_chambreAdd =
          newTypeChambre.type_chambreAdd === "" ||
          types_chambre.some((type) => sanitizeInput(type?.type_chambre) === sanitizeInput(newTypeChambre.type_chambreAdd));
    
        setErrors(newErrors);
        setVueErrors(newVueErrors);
        setEtageErrors(newEtageErrors);
        setTypeErrors(newTypeErrors);
      };
      validateData();
    }
  }, [formData, newVue, newTypeChambre, newEtage, submitted]);


const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitted(true);

  const hasErrors = Object.values(errors).some(error => error === true);
  if (hasErrors) {
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Veuillez remplir tous les champs obligatoires.",
    });
    return;  
  }
  const url = editingChambre
      ? `http://localhost:8000/api/chambres/${editingChambre.id}`
      : "http://localhost:8000/api/chambres";
  const method = editingChambre ? "put" : "post";

  let requestData;

  if (editingChambre) {
    requestData ={
    type_chambre: formData.type_chambre,
    num_chambre: formData.num_chambre,
    etage_id: formData.etage || selectedEtage,
    nb_lit: formData.nb_lit,
    nb_salle: formData.nb_salle,
    climat: formData.climat,
    wifi: formData.wifi,
    vue_id: formData.vue || selectedVue,
    }
  }
  else {
  const formDatad = new FormData();
  formDatad.append("type_chambre", formData.type_chambre);
  formDatad.append("num_chambre", formData.num_chambre);
  formDatad.append("etage_id", formData.etage || selectedEtage);
  formDatad.append("nb_lit", formData.nb_lit);
  formDatad.append("nb_salle", formData.nb_salle);
  formDatad.append("climat", formData.climat);
  formDatad.append("wifi", formData.wifi);
  formDatad.append("vue_id", formData.vue || selectedVue);
  requestData = formDatad;
  }

  try {
      const response = await axios({
          method: method,
          url: url,
          data: requestData,
      });
      
      if (response.status === 200 || response.status === 201) {
          fetchChambres();  // Fetch updated data after successful submit
          const successMessage = `Chambre ${editingChambre ? "modifié" : "ajouté"} avec succès.`;
          Swal.fire({
              icon: "success",
              title: "Succès!",
              text: successMessage,
          });
          // Reset form and errors, but keep the form open with the new data
          setFormData({
              type_chambre: "",
              num_chambre: "",
              etage: "",
              nb_lit: "",
              nb_salle: "",
              climat: "",
              wifi: "",
              vue: "",
          });
          setErrors({
              type_chambre: "",
              etage: "",
              nb_lit: "",
              nb_salle: "",
              climat: "",
              wifi: "",
              vue: "",
          });
          setEditingChambre(null);
          // Close the form and reset layout
          setFormContainerStyle({ right: "-100%" });
          setTableContainerStyle({ marginRight: "0px" });
          setSubmitted(false);
          // Do not close the form here if you want to keep it open
      }
  } catch (error) {
      if (error.response) {
          // Handle error
      }
      setTimeout(() => {
          setErrors({});
      }, 3000);
  }
};


// Update deletion handler to use chambre.id instead of num_chambre

const handleDelete = (num_chambre) => {
  Swal.fire({
    title: "Êtes-vous sûr de vouloir supprimer cette chambre ?",
    showDenyButton: true,
    showCancelButton: false,
    confirmButtonText: "Oui",
    denyButtonText: "Non",
    customClass: {
      actions: "my-actions",
      cancelButton: "order-1 right-gap",
      confirmButton: "order-2",
      denyButton: "order-3",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      axios
        .delete(`http://localhost:8000/api/chambres/${num_chambre}`)
        .then(() => {
          fetchChambres();
          Swal.fire({
            icon: "success",
            title: "Succès!",
            text: "Chambre supprimée avec succès.",
          });
        })
        .catch((error) => {
          if (error.response && error.response.status === 400) {
            Swal.fire({
              icon: "error",
              title: "Erreur",
              text: error.response.data.error,
            });
          } else {
            console.error("Une erreur s'est produite :", error);
          }
        });
    }
  });
};

const handleDeleteSelected = () => {
  Swal.fire({
    title: "Êtes-vous sûr de vouloir supprimer?",
    showDenyButton: true,
    confirmButtonText: "Oui",
    denyButtonText: "Non",
  }).then((result) => {
    if (result.isConfirmed) {
      Promise.all(
        selectedItems.map((num_chambre) =>
          axios.delete(`http://localhost:8000/api/chambres/${num_chambre}`)
        )
      )
        .then(() => {
          Swal.fire("Succès!", "Chambres supprimées avec succès.", "success");
          setSelectedItems([]);
          fetchChambres();
        })
        .catch((error) => {
          console.error("Erreur lors de la suppression de la chambre:", error);
          Swal.fire("Erreur!", "Échec de la suppression.", "error");
        });
    }
  });
};


  //------------------------- CLIENT PAGINATION---------------------//

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const selectedRows = parseInt(event.target.value, 10);
    setRowsPerPage(selectedRows);
    localStorage.setItem('rowsPerPageChambres', selectedRows);
    setPage(0);
  };

  useEffect(() => {
    const savedRowsPerPage = localStorage.getItem('rowsPerPageChambres');
    if (savedRowsPerPage) {
      setRowsPerPage(parseInt(savedRowsPerPage, 10));
    }
  }, []);

  //------------------------- CLIENT DELETE---------------------//

  
  //-------------------------Select Delete --------------------//


  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (selectAll) {
      setSelectedItems([]);
    } else {
      // Use num_chambre so that deletion endpoint receives the proper identifier
      setSelectedItems(chambres?.map((chambre) => chambre.num_chambre));
    }
  };
  
  const handleCheckboxChange = (num_chambre) => {
    if (selectedItems.includes(num_chambre)) {
      setSelectedItems(selectedItems.filter((value) => value !== num_chambre));
    } else {
      setSelectedItems([...selectedItems, num_chambre]);
    }
  };
  

  const exportToExcel = () => {
    const table = document.getElementById('chambresTable');
    const workbook = XLSX.utils.table_to_book(table, { sheet: 'Chambres' });
    XLSX.writeFile(workbook, 'chambres_table.xlsx');
  };

  
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Manually adding HTML content
    const title = 'Table Chambres';
    doc.text(title, 14, 16);
    
    doc.autoTable({
      head: [['Code Chambre', 'Type', 'Etage', 'Nombre de lit', 'Nombre de salle', "Climat", "Wifi", "Vue"]],
      body: filteredChambres?.map(chambre => [
        chambre.num_chambre ? { content: 'Code Chambre', rowSpan: 1 } : '',
        chambre.type_chambre || '',
        chambre.etage.etage || '',
        chambre.nb_lit || '',
        chambre.nb_salle || '',
        chambre.climat || '',
        chambre.wifi || '',
        chambre.vue.vue || '',

      ]),
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8, overflow: 'linebreak' },
      headStyles: { fillColor: '#007bff' }
    });
  
    doc.save('chambres_table.pdf');
  };
  

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Chambre List</title>
          <style>
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <h1>Chambre List</h1>
          <table>
            <thead>
              <tr>
                <th>Code Chambre</th>
                <th>Type</th>
                <th>Etage</th>
                <th>Nombre de list</th>
                <th>Nombre de salle</th>
                <th>Climat</th>
                <th>Wifi</th>
                <th>Vue</th>


              </tr>
            </thead>
            <tbody>
              ${filteredChambres?.map(chambre => `
                <tr>
                  <td>${chambre.num_chambre || ''}</td>
                  <td>${chambre.type_chambre || ''}</td>
                  <td>${chambre.etage.etage || ''}</td>
                  <td>${chambre.nb_lit || ''}</td>
                  <td>${chambre.nb_salle || ''}</td>
                  <td>${chambre.climat  || ''}</td>
                  <td>${chambre.wifi || ''}</td>
                  <td>${chambre.vue.vue || ''}</td>

                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
  
    printWindow.document.close();
    printWindow.print();
  };
  
  //------------------ Zone --------------------//
  // const handleDeleteZone = async (zoneId) => {
  //   try {
  //     const response = await axios.delete(
  //       `http://localhost:8000/api/types/${zoneId}`
  //     );
  //     Swal.fire({
  //       icon: "success",
  //       title: "Succès!",
  //       text: "Zone supprimée avec succès.",
  //     });
  //   } catch (error) {
  //     console.error("Error deleting zone:", error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Erreur!",
  //       text: "Échec de la suppression de la zone.",
  //     });
  //   }
  // };

  // const handleEditZone = async (zoneId) => {
  //   try {
  //     const response = await axios.get(
  //       `http://localhost:8000/api/types/${zoneId}`
  //     );
  //     const zoneToEdit = response.data;

  //     if (!zoneToEdit) {
  //       console.error("Zone not found or data is missing");
  //       return;
  //     }

  //     const { value: editedZone } = await Swal.fire({
  //       title: "Modifier une zone",
  //       html: `
  //         <form id="editZoneForm">
  //             <input id="swal-edit-input1" class="swal2-input" placeholder="Zone" name="zone" value="${zoneToEdit.zone}">
  //         </form>
  //     `,
  //       showCancelButton: true,
  //       confirmButtonText: "Modifier",
  //       cancelButtonText: "Annuler",
  //       preConfirm: () => {
  //         const editedZoneValue =
  //           document.getElementById("swal-edit-input1").value;
  //         return { zone: editedZoneValue };
  //       },
  //     });

  //     if (editedZone && editedZone.zone !== zoneToEdit.zone) {
  //       const putResponse = await axios.put(
  //         `http://localhost:8000/api/types/${zoneId}`,
  //         editedZone
  //       );
  //       Swal.fire({
  //         icon: "success",
  //         title: "Succès!",
  //         text: "Zone modifiée avec succès.",
  //       });
  //     } else {
  //     }
  //   } catch (error) {
  //     console.error("Error editing zone:", error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Erreur!",
  //       text: "Échec de la modification de la zone.",
  //     });
  //   }
  //   fetchChambres();
  // };

  // const handleAddZone = async () => {
  //   const { value: zoneData } = await Swal.fire({
  //     title: "Ajouter une zone",
  //     html: `
  //         <form id="addZoneForm">
  //             <input id="swal-input1" class="swal2-input" placeholder="Zone" name="zone">
  //         </form>
  //         <div class="form-group mt-3">
  //             <table class="table table-hover">
  //                 <thead>
  //                     <tr>
  //                         <th>Zone</th>
  //                         <th>Action</th>
  //                     </tr>
  //                 </thead>
  //                 <tbody>
  //                     ${types
  //                       ?.map(
  //                         (zone) => `
  //                         <tr key=${zone.id}>
  //                             <td>${zone.zone}</td>
  //                             <td>
  //                                 <select class="custom-select" id="actionDropdown_${zone.id}" class="form-control">
  //                                     <option class="btn btn-light" disabled selected value="">Select Action</option>
  //                                     <option class="btn btn-danger text-center" value="delete_${zone.id}">Delete</option>
  //                                     <option class="btn btn-info text-center" value="edit_${zone.id}">Edit</option>
  //                                 </select>
  //                             </td>
  //                         </tr>
  //                     `
  //                       )
  //                       .join("")}
  //                 </tbody>
  //             </table>
  //         </div>
  //     `,
  //     showCancelButton: true,
  //     confirmButtonText: "Ajouter",
  //     cancelButtonText: "Annuler",
  //     preConfirm: () => {
  //       const zone = Swal.getPopup().querySelector("#swal-input1").value;
  //       return { zone };
  //     },
  //   });

  //   if (zoneData) {
  //     try {
  //       const response = await axios.post(
  //         "http://localhost:8000/api/types",
  //         zoneData
  //       );
  //       Swal.fire({
  //         icon: "success",
  //         title: "Success!",
  //         text: "Zone ajoutée avec succès.",
  //       });
  //     } catch (error) {
  //       console.error("Error adding zone:", error);
  //       Swal.fire({
  //         icon: "error",
  //         title: "Erreur!",
  //         text: "Échec de l'ajout de la zone.",
  //       });
  //     }
  //   }
  //   fetchChambres();
  // };

  document.addEventListener("change", async function (event) {
    if (event.target && event.target.id.startsWith("actionDropdown_")) {
      const [action, typeId] = event.target.value.split("_");
      if (action === "delete") {
        // Delete action
        handleDeleteType(typeId);
      } else if (action === "edit") {
        // Edit action
        handleEditType(typeId);
      }

      // Clear selection after action
      event.target.value = "";
    }
  });
  



  //-----------------------------------------//

  const handleAddEmptyRow = () => {
    setSelectedProductsData([...selectedProductsData, {}]);
};
  const handleAddEmptyRowRep = () => {
    setSelectedProductsDataRep([...selectedProductsDataRep, {}]);
};
const handleDeleteProduct = (index, id) => {
  const updatedSelectedProductsData = [...selectedProductsData];
  updatedSelectedProductsData.splice(index, 1);
  setSelectedProductsData(updatedSelectedProductsData);
};
const handleDeleteProductRap = (index, id) => {
  const updatedSelectedProductsData = [...selectedProductsDataRep];
  updatedSelectedProductsData.splice(index, 1);
  setSelectedProductsDataRep(updatedSelectedProductsData);
  if (id) {
      axios
          .delete(`http://localhost:8000/api/contactClient/${id}`)
          .then(() => {
            fetchChambres();
          });
  }
};
const handleInputChange = (index, field, value) => {
  const updatedProducts = [...selectedProductsData];
  updatedProducts[index][field] = value;


  let newErrors = {...errors};
  if (field === 'name' && value === '') {
    newErrors.nb_lit = 'Le Nombre de lit est obligatoire.';
  } else {
    newErrors.nb_lit = '';
  }
  setSelectedProductsData(updatedProducts);

  setErrors(newErrors);
};
const handleInputChangeRep = (index, field, value) => {
  const updatedProducts = [...selectedProductsDataRep];
  updatedProducts[index][field] = value;
  let newErrors = {...errors};
  





  setErrors(newErrors);
  setSelectedProductsDataRep(updatedProducts);
};


const handleTypeFilterChange = (e) => {
  setTypeFilter(e.target.value);
};


const filteredChambres = chambres?.filter((chambre) => {
  return (
    ((typeFilter ? chambre.type_chambre?.type_chambre === typeFilter : true) &&
    (selectedVue ? chambre.vue.id === selectedVue : true) &&
    (selectedEtage ? chambre.etage.id === selectedEtage : true)) &&
    (
    (searchTerm ? chambre?.num_chambre.toLowerCase().includes(searchTerm.toLowerCase()) : true) ||
    (searchTerm ? chambre?.type_chambre?.type_chambre?.toLowerCase().includes(searchTerm.toLowerCase()) : true) ||
    (searchTerm ? chambre?.etage?.etage?.toLowerCase().includes(searchTerm.toLowerCase()) : true) ||
    (searchTerm ? chambre?.vue?.vue?.toLowerCase().includes(searchTerm.toLowerCase()) : true) ||
    (searchTerm ? chambre?.climat?.toLowerCase().includes(searchTerm.toLowerCase()) : true) ||
    (searchTerm ? String(chambre?.wifi).includes(searchTerm.toLowerCase()) : true) ||
    (searchTerm ? String(chambre?.nb_lit).includes(searchTerm.toLowerCase()) : true) ||
    (searchTerm ? String(chambre?.nb_salle).includes(searchTerm.toLowerCase()) : true) 
    )
  )
});

const handleDeleteType = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/types-chambre/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Type supprimée avec succès.",
    });
    await fetchChambres(); // Refresh categories after adding

    // Récupérer les nouvelles catégories après suppression
   
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Ce type est associé à une autre chambre.",
    });
  }
};

const [activeVueIndex, setActiveVueIndex] = useState(0);
const [activeEtageIndex, setActiveEtageIndex] = useState(0);
const [filtreclientBySect,setFiltreClientBySect] = useState([])
const handleVueSelect = (selectedIndex) => {
  setActiveVueIndex(selectedIndex);
};const handleEtageSelect = (selectedIndex) => {
  setActiveEtageIndex(selectedIndex);
};
const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array?.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
const chunkSize = 3;
const chunks = chunkArray(vues, chunkSize);
const chunks1 = chunkArray(etages, chunkSize);


const handleVueFilterChange = (catId) => {
  setSelectedVue(catId);
  setFormData({...formData, vue: ""})
};
const handleEtageFilterChange = (catId) => {
  setSelectedEtage(catId);
  setFormData({...formData, etage: ""})
};
const handleShowFormButtonClick = () => {
  if (formContainerStyle.right === "-100%") {
    setFormContainerStyle({ right: "0" });
    setTableContainerStyle({ marginRight: "650px" });
  } else {
    closeForm();
  }
};
const closeForm = () => {
  setSubmitted(false);
  setFormContainerStyle({ right: "-100%" });
  setTableContainerStyle({ marginRight: "0" });
  setShowForm(false); // Hide the form
  setFormData({
    type_chambre: "",
    num_chambre: "",
    etage: "",
    nb_lit: "",
    nb_salle: "",
    climat: "",
    wifi: "",
    vue: "",
  });
  setErrors({
    type_chambre: "",
    etage: "",
    nb_lit: "",
    nb_salle: "",
    climat: "",
    wifi: "",
    vue: "",
  });
  setSelectedProductsData([])
  setSelectedProductsDataRep([])
  setEditingChambre(null); 
};
const handleAddEtage = async () => {
  try {
    const hasErrors = Object.values(etageErrors).some(error => error === true);
      if (hasErrors) {
        alert(JSON.stringify(etageErrors));
        return;  
      }
    const formData = new FormData();
    formData.append('photo', newEtage.photo);
    formData.append("etage", newEtage.etageAdd);
    
    const response = await axios.post(
      "http://localhost:8000/api/etages", formData
    );

    fetchChambres(); 
    Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Etage ajoutée avec succès.",
              }); // Hide the modal after success
              setShowAddEtage(false);
  } catch (error) {
    console.error("Error adding etage:", error);
  }
};
const handleDeleteEtage = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/etages/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Etage supprimée avec succès.",
    });
    await fetchChambres(); // Refresh categories after adding

  } catch (error) {
    console.error("Error deleting Etage:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Cet Etage est associé à une chambre.",
    });
  }
};
const handleEditEtage = (categorieId) => {
  setNewEtage(categorieId);
  setEditingEtage(categorieId);
  setEtageErrors({...etageErrors, 
    etageAdd: "",
  })
  setCategorie(categorieId.id);
  setShowEditModalEtage(true);
};
const handleSaveEtage = async () => {
  try {
    const hasErrors = Object.values(etageErrors).some(error => error === true);
      if (hasErrors) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;  
      }
      const formData = new FormData();
      formData.append('_method', 'put');
        if (newEtage.photo) {
          formData.append('photo', newEtage.photo);
        }
    formData.append("etage", newEtage.etage);
    const response = await axios.post(`http://localhost:8000/api/etages/${categorieId}`,formData);

    await fetchChambres(); // Refresh categories after adding
    setShowEditModalEtage(false);
    
    // Show success message
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Etage modifiée avec succès.",
    });
    
    // Clear the form state
    setNewEtage({ etage: '', photo: null });
  } catch (error) {
    console.error("Erreur lors de la modification de la Etage");
  }
};

const handleAddVue = async () => {
  try {
    const formData = new FormData();
    if (newVue.photo) {
      formData.append('photo', newVue.photo);
    }
    formData.append("vue", newVue.vueAdd);
    
    const response = await axios.post(
      "http://localhost:8000/api/vues", formData
    );

    fetchChambres(); 
    Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Vue ajoutée avec succès.",
              }); // Hide the modal after success
              setShowAddVue(false);
  } catch (error) {
    console.error("Error adding vue:", error);
  }
};
const handleDeleteVue = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/vues/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Vue supprimée avec succès.",
    });
    await fetchChambres(); // Refresh categories after adding

  } catch (error) {
    console.error("Error deleting Vue:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Cette vue est associée à une autre chambre.",
    });
  }
};
const handleEditVue = (categorieId) => {
  setNewVue(categorieId);
  setEditingVue(categorieId);
  setCategorie(categorieId.id);
  setShowEditModalVue(true);
};
const handleSaveVue = async () => {
  const formData = new FormData();
  formData.append('_method', 'put');
    if (newVue.photo) {
      formData.append('photo', newVue.photo);
    }
    formData.append("vue", newVue.vue);

  try {
    const response = await axios.post(`http://localhost:8000/api/vues/${categorieId}`,formData);

    await fetchChambres(); // Refresh categories after adding
    setShowEditModalVue(false);
    
    // Show success message
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Vue modifiée avec succès.",
    });
    
    // Clear the form state
    setNewVue({ vue: '', photo: null });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Ereur!",
      text: "Échec de la suppression du Vue.",
    });
  }
};
const handleSelectItem = (item) => {
  const selectedIndex = selectedItems.findIndex(
    (selectedItem) => selectedItem.id === item.id
  );

  if (selectedIndex === -1) {
    setSelectedItems([...selectedItems, item.id]);
  } else {
    const updatedItems = [...selectedItems];
    updatedItems.splice(selectedIndex, 1);
    setSelectedItems(updatedItems);
  }

};
const resetAddTypeChambreForm = () => {
  setNewTypeChambre(emptyTypeChambre);
  setTypeCreationMode("preset");

  setTypeErrors({
    codeAdd: "",
    type_chambreAdd: "",
    nb_litAdd: "",
    nb_salleAdd: "",
    commentaireAdd: "",
  });
};
const validateAddTypeChambre = () => {
  const errors = {};

  if (!newTypeChambre.codeAdd.trim()) {
    errors.codeAdd = "Le code est obligatoire.";
  }

  if (!newTypeChambre.type_chambreAdd.trim()) {
    errors.type_chambreAdd = "Le type de chambre est obligatoire.";
  }

  const nbLit = Number(newTypeChambre.nb_litAdd);
  if (
    newTypeChambre.nb_litAdd === "" ||
    !Number.isInteger(nbLit) ||
    nbLit < 1
  ) {
    errors.nb_litAdd = "Le nombre de lits doit être un nombre entier supérieur ou égal à 1.";
  }

  const nbSalle = Number(newTypeChambre.nb_salleAdd);
  if (
    newTypeChambre.nb_salleAdd === "" ||
    !Number.isInteger(nbSalle) ||
    nbSalle < 1
  ) {
    errors.nb_salleAdd = "Le nombre de salles doit être un nombre entier supérieur ou égal à 1.";
  }

  return errors;
};
const handlePresetTypeChange = (value) => {
  const preset = roomTypePresets[value];

  setNewTypeChambre((prev) => ({
    ...prev,
    type_chambreAdd: value,
    nb_litAdd: preset ? String(preset.nb_lit) : "",
    nb_salleAdd: preset ? String(preset.nb_salle) : "",
    commentaireAdd: preset ? preset.commentaire : "",
  }));
};
const handleAddTypeChambre = async () => {
  const validationErrors = validateAddTypeChambre();

  if (Object.keys(validationErrors).length > 0) {
    setTypeErrors(validationErrors);

    Swal.fire({
      icon: "error",
      title: "Champs invalides",
      text: "Veuillez remplir correctement les champs obligatoires.",
    });

    return;
  }

  try {
    const payload = {
      code: newTypeChambre.codeAdd.trim(),
      type_chambre: newTypeChambre.type_chambreAdd.trim(),
      nb_lit: Number(newTypeChambre.nb_litAdd),
      nb_salle: Number(newTypeChambre.nb_salleAdd),
      commentaire: newTypeChambre.commentaireAdd?.trim() || null,
    };

    console.log("Payload Type Chambre:", payload);

    const response = await axios.post(
      "http://localhost:8000/api/types-chambre",
      payload
    );

    if (response.status === 201) {
      await fetchChambres();

      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Type Chambre ajoutée avec succès.",
      });

      resetAddTypeChambreForm();
      setShowAddCategory(false);
    }
  } catch (error) {
    console.error("Add type error:", error.response?.data || error);

    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      const messages = Object.values(validationErrors).flat();

      Swal.fire({
        icon: "warning",
        title: "Erreur de validation",
        html: `
          <div style="text-align:left">
            ${messages.map((msg) => `<p>${msg}</p>`).join("")}
          </div>
        `,
      });

      return;
    }

    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Impossible d'ajouter le type de chambre.",
    });
  }
};
const handleDeleteTypeChambre = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/types-chambre/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Tarif Chambre supprimée avec succès.",
    });
    await fetchChambres(); // Refresh categories after adding

  } catch (error) {
    console.error("Error deleting categorie:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Échec de la suppression du chambre.",
    });
  }
};
const handleEditTypeChambre
= (categorieId) => {
  setEditingType(categorieId);
  setNewTypeChambre(categorieId);
  setTypeErrors({...typeErrors, 
    codeAdd: "",
    type_chambreAdd: "",
    nb_litAdd: "",
    nb_salleAdd: "",
    commentaireAdd: "",
  })
  setCategorie(categorieId.id)
  setShowEditModal(true);
};
const handleSaveTypeChambre = async () => {
  try {
    const hasErrors = Object.values(typeErrors).some(error => error === true);
      if (hasErrors) {
        alert(JSON.stringify(typeErrors))
        return;
      }
    await axios.put(`http://localhost:8000/api/types-chambre/${categorieId}`, newTypeChambre);
    await fetchChambres(); // Refresh categories after adding
    setShowEditModal(false);
    setSelectedCategoryId([])
    // Fermer le modal
            Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Tarif Chambre modifiée avec succès.",
      });
  } catch (error) {
    console.error("Erreur lors de la modification de la catégorie :", error);
  }
};
const closeTypeForm = () => {
  setShowEditModal(false)
  // setNewTypeChambre({...newTypeChambre, 
  //   codeAdd: "",
  //   type_chambreAdd: "",
  //   nb_litAdd: "",
  //   nb_salleAdd: "",
  //   commentaireAdd: "",
  // });
  setTypeErrors({...typeErrors, 
    codeAdd: "",
    type_chambreAdd: "",
    nb_litAdd: "",
    nb_salleAdd: "",
    commentaireAdd: "",
  })
}
const closeEtageForm = () => {
  setShowEditModalEtage(false);
  setEtageErrors({...etageErrors, 
    etageAdd: ""
  });
  setNewEtage({...newEtage, 
    etageAdd: ""
  })
}
useEffect(() => {
  if (!showEditModalEtage)
    setEtageErrors({...etageErrors, 
      etageAdd: ""
    });
},[showEditModalEtage])

// Define table columns (customize render as needed)
const columns = [
  { key: "num_chambre", label: "Num Chambre" },
  { key: "type_chambre", label: "Type", render: (item) => item.type_chambre?.type_chambre || item.type_chambres?.type_chambre || '' },
  { key: "etage", label: "Etage", render: (item) => item.etage?.etage || '' },
  { key: "vue", label: "Vue", render: (item) => item.vue?.vue || '' },
  { key: "nb_lit", label: "Nombre de lit" },
  { key: "nb_salle", label: "Nombre de Salle" },
  { key: "climat", label: "Climat", render: (item) => item.climat ? "Oui" : "Non" },
  { key: "wifi", label: "Wifi", render: (item) => item.wifi ? "Oui" : "Non" },
];

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles}}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>

       
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ marginTop: "15px" }}
          >
            <h3 className="titreColore" style={{
              
                color: "#333",
                padding: "10px 20px",
                
              }}>
              Liste des Chambres
                
            </h3>
            <div className="d-flex">
              <div style={{ width: "500px", marginRight: "20px" }}>
                <Search onSearch={handleSearch} type="search" />
              </div>


              <div>
              <FontAwesomeIcon
    style={{
      cursor: "pointer",
      color: "grey",
      fontSize: "2rem",
    }}
    onClick={printTable}  
    icon={faPrint}
    className="me-2"
  />
                  <FontAwesomeIcon
      style={{
        cursor: "pointer",
        color: "red",
        fontSize: "2rem",
        marginLeft: "15px",
      }}
      onClick={exportToPDF}
            icon={faFilePdf}
    />

                <FontAwesomeIcon
                  icon={faFileExcel}
                  onClick={exportToExcel}
                  style={{
                    cursor: "pointer",
                    color: "green",
                    fontSize: "2rem",
                    marginLeft: "15px",
                  }}
                />
              </div>
            </div>
          </div>

          
            <div className="d-flex">
            <div style={{width:'50%',height:'50%',marginTop:'-15px', marginRight: '5px'}}>
              <h5 className="container-d-flex justify-content-start AjouteBotton"style={{marginBottom:'-3px'}} >Vues du Chambre</h5>
              <div className="bgSecteur d-flex justify-content-around">
              <Carousel 
  activeIndex={activeVueIndex}
  onSelect={handleVueSelect}
  interval={null}
  nextIcon={<FaArrowRight size="2x" color="white" style={{ backgroundColor: "black", borderRadius: '50%' }} />}
  prevIcon={<FaArrowLeft size="2x" color="white" style={{ backgroundColor: "black", borderRadius: '50%' }} />}
>
                {chunks?.map((chunk, chunkIndex) => (
    <Carousel.Item key={chunkIndex}>
                    <div className="d-flex justify-content-start" >
                      <a href="#" style={{marginLeft:'60px'}}>
                        <div
                          className={`category-item ${selectedVue === '' ? 'active' : ''}`} 
                          onClick={() => handleVueFilterChange("")}
                        >
                          <img
                            src={'../../images/bayd.jpg'}
                            alt={'tout'}
                            loading="lazy"
                            className={`rounded-circle category-img ${selectedVue === '' ? 'selected' : ''}`}
                          />
                          <p className="category-text">Tout</p>
                        </div>
                      </a>
                      {chunk?.map((category, index) => (
              <a href="#" className="mx-5" key={index}>
              <div 
              className={`category-item ${selectedVue === category.id ? 'active' : ''}`} 
              onClick={() => handleVueFilterChange(category.id)}
              >
              <img
                src={category.photo ? `http://127.0.0.1:8000/storage/${category.photo}` : "http://127.0.0.1:8000/storage/vue-img.webp"}
                alt={category.vue}
                loading="lazy"
                className={`rounded-circle category-img ${selectedVue === category.id ? 'selected' : ''}`}
              />
              <p className="category-text">{category.vue}</p>
              </div>
              </a>
              ))}
      </div>
    </Carousel.Item>
  ))}
</Carousel>
</div>
</div>
<div style={{width:'50%',height:'50%',marginTop:'-15px', marginRight: '5px'}}>
              <h5 className="container-d-flex justify-content-start AjouteBotton" style={{marginBottom:'-3px', zIndex: 9999}} >Etages du Chambre</h5>
              <div className="bgSecteur d-flex justify-content-around">
              <Carousel 
  activeIndex={activeEtageIndex}
  onSelect={handleEtageSelect}
  interval={null}
  nextIcon={<FaArrowRight size="2x" color="white" style={{ backgroundColor: "black", borderRadius: '50%' }} />}
  prevIcon={<FaArrowLeft size="2x" color="white" style={{ backgroundColor: "black", borderRadius: '50%' }} />}
>
  {chunks1?.map((chunk, chunkIndex) => (
    <Carousel.Item key={chunkIndex}>
                    <div className="d-flex justify-content-start">
                      <a href="#" style={{marginLeft:'60px'}}>
                        <div
                          className={`category-item ${selectedEtage === '' ? 'active' : ''}`} 
                          onClick={() => handleEtageFilterChange("")}
                        >
                          <img
                            src={'../../images/bayd.jpg'}
                            alt={'tout'}
                            loading="lazy"
                            className={`rounded-circle category-img ${selectedEtage === '' ? 'selected' : ''}`}
                          />
                          <p className="category-text">Tout</p>
                        </div>
                      </a>
                      {chunk?.map((category, index) => (
              <a href="#" className="mx-5" key={index}>
              <div 
              className={`category-item ${selectedEtage === category.id ? 'active' : ''}`} 
              onClick={() => handleEtageFilterChange(category.id)}
              >
              <img
              src={category.photo ? `http://127.0.0.1:8000/storage/${category.photo}` : "http://127.0.0.1:8000/storage/etage-img.webp"}
              alt={category.etage}
              loading="lazy"
              className={`rounded-circle category-img ${selectedEtage === category.id ? 'selected' : ''}`}
              />
              <p className="category-text">{category.etage}</p>
              </div>
              </a>
              ))}
      </div>
    </Carousel.Item>
  ))}
</Carousel>
</div>
</div>
</div>


<div className="container-d-flex justify-content-start">
            <div style={{ display: "flex", alignItems: "center" ,marginTop:'-16px' ,padding:'15px'}}>
             
              <a
                onClick={handleShowFormButtonClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  marginTop: "5px",
                  backgroundColor: "#00afaa",
                  color: "white",
                  borderRadius: "10px",
                  fontWeight: "bold"  , 
                  marginLeft: "98.5%",
                  padding: "6px 15px",
                  height: "40px",
                }}
                className="gap-2 AjouteBotton"
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  style={{ cursor: "pointer" ,color: "white" }}
                />
              </a>

            </div>
          

        <div style={{ marginTop:"0px",}}>
        <div id="formContainer" style={{...formContainerStyle, marginTop:'0px', maxHeight:'700px', overflow:'auto', padding:'20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: "#fff"}}>
            <Form className="col row" onSubmit={handleSubmit}>
              <Form.Label className="text-center">
                <h4 style={{ 
                  fontSize: "25px", 
                  fontFamily: "Arial, sans-serif", 
                  fontWeight: "bold", 
                  color: "black",
                  borderBottom: "2px solid black", 
                  paddingBottom: "5px",
                }}>
                  {editingChambre ? "Modifier" : "Ajouter"} une Chambre
                </h4>
              </Form.Label>
              <div className="row">
                <Form.Group className="col-md-6 mb-3" controlId="num_chambre">
                  <Form.Label>Numero de Chambre</Form.Label>
                  <Form.Control
                    type="number"
                    name="num_chambre"
                    isInvalid={submitted && !!errors.num_chambre}
                    value={formData.num_chambre}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.num_chambre}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="col-md-6 mb-3" controlId="type_chambre">
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="text-primary me-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
  resetAddTypeChambreForm();
  setShowAddCategory(true);
}}
                    />
                    <Form.Label>Type</Form.Label>
                  </div>
                  <Form.Select
                    name="type_chambre"
                    isInvalid={submitted && !!errors.type_chambre}
                    value={formData.type_chambre}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner Type</option>
                    {types?.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.type_chambre}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.type_chambre}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>


              <div className="row">
                <Form.Group className="col-md-6 mb-3" controlId="vue">
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="text-primary me-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowAddVue(true)}
                    />
                    <Form.Label>Vue</Form.Label>
                  </div>
                  <Form.Select
                    name="vue"
                    isInvalid={submitted && !!errors.vue}
                    value={selectedVue || formData.vue}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner une Vue</option>
                    {vues?.map((vue) => (
                      <option value={vue?.id}>{vue?.vue}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.vue}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="col-md-6 mb-3" controlId="etage">
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="text-primary me-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowAddEtage(true)}
                    />
                    <Form.Label>Etage</Form.Label>
                  </div>
                  <Form.Select
                    name="etage"
                    isInvalid={submitted && !!errors.etage}
                    value={selectedEtage || formData.etage}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner un Etage</option>
                    {etages?.map((etage) => (
                      <option value={etage?.id}>{etage?.etage}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.etage}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
                <Modal show={showEditModalVue} onHide={() => setShowEditModalVue(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une Vue</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
                <Form.Label>Photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    onChange={(e) => setNewVue({ ...newVue, photo: e.target.files[0] })}
                    className="form-control"
                    lang="fr"
                  />
                  <Form.Text className="text-danger">{errors.photo}</Form.Text>
                </Form.Group>
            <Form.Group>
              <Form.Label>Vue</Form.Label>
              <Form.Control
                type="text"
                placeholder="Vue"
                name="vue"
                isInvalid={!!vueErrors.vue}
                value={newVue.vue}
                onChange={(e) => setNewVue({ ...newVue, vue: e.target.value })}/>
            </Form.Group>
      </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveVue}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowEditModalVue(false)}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
    <Modal show={showEditModalEtage} onHide={() => setShowEditModalEtage(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une Etage</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
                <Form.Label>Photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    onChange={(e) => setNewEtage({ ...newEtage, photo: e.target.files[0] })}
                    className="form-control"
                    lang="fr"
                  />
                  <Form.Text className="text-danger">{errors.photo}</Form.Text>
                </Form.Group>
            <Form.Group>
              <Form.Label>Etage</Form.Label>
              <Form.Control
                type="text"
                placeholder="Etage"
                name="etage"
                isInvalid={!!etageErrors.etage}
                value={newEtage.etage}
                onChange={(e) => setNewEtage({ ...newEtage, etage: e.target.value })}/>
            </Form.Group>
      </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveEtage}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={closeEtageForm} >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
                <Modal show={showAddVue} onHide={() => setShowAddVue(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Vue</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form encType="multipart/form-data">
          <Form.Group>
                <Form.Label>Photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    isInvalid={!!vueErrors.photo}
                    onChange={(e) => setNewVue({ ...newVue, photo: e.target.files[0] })}
                    className="form-control"
                    lang="fr"
                  />
                  <Form.Text className="text-danger">{errors.photo}</Form.Text>
                </Form.Group>



            <Form.Group>
              <Form.Label>Vue</Form.Label>
              <Form.Control
                type="text"
                placeholder="Vue"
                name="vue"
                isInvalid={!!vueErrors.vueAdd}
                onChange={(e) => setNewVue({ ...newVue, vueAdd: e.target.value })}
              />
            </Form.Group>
      </Form>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3" style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table table-bordred">
              <thead>
                <tr>
                  <th>Vue</th>
                  <th>Photo</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vues?.map(categ => (
                  <tr>
                    <td>{categ?.vue}</td>
                    <td>  
                    <img
                      src={categ.photo ? `http://127.0.0.1:8000/storage/${categ.photo}` : "http://127.0.0.1:8000/storage/vue-img.webp"}
                      alt={categ.vue}
                      loading="lazy"
                      className={`rounded-circle category-img`}
                      />
                    </td>
                    <td>
                        <FontAwesomeIcon
                                  onClick={() => handleEditVue(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteVue(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddVue}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddVue(false)}
  >
    Annuler
  </Fab>
  </Form.Group>
      </Modal.Body>
      </Modal>
      <Modal show={showAddEtage} onHide={() => setShowAddEtage(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Etage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form encType="multipart/form-data">
          <Form.Group>
                <Form.Label>Photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    onChange={(e) => setNewEtage({ ...newEtage, photo: e.target.files[0] })}
                    className="form-control"
                    lang="fr"
                  />
                  <Form.Text className="text-danger">{errors.photo}</Form.Text>
                </Form.Group>
            <Form.Group>
              <Form.Label>Etage</Form.Label>
              <Form.Control
                type="text"
                placeholder="Etage"
                name="etage"
                isInvalid={!!etageErrors.etageAdd}
                onChange={(e) => setNewEtage({ ...newEtage, etageAdd: e.target.value })}
              />
            </Form.Group>
      </Form>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3" style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table table-bordred">
              <thead>
                <tr>
                  <th>Etage</th>
                  <th>Photo</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {etages?.map(categ => (
                  <tr>
                    <td>{categ?.etage}</td>
                    <td>  
                    <img
                        src={categ.photo ? `http://127.0.0.1:8000/storage/${categ.photo}` : "http://127.0.0.1:8000/storage/etage-img.webp"}
                        alt={categ.etage}
                        loading="lazy"
                        className={`rounded-circle category-img`}
                      />
                    </td>
                    <td>
                        <FontAwesomeIcon
                                  onClick={() => handleEditEtage(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteEtage(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
          <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddEtage}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddEtage(false)}
  >
    Annuler
  </Fab>
  </Form.Group>
      </Modal.Body>
      </Modal>
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier Type de Chambre</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
        <Form.Group>
              <Form.Label>Code Chambre</Form.Label>
              <Form.Control
                type="text"
                placeholder="Code Chambre"
                name="code"
                isInvalid={!!typeErrors.code}
                value={newTypeChambre.code}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, code: e.target.value })}
              />
            </Form.Group>
        <Form.Group>
              <Form.Label>Type Chambre</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type de Chambre"
                name="type_chambre"
                isInvalid={!!typeErrors.type_chambre}
                value={newTypeChambre.type_chambre}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, type_chambre: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Nombre de Lit</Form.Label>
              <Form.Control
                type="number"
                placeholder="Nombre de Lit"
                name="nb_lit"
                isInvalid={!!typeErrors.nb_lit}
                value={newTypeChambre.nb_lit}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, nb_lit: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Nombre de Salle</Form.Label>
              <Form.Control
                type="number"
                placeholder="Nombre de Salle"
                name="nb_salle"
                isInvalid={!!typeErrors.nb_salle}
                value={newTypeChambre.nb_salle}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, nb_salle: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Commentaire</Form.Label>
              <Form.Control
                type="text"
                placeholder="Commentaire"
                name="commentaire"
                isInvalid={!!typeErrors.commentaire}
                value={newTypeChambre.commentaire}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, commentaire: e.target.value })}
              />
            </Form.Group>
        </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveTypeChambre}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2" 
    onClick={closeTypeForm}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
                  <Modal show={showAddCategory} onHide={() => {
  resetAddTypeChambreForm();
  setShowAddCategory(false);
}}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
  <Form.Label>Mode de création</Form.Label>
  <Form.Select
    value={typeCreationMode}
    onChange={(e) => {
      setTypeCreationMode(e.target.value);

      setNewTypeChambre((prev) => ({
        ...prev,
        type_chambreAdd: "",
        nb_litAdd: "",
        nb_salleAdd: "",
        commentaireAdd: "",
      }));
    }}
  >
    <option value="preset">Type prédéfini</option>
    <option value="custom">Type personnalisé</option>
  </Form.Select>
</Form.Group>

          <Form.Group>
              <Form.Label>Code</Form.Label>
<Form.Control
  type="text"
  placeholder="Code"
  value={newTypeChambre.codeAdd}
  isInvalid={!!typeErrors.codeAdd}
  onChange={(e) =>
    setNewTypeChambre({
      ...newTypeChambre,
      codeAdd: e.target.value,
    })
  }
/>
<Form.Control.Feedback type="invalid">
  {typeErrors.codeAdd}
</Form.Control.Feedback>
            </Form.Group>
<Form.Group className="mb-3">
  <Form.Label>Type Chambre</Form.Label>

  {typeCreationMode === "preset" ? (
    <Form.Select
      value={newTypeChambre.type_chambreAdd}
      isInvalid={!!typeErrors.type_chambreAdd}
      onChange={(e) => handlePresetTypeChange(e.target.value)}
    >
      <option value="">Sélectionner un type prédéfini</option>
      {Object.keys(roomTypePresets).map((typeName) => (
        <option key={typeName} value={typeName}>
          {typeName}
        </option>
      ))}
    </Form.Select>
  ) : (
    <Form.Control
      type="text"
      placeholder="Ex: Suite royale"
      value={newTypeChambre.type_chambreAdd}
      isInvalid={!!typeErrors.type_chambreAdd}
      onChange={(e) =>
        setNewTypeChambre({
          ...newTypeChambre,
          type_chambreAdd: e.target.value,
        })
      }
    />
  )}

  <Form.Control.Feedback type="invalid">
    {typeErrors.type_chambreAdd}
  </Form.Control.Feedback>
</Form.Group>            
            <Form.Group>
              <Form.Label>Nombre de Lit</Form.Label>
<Form.Control
  type="number"
  min="1"
  placeholder="Nombre de lits"
  value={newTypeChambre.nb_litAdd}
  readOnly={typeCreationMode === "preset"}
  isInvalid={!!typeErrors.nb_litAdd}
  onChange={(e) =>
    setNewTypeChambre({
      ...newTypeChambre,
      nb_litAdd: e.target.value,
    })
  }
/>
<Form.Control.Feedback type="invalid">
  {typeErrors.nb_litAdd}
</Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Form.Label>Nombre de Salle</Form.Label>
<Form.Control
  type="number"
  min="1"
  placeholder="Nombre de salles"
  value={newTypeChambre.nb_salleAdd}
  readOnly={typeCreationMode === "preset"}
  isInvalid={!!typeErrors.nb_salleAdd}
  onChange={(e) =>
    setNewTypeChambre({
      ...newTypeChambre,
      nb_salleAdd: e.target.value,
    })
  }
/>
<Form.Control.Feedback type="invalid">
  {typeErrors.nb_salleAdd}
</Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group>
              <Form.Label>Commentaire</Form.Label>
<Form.Control
  as="textarea"
  rows={2}
  placeholder="Commentaire optionnel"
  value={newTypeChambre.commentaireAdd}
  onChange={(e) =>
    setNewTypeChambre({
      ...newTypeChambre,
      commentaireAdd: e.target.value,
    })
  }
/>
            </Form.Group>
          
            <Form.Group className="mt-3">
            <div className="form-group mt-3" style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table table-bordred">
              <thead>
                <tr>
                  <th>Code Chambre</th>
                  <th>Type Chambre</th>
                  <th>Nombre de Lit</th>
                  <th>Nombre de Salle</th>
                  <th>Commentaire</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {types?.map(categ => (
                  <tr>
                    <td>{categ.code}</td>
                    <td>{categ.type_chambre}</td>
                    <td>{categ.nb_lit}</td>
                    <td>{categ.nb_salle}</td>
                    <td>{categ.commentaire}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditTypeChambre(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteTypeChambre(categ.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </Form.Group>
            
          </Form>
        </Modal.Body>
        
          
          
        <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleAddTypeChambre}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={() => setShowAddCategory(false)}
  >
    Annuler
  </Fab>
  </Form.Group>
        
      </Modal>

<div className="row">
                <Form.Group className="col-md-6 mb-3" controlId="nb_salle">
                  <Form.Label>Nombre de Salle</Form.Label>
                  <Form.Select
                    name="nb_salle"
                    isInvalid={submitted && !!errors.nb_salle}
                    value={formData.nb_salle}
                    onChange={handleChange}
                    readOnly
                  >
                    <option value="">Nombre de Salle</option>
                    {Array.from({ length: 7 }, (_, i) => (
                      <option key={i} value={i + 1}>{i + 1}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.nb_salle}
                  </Form.Control.Feedback>
                </Form.Group>

<Form.Group className="col-md-6 mb-3" controlId="nb_lit">
                  <Form.Label>Nombre de Lit</Form.Label>
                  <Form.Select
                    name="nb_lit"
                    isInvalid={submitted && !!errors.nb_lit}
                    value={formData.nb_lit}
                    onChange={handleChange}
                    readOnly
                  >
                    <option value="">Nombre de Lit</option>
                    {Array.from({ length: 7 }, (_, i) => (
                      <option key={i} value={i + 1}>{i + 1}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.nb_lit}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>


              <Form.Group className="col-md-6 mb-3" controlId="climat">
                <Form.Label>Climat</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    label="Oui"
                    name="climat"
                    value="oui"
                    checked={formData.climat === 'oui'}
                    onChange={handleChange}
                    isInvalid={submitted && !!errors.climat}
                  />
                  <Form.Check
                    type="radio"
                    label="Non"
                    name="climat"
                    value="non"
                    checked={formData.climat === 'non'}
                    onChange={handleChange}
                    isInvalid={submitted && !!errors.climat}
                  />
                </div>
                <Form.Control.Feedback type="invalid">
                  {errors.climat}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="col-md-6 mb-3" controlId="wifi">
                <Form.Label>Wifi</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    label="Oui"
                    name="wifi"
                    value="oui"
                    checked={formData.wifi === 'oui'}
                    onChange={handleChange}
                    isInvalid={submitted && !!errors.wifi}
                  />
                  <Form.Check
                    type="radio"
                    label="Non"
                    name="wifi"
                    value="non"
                    checked={formData.wifi === 'non'}
                    onChange={handleChange}
                    isInvalid={submitted && !!errors.wifi}
                  />
                </div>
                <Form.Control.Feedback type="invalid">
                  {errors.wifi}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mt-5 d-flex justify-content-center">
                <Fab
                  variant="extended"
                  className="btn-sm Fab mb-2 mx-2"
                  type="submit"
                >
                  Valider
                </Fab>
                <Fab
                  variant="extended"
                  className="btn-sm FabAnnule mb-2 mx-2"
                  onClick={closeForm}
                >
                  Annuler
                </Fab>
              </Form.Group>
            </Form>
          </div>

        </div>
            
        <div className="">
          <div
            id="tableContainer"
            className="table-responsive"
            style={{...tableContainerStyle, overflowX: 'auto', minWidth: '650px', overflow: 'auto',
              marginTop:'20px',
              background: "#f9f9f9",
              borderRadius: "8px",
              boxShadow: "0px 2px 8px rgba(0,0,0,0.1)"
            }}
          >
            <ExpandRTable
            columns={columns}
            data={chambres}
            filteredData={filteredChambres}
            searchTerm={searchTerm}
            highlightText={highlightText}
            selectAll={selectedItems.length === filteredChambres.length}
            selectedItems={selectedItems}
            handleSelectAllChange={handleSelectAllChange}
            handleCheckboxChange={handleCheckboxChange}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleDeleteSelected={handleDeleteSelected}
            rowsPerPage={rowsPerPage}
            page={page}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            expandedRows={expandedRows}
            toggleRowExpansion={toggleRow}
            renderExpandedRow={(item) => <></>}
            renderCustomActions={null}
          />
    </div>
 
              
        </div>
      </div>
           
    </Box>
    </Box>
    </ThemeProvider>
   );
 };
 
export default Chambre;