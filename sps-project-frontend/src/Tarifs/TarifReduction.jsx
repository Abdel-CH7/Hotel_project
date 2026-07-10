import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button, Modal, Carousel } from "react-bootstrap";
import Navigation from "../Acceuil/Navigation";
import { highlightText } from '../utils/textUtils';
import { sanitizeInput } from "../utils/sanitizeInput";
// import PrintList from "./PrintList";
// import ExportPdfButton from "./exportToPdf";
import "jspdf-autotable";
import Search from "../Acceuil/Search";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import SearchWithExport from "../components/SearchWithExport";
// import CarouselSelector from "../components/CarouselSelector";
import SearchWithExportCarousel from "../components/SearchWithExportCarousel";
import PeopleIcon from "@mui/icons-material/People";
import jsPDF from 'jspdf';
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
import { useOpen } from "../Acceuil/OpenProvider"; // Importer le hook personnalisé
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import TarifChambre from "./TarifChambre";

//------------------------- Tarifs Reduction ---------------------//
const TarifReduction = () => {
  const [tarifReduction, setTarifReduction] = useState([]);
  const [typesReduction, setTypesReduction] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tarifReductionErrors, setTarifReductionErrors] = useState({
    designation: "",
    photo: null
  })
  const [tarifsReduction, setTarifsReduction] = useState([]);
  const [editingTypeReduction, setEditingTypeReduction] = useState({
    code: "",
    type_reduction: ""
  });
  const [editingDesignation, setEditingDesignation] = useState({});
  const [typeErrors, setTypeErrors] = useState({
    code: "",
    type_reduction: "",
  })

  // -------------------Tarif de reduction -------------------------------
  const carouselOptions = tarifsReduction?.map((item) => ({
    id: item.id,
    label: item.designation,
    image: item.photo ? `http://127.0.0.1:8000/storage/${item.photo}` : "http://localhost:8000/storage/repas-img.webp",
  }));
  //---------------form-------------------//
  const [newReduction, setNewReduction] = useState({
    type_reduction: "",
    designation: "",
    montant: "",
    percentage: ""
  });
  const [newDesignation, setNewDesignation] = useState({
    designation: "",
    photo: ""
  });
  const [newCategory, setNewCategory] = useState({ categorie: ""})
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditModalSite, setShowEditModalSite] = useState(false);
  const [showEditModalDesignation, setShowEditModalDesignation] = useState(false);

  const [showEditModalSecteur, setShowEditModalSecteur] = useState(false);
  const [showEditModalmod, setShowEditModalmod] = useState(false);
  const [showAddDesignation, setShowAddDesignation] = useState(false); 


  const [selectedCategoryId, setSelectedCategoryId] = useState([]);
  const [categorieId, setCategorie] = useState();

