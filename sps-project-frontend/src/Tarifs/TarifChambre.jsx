import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button, Modal, Carousel } from "react-bootstrap";
import { highlightText } from '../utils/textUtils';
import TablePagination from "@mui/material/TablePagination";
// import PrintList from "./PrintList";
// import ExportPdfButton from "./exportToPdf";
import "jspdf-autotable";
import Search from "../Acceuil/Search";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PeopleIcon from "@mui/icons-material/People";
import jsPDF from 'jspdf';
// import SearchWithExport from "../components/SearchWithExport";
// import CarouselSelector from "../components/CarouselSelector";
import SearchWithExportCarousel from "../components/SearchWithExportCarousel";

import 'jspdf-autotable';
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

//------------------------- Tarifs Chambre ---------------------//
const TarifChambre = () => {
  const [tarifChambre, setTarifChambre] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);


  const [tarifsChambre, setTarifsChambre] = useState([]);

  // -------------------Filtre Tarifs Chambre -----------------------//
  const carouselOptions = tarifsChambre?.map((item) => ({
    id: item.id,
    label: item.designation,
    image: item.photo ? `http://127.0.0.1:8000/storage/${item.photo}` : "http://localhost:8000/storage/repas-img.webp",
  }));
  

  //---------------form-------------------//
  const [newTypeChambre, setNewTypeChambre] = useState({
    code: "",
    type_chambre: "",
    nb_lit: "",
    nb_salle: "",
    commentaire: "",
    lit_supp: ""
  });
  const [editingTypeChambre, setEditingTypeChambre] = useState({})
  const [editingDesignation, setEditingDesignation] = useState({})

  const [hasSubmitted, setHasSubmitted] = useState(false); // Track form submission state
  const [hasSubmittedAjoutTarif, setHasSubmittedAjoutTarif] = useState(false);
  
  const [newDesignation, setNewDesignation] = useState({
    id: "",
    created_at: "",
    updated_at: "",
    designation: "",
    photo: ""
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditModalDesignation, setShowEditModalDesignation] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState([]);
  const [categorieId, setCategorie] = useState();

const [typeChambre, setTypeChambre] = useState('');

const [typesChambre, setTypesChambre] = useState([]);


  const [showForm, setShowForm] = useState(false);
  
  
  const [formData, setFormData] = useState({
    code: "",
    type_chambre: "", 	
    designation: "",
    single: "",
    double: "",
    triple: "",
    lit_supp: "",
  });
  const [formDataDesignation, setFormDataDesignation] = useState({
    designation: "", 	
    photo: "",
  });
  const [errors, setErrors] = useState({
    code: "",
    type_chambre: "", 
    designation: "",		
    single: "",
    double: "",
    triple: "",
    lit_supp: "",
  });
  const [typeErrors, setTypeErrors] = useState({
    code: "",
    type_chambre: "", 
    nb_salle: "",		
    nb_lit: "",
    nb_litAdd: "",
    commentaire: "",
  });
  const [tarifChambreErrors, setTarifChambreErrors] = useState({
    designation: "",
    photo: null
  })
  
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  //-------------------edit-----------------------//
  const [editingTarifChambre, setEditingTarifChambre] = useState(null); // State to hold the client being edited
  const [editingTarifChambreId, setEditingTarifChambreId] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false); 
  const [showAddDesignation, setShowAddDesignation] = useState(false); 
  const [showAddRepas, setShowAddRepas] = useState(false); 
  const [showAddCategorySite, setShowAddCategorySite] = useState(false); // Gère l'affichage du formulaire

  const [showAddRegein, setShowAddRegein] = useState(false); // Gère l'affichage du formulaire
  const [showAddRegeinSite, setShowAddRegeinSite] = useState(false); // Gère l'affichage du formulaire

  const [showAddSecteur, setShowAddSecteur] = useState(false); // Gère l'affichage du formulaire

  const [showAddMod, setShowAddMod] = useState(false); // Gère l'affichage du formulaire

  //-------------------Pagination-----------------------/
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [filteredTarifChambre, setFilteredTarifChambre] = useState([]);
  // Pagination calculations
  const indexOfLastTarif = (page + 1) * rowsPerPage;
  const indexOfFirstTarif = indexOfLastTarif - rowsPerPage;
  const currentChambres = tarifChambre?.slice(indexOfFirstTarif, indexOfLastTarif);
  //-------------------Selected-----------------------/
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  //-------------------Search-----------------------/
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTarifChambreId, setSelectedTarifChambreId] = useState(null);
  //------------------------Site-Client---------------------
  const [editingsitechambre, setEditingsitechambre] = useState(null);
  const [editingsitechambreId, setEditingsitechambreId] = useState(null);

  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedRowsContact, setExpandedRowsContact] = useState([]);
  const [expandedRowsContactSite, setExpandedRowsContactsite] = useState([]);


  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [selectedProductsDataRep, setSelectedProductsDataRep] = useState([]);


  const fetchTarifChambre = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/tarifs-chambre");
      const data = response.data;
  
      setTarifChambre(data.tarifsChambreDetail);
      setTarifsChambre(data.tarifsChambre);
      setTypesChambre(data.typesChambre);
  
      localStorage.setItem("tarifChambre", JSON.stringify(data.tarifsChambreDetail));
      localStorage.setItem("tarifsChambre", JSON.stringify(data.tarifsChambre));
      localStorage.setItem("typesChambre", JSON.stringify(data.typesChambre));
    } catch (error) {
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la liste des Tarifs Chambre.",
        });
      }
    }
  };
  
  useEffect(() => {
    const storedTarifChambre = localStorage.getItem("tarifChambre");
    const storedTarifsChambre = localStorage.getItem("tarifsChambre");
    const storedTypesChambre = localStorage.getItem("typesChambre");
    storedTarifsChambre && setTarifsChambre(JSON.parse(storedTarifsChambre));
    storedTarifChambre && setTarifChambre(JSON.parse(storedTarifChambre));
    storedTypesChambre && setTypesChambre(JSON.parse(storedTypesChambre));

    if (!storedTarifChambre || !storedTypesChambre || !storedTarifsChambre)
      fetchTarifChambre();
    
  }, []);


  const toggleRow = (tarifChambreId) => {
    setExpandedRows((prevExpandedRows) =>
      prevExpandedRows.includes(tarifChambreId)
        ? prevExpandedRows?.filter((id) => id !== tarifChambreId)
        : [...prevExpandedRows, tarifChambreId]
    );
  };
  const toggleRowContact = (tarifChambreId) => {
    setExpandedRowsContact((prevExpandedRows) =>
      prevExpandedRows.includes(tarifChambreId)
        ? prevExpandedRows?.filter((id) => id !== tarifChambreId)
        : [...prevExpandedRows, tarifChambreId]
    );
  };
  const toggleRowContactSite = (TarifChambreId) => {
    setExpandedRowsContactsite((prevExpandedRows) =>
      prevExpandedRows.includes(TarifChambreId)
        ? prevExpandedRows?.filter((id) => id !== TarifChambreId)
        : [...prevExpandedRows, TarifChambreId]
    );
  };
  //---------------------------------------------


  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.type === "file" ? e.target.files[0] : e.target.value,
    });
  };

  // const handleChange = (e) => {
  //   setUser({
  //     ...user,
  //     [e.target.name]:
  //       e.target.type === "file" ? e.target.files[0] : e.target.value,
  //   });
  // };
  //------------------------- tarif Chambre EDIT---------------------//

  const handleEdit = (tarifChambre) => {
    setErrors({})
    setEditingTarifChambre(tarifChambre); 
    
    
    // Populate form data with tarif Chambre details
    setFormData({
      code: tarifChambre.code || "",
        type_chambre: tarifChambre.type_chambre.id || "",
        designation: tarifChambre.tarif_chambre.id || "",
        single: tarifChambre.single || "",
        double: tarifChambre?.double || "",
        triple: tarifChambre?.triple || "",
        lit_supp: tarifChambre?.lit_supp || "",
  });
      // Sélectionner automatiquement la ligne à modifier
      setSelectedItems([tarifChambre.id]);

    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    } 
  };


  useEffect(() => {
    if (editingTarifChambreId !== null) {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    }
  }, [editingTarifChambreId]);

  useEffect(() => {
    const validateData = () => {
      const newErrors = { ...errors };
      const newTypeErrors = { ...typeErrors };
      const newTarifChambreErrors = { ...tarifChambreErrors };
      // Validation L'insertion de Tarif Chambre Detail
      const codes = tarifChambre.filter((chambre) => chambre.code);
      newErrors.designation = (selectedCategory || formData.designation) === "";
      newErrors.type_chambre = formData.type_chambre === "";
      newErrors.single = formData.single === "";
      if (!editingTarifChambre)
        newErrors.code = formData.code === "" || codes.some((chambre) => sanitizeInput(chambre.code) === sanitizeInput(formData.code));
      else
      newErrors.code = (formData.code === "" || codes.some((chambre) => sanitizeInput(chambre.code) === sanitizeInput(formData.code))) 
    && sanitizeInput(editingTarifChambre.code) != sanitizeInput(formData.code);
      newErrors.double = formData.double === "";
      newErrors.triple = formData.triple === "";
      newErrors.lit_supp = formData.lit_supp === "";
      // newErrors.montant = formData.montant < 5 || formData.montant == null;
      // Validation L'insertion de Type Chambre
      const typesCodes = typesChambre.filter((chambre) => chambre.code);
      if (!newTypeChambre)
      newTypeErrors.code = newTypeChambre.code === "" || typesCodes.some((chambre) => sanitizeInput(chambre.code) === sanitizeInput(newTypeChambre.code));
      else 
      newTypeErrors.code = newTypeChambre.code === "" || typesCodes.some((chambre) => sanitizeInput(chambre.code) === sanitizeInput(newTypeChambre.code)) 
      && sanitizeInput(newTypeChambre.code) != sanitizeInput(editingTypeChambre.code);
      newTypeErrors.nb_lit = newTypeChambre.nb_lit === "";
      newTypeErrors.nb_litAdd = newTypeChambre.nb_lit === "";
      newTypeErrors.nb_salle = newTypeChambre.nb_salle === "";
      newTypeErrors.commentaire = newTypeChambre.commentaire === "";
      newTypeErrors.type_chambre = newTypeChambre.type_chambre === "" || typesCodes.some((chambre) => sanitizeInput(chambre.type_chambre) === sanitizeInput(newTypeChambre.type_chambre))
      && sanitizeInput(newTypeChambre.type_chambre) != sanitizeInput(editingTypeChambre.type_chambre);
      // Validation L'insertion de Tarif Chambre (Designation & Photo)
      const designations = tarifsChambre.filter((chambre) => chambre.designation);
      newTarifChambreErrors.designation = newDesignation.designation === "" || designations.some((chambre) => sanitizeInput(chambre.designation) === sanitizeInput(newDesignation.designation))
      && sanitizeInput(newDesignation.designation || "") != sanitizeInput(editingDesignation.designation || "");
      newTarifChambreErrors.designationAdd = newDesignation.designation === "" || designations.some((chambre) => sanitizeInput(chambre.designation) === sanitizeInput(newDesignation.designation));
      // newTarifChambreErrors.photo = newDesignation.photo === "";
      setErrors(newErrors);
      setTypeErrors(newTypeErrors);
      setTarifChambreErrors(newTarifChambreErrors);
      return true;
    };
  
    validateData();
  }, [formData, newTypeChambre, newDesignation]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true); // Set hasSubmitted to true when form is submitted
    
    // Validation logic based on errors and hasSubmitted flag
    const hasErrors = Object.values(errors).some(error => error === true);
    if (hasErrors) {
        Swal.fire({
                icon: "error",
                title: "Veuillez remplir tous les champs obligatoires.",
              });
        return;
    }

    const url = editingTarifChambre 
        ? `http://localhost:8000/api/tarifs-chambre/${editingTarifChambre.id}`
        : "http://localhost:8000/api/tarifs-chambre";
    const method = editingTarifChambre ? "put" : "post";

    let requestData;

    if (editingTarifChambre) {
        requestData = {
            code: formData.code,
            type_chambre: formData.type_chambre,
            tarif_chambre: formData.designation,
            single: formData.single,
            double: formData.double,
            triple: formData.triple,
            lit_supp: formData.lit_supp,
        }
    }
    else {
        const formDatad = new FormData();
        formDatad.append("code", formData.code);
        formDatad.append("type_chambre", formData.type_chambre);
        formDatad.append("tarif_chambre", formData.designation || selectedCategory);
        formDatad.append("single", formData.single);
        formDatad.append("double", formData.double);
        formDatad.append("triple", formData.triple);
        formDatad.append("lit_supp", formData.lit_supp);
        requestData = formDatad;
    }

    try {
        const response = await axios({
            method: method,
            url: url,
            data: requestData,
        });

        if (response.status === 200 || response.status === 201) {
            fetchTarifChambre();
            const successMessage = `Tarif Chambre ${editingTarifChambre ? "modifié" : "ajouté"} avec succès.`;
            Swal.fire({
                icon: "success",
                title: "Succès!",
                text: successMessage,
            });

            // Reset form and errors
            setSelectedProductsData([]);
            setSelectedProductsDataRep([]);
            setFormData({
                code: "", 
                type_chambre: "", 
                designation: "",
                single: "",
                double: "",
                triple: "",
                lit_supp: "",
            });
            setErrors({
                code: "",
                type_chambre: "", 
                designation: "",
                single: "",
                double: "",
                triple: "",
                lit_supp: "",
            });
            setEditingTarifChambre(null);
            closeForm();
        }
    } catch (error) {
        setTimeout(() => {
            setErrors({
                code: error.response.data?.errors?.code,
                type_chambre: error.response.data?.errors?.type_chambre,
                designation: error.response.data?.errors?.tarif_chambre,
                single: error.response.data?.errors?.single,
                double: error.response.data?.errors?.double,
                triple: error.response.data?.errors?.triple,
                lit_supp: error.response.data?.errors?.lit_supp,
            });
        }, 3000);
    }
};

    //------------------------- CHAMBRE FORM---------------------//

    const handleShowFormButtonClick = () => {
      setEditingTarifChambre(null);
      setFormData({
        code: "",
        type_chambre: "",
        designation: "",
        single: "",
        double: "",
        triple: "",
        lit_supp: "",
    });

    // Reset general form errors (validation errors)
    setErrors({
        code: "",
        type_chambre: "",
        designation: "",
        single: "",
        double: "",
        triple: "",
        lit_supp: "",
    });
    
      // Désélectionner toutes les cases cochées
    setSelectedItems([]);

      if (formContainerStyle.right === "-100%") {
        setFormContainerStyle({ right: "0" });
        setTableContainerStyle({ marginRight: "650px" });
      } 
    };

    const closeForm = () => {
      // Reset styles to hide the form and reset table layout
      setFormContainerStyle({ right: "-100%" });
      setTableContainerStyle({ marginRight: "0" });
      setSelectedCategory("")
      setSelectedItems([]); // Désélectionne toutes les cases
      // Close the form by setting showForm to false
      setShowForm(false);
  
      // Reset type-specific errors
      setTypeErrors({});
  
      // Reset the form data fields to empty values
      setFormData({
          code: "",
          type_chambre: "",
          designation: "",
          single: "",
          double: "",
          triple: "",
          lit_supp: "",
      });
  
      // Reset general form errors (validation errors)
      setErrors({
          code: "",
          type_chambre: "",
          designation: "",
          single: "",
          double: "",
          triple: "",
          lit_supp: "",
      });
  
      
      // Clear the selected product data
      setSelectedProductsData([]);
      setSelectedProductsDataRep([]);
  
      // Clear any ongoing editing data
      setEditingTarifChambre(null); // Clear editing client
  
      // Reset the 'hasSubmitted' flag to ensure no validation messages are shown on reopening the form
      setHasSubmitted(false); // Reset hasSubmitted flag to false
  };
  
  //-------------------------SITE CLIENT----------------------------//
  //-------------------------  SUBMIT---------------------//
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

  const getSelectedTarifChambreIds = () => {
    return selectedItems?.map((item) => item.id);
  };
  
  
  //------------------------- CLIENT PAGINATION---------------------//

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const selectedRows = parseInt(event.target.value, 10);
    setRowsPerPage(selectedRows);
    localStorage.setItem('rowsPerPageChambres', selectedRows);  // Store in localStorage
    setPage(0);
  };

  useEffect(() => {
    const savedRowsPerPage = localStorage.getItem('rowsPerPageChambres');
    if (savedRowsPerPage) {
      setRowsPerPage(parseInt(savedRowsPerPage, 10));
    }
  }, []);

  //------------------------- CLIENT DELETE---------------------//

  const handleDelete = (designation_code) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce tarif ?",
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
          .delete(`http://localhost:8000/api/tarifs-chambre/${designation_code}`)
          .then(() => {
            fetchTarifChambre();
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Tarif Chambre supprimé avec succès.",
            });
          })
          .catch((error) => {
            if (error.response && error.response.status === 400) {
              Swal.fire({
                icon: "error",
                title: "Erreur",
                text: error.response.data.message,
              });
            }
          });
      } 
    });
  };
  
  //-------------------------Select Delete --------------------//
  const handleDeleteSelected = () => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ?",
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
        selectedItems.forEach((item) => {
          axios
            .delete(`http://localhost:8000/api/tarifs-chambre/${item}`)
            .then(() => {
              fetchTarifChambre();
              Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Tarif Chambre supprimé avec succès.",
              });
            })
            .catch((error) => {
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: error.response.data.message,
              });
            });
        });
    
      }
    });
    setSelectedItems([]);
    fetchTarifChambre();
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(tarifChambre?.map((TarifChambre) => TarifChambre.id));
    }
  };
  const handleCheckboxChange = (itemId) => {
    let updatedSelection = [...selectedItems];
  
    if (updatedSelection.includes(itemId)) {
      updatedSelection = updatedSelection.filter((id) => id !== itemId);
    } else {
      updatedSelection.push(itemId);
    }
  
    setSelectedItems(updatedSelection);
  
    // Si un seul élément est sélectionné, afficher ses infos dans le formulaire
    if (updatedSelection.length === 1) {
      const selectedTarif = tarifChambre.find((item) => item.id === updatedSelection[0]);
      if (selectedTarif) {
        setEditingTarifChambre(selectedTarif);
        setFormData({
          code: selectedTarif.code?.id || "",
          type_chambre: selectedTarif.type_chambre?.id || "",
          single: selectedTarif.single?.id || "",
          double: selectedTarif.double || "",
          triple: selectedTarif.triple || "",
          lit_supp: selectedTarif.lit_supp || "",
        });
  
        if (formContainerStyle.right === "-100%") {
          setFormContainerStyle({ right: "0" });
          setTableContainerStyle({ marginRight: "650px" });
        }
      }
    } 
    // Si aucune case n'est cochée, fermer le formulaire
    else if (updatedSelection.length === 0) {
      closeForm();
    }
  };

  const exportToExcel = () => {
    const table = document.getElementById('tarifChambreTable');
    const workbook = XLSX.utils.table_to_book(table, { sheet: 'Tarifs Chambre' });
    XLSX.writeFile(workbook, 'tarifs_chambre_table.xlsx');
  };

  
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Manually adding HTML content
    const title = 'Table Tarifs Chambre';
    doc.text(title, 14, 16);
    
    doc.autoTable({
      head: [['Type Chambre', 'Single', 'Double', 'Triple', 'Lit Supplementaires']],
      body: filteredTarifchambre?.map(tarifChambre => [
        tarifChambre?.code ? { content: 'Tarif Chambre Code', rowSpan: 1 } : '',
        tarifChambre.single || '',
        tarifChambre.double || '',
        tarifChambre.triple || '',
        tarifChambre.lit_supp || '',
      ]),
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8, overflow: 'linebreak' },
      headStyles: { fillColor: '#007bff' }
    });
  
    doc.save('tarifs_chambre_table.pdf');
  };
  

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Tarifs Chambre List</title>
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
          <h1>Tarifs Chambre List</h1>
          <table>
            <thead>
              <tr>
              <th>Tarif Chambre Code</th>
              <th>Tarif Chambre </th>
              <th>Type Chambre </th>
              <th>Single</th>
              <th>Double</th>
                <th>Triple</th>
                <th>Lit Supplementaires</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTarifchambre?.map(tarifChambre => `
                <tr>
                <td>${tarifChambre?.code || ''}</td>
                <td>${tarifChambre?.tarif_chambre?.designation || ''}</td>
                  <td>${tarifChambre?.type_chambre?.type_chambre || ''}</td>
                  <td>${tarifChambre.single || ''}</td>
                  <td>${tarifChambre.double || ''}</td>
                  <td>${tarifChambre?.triple || ''}</td>
                  <td>${tarifChambre?.lit_supp || ''}</td>
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

  document.addEventListener("change", async function (event) {
    if (event.target && event.target.id.startsWith("actionDropdown_")) {
      const [action, typeId] = event.target.value.split("_");
      if (action === "delete") {
        // Delete action
        handleDeleteChambre(typeId);
      } else if (action === "edit") {
        // Edit action
        handleEditChambre(typeId);
      }
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


const handleChambreFilterChange = (e) => {
  setTypeChambre(e.target.value);
};



const filteredTarifchambre = tarifChambre?.filter((tarifChambre) => {
  return (
    ((typeChambre ? tarifChambre?.type_chambre.type_chambre == typeChambre : true) &&
    (selectedCategory ? tarifChambre.tarif_chambre.id === selectedCategory : true)) &&
      (
        (searchTerm ? tarifChambre?.code.toLowerCase().includes(searchTerm.toLowerCase()) : true) ||
        (searchTerm ? tarifChambre?.type_chambre?.type_chambre.toLowerCase().includes(searchTerm.toLowerCase()) : true) || 
        (searchTerm ? tarifChambre?.tarif_chambre?.designation.toLowerCase().includes(searchTerm.toLowerCase()) : true) || 
        (searchTerm ? String(tarifChambre?.single).includes(searchTerm) : true) ||
        (searchTerm ? String(tarifChambre?.double).includes(searchTerm) : true) ||
        (searchTerm ? String(tarifChambre?.triple).includes(searchTerm) : true) ||
        (searchTerm ? String(tarifChambre?.lit_supp).includes(searchTerm) : true) 
      )
  );
});


const handleCloseAddTypeChambre = () => {
  setShowAddCategory(false);
  setNewTypeChambre({ code: "", type_reduction: "", nb_lit: "", nb_salle: "", commentaire: "" });
  setTypeErrors({ code: "", type_reduction: "", nb_lit: "", nb_salle: "", commentaire: "" });
  setHasSubmittedAjoutTarif(false);
};

const handleAddTypeChambre = async () => {
  setHasSubmittedAjoutTarif(true); // Marquer que le formulaire a été soumis

 

  if (!newTypeChambre.code.trim()) {
    setTarifChambreErrors(prevErrors => ({
      ...prevErrors,
      code: "Ce champ est obligatoire."
    }));
    return;
  }
  if (!newTypeChambre.type_chambre.trim()) {
    setTarifChambreErrors(prevErrors => ({
      ...prevErrors,
      type_chambre: "Ce champ est obligatoire."
    }));
    return;
  }
  if (!newTypeChambre.nb_lit.trim()) {
    setTarifChambreErrors(prevErrors => ({
      ...prevErrors,
      nb_lit: "Ce champ est obligatoire."
    }));
    return;
  }
  if (!newTypeChambre.nb_salle.trim()) {
    setTarifChambreErrors(prevErrors => ({
      ...prevErrors,
      nb_salle: "Ce champ est obligatoire."
    }));
    return;
  }
  if (!newTypeChambre.commentaire.trim()) {
    setTarifChambreErrors(prevErrors => ({
      ...prevErrors,
      commentaire: "Ce champ est obligatoire."
    }));
    return;
  }

  // Vérifier si `code` ou `type_reduction` existent déjà
    const codeExists = typesChambre.some(type => sanitizeInput(type.code) === sanitizeInput(newTypeChambre.code));
    const typeExists = typesChambre.some(type => sanitizeInput(type.type_chambre) === sanitizeInput(newTypeChambre.type_chambre));
  
    if (codeExists || typeExists) {
      Swal.fire({
        icon: "error",
        title: "Duplication détectée",
        text: `${codeExists ? "Ce code existe déjà." : ""} ${typeExists ? "Ce type de réduction existe déjà." : ""}`,
      });
      return;
    }
  try {
    const formData = new FormData();
    formData.append("code", newTypeChambre.code);
    formData.append("type_chambre", newTypeChambre.type_chambre);
    formData.append("nb_lit", newTypeChambre.nb_lit);
    formData.append("nb_salle", newTypeChambre.nb_salle);
    formData.append("commentaire", newTypeChambre.commentaire);
    const response = await axios.post("http://localhost:8000/api/types-chambre", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    await fetchTarifChambre();
    if (response.status === 201) {
            Swal.fire({
                        icon: "success",
                        title: "Succès!",
                        text: "Type Chambre ajoutée avec succès.",
                      });
      setShowAddCategory(false);
      setNewTypeChambre({ code: "", type_chambre: "", nb_lit: "", nb_salle: "", commentaire: "" });
      setTypeErrors({ code: "", type_reduction: "", nb_lit: "", nb_salle: "", commentaire: "" });
      setHasSubmittedAjoutTarif(false);
    }
  } catch (error) {
    setErrors({
      code: error.response.data?.errors?.code,
      type_chambre: error.response.data?.errors?.type_chambre,
      nb_lit: error.response.data?.errors?.nb_lit,
      nb_salle: error.response.data?.errors?.nb_salle,
      commentaire: error.response.data?.errors?.commentaire,
    });
  }
};

const handleCloseTarifChambre = () => {
  setShowAddDesignation(false);
  setNewDesignation({ designation: "", photo: "" });
  setTarifChambreErrors({ designation: "", photo: null });
  setHasSubmittedAjoutTarif(false);
};


const handleAddDesignation = async () => {
  setHasSubmittedAjoutTarif(true); // Indique que le formulaire a été soumis

  // Vérifier si le champ de désignation est vide
    if (!newDesignation.designation.trim()) {
      setTarifChambreErrors(prevErrors => ({
        ...prevErrors,
        designation: "Ce champ est obligatoire."
      }));
      return;
    }
  
    // Vérifier si la désignation existe déjà
    const designationExists = tarifsChambre.some(tarif =>
      sanitizeInput(tarif.designation) === sanitizeInput(newDesignation.designation)
    );
  
    if (designationExists) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Cette désignation existe déjà.",
      });
      return;
    }
  try {
  
    const formData = new FormData();
    if (newDesignation.photo) {
      formData.append('photo', newDesignation.photo);
    }
    formData.append("designation", newDesignation.designation);
    
    const response = await axios.post(
      "http://localhost:8000/api/desigs-chambre", formData
    );

    await fetchTarifChambre(); 
    Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Tarif Chambre ajoutée avec succès.",
              }); // Hide the modal after success
              setShowAddDesignation(false);
              setNewDesignation({
                photo: null,
                designation: "",
              })
              // Réinitialiser l'état après un ajout réussi
    setShowAddDesignation(false);
    setNewDesignation({ photo: null, designation: "" });
    setTarifChambreErrors({ designation: "", photo: null });
    setHasSubmittedAjoutTarif(false); // Réinitialiser le flag après succès

  } catch (error) {
    setTimeout(() => {
      setErrors({
        designation: error.response.data?.errors?.designation,
        photo: error.response.data?.errors?.photo,
      });
  }, 3000);
  }
};


const handleCloseEditChambre = () => {
  setShowEditModal(false);
  setNewTypeChambre({ code: "", type_reduction: "", nb_lit: "", nb_salle: "", commentaire: "" });
  setTypeErrors({ code: "", type_reduction: "", nb_lit: "", nb_salle: "", commentaire: "" });
  setHasSubmittedAjoutTarif(false);
};
const handleSaveTypeChambre = async () => {
  const codeExists = typesChambre.some(type => 
    sanitizeInput(type.code) === sanitizeInput(newTypeChambre.code) && type.id !== categorieId
  );
  const typeExists = typesChambre.some(type => 
    sanitizeInput(type.type_chambre) === sanitizeInput(newTypeChambre.type_chambre) && type.id !== categorieId
  );

  if (codeExists || typeExists) {
    console.log("Swal déclenché pour duplication"); // Debug
    console.log("codeExists:", codeExists, "typeExists:", typeExists);
    Swal.fire({
      icon: "error",
      title: "Duplication détectée",
      text: `${codeExists ? "Ce code existe déjà." : ""} ${typeExists ? "Ce type de chambre existe déjà." : ""}`,
    });
    return;
  }
  try {
    
    await axios.put(`http://localhost:8000/api/types-chambre/${categorieId}`, newTypeChambre);
    await fetchTarifChambre();
    setSelectedCategoryId([])
            Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Tarif Chambre modifiée avec succès.",
      });
      setShowEditModal(false);
      setNewTypeChambre({ code: "", type_chambre: "", nb_lit: "", nb_salle: "", commentaire: "" });
      setTypeErrors({ code: "", type_reduction: "", nb_lit: "", nb_salle: "", commentaire: "" });
      setHasSubmittedAjoutTarif(false);
      setSelectedCategoryId([]);
  } catch (error) {
    setTimeout(() => {
      setErrors({
        code: error.response.data?.errors?.code,
        type_chambre: error.response.data?.errors?.type_chambre,
        nb_lit: error.response.data?.errors?.nb_lit,
        nb_salle: error.response.data?.errors?.nb_salle,
        commentaire: error.response.data?.errors?.commentaire,
      });
  }, 3000);
  }
};

const handleCloseEditDesignation = () => {
  setShowEditModalDesignation(false);
  setNewDesignation({ designation: "", photo: null });
  setTarifChambreErrors({ designation: "", photo: null });
  setHasSubmittedAjoutTarif(false);
};

const handleSaveDesignation = async () => {

  setHasSubmittedAjoutTarif(true); // Indique que le formulaire a été soumis

  // Vérifier si la désignation est vide
  if (!newDesignation.designation.trim()) {
    setTarifChambreErrors(prevErrors => ({
      ...prevErrors,
      designation: "Ce champ est obligatoire."
    }));
    return;
  }
   const designationExists = tarifsChambre.some(tarif =>
      sanitizeInput(tarif.designation) === sanitizeInput(newDesignation.designation)
    );
  
    if (designationExists) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Cette désignation existe déjà.",
      });
      return;
    }
  try {
  const formData = new FormData();
  formData.append('_method', 'put');
    if (newDesignation.photo) {
      formData.append('photo', newDesignation.photo);
    }
    formData.append("designation", newDesignation.designation);

  
    const response = await axios.post(`http://localhost:8000/api/desigs-chambre/${categorieId}`,formData);

    await fetchTarifChambre(); // Refresh categories after adding
    setShowEditModalDesignation(false);
    
    // Show success message
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Tarif Chambre modifiée avec succès.",
    });
    
     // Réinitialiser l'état après mise à jour
     setShowEditModalDesignation(false);
     setNewDesignation({ designation: "", photo: null });
     setTarifChambreErrors({ designation: "", photo: null });
     setHasSubmittedAjoutTarif(false); // Réinitialiser l'état de soumission
  } catch (error) {
    setTimeout(() => {
      setErrors({
        designation_edit: error.response.data?.errors?.designation,
        photo_edit: error.response.data?.errors?.photo,
      });
  }, 3000);
  }
};