const [typeReduction, setTypeReduction] = useState('');
const [newTypeReduction, setNewTypeReduction] = useState({
  code: "",
  type_reduction: "",
});

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type_reduction: "", 	
    designation: "",
    percentage: "",
    montat: "",
  });
  const [errors, setErrors] = useState({
    type_reduction: "",
    designation: "",
    montant: "",
    percentage: ""
  });
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  //-------------------edit-----------------------//
  const [editingTarifReduction, setEditingTarifReduction] = useState(null); // State to hold the client being edited
  const [editingTarifReductionId, setEditingTarifReductionId] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false); 
  const [showAddReduction, setShowAddReduction] = useState(false); 
  const [showAddCategorySite, setShowAddCategorySite] = useState(false); // Gère l'affichage du formulaire

  const [showAddRegein, setShowAddRegein] = useState(false); // Gère l'affichage du formulaire
  const [showAddRegeinSite, setShowAddRegeinSite] = useState(false); // Gère l'affichage du formulaire

  const [showAddSecteur, setShowAddSecteur] = useState(false); // Gère l'affichage du formulaire

  const [showAddMod, setShowAddMod] = useState(false); // Gère l'affichage du formulaire

  //-------------------Pagination-----------------------/
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [filteredTarifReduction, setFilteredTarifReduction] = useState([]);
  // Pagination calculations
  const indexOfLastTarif = (page + 1) * rowsPerPage;
  const indexOfFirstTarif = indexOfLastTarif - rowsPerPage;
  const currentReduction = tarifReduction?.slice(indexOfFirstTarif, indexOfLastTarif);
  //-------------------Selected-----------------------/
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  //-------------------Search-----------------------/
  const [searchTerm, setSearchTerm] = useState("");
  //------------------------Site-Client---------------------

  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedRowsContact, setExpandedRowsContact] = useState([]);
  const [expandedRowsContactSite, setExpandedRowsContactsite] = useState([]);


  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [selectedProductsDataRep, setSelectedProductsDataRep] = useState([]);


  const fetchTarifReduction = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/tarifs-reduction");
      const data = response.data;
  
      setTarifReduction(data.tarifsReductionDetail);
      setTarifsReduction(data.tarifsReduction);
      setTypesReduction(data.typesReduction);

      localStorage.setItem("typesReduction", JSON.stringify(data.typesReduction));
      localStorage.setItem("tarifReduction", JSON.stringify(data.tarifsReductionDetail));
      localStorage.setItem("tarifsReduction", JSON.stringify(data.tarifsReduction));
      
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la liste des Tarifs Reduction.",
        });
      }
    }
  };
  
  useEffect(() => {
    const storedTypesReduction = localStorage.getItem("typesReduction");
    const storedTarifReductionDetail = localStorage.getItem("tarifReduction");
    const storedTarifsReduction = localStorage.getItem("tarifsReduction");
    storedTarifReductionDetail && setTarifReduction(JSON.parse(storedTarifReductionDetail));
    storedTarifsReduction && setTarifsReduction(JSON.parse(storedTarifsReduction));
    storedTypesReduction && setTypesReduction(JSON.parse(storedTypesReduction));

    if (!storedTarifReductionDetail || !storedTarifsReduction || !storedTypesReduction)
      fetchTarifReduction();
    
  }, []);


  const toggleRow = (tarifReductionId) => {
    setExpandedRows((prevExpandedRows) =>
      prevExpandedRows.includes(tarifReductionId)
        ? prevExpandedRows?.filter((id) => id !== tarifReductionId)
        : [...prevExpandedRows, tarifReductionId]
    );
  };
  const toggleRowContact = (tarifReductionId) => {
    setExpandedRowsContact((prevExpandedRows) =>
      prevExpandedRows.includes(tarifReductionId)
        ? prevExpandedRows?.filter((id) => id !== tarifReductionId)
        : [...prevExpandedRows, tarifReductionId]
    );
  };
  const toggleRowContactSite = (TarifReductionId) => {
    setExpandedRowsContactsite((prevExpandedRows) =>
      prevExpandedRows.includes(TarifReductionId)
        ? prevExpandedRows?.filter((id) => id !== TarifReductionId)
        : [...prevExpandedRows, TarifReductionId]
    );
  };
  //---------------------------------------------
  useEffect(() => {
    const filtered = tarifReduction?.filter((tarifReduction) =>
      Object.values(tarifReduction).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (typeof value === "number") {
          return value.toString().includes(searchTerm.toLowerCase());
        }
        return false;
      })
    );
    setFilteredTarifReduction(JSON.stringify(tarifReduction));
  }, [tarifReduction, searchTerm]);

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
  //------------------------- tarif Reduction EDIT---------------------//

  const handleEdit = (tarifReduction) => {
    setErrors({})
    setEditingTarifReduction(tarifReduction); 

    // Populate form data with tarif Reduction details
    setFormData({
        designation: tarifReduction.tarif_reduction?.id || "",
        type_reduction: tarifReduction.type_reduction?.id || "",
        montant: tarifReduction.montant || "",
        percentage: tarifReduction.percentage || "",
  });
        // Sélectionner automatiquement la ligne à modifier
        setSelectedItems([tarifReduction.id]);

    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    } 
  };



  useEffect(() => {
    if (editingTarifReductionId !== null) {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    }
  }, [editingTarifReductionId]);

  useEffect(() => {
    const validateData = () => {
      const newErrors = { ...errors };
      const newTarifReductionErrors = { ...tarifReductionErrors };
      const newTypeErrors = {...typeErrors}
      newErrors.designation = (selectedCategory || formData.designation) === "";
      newErrors.type_reduction = formData.type_reduction === "";
      newErrors.percentage = formData.percentage === "";
      newErrors.montant = (formData.montant < 5 || formData.montant == null) ? true : false;
      // Validation L'insertion de Type Chambre
      const typesCodes = typesReduction.filter((chambre) => chambre.code);
      if (!newTypeReduction) 
      newTypeErrors.code = newTypeReduction.code === "" || typesCodes.some((chambre) => sanitizeInput(chambre.code) === sanitizeInput(newTypeReduction.code)) 
      else if (newTypeReduction)
      newTypeErrors.code = newTypeReduction.code === "" || typesCodes.some((chambre) => sanitizeInput(chambre.code) === sanitizeInput(newTypeReduction.code)) 
      && sanitizeInput(newTypeReduction.code) != sanitizeInput(editingTypeReduction.code);
      newTypeErrors.type_reduction = newTypeReduction.type_reduction === "" || typesCodes.some((chambre) => sanitizeInput(chambre.type_reduction) === sanitizeInput(newTypeReduction.type_reduction || ""))
      && sanitizeInput(newTypeReduction.type_reduction) != sanitizeInput(editingTypeReduction.type_reduction);
      // Validation L'insertion de Tarif Chambre (Designation & Photo)
      const designations = tarifsReduction.filter((chambre) => chambre.designation);
      newTarifReductionErrors.designation = newDesignation.designation === "" || designations.some((chambre) => sanitizeInput(chambre.designation) === sanitizeInput(newDesignation.designation))
      && sanitizeInput(newDesignation.designation || "") != sanitizeInput(editingDesignation.designation || "");;
      newTarifReductionErrors.designationAdd = newDesignation.designation === "" || designations.some((chambre) => sanitizeInput(chambre.designation) === sanitizeInput(newDesignation.designation));
      setTarifReductionErrors(newTarifReductionErrors);
      setErrors(newErrors);
      setTypeErrors(newTypeErrors);
      return true;
    };
    validateData();
  }, [formData, newTypeReduction, newDesignation, selectedCategory]);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    setHasSubmitted(true); // Mark form as submitted
  
    // Check for empty fields
    const newErrors = {
      type_reduction: formData.type_reduction === "",
      designation: formData.designation === "",
      percentage: formData.percentage === "",
      montant: (formData.montant < 5 || formData.montant == null),
    };
  
    setErrors(newErrors); // Update error state
  
    // If there are validation errors, show alert and return
    if (Object.values(newErrors).some((error) => error)) {
      Swal.fire({
        icon: "error",
        title: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }
  
    try {
      const url = editingTarifReduction 
        ? `http://localhost:8000/api/tarifs-reduction/${editingTarifReduction?.id}`
        : "http://localhost:8000/api/tarifs-reduction";
  
      const method = editingTarifReduction ? "put" : "post";
      let requestData = new FormData();
  
      requestData.append("type_reduction", formData.type_reduction);
      requestData.append("tarif_reduction", formData.designation || selectedCategory);
      requestData.append("montant", formData.montant);
      requestData.append("percentage", formData.percentage);
  
      if (editingTarifReduction) {
        requestData.append("_method", "PUT");
      }
  
      const response = await axios({
        method: "post",
        url: url,
        data: requestData,
      });
  
      if (response.status === 200 || response.status === 201) {
        fetchTarifReduction();
        Swal.fire({
          icon: "success",
          title: ` ${editingTarifReduction ? "Modifié" : "Ajouté"} avec succès.`,
        });
  
        // Reset form and errors
        setFormData({
          type_reduction: "",
          designation: "",
          montant: "",
          percentage: ""
        });
  
        setErrors({
          type_reduction: false,
          designation: false,
          montant: false,
          percentage: false
        });
  
        setHasSubmitted(false); // Reset submission state
        setEditingTarifReduction(null);
        closeForm(); // Close form after successful submission
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erreur!",
        text: error.response?.data?.error || "Une erreur s'est produite.",
      });
    }
  };

    //------------------------- Reduction FORM---------------------//

    const handleShowFormButtonClick = () => {
      setEditingTarifReduction(null);
      setFormData({
        type_reduction: "",
        designation: "",
        montant: "",
        percentage: ""
      });
      setErrors({
        type_reduction: false,
        designation: false,
        montant: false,
        percentage: false,
      });

        // Désélectionner toutes les cases cochées
        setSelectedItems([]);

      if (formContainerStyle.right === "-100%") {
        setFormContainerStyle({ right: "0" });
        setTableContainerStyle({ marginRight: "650px" });
      } 
    };

    // Close the form
    const closeForm = () => {
      setFormContainerStyle({ right: "-100%" });
      setTableContainerStyle({ marginRight: "0" });
      setShowForm(false); // Hide the form
      setSelectedCategory("")
      setSelectedItems([]); // Désélectionne toutes les cases
     // Reset form data and errors
  setFormData({
    type_reduction: "",
    designation: "",
    montant: "",
    percentage: ""
  });

  setErrors({
    type_reduction: "",
    designation: "",
    montant: "",
    percentage: ""
  });
      setHasSubmitted(false); // Reset submission state
      setSelectedProductsData([])
      setSelectedProductsDataRep([])
      setEditingTarifReduction(null); // Clear editing client
    };
  //-------------------------SITE CLIENT----------------------------//
  //-------------------------  SUBMIT---------------------//
  const handleSelectItem = (item) => {
    const selectedIndex = selectedItems.findIndex(
      (selectedItem) => selectedItem?.id === item?.id
    );

    if (selectedIndex === -1) {
      setSelectedItems([...selectedItems, item?.id]);
    } else {
      const updatedItems = [...selectedItems];
      updatedItems.splice(selectedIndex, 1);
      setSelectedItems(updatedItems);
    }

  };

  const getSelectedTarifReductionIds = () => {
    return selectedItems?.map((item) => item?.id);
  };
  
  
  //------------------------- CLIENT PAGINATION---------------------//

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const selectedRows = parseInt(event.target.value, 10);
    setRowsPerPage(selectedRows);
    localStorage.setItem('rowsPerPageReductions', selectedRows);  // Store in localStorage
    setPage(0);
  };

  useEffect(() => {
    const savedRowsPerPage = localStorage.getItem('rowsPerPageReductions');
    if (savedRowsPerPage) {
      setRowsPerPage(parseInt(savedRowsPerPage, 10));
    }
  }, []);

  //------------------------- CLIENT DELETE---------------------//

  const handleDelete = (tarif_reduction_code) => {
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
          .delete(`http://localhost:8000/api/tarifs-reduction/${tarif_reduction_code}`)
          .then(() => {
            fetchTarifReduction();
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Tarif Reduction supprimé avec succès.",
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
        // if (selectedItems.length == 0) {
        selectedItems.forEach((item) => {
          axios
            .delete(`http://localhost:8000/api/tarifs-reduction/${item}`)
            .then(() => {
              fetchTarifReduction();
              Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Tarif Reduction supprimé avec succès.",
              });
            })
            .catch((error) => {
              console.error("Erreur lors de la suppression du Tarif Reduction:", error);
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la suppression du Tarif Reduction.",
              });
            });
        });
    // }
    // else {
    //   axios.delete('http://localhost:8000/api/delete-all-tarifs-reduction')
    //   .then(() => {
    //     Swal.fire({
    //       icon: "success",
    //       title: "Succès!",
    //       text: "Toutes les reduction ont été supprimées.",
    //     });
    //   })
    //   .catch((error) => {
    //     console.error("Erreur lors de la suppression du reduction:", error);
    //     Swal.fire({
    //       icon: "error",
    //       title: "Erreur!",
    //       text: "Échec de la suppression du reduction.",
    //     });
    //   });
    // }
      }
    });
    setSelectedItems([]);
    fetchTarifReduction();
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(tarifReduction?.map((TarifReduction) => TarifReduction?.id));
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
      const selectedTarif = tarifReduction.find((item) => item.id === updatedSelection[0]);
      if (selectedTarif) {
        setEditingTarifReduction(selectedTarif);
        setFormData({
          type_reduction: selectedTarif.type_reduction?.id || "",
          percentage: selectedTarif.percentage?.id || "",
          montant: selectedTarif.montant || "",
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
    const table = document.getElementById('tarifReductionTable');
    const workbook = XLSX.utils.table_to_book(table, { sheet: 'Tarifs Reduction' });
    XLSX.writeFile(workbook, 'tarifs-reduction_table.xlsx');
  };

  
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Manually adding HTML content
    const title = 'Table Tarifs Reduction';
    doc.text(title, 14, 16);
    
    doc.autoTable({
      head: [['Type Reduction Code', 'Type Reduction', 'Montant']],
      body: filteredTarifreduction?.map(tarifReduction => [
        tarifReduction?.id ? { content: 'Tarif Reduction Code', rowSpan: 1 } : '',
        tarifReduction.type_reduction.type_reduction || '',
        tarifReduction.montant || '',
        tarifReduction.percentage || '',
      ]),
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8, overflow: 'linebreak' },
      headStyles: { fillColor: '#007bff' }
    });
  
    doc.save('tarifs-reduction_table.pdf');
  };
  

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Tarifs Reduction List</title>
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
          <h1>Tarifs Reduction List</h1>
          <table>
            <thead>
              <tr>
              <th>Tarif Reduction Code</th>
              <th>Tarif Reduction</th>
                <th>Type Reduction</th>
                <th>Montant</th>
                <th>Pourcentage</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTarifreduction?.map(tarifReduction => `
                <tr>
                <td>${tarifReduction?.id || ''}</td>
                <td>${tarifReduction?.tarif_reduction?.designation || ''}</td>
                  <td>${tarifReduction?.type_reduction?.type_reduction || ''}</td>
                  <td>${tarifReduction.montant || ''}</td>
                  <td>${tarifReduction.percentage || ''}</td>
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
  //   fetchTarifReduction();
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
  //                         <tr key=${zone?.id}>
  //                             <td>${zone.zone}</td>
  //                             <td>
  //                                 <select class="custom-select" id="actionDropdown_${zone?.id}" class="form-control">
  //                                     <option class="btn btn-light" disabled selected value="">Select Action</option>
  //                                     <option class="btn btn-danger text-center" value="delete_${zone?.id}">Delete</option>
  //                                     <option class="btn btn-info text-center" value="edit_${zone?.id}">Edit</option>
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
  //   fetchTarifReduction();
  // };

  document.addEventListener("change", async function (event) {
    if (event.target && event.target?.id.startsWith("actionDropdown_")) {
      const [action, typeId] = event.target.value.split("_");
      if (action === "delete") {
        // Delete action
        handleDeleteReduction(typeId);
      } else if (action === "edit") {
        // Edit action
        handleEditReduction(typeId);
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


const handleReductionFilterChange = (e) => {
  setTypeReduction(e.target.value);
};

const [hasSubmitted, setHasSubmitted] = useState(false);
const [hasSubmittedAjoutTarif, setHasSubmittedAjoutTarif] = useState(false);


const filteredTarifreduction = tarifReduction?.filter((tarifReduction) => {
  return (
    ((typeReduction ? tarifReduction?.type_reduction.type_reduction == typeReduction : true) &&
    (selectedCategory ? tarifReduction.tarif_reduction?.id
      === selectedCategory : true)) &&
    (
      (
        (searchTerm ? tarifReduction?.tarif_reduction?.designation.toLowerCase().includes(searchTerm.toLowerCase()) : true) ||
        (searchTerm ? tarifReduction?.type_reduction?.type_reduction.toLowerCase().includes(searchTerm.toLowerCase()) : true) ||
        (searchTerm ? String(tarifReduction?.montant).includes(searchTerm) : true) ||
        (searchTerm ? String(tarifReduction?.percentage).includes(searchTerm) : true) 
      )
    )
  );
});


const handleAddReduction = async () => {
  try {
    const formData = new FormData();
    formData.append("type_reduction", newCategory.categorie);
    formData.append("montant", newCategory.categorie);
    formData.append("perecentage", newCategory.categorie);
    const response = await axios.post("http://localhost:8000/api/tarifs-reduction", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    await fetchTarifReduction(); // Refresh categories after adding
    setNewType({ type: "" })
    setNewMontant({ montant: "" })
    Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Tarif Reduction ajoutée avec succès.",
              }); // Hide the modal after success
              setShowAddCategory(false);

  } catch (error) {
    console.error("Error adding category:", error);
  }
};

const handleCloseEditReduction = () => {
  setShowEditModal(false);
  setNewTypeReduction({ code: "", type_reduction: "" });
  setTypeErrors({ code: "", type_reduction: "" });
  setHasSubmittedAjoutTarif(false);
};


const handleSaveReduction = async () => {
  setHasSubmittedAjoutTarif(true); // Marquer que le formulaire a été soumis

 

  if (!newTypeReduction.code.trim()) {
    setTypeErrors(prevErrors => ({
      ...prevErrors,
      code: "Ce champ est obligatoire."
    }));
    return;
  }
  if (!newTypeReduction.type_reduction.trim()) {
    setTypeErrors(prevErrors => ({
      ...prevErrors,
      type_reduction: "Ce champ est obligatoire."
    }));
    return;
  }
  

  // Vérifier si `code` ou `type_reduction` existent déjà (sauf pour l'élément en cours de modification)
  const codeExists = typesReduction.some(type => 
    sanitizeInput(type.code) === sanitizeInput(newTypeReduction.code) && type.id !== categorieId
  );
  const typeExists = typesReduction.some(type => 
    sanitizeInput(type.type_reduction) === sanitizeInput(newTypeReduction.type_reduction) && type.id !== categorieId
  );

  if (codeExists || typeExists) {
    Swal.fire({
      icon: "error",
      title: "Duplication détectée",
      text: `${codeExists ? "Ce code existe déjà." : ""} ${typeExists ? "Ce type de réduction existe déjà." : ""}`,
    });
    return;
  }

  try {
    await axios.put(`http://localhost:8000/api/types-reduction/${categorieId}`, newTypeReduction);
    await fetchTarifReduction(); // Rafraîchir les données après modification

    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Type Reduction modifiée avec succès.",
    });

    // Réinitialiser après mise à jour
    setShowEditModal(false);
    setNewTypeReduction({ code: "", type_reduction: "" });
    setTypeErrors({ code: "", type_reduction: "" });
    setHasSubmittedAjoutTarif(false);
    setSelectedCategoryId([]);

  } catch (error) {
    console.error("Erreur lors de la modification de la catégorie :", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Une erreur s'est produite lors de la modification.",
    });
  }
};