const handleDeleteDesignation = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/desigs-chambre/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Tarif Chambre supprimée avec succès.",
    });
    await fetchTarifChambre(); // Refresh categories after adding

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: error.response.data.message,
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
    await fetchTarifChambre(); // Refresh categories after adding

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: error.response.data.message,
    });
  }
};

const handleDeleteChambre = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/tarifs-chambre/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Tarif chambre supprimée avec succès.",
    });
    await fetchTarifChambre(); // Refresh categories after adding

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: error.response.data.message,
    });
  }
};

const handleEditChambre
= (categorieId) => {
  setSelectedCategoryId(categorieId);
  setCategorie(categorieId.id)
  setShowEditModal(true);
};
const handleEditTypeChambre = (typeChambre) => {
  setNewTypeChambre(typeChambre);
  setEditingTypeChambre(typeChambre);
  setCategorie(typeChambre.id);
  setShowEditModal(true);
    // Réinitialiser erreurs et état de soumission
  setTypeErrors({ code: "", type_reduction: "", nb_lit: "", nb_salle: "", commentaire: "" });
  setHasSubmittedAjoutTarif(false);
};

const handleEditDesignation = (categorieId) => {
  setNewDesignation(categorieId);
  setEditingDesignation(categorieId);
  setCategorie(categorieId.id)
  setShowEditModalDesignation(true);
  // Réinitialiser erreurs et état de soumission
  setTarifChambreErrors({ designation: "", photo: null });
  setHasSubmittedAjoutTarif(false);
};

const [activeIndex, setActiveIndex] = useState(0);
const handleSelect = (selectedIndex) => {
  setActiveIndex(selectedIndex);
};
const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array?.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
const chunkSize = 9;
const chunks = chunkArray(tarifsChambre, chunkSize);


const handleCategoryFilterChange = (catId) => {
 
  setSelectedCategory(catId);
};
const DisplayAddTypeChambre = () => {
  setShowAddCategory(true);
  setNewTypeChambre({
    code: "",
    type_chambre: "",
    nb_salle: "",
    nb_lit: "",
    commentaire: ""
  })
  setErrors({})
}
const sanitizeInput = (val) => {
  // const newVal = val.toLowerCase().trim();
  // return newVal
  return val ? val.toLowerCase().trim() : "";
}
  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles}}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>

       
        {/* <SearchWithExport
              onSearch={handleSearch}
              exportToExcel={exportToExcel}
              exportToPDF={exportToPDF}
              printTable={printTable}
              categories={typesChambre} // Remplacez par la liste des catégories appropriée si nécessaire
              chunks={chunks} // Si vous utilisez un découpage en morceaux pour un carousel
              Title="Liste des Tarifs Chambres"
         />

          {
          
          <div style={{height:'125px',marginTop:'-15px', marginBottom:"25px"}}>
         
          <CarouselSelector
                  title="Tarifs de Chambre"
                  options={carouselOptions}
                  selectedOption={selectedCategory}
                  onSelectOption={setSelectedCategory}
                  activeIndex={activeIndex}
                  onSelectIndex={setActiveIndex}
                />

          </div>

          } */}


              <div>
                <SearchWithExportCarousel
                  onSearch={handleSearch}
                  exportToExcel={exportToExcel}
                  exportToPDF={exportToPDF}
                  printTable={printTable}
                  categories={chunks}
                  selectedCategory={selectedCategory}
                  handleCategoryFilterChange={handleCategoryFilterChange}
                  activeIndex={activeIndex}
                  handleSelect={handleSelect}
                  chunks={chunks}
                  subtitle="Tarifs de Chambres"
                  Title="Liste des Tarifs"
                />
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
                  backgroundColor: "#329982",
                  color: "white",
                  borderRadius: "10px",
                  fontWeight: "bold"  , 
                  marginLeft: "96%",
                  padding: "6px 15px",
                  height: "40px",
                }}
                className="gap-2 AjouteBotton"
              >
 <FontAwesomeIcon
                    icon={faPlus}
                    className="AjouteBotton"
                    style={{ cursor: "pointer" ,color: "white" }}
                  />
              </a>

            </div>

            <div className="filters" >
            

    <Form.Select aria-label="Default select example"
    value={typeChambre} onChange={handleChambreFilterChange}
    style={{width:'12%' ,height:"40px",marginTop:"20px",position:'absolute', left: '81%',  top: '224px',cursor: "pointer",
      borderRadius: "10px", color: "black", fontWeight: "bold"}}>
    <option value=""  style={{ fontWeight: "bold"}}>Sélectionner Type de Chambre</option>
    {tarifChambre?.map((type) => (
        <option value={type.type_chambre.type_chambre}>
          {type.type_chambre.type_chambre}
        </option>
    ))}
    </Form.Select>