const handleDeleteReduction = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/tarifs-reduction/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Tarif Reduction supprimée avec succès.",
    });
    await fetchTarifReduction(); // Refresh categories after adding

  } catch (error) {
    console.error("Error deleting categorie:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Échec de la suppression de la Type.",
    });
  }
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
const chunks = chunkArray(tarifsReduction, chunkSize);


const handleCategoryFilterChange = (catId) => {
  setSelectedCategory(catId);
};

const handleShowAddTypeReduction = () => {
  setShowAddCategory(true); // Ouvrir le modal
  setNewTypeReduction({ code: "", type_reduction: "" }); // Réinitialiser le formulaire
  setTypeErrors({ code: "", type_reduction: "" }); // Réinitialiser les erreurs
  setHasSubmittedAjoutTarif(false); // Réinitialiser l'état de soumission
};

const handleCloseAddTypeReduction = () => {
  setShowAddCategory(false);
  setNewTypeReduction({ code: "", type_reduction: "" });
  setTypeErrors({ code: "", type_reduction: "" });
  setHasSubmittedAjoutTarif(false);
};

const handleAddTypeReduction = async () => {
  setHasSubmittedAjoutTarif(true); // Marquer que le formulaire a été soumis

  // Vérification des champs vides
  if (!newTypeReduction.code.trim()) {
    setTarifRepasErrors(prevErrors => ({
      ...prevErrors,
      code: "Ce champ est obligatoire."
    }));
    return;
  }

  if (!newTypeReduction.type_reduction.trim()) {
    setTarifRepasErrors(prevErrors => ({
      ...prevErrors,
      type_reduction: "Ce champ est obligatoire."
    }));
    return;
  }



  // Vérifier si `code` ou `type_reduction` existent déjà
  const codeExists = typesReduction.some(type => sanitizeInput(type.code) === sanitizeInput(newTypeReduction.code));
  const typeExists = typesReduction.some(type => sanitizeInput(type.type_reduction) === sanitizeInput(newTypeReduction.type_reduction));

  if (codeExists || typeExists) {
    Swal.fire({
      icon: "error",
      title: "Duplication détectée",
      text: `${codeExists ? "Ce code existe déjà." : ""} ${typeExists ? "Ce type de réduction existe déjà." : ""}`,
    });
    return;
  }

  // Si tout est bon, procéder à l'ajout
  try {
    const formData = new FormData();
    formData.append("code", newTypeReduction.code);
    formData.append("type_reduction", newTypeReduction.type_reduction);
    
    const response = await axios.post("http://localhost:8000/api/types-reduction", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    await fetchTarifReduction();

    if (response.status === 201) {
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Type Reduction ajoutée avec succès.",
      });

      // Réinitialiser l'état après ajout
      setShowAddCategory(false);
      setNewTypeReduction({ code: "", type_reduction: "" });
      setTypeErrors({ code: "", type_reduction: "" });
      setHasSubmittedAjoutTarif(false);
    }

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Une erreur s'est produite lors de l'ajout.",
    });
    setShowAddCategory(false);
  }
};