</div>

        <div style={{ marginTop:"0px",}}>
        <div id="formContainer" className="" style={{...formContainerStyle,marginTop:'0px',maxHeight:'700px',overflow:'auto',padding:'0'}}>
              <Form className="col row" onSubmit={handleSubmit} style={{zIndex: 9999}}>
                <Form.Label className="text-center ">
                <h4
                     style={{
                      fontSize: "25px", 
                      fontFamily: "Arial, sans-serif", 
                      fontWeight: "bold", 
                      color: "black",
                      borderBottom: "2px solid black", 
                      paddingBottom: "5px",
                    }}
                    >
                      {editingTarifChambre ? "Modifier" : "Ajouter"} un Tarif</h4>
                </Form.Label>
                
{/* Form Container */}
<div className="form-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>

  {/* First Row */}
  <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
    <Form.Group className="custom-form-group" controlId="code">
      <Form.Label>Tarif Code</Form.Label>
      <Form.Control
        type="text"
        name="code"
        placeholder="Tarif Code"
        isInvalid={hasSubmitted && !!errors.code}
        value={formData.code}
        onChange={handleChange}
      />
      {hasSubmitted && errors.code && (
        <Form.Text className="text-danger">Required</Form.Text>
      )}
    </Form.Group>
  </div>

  <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
    <Form.Group className="custom-form-group" controlId="designation">
      <div className="icon-container">
        <FontAwesomeIcon
          icon={faPlus}
          className="text-primary"
          style={{ cursor: "pointer" }}
          onClick={() => setShowAddDesignation(true)}
        />
        <Form.Label>Tarif Chambre</Form.Label>
      </div>
      <Form.Select
        name="designation"
        isInvalid={hasSubmitted && !!errors.designation}
        value={formData.designation || selectedCategory}
        onChange={handleChange}
      >
        <option value="">Sélectionner un Tarif Chambre</option>
        {tarifsChambre?.map((tarif) => (
          <option key={tarif?.id} value={tarif?.id}>
            {tarif?.designation}
          </option>
        ))}
      </Form.Select>
      {hasSubmitted && errors.designation && (
        <Form.Text className="text-danger">Required</Form.Text>
      )}
    </Form.Group>
  </div>

  {/* Second Row */}
  <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
    <Form.Group className="custom-form-group" controlId="type_chambre">
      <div className="icon-container">
        <FontAwesomeIcon
          icon={faPlus}
          className="text-primary"
          style={{ cursor: "pointer" }}
          onClick={DisplayAddTypeChambre}
        />
        <Form.Label>Type Chambre</Form.Label>
      </div>
      <Form.Select
        name="type_chambre"
        value={formData.type_chambre}
        isInvalid={hasSubmitted && !!errors.type_chambre}
        onChange={handleChange}
      >
        <option value="">Sélectionner Type de Chambre</option>
        {typesChambre?.map((tarif) => (
          <option key={tarif.id} value={tarif.id}>
            {tarif?.type_chambre}
          </option>
        ))}
      </Form.Select>
      {hasSubmitted && errors.type_chambre && (
        <Form.Text className="text-danger">Required</Form.Text>
      )}
    </Form.Group>
  </div>

  {/* Price Fields */}
  <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
    <Form.Group className="custom-form-group" controlId="single">
      <Form.Label>Single</Form.Label>
      <Form.Control
        type="number"
        name="single"
        min="0"
        placeholder="Prix de Single"
        value={formData.single}
        isInvalid={hasSubmitted && !!errors.single}
        onChange={handleChange}
      />
      {hasSubmitted && errors.single && (
        <Form.Text className="text-danger">Required</Form.Text>
      )}
    </Form.Group>
  </div>

  <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
    <Form.Group className="custom-form-group" controlId="double">
      <Form.Label>Double</Form.Label>
      <Form.Control
        type="number"
        name="double"
        min="0"
        placeholder="Prix de Double"
        value={formData.double}
        isInvalid={hasSubmitted && !!errors.double}
        onChange={handleChange}
      />
      {hasSubmitted && errors.double && (
        <Form.Text className="text-danger">Required</Form.Text>
      )}
    </Form.Group>
  </div>

  <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
    <Form.Group className="custom-form-group" controlId="triple">
      <Form.Label>Triple</Form.Label>
      <Form.Control
        type="number"
        name="triple"
        min="0"
        placeholder="Prix de Triple"
        value={formData.triple}
        isInvalid={hasSubmitted && !!errors.triple}
        onChange={handleChange}
      />
      {hasSubmitted && errors.triple && (
        <Form.Text className="text-danger">Required</Form.Text>
      )}
    </Form.Group>
  </div>

  <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
    <Form.Group className="custom-form-group" controlId="lit_supp">
      <Form.Label>Lit Supplémentaires</Form.Label>
      <Form.Control
        type="number"
        name="lit_supp"
        min="0"
        placeholder="Prix de lit Supp"
        value={formData.lit_supp}
        isInvalid={hasSubmitted && !!errors.lit_supp}
        onChange={handleChange}
      />
      {hasSubmitted && errors.lit_supp && (
        <Form.Text className="text-danger">Required</Form.Text>
      )}
    </Form.Group>
  </div>