const handleEditReduction
= (categorieId) => {
  setSelectedCategoryId(categorieId);
  setCategorie(categorieId?.id)
  setShowEditModal(true);
};
const handleDeleteTypeReduction = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/types-reduction/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Type Reduction supprimée avec succès.",
    });
    await fetchTarifReduction(); // Refresh categories after adding

  } catch (error) {
    console.error("Error deleting Type Reduction:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Échec de la suppression de la Type.",
    });
  }
};
const handleEditTypeReduction
= (categorieId) => {
  setNewTypeReduction(categorieId);
  setEditingTypeReduction(categorieId);
  setCategorie(categorieId?.id)
  setShowEditModal(true);
   // Réinitialiser erreurs et état de soumission
   setTypeErrors({ code: "", type_reduction: "" });
   setHasSubmittedAjoutTarif(false);
};


const handleCloseTarifReduction = () => {
  setShowAddDesignation(false);
  setNewDesignation({ designation: "", photo: "" });
  setTarifReductionErrors({ designation: "", photo: null });
  setHasSubmittedAjoutTarif(false);
};

const handleAddDesignation = async () => {
  setHasSubmittedAjoutTarif(true); // Indique que le formulaire a été soumis

  // Vérifier si le champ de désignation est vide
  if (!newDesignation.designation.trim()) {
    setTarifReductionErrors(prevErrors => ({
      ...prevErrors,
      designation: "Ce champ est obligatoire."
    }));
    return;
  }

  // Vérifier si la désignation existe déjà
  const designationExists = tarifsReduction.some(tarif =>
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
      "http://localhost:8000/api/desigs-reduction", formData
    );

    await fetchTarifReduction(); 
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Désignation ajoutée avec succès.",
    });

    // Réinitialiser l'état après un ajout réussi
    setShowAddDesignation(false);
    setNewDesignation({ photo: null, designation: "" });
    setTarifReductionErrors({ designation: "", photo: null });
    setHasSubmittedAjoutTarif(false); // Réinitialiser le flag après succès

  } catch (error) {
    console.error("Erreur lors de l'ajout de la désignation:", error);
  }
};

const handleDeleteDesignation = async (categorieId) => {
  try {
    await axios.delete(`http://localhost:8000/api/desigs-reduction/${categorieId}`);
    
    // Notification de succès
    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Tarif Reduction supprimée avec succès.",
    });
    await fetchTarifReduction(); // Refresh categories after adding

  } catch (error) {
    console.error("Error deleting Tarif Reduction:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Échec de la suppression de la Tarif Reduction.",
    });
  }
};

const handleCloseEditDesignation = () => {
  setShowEditModalDesignation(false);
  setNewDesignation({ designation: "", photo: null });
  setTarifReductionErrors({ designation: "", photo: null });
  setHasSubmittedAjoutTarif(false);
};

const handleEditDesignation = (categorieId) => {
  setSelectedCategoryId(categorieId);
  setNewDesignation(categorieId);
  setCategorie(categorieId?.id);
  setEditingDesignation(categorieId);
  setShowEditModalDesignation(true);
   // Réinitialiser erreurs et état de soumission
   setTarifReductionErrors({ designation: "", photo: null });
   setHasSubmittedAjoutTarif(false);
};

const handleSaveDesignation = async () => {
  setHasSubmittedAjoutTarif(true); // Indique que le formulaire a été soumis

  // Vérifier si la désignation est vide
  if (!newDesignation.designation.trim()) {
    setTarifReductionErrors(prevErrors => ({
      ...prevErrors,
      designation: "Ce champ est obligatoire."
    }));
    return;
  }


  const designationExists = tarifsReduction.some(tarif =>
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

    const response = await axios.post(`http://localhost:8000/api/desigs-reduction/${categorieId}`, formData);

    await fetchTarifReduction(); // Rafraîchir les données après la modification

    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Désignation modifiée avec succès.",
    });

    // Réinitialiser l'état après mise à jour
    setShowEditModalDesignation(false);
    setNewDesignation({ designation: "", photo: null });
    setTarifReductionErrors({ designation: "", photo: null });
    setHasSubmittedAjoutTarif(false); // Réinitialiser l'état de soumission

  } catch (error) {
    console.error("Erreur lors de la modification de la désignation :", error.response.data);
  }
};

const displayAddTypeReduction = () => {
  setShowAddCategory(true)
  setTypeErrors({
    code: true,
    type_reduction: true
  })
}
const handleShowTarifReduction = () => {
  setShowAddDesignation(true);
  setNewDesignation({ designation: "", photo: "" }); // Réinitialiser le formulaire
  setTarifReductionErrors({ designation: "", photo: null }); // Réinitialiser les erreurs
  setHasSubmittedAjoutTarif(false); // Réinitialiser l'état de soumission
}
  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles}}>
        <Box component="main" className="app-page tarif-reduction-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>

       
         
        {/* <SearchWithExport
              onSearch={handleSearch}
              exportToExcel={exportToExcel}
              exportToPDF={exportToPDF}
              printTable={printTable}
              categories={typesReduction} // Remplacez par la liste des catégories appropriée si nécessaire
              chunks={chunks} // Si vous utilisez un découpage en morceaux pour un carousel
              Title="Liste des Tarifs Reduction"
            />

          {
          
          <div style={{height:'125px',marginTop:'-15px',marginBottom:"25px"}}>
          

          <CarouselSelector
                title="Tarifs de Repas"
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
                  subtitle="Tarifs de Réduction"
                  Title="Liste des Tarifs"
                />
              </div>

          <div className="app-controls-row">
             
              <button
                type="button"
                onClick={handleShowFormButtonClick}
                className="app-add-button"
              >
 <FontAwesomeIcon
                    icon={faPlus}
                  />
                  Ajouter Tarif
              </button>

            <div className="app-filter-controls">
            

    <Form.Select aria-label="Default select example"
    value={typeReduction} onChange={handleReductionFilterChange}
    className="app-filter-select">
    <option value=""  style={{ fontWeight: "bold"}}>Sélectionner Type Réduction</option>
    {typesReduction?.map((type) => (
        <option value={type.type_reduction}>
          {type.type_reduction}
        </option>
    ))}
    </Form.Select>
</div>
</div>

        <div style={{ marginTop:"0px",}}>
        <div id="formContainer" className="app-form-drawer" style={formContainerStyle}>
              <Form className="col row" onSubmit={handleSubmit}>
                <Form.Label className="text-center ">
                <h4 className="app-form-drawer-title">
                      {editingTarifReduction ? "Modifier" : "Ajouter"} un Tarif</h4>
                </Form.Label>

                <Form.Group className="form-group">
                <div className="d-flex align-items-center w-100">
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="text-primary me-2"
                    style={{ cursor: "pointer" }}
                    onClick={handleShowTarifReduction}
                  />
                  <Form.Label className="me-3" style={{ minWidth: "150px" }}>Tarif Reduction</Form.Label>
                  <div style={{ flexGrow: 1, position: "relative" }}>
                    <Form.Select
                      name="designation"
                      isInvalid={hasSubmitted && !!errors.designation} // Ensure it's a boolean
                      value={selectedCategory ? selectedCategory : formData.designation}
                      onChange={handleChange}
                    >
                      <option value="">Sélectionner un Tarif Reduction</option>
                      {tarifsReduction?.map((tarif) => (
                        <option key={tarif.id} value={tarif.id}>{tarif.designation}</option>
                      ))}
                    </Form.Select>
                    {hasSubmitted && errors.designation && (
                      <Form.Control.Feedback type="invalid" className="d-block">
                        Required.
                      </Form.Control.Feedback>
                    )}
                  </div>
                </div>
              </Form.Group>


                <Modal show={showEditModalDesignation} onHide={handleCloseEditDesignation}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier un Tarif de Reduction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
                <Form.Label>Photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    isInvalid={!!tarifReductionErrors.photo}
                    onChange={(e) => setNewDesignation({ ...newDesignation, photo: e.target.files[0] })}
                    className="form-control"
                    lang="fr"
                  />
                  <Form.Text className="text-danger">{errors.photo}</Form.Text>
                </Form.Group>
            <Form.Group>
              <Form.Label>Designation</Form.Label>
              <Form.Control
                type="text"
                placeholder="Designation"
                name="designation"
                isInvalid={hasSubmittedAjoutTarif && !!tarifReductionErrors.designation}
                value={newDesignation.designation}
                onChange={(e) => setNewDesignation({ ...newDesignation, designation: e.target.value })}
                />
                {hasSubmittedAjoutTarif && tarifReductionErrors.designation && (
                                    <Form.Control.Feedback type="invalid">
                                          Required
                                        </Form.Control.Feedback>
               )}
            </Form.Group>
      </Form>
      </Modal.Body>
      
      <Form.Group className="app-form-actions">
        <Button
          type="button"
          className="app-primary-button"
          onClick={handleSaveDesignation}
        >
          Valider
        </Button>
        <Button
          type="button"
          className="app-secondary-button"
          onClick={handleCloseEditDesignation}
        >
          Annuler
        </Button>
      </Form.Group>
    </Modal>
                <Modal show={showAddDesignation} onHide={handleCloseTarifReduction}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Tarif Reduction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form encType="multipart/form-data">
          <Form.Group>
                <Form.Label>Photo</Form.Label>
                  <Form.Control
                    type="file"
                    name="photo"
                    isInvalid={!!tarifReductionErrors.photo}
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
                isInvalid={hasSubmittedAjoutTarif && !!tarifReductionErrors.designation}
                onChange={(e) => setNewDesignation({ ...newDesignation, designation: e.target.value })}
              />
              {hasSubmittedAjoutTarif && tarifReductionErrors.designation && (
                                    <Form.Control.Feedback type="invalid">
                                          Required
                                        </Form.Control.Feedback>
               )}
            </Form.Group>
      </Form>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3" style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table app-table">
              <thead>
                <tr>
                  <th>Designation</th>
                  <th>Photo</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tarifsReduction?.map(categ => (
                  <tr>
                    <td>{categ?.designation}</td>
                    <td>  
                    <img
                        src={categ.photo ? `http://127.0.0.1:8000/storage/${categ.photo}` : "http://localhost:8000/storage/reduction-img.webp"}
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
                                  onClick={() => handleDeleteDesignation(categ?.id)}
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
          <Form.Group className="app-form-actions">
            <Button
              type="button"
              className="app-primary-button"
              onClick={handleAddDesignation}
            >
              Valider
            </Button>
            <Button
              type="button"
              className="app-secondary-button"
              onClick={handleCloseTarifReduction}
            >
              Annuler
            </Button>
          </Form.Group>
      </Modal.Body>
      </Modal>

                <Form.Group className="form-group">
            <div className="d-flex align-items-center w-100">
              <FontAwesomeIcon
                icon={faPlus}
                className="text-primary me-2"
                style={{ cursor: "pointer" }}
                onClick={displayAddTypeReduction}
              />
              <Form.Label className="me-3" style={{ minWidth: "150px" }}>Type Reduction</Form.Label>
              <div style={{ flexGrow: 1, position: "relative" }}>
                <Form.Select
                  name="type_reduction"
                  isInvalid={hasSubmitted && errors.type_reduction}
                  value={formData.type_reduction}
                  onChange={handleChange}
                >
                  <option value="">Sélectionner Type de Reduction</option>
                  {typesReduction?.map((tarif) => (
                    <option key={tarif.id} value={tarif.id}>{tarif.type_reduction}</option>
                  ))}
                </Form.Select>
                {hasSubmitted && errors.type_reduction && (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    Required
                  </Form.Control.Feedback>
                )}
              </div>
            </div>
          </Form.Group>

                <Modal show={showEditModal} onHide={handleCloseEditReduction}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier Type de Reduction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
        <Form.Group>
              <Form.Label>Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Code"
                name="code"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.code}
                onChange={(e) => setNewTypeReduction({ ...newTypeReduction, code: e.target.value })}
                value={newTypeReduction.code}
                />
                {hasSubmittedAjoutTarif && typeErrors.code && (
                                    <Form.Control.Feedback type="invalid">
                                          Required
                                        </Form.Control.Feedback>
               )}
            </Form.Group>
            <Form.Group>
              <Form.Label>Type Reduction</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type Reduction"
                name="type_reduction"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.type_reduction}
                onChange={(e) => setNewTypeReduction({ ...newTypeReduction, type_reduction: e.target.value })}
                value={newTypeReduction.type_reduction}
                />
              {hasSubmittedAjoutTarif && typeErrors.type_reduction && (
                                    <Form.Control.Feedback type="invalid">
                                          Required
                                        </Form.Control.Feedback>
               )}
            </Form.Group>
      </Form>
      </Modal.Body>
      
      <Form.Group className="app-form-actions">
        <Button
          type="button"
          className="app-primary-button"
          onClick={handleSaveReduction}
        >
          Valider
        </Button>
        <Button
          type="button"
          className="app-secondary-button"
          onClick={handleCloseEditReduction}
        >
          Annuler
        </Button>
      </Form.Group>
    </Modal>
                <Modal show={showAddCategory} onHide={handleCloseAddTypeReduction}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Type Reduction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
          <Form.Group>
              <Form.Label>Code Reduction</Form.Label>
              <Form.Control
                type="text"
                placeholder="Code Reduction"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.code}
                name="code"
                onChange={(e) => setNewTypeReduction({ ...newTypeReduction, code: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.code && (
                                    <Form.Control.Feedback type="invalid">
                                          Required
                                        </Form.Control.Feedback>
               )}
            </Form.Group>
          <Form.Group>
              <Form.Label>Type Reduction</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type Reduction"
                isInvalid={hasSubmittedAjoutTarif && !!typeErrors.type_reduction}
                name="type_reduction"
                onChange={(e) => setNewTypeReduction({ ...newTypeReduction, type_reduction: e.target.value })}
              />
              {hasSubmittedAjoutTarif && typeErrors.type_reduction && (
                                    <Form.Control.Feedback type="invalid">
                                          Required
                                        </Form.Control.Feedback>
               )}
            </Form.Group>
      </Form>
            
            <Form.Group className="mt-3">
            <div className="form-group mt-3" style={{maxHeight:'500px',overflowY:'auto'}}>
            <table className="table app-table">
              <thead>
                <tr>
                <th>Code Reduction</th>
                  <th>Type Reduction</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {typesReduction?.map(categ => (
                  <tr>
                    <td>{categ.code}</td>
                    <td>{categ.type_reduction}</td>
                    <td>
                   
    <FontAwesomeIcon
                                  onClick={() => handleEditTypeReduction(categ)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                <span style={{ margin: "0 8px" }}></span>
                                <FontAwesomeIcon
                                  onClick={() => handleDeleteTypeReduction(categ?.id)}
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
          <Form.Group className="app-form-actions">
            <Button
              type="button"
              className="app-primary-button"
              onClick={handleAddTypeReduction}
            >
              Valider
            </Button>
            <Button
              type="button"
              className="app-secondary-button"
              onClick={handleCloseAddTypeReduction}
            >
              Annuler
            </Button>
          </Form.Group>
      </Modal.Body>
      </Modal>

              <Form.Group className="form-group">
                <div className="d-flex align-items-center w-100">
                  <div style={{ width: "20px" }}></div> {/* Keeping the empty div */}
                  <Form.Label className="me-3" style={{ minWidth: "150px" }}>Montant</Form.Label>
                  <div style={{ flexGrow: 1, position: "relative" }}>
                    <Form.Control
                      type="number"
                      name="montant"
                      min="5"
                      isInvalid={hasSubmitted && errors.montant}
                      placeholder="Montant"
                      value={formData.montant}
                      onChange={handleChange}
                    />
                    {hasSubmitted && errors.montant && (
                      <Form.Control.Feedback type="invalid" className="d-block">
                        Le montant doit être supérieur ou égal à 5.
                      </Form.Control.Feedback>
                    )}
                  </div>
                </div>
              </Form.Group>

              <Form.Group className="form-group">
        <div className="d-flex align-items-center w-100">
          <div style={{ width: "20px" }}></div> {/* Keeping the empty div */}
          <Form.Label className="me-3" style={{ minWidth: "150px" }}>Percentage</Form.Label>
          <div style={{ flexGrow: 1, position: "relative" }}>
            <Form.Control
              type="number"
              name="percentage"
              min="0"
              isInvalid={hasSubmitted && errors.percentage}
              placeholder="Percentage"
              value={formData.percentage}
              onChange={handleChange}
            />
            {hasSubmitted && errors.percentage && (
              <Form.Control.Feedback type="invalid" className="d-block">
                Required
              </Form.Control.Feedback>
            )}
          </div>
        </div>
      </Form.Group>

  <div className="app-form-actions">
    <Button
      type="submit"
      className="app-primary-button"
    >
      Valider
    </Button>
    <Button
      type="button"
      className="app-secondary-button"
      onClick={closeForm}
    >
      Annuler
    </Button>
  </div>
              </Form>
            </div>
        </div>
            <div className="">
              <div
                id="tableContainer"
                className="app-table-wrapper"
                style={{...tableContainerStyle, overflowX: 'auto',
                  maxHeight: '700px', overflow: 'auto',
                  marginTop:'0px',
                  paddingTop:'0px'

                }}
              >
                 <table className="table table-bordered app-table" id="tarifReductionTable" style={{ marginTop: "-5px", }}>
  <thead className="text-center table-secondary" style={{ position: 'sticky', top: -1, backgroundColor: '#ddd', zIndex: 1,padding:'10px'}}>
    <tr className="tableHead">
      <th className="tableHead">
        <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
      </th>
      <th className="tableHead">Tarif Reduction</th>
      <th className="tableHead">Type Reduction</th>
      <th className="tableHead">Montant</th>
      <th className="tableHead">Percentage</th>
      <th className="tableHead">Action</th>
    </tr>
  </thead>
  <tbody className="text-center" style={{ backgroundColor: '#007bff' }}>
    {filteredTarifreduction
      ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      ?.map((tarifReduction) => {
      return(
        <React.Fragment>
          <tr>
      
            <td style={{ backgroundColor: "white" }}>
              <input
                type="checkbox"
                checked={selectedItems.includes(tarifReduction?.id)}
                onChange={() => handleCheckboxChange(tarifReduction?.id)}
              />
            </td>
            <td style={{ backgroundColor: "white" }}>{highlightText(tarifReduction?.tarif_reduction?.designation, searchTerm) || ''}</td>
            <td style={{ backgroundColor: "white" }}>{highlightText(tarifReduction?.type_reduction?.type_reduction, searchTerm) || ''}</td>
            <td style={{ backgroundColor: "white" }}>{highlightText(String(tarifReduction?.montant), searchTerm) || ''}</td>
            <td style={{ backgroundColor: "white" }}>{highlightText(String(tarifReduction?.percentage), searchTerm) || ''}</td>
            <td style={{ backgroundColor: "white", whiteSpace: "nowrap" }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    <FontAwesomeIcon
      onClick={() => handleEdit(tarifReduction)}
      icon={faEdit}
      className="app-table-action is-edit"
    />
    <FontAwesomeIcon
      onClick={() => handleDelete(tarifReduction?.id)}
      icon={faTrash}
      className="app-table-action is-delete"
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
               
                <div className="app-table-footer">
                  <Button
                    type="button"
                    className="app-danger-button"
                    onClick={handleDeleteSelected}
                    disabled={selectedItems?.length === 0}
                  >
                    <FontAwesomeIcon
                      icon={faTrash}
                      style={{ marginRight: "0.5rem" }}
                    />
                    Supprimer selection
                  </Button>

                  <div className="app-table-pagination">
                    <span>Lignes par page:</span>

                    <select
                      value={rowsPerPage}
                      onChange={(e) =>
                        handleChangeRowsPerPage({
                          target: { value: e.target.value },
                        })
                      }
                    >
                      {[5, 10, 15, 20, 25].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>

                    <span>
                      {filteredTarifreduction.length > 0
                        ? `${page * rowsPerPage + 1}-${Math.min(
                            (page + 1) * rowsPerPage,
                            filteredTarifreduction.length
                          )} sur ${filteredTarifreduction.length}`
                        : "0-0 sur 0"}
                    </span>

                    <button
                      type="button"
                      className="app-pagination-arrow"
                      disabled={page === 0}
                      onClick={(e) => handleChangePage(e, page - 1)}
                      aria-label="Page précédente"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      className="app-pagination-arrow"
                      disabled={(page + 1) * rowsPerPage >= filteredTarifreduction.length}
                      onClick={(e) => handleChangePage(e, page + 1)}
                      aria-label="Page suivante"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default TarifReduction;