</div> 



                

                
        
      <Modal show={showAddCategory} onHide={handleCloseAddTypeChambre}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Type Chambre</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
          <Form.Group>
              <Form.Label>Code Chambre</Form.Label>
              <Form.Control
                type="text"
                placeholder="Code Chambre"
                name="code"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.code}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, code: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.code && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
            </Form.Group>
          <Form.Group>
              <Form.Label>Type Chambre</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type Chambre"
                name="type_chambre"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.type_chambre}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, type_chambre: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.type_chambre && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
            </Form.Group>
            
            <Form.Group>
              <Form.Label>Nombre de Lit</Form.Label>
              <Form.Control
                type="number"
                placeholder="Nombre de Lit"
                name="nb_lit"
                min="0"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.nb_litAdd}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, nb_lit: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.nb_litAdd && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
            </Form.Group>
            <Form.Group>
              <Form.Label>Nombre de Salle</Form.Label>
              <Form.Control
                type="number"
                placeholder="Nombre de Salle"
                name="nb_salle"
                min="0"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.nb_salle}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, nb_salle: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.nb_salle && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
            </Form.Group>
            
            <Form.Group>
              <Form.Label>Commentaire</Form.Label>
              <Form.Control
                type="text"
                placeholder="Commentaire"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.commentaire}
                name="commentaire"
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, commentaire: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.commentaire && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
            </Form.Group>
      </Form>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3" style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table">
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
                {typesChambre?.map(categ => (
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
    onClick={handleCloseAddTypeChambre}
  >
    Annuler
  </Fab>
  </Form.Group>
      </Modal.Body>
      </Modal>
    
    <Modal show={showEditModalDesignation} onHide={handleCloseEditDesignation}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier un Tarif Chambre</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
                <Form.Label>Photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    isInvalid={!!tarifChambreErrors.photo}
                    onChange={(e) => setNewDesignation({ ...newDesignation, photo: e.target.files[0] })}
                    className="form-control"
                    lang="fr"
                  />
                </Form.Group>
            <Form.Group>
              <Form.Label>Designation</Form.Label>
              <Form.Control
                type="text"
                placeholder="Designation"
                name="designation"
                isInvalid={hasSubmittedAjoutTarif && !!tarifChambreErrors.designation}
                value={newDesignation.designation}
                onChange={(e) => setNewDesignation({ ...newDesignation, designation: e.target.value })}
                />
                {hasSubmittedAjoutTarif && tarifChambreErrors.designation && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                             )}
            </Form.Group>
      </Form>
      </Modal.Body>
      
      <Form.Group className=" d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
    onClick={handleSaveDesignation}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={handleCloseEditDesignation}>
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
    <Modal show={showAddDesignation} onHide={handleCloseTarifChambre}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Tarif Chambre</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form encType="multipart/form-data">
          <Form.Group>
                <Form.Label>Photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    isInvalid={!!tarifChambreErrors.photo}
                    onChange={(e) => setNewDesignation({ ...newDesignation, photo: e.target.files[0] })}
                    className="form-control"
                    lang="fr"
                  />
                </Form.Group>
            <Form.Group>
              <Form.Label>Designation</Form.Label>
              <Form.Control
                type="text"
                placeholder="Designation"
                name="designation"
                isInvalid={hasSubmittedAjoutTarif && tarifChambreErrors.designation}
                onChange={(e) => setNewDesignation({ ...newDesignation, designation: e.target.value })}
              />
              {hasSubmittedAjoutTarif && tarifChambreErrors.designation && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                             )}
            </Form.Group>
      </Form>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3" style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Designation</th>
                  <th>Photo</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tarifsChambre?.map(categ => (
                  <tr>
                    <td>{categ?.designation}</td>
                    <td>  
                    <img
                        src={categ.photo ? `http://127.0.0.1:8000/storage/${categ.photo}` : "http://localhost:8000/storage/chambre-img.webp"}
                        alt={categ.designation}
                        loading="lazy"
                        className={`rounded-circle category-img`}
                      />
                    </td>
                    <td>
                        <FontAwesomeIcon
                                  onClick={() => handleEditDesignation(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteDesignation(categ.id)}
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
    onClick={handleAddDesignation}
  >
    Valider
  </Fab>
  <Fab
    variant="extended"
    className="btn-sm FabAnnule mb-2 mx-2"
    onClick={handleCloseTarifChambre}
  >
    Annuler
  </Fab>
  </Form.Group>
      </Modal.Body>
      </Modal>
      <Modal show={showEditModal} onHide={handleCloseEditChambre}>
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
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.code}
                value={newTypeChambre.code}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, code: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.code && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
            </Form.Group>
        <Form.Group>
              <Form.Label>Type Chambre</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type de Chambre"
                name="type_chambre"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.type_chambre}
                value={newTypeChambre.type_chambre}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, type_chambre: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.type_chambre && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
            </Form.Group>
            <Form.Group>
              <Form.Label>Nombre de Lit</Form.Label>
              <Form.Control
                type="number"
                placeholder="Nombre de Lit"
                name="nb_lit"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.nb_lit}
                value={newTypeChambre.nb_lit}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, nb_lit: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.nb_lit && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
            </Form.Group>
            <Form.Group>
              <Form.Label>Nombre de Salle</Form.Label>
              <Form.Control
                type="number"
                placeholder="Nombre de Salle"
                name="nb_salle"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.nb_salle}
                value={newTypeChambre.nb_salle}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, nb_salle: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.nb_salle && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
            </Form.Group>
            <Form.Group>
              <Form.Label>Commentaire</Form.Label>
              <Form.Control
                type="text"
                placeholder="Commentaire"
                name="commentaire"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.commentaire}
                value={newTypeChambre.commentaire}
                onChange={(e) => setNewTypeChambre({ ...newTypeChambre, commentaire: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.commentaire && (
                                                  <Form.Control.Feedback type="invalid">
                                                        Required
                                                      </Form.Control.Feedback>
                )}
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
    onClick={handleCloseEditChambre}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
          
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
                style={{...tableContainerStyle, overflowX: 'auto', minWidth: '650px',
                  maxHeight: '700px', overflow: 'auto',
                  marginTop:'0px',
                  paddingTop:'0px'
                }}
              >
    <table className="table table-bordered" id="tarifChambreTable" style={{ marginTop: "-5px", }}>
  <thead className="text-center table-secondary" style={{ position: 'sticky', top: -1, backgroundColor: '#ddd', zIndex: 1,padding:'10px'}}>
    <tr className="tableHead">
      <th className="tableHead">
        <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
      </th>
      <th className="tableHead">Tarif Chambre</th>
      <th className="tableHead">Tarif Code</th>
      <th className="tableHead">Type Chambre</th>
      <th className="tableHead">Single</th>
      <th className="tableHead">Double</th>
      <th className="tableHead">Triple</th>
      <th className="tableHead">Lit Supplementaires</th>
      <th className="tableHead">Action</th>
    </tr>
  </thead>
  <tbody className="text-center" style={{ backgroundColor: '#007bff' }}>
    {filteredTarifchambre
      ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      ?.map((tarifChambre) => {
      return(
        <React.Fragment>
          <tr>
      
            <td style={{ backgroundColor: "white" }}>
              <input
                type="checkbox"
                checked={selectedItems.includes(tarifChambre?.id)}
                onChange={() => handleCheckboxChange(tarifChambre?.id)}
              />
            </td>
            <td style={{ backgroundColor: "white" }}>{highlightText(tarifChambre?.tarif_chambre.designation, searchTerm) ||''}</td>
            <td style={{ backgroundColor: "white" }}>{highlightText(tarifChambre?.code, searchTerm) ||''}</td>
            <td style={{ backgroundColor: "white" }}>{highlightText(tarifChambre?.type_chambre.type_chambre, searchTerm) ||''}</td>
            <td style={{ backgroundColor: "white" }}>{highlightText(String(tarifChambre.single), searchTerm) || ''}</td>
            <td style={{ backgroundColor: "white" }}>{highlightText(String(tarifChambre.double), searchTerm) || ''}</td>
            <td style={{ backgroundColor: "white" }}>{highlightText(String(tarifChambre.triple), searchTerm)|| ''}</td>
            <td style={{ backgroundColor: "white" }}>{highlightText(String(tarifChambre.lit_supp), searchTerm) || ''}</td>
            <td style={{ backgroundColor: "white", whiteSpace: "nowrap" }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    <FontAwesomeIcon
      onClick={() => handleEdit(tarifChambre)}
      icon={faEdit}
      style={{ color: "#007bff", cursor: "pointer", marginRight: "10px" }}
    />
    <FontAwesomeIcon
      onClick={() => handleDelete(tarifChambre?.id)}
      icon={faTrash}
      style={{ color: "#ff0000", cursor: "pointer", marginRight: "10px" }}
    />
  </div>  
</td>

          </tr>

        </React.Fragment>
      )
       
})}
  </tbody>
</table>

                {/* )} */}
               
                <a href="#">
                  <Button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedItems?.length === 0}
                  style={{
                    borderRadius: "10px",
                    fontWeight: "bold",
                    fontSize: "17px",
                    color: "white",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faTrash}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Supprimer selection
                </Button>
                </a>
                <TablePagination
                  rowsPerPageOptions={[5, 10,15,20, 25]}
                  component="div"
                  count={filteredTarifchambre?.length || 0}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </div>
            </div>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default TarifChambre;