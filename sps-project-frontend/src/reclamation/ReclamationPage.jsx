import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { useOpen } from "../Acceuil/OpenProvider";
import SearchWithExportCarousel from "../components/SearchWithExportCarousel";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Import the autoTable plugin
import * as XLSX from "xlsx";
import { openDB } from "idb"; // ✅ IndexedDB Library
import ExpandRTable from "../components/ExpandRTable";
import { highlightText } from "../utils/textUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"; // If using dropdown icons
import DynamicFilter from "../components/DynamicFilter";
import { Form, Button, Modal, Carousel } from "react-bootstrap";
import "../style.css";
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

import departmentFallbackImage from "../assets/departments/default.png";



const initDB = async () => {
    return openDB("ReclamationsDB", 3, { // 🔥 Change version to 3 (incremented)
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`🔄 Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`);
  
        if (oldVersion < 1) {
          db.createObjectStore("departments", { keyPath: "id" });
          db.createObjectStore("reclamations", { keyPath: "id" });
        }
  
        if (oldVersion < 2) {
          db.createObjectStore("reclamation_historique", { keyPath: "id" });
        }
  
        if (oldVersion < 3) {
          console.log("✅ Version 3: Ensure all stores exist.");
        }
      },
    });
  };


// ✅ Function to chunk the departments array for carousel display
const chunkArray = (array, size) => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, index * size + size)
  );
};

const STORAGE_URL =
  "http://127.0.0.1:8000/storage";

const getDepartmentImageUrl = (
  photo,
  fallbackImage = departmentFallbackImage
) => {
  if (!photo) {
    return fallbackImage;
  }

  const photoPath = String(photo);

  if (
    photoPath.startsWith("http://") ||
    photoPath.startsWith("https://") ||
    photoPath.startsWith("data:") ||
    photoPath.startsWith("blob:")
  ) {
    return photoPath;
  }

  const cleanPath = photoPath
    .replace(/^\/+/, "")
    .replace(/^storage\//, "");

  return `${STORAGE_URL}/${cleanPath}`;
};





const ReclamationPage = () => {
  const { dynamicStyles } = useOpen();
  const [reclamations, setReclamations] = useState([]);
  const [filteredReclamations, setFilteredReclamations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [historique, setHistorique] = useState([]);
  const [historiqueData, setHistoriqueData] = useState([]); // ✅ Define state
  const [editingReclamation, setEditingReclamation] = useState(null);
  const [showAddReclamationModal, setShowAddReclamationModal] = useState(false);
  const [showEditReclamationModal, setShowEditReclamationModal] = useState(false);
  const [reclamationFormData, setReclamationFormData] = useState({
    type_reclamation: "",
    reclamer_a_travers: "",
    departement_affecte: "",
    suivi: "",
    reponse: "",
    date: "",
  });
  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formContainerStyle, setFormContainerStyle] = useState({ right: "-100%" });
  const [tableContainerStyle, setTableContainerStyle] = useState({ marginRight: "0" });
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  // In your state declarations
  const [newDepartment, setNewDepartment] = useState({
  name: "",
  photo: null,
});
  const [editingDepartment, setEditingDepartment] =
  useState({
    id: null,
    designation: "",
    photo: null,
    existingPhoto: null,
  });
 // For editing
  const [showEditDropdown, setShowEditDropdown] = useState(false); // Step 1: Declare state for the modal
  const [departmentErrors, setDepartmentErrors] =
  useState({
    name: "",
    designation: "",
    photo: "",
  });
  const [rowsPerPage, setRowsPerPage] = useState(5);  // Default to 5 rows per page
  const [page, setPage] = useState(0);  // Start at page 0
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(null); // ✅ Track selected date


  // ✅ Load Cached Data from IndexedDB
  const loadCachedData = useCallback(async () => {
    const db = await initDB();
  
    const cachedDepartments = await db.getAll("departments");
    const cachedReclamations = await db.getAll("reclamations");
    const cachedHistorique = await db.getAll("reclamation_historique");
  
    if (cachedDepartments.length > 0) setDepartments(cachedDepartments);
    if (cachedReclamations.length > 0) {
      setReclamations(cachedReclamations);
      setFilteredReclamations(cachedReclamations);
    }
    if (cachedHistorique.length > 0) setHistorique(cachedHistorique);
  
    console.log("🔄 Loaded Cached Data from IndexedDB:", {
      departments: cachedDepartments,
      reclamations: cachedReclamations,
      historique: cachedHistorique,
    });
  }, []);
  

  // ✅ Fetch all data simultaneously for faster load
  const fetchData = useCallback(async () => {
    try {
      console.log("🚀 Fetching data from API...");
  
      const [deptResponse, recResponse] = await Promise.all([
        axios.get("http://localhost:8000/api/reclamations/departements"),
        axios.get("http://localhost:8000/api/reclamations"),
      ]);
  
      console.log("✅ API responses received", {
        departments: deptResponse.data,
        reclamations: recResponse.data,
      });
  
      // ✅ DELETE OLD IndexedDB if version conflict
      if (indexedDB.databases) {
        const databases = await indexedDB.databases();
        if (databases.some(db => db.name === "ReclamationsDB" && db.version < 2)) {
          console.warn("⚠️ IndexedDB version outdated, deleting...");
          indexedDB.deleteDatabase("ReclamationsDB");
        }
      }
  
      const db = await initDB(); // ✅ Open updated database
  
      // ✅ Store Departments
      const formattedDepartments =
  deptResponse.data.map((dept) => ({
    id: dept.id,
    designation: dept.nom,
    photo: dept.photo || null,
  }));
      setDepartments(formattedDepartments);
      await db.clear("departments");
      formattedDepartments.forEach((dept) => db.put("departments", dept));
  
      // ✅ Store Reclamations & Historique
      setReclamations(recResponse.data);
      setFilteredReclamations(recResponse.data);
      await db.clear("reclamations");
      await db.clear("reclamation_historique");
  
      let allHistorique = [];
      recResponse.data.forEach((rec) => {
        db.put("reclamations", rec);
        if (rec.historique) {
          rec.historique.forEach((histo) => {
            db.put("reclamation_historique", histo);
            allHistorique.push(histo);
          });
        }
      });
  
      setHistoriqueData(allHistorique); // ✅ Store historique in state
      console.log("✅ Historique stored in IndexedDB:", allHistorique);
    } catch (error) {
      console.error("❌ Fetch error:", error.response?.status, error.response?.data);
      Swal.fire("Erreur!", `Échec du chargement des données: ${error.message}`, "error");
    }
  }, []);
  
  
  
  // Add this handler function
  const handleSaveEdit = async () => {
    try {
      await axios.put(`http://localhost:8000/api/reclamations/${editingReclamation.id}`, editingReclamation);
      fetchData();
      setEditingReclamation(null);
      Swal.fire("Success!", "Réclamation mise à jour", "success");
    } catch (error) {
      Swal.fire("Error!", "Échec de la mise à jour", "error");
    }
  };


  // ✅ Load cached data instantly, then fetch fresh data
  useEffect(() => {
    console.log("Departments:", departments); // Check if departments are populated correctly
    loadCachedData();
    fetchData();
  }, [loadCachedData, fetchData]);
  

  // ✅ Pre-chunk departments before rendering to avoid delays
  const chunks = useMemo(() => chunkArray(departments, 9), [departments]);

  const normalizeSearchValue = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const formatReclamationDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(date);
  }

  return parsedDate.toLocaleDateString("fr-FR");
};

const getReclamationISODate = (date) => {
  if (!date) return "";

  return String(date).split("T")[0];
};

  // ✅ Optimized filtering logic
useEffect(() => {
  const normalizedSearchTerm = normalizeSearchValue(searchTerm);

  setFilteredReclamations(
    (Array.isArray(reclamations) ? reclamations : []).filter((rec) => {
      const formattedDate = formatReclamationDate(rec.date);
      const isoDate = getReclamationISODate(rec.date);

      const matchesSearch =
        !normalizedSearchTerm ||
        [
          rec.type_reclamation,
          formattedDate,
          isoDate,
          rec.reclamer_a_travers,
          rec.departement?.nom,
          rec.departement_affecte,
          rec.suivi,
          rec.reponse,
        ].some((field) =>
          normalizeSearchValue(field).includes(normalizedSearchTerm)
        );

      const matchesDepartment = selectedDepartment?.id
        ? String(rec.departement?.id || rec.departement_id) ===
          String(selectedDepartment.id)
        : true;

      const matchesStatus = selectedStatus
        ? rec.suivi === selectedStatus
        : true;

      const selectedDateString = selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : "";

      const matchesDate = selectedDateString
        ? isoDate === selectedDateString
        : true;

      return matchesSearch && matchesDepartment && matchesStatus && matchesDate;
    })
  );
}, [reclamations, searchTerm, selectedDepartment, selectedStatus, selectedDate]);  
  
  
  
  
  
  
  
const handleEditDepartment = async () => {
  const departmentName = String(
    editingDepartment.designation || ""
  ).trim();

  if (!departmentName) {
    setDepartmentErrors((previousErrors) => ({
      ...previousErrors,
      designation: "Le nom est obligatoire.",
    }));

    return;
  }

  try {
    const requestData = new FormData();

    requestData.append("_method", "PUT");
    requestData.append("nom", departmentName);

    if (editingDepartment.photo instanceof File) {
      requestData.append(
        "photo",
        editingDepartment.photo
      );
    }

    await axios.post(
      `http://localhost:8000/api/reclamations/departements/${editingDepartment.id}`,
      requestData
    );

    await fetchData();
    closeEditDepartmentModal();

    Swal.fire(
      "Succès!",
      "Département modifié avec succès.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erreur modification département:",
      error.response?.data || error
    );

    const backendErrors =
      error.response?.data?.errors || {};

    const nameError =
      backendErrors.nom?.[0] || "";

    const photoError =
      backendErrors.photo?.[0] || "";

    setDepartmentErrors((previousErrors) => ({
      ...previousErrors,
      designation: nameError,
      photo: photoError,
    }));

    Swal.fire(
      "Erreur!",
      nameError ||
        photoError ||
        error.response?.data?.message ||
        `Erreur serveur ${error.response?.status || ""}`,
      "error"
    );
  }
};




  // ✅ Export Data Optimization
  const exportData = useMemo(
    () =>
      filteredReclamations.map((rec) => ({
        Type: rec.type_reclamation,
        "Réclamé à travers": rec.reclamer_a_travers,
        Département: rec.departement_affecte,
        Status: rec.suivi,
        Réponse: rec.reponse,
        Date: new Date(rec.date).toLocaleDateString("fr-FR"), // ✅ Include date
      })),
    [filteredReclamations]
  );
  

  // ✅ Export Handlers
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    console.log("Exporting data to PDF..."); // Add this to check if the function is triggered
  
    doc.autoTable({
      head: [["Type", "Réclamé à travers", "Département","Date", "Status", "Réponse"]],
      body: exportData.map((item) => [
        item.Type,
        item["Réclamé à travers"],
        item["Département"],
        item.Date,
        item.Status,
        item.Réponse,
      ]),
    });
  
    console.log("PDF generated..."); // Check if the PDF is being generated
    doc.save("reclamations.pdf");
  }, [exportData]);
  
  


  const exportToExcel = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Réclamations");
    XLSX.writeFile(workbook, "reclamations.xlsx");
  }, [exportData]);



  const printTable = () => {
    const printWindow = window.open('',);
    printWindow.document.write(`
      <html>
        <head>
          <title>Liste des Réclamations</title>
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
          <h1>Liste des Réclamations</h1>
          <table>
            <thead>
              <tr>
                <th>Type de Réclamation</th>
                <th>Date</th>
                <th>Réclamé à travers</th>
                <th>Département Affecté</th>
                <th>Status</th>
                <th>Réponse</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReclamations?.map(reclamation => `
                <tr>
                  <td>${reclamation.type_reclamation || ''}</td>
                  <td>${reclamation.date ? new Date(reclamation.date).toLocaleDateString("fr-FR") : ''}</td>
                  <td>${reclamation.reclamer_a_travers || ''}</td>
                  <td>${reclamation.departement?.nom || 'Non spécifié'}</td>
                  <td>${reclamation.suivi || ''}</td>
                  <td>${reclamation.reponse || ''}</td>
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

  // table parts
const columns = [
  {
    key: "type_reclamation",
    label: "Type de Réclamation",
    width: 220,
    render: (item) => highlightText(item.type_reclamation, searchTerm),
  },
  {
    key: "date",
    label: "Date",
    width: 130,
    render: (item) =>
      item.date
        ? highlightText(formatReclamationDate(item.date), searchTerm)
        : "Date non disponible",
  },
  {
    key: "reclamer_a_travers",
    label: "Réclamé à Travers",
    width: 220,
    render: (item) => highlightText(item.reclamer_a_travers, searchTerm),
  },
  {
    key: "departement_nom",
    label: "Département Affecté",
    width: 220,
    render: (item) =>
      highlightText(item.departement?.nom || "Non spécifié", searchTerm),
  },
  {
    key: "suivi",
    label: "Status",
    width: 160,
    render: (item, searchTerm, toggleRowExpansion) => (
      <>
        <button
          type="button"
          onClick={() => toggleRowExpansion(item.id)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            marginRight: "6px",
          }}
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </button>

        {highlightText(item.suivi, searchTerm) || ""}
      </>
    ),
  },
  {
    key: "reponse",
    label: "Réponse",
    width: 260,
    render: (item) => highlightText(item.reponse, searchTerm),
  },
];  
  

/////////////////////////////////////////////////////// Table part //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const toggleRowExpansion = (id) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [id]: !prevExpandedRows[id], // Toggle between true and false
    }));
  };
  
  const renderExpandedRow = (item) => {
    console.log("Expanded Row Item:", item); // Debugging
  
    if (!item.historique || item.historique.length === 0) {
      return (
        <div>
          <table className="table table-responsive table-bordered">
            <tbody>
              <tr>
                <td colSpan="25" style={{ textAlign: "center", fontStyle: "italic" }}>
                  Aucun historique disponible
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
  
    // ✅ Filter historique by matching `suivi` status and ensuring a meaningful description
    const latestHistorique = item.historique
      .filter(h => h.description && h.description !== "Réclamation mise à jour") // ✅ Ignore generic updates
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // ✅ Get the latest entry
      .shift();
  
    return (
      <div>
        <table className="table table-responsive table-bordered">
          <tbody>
            <tr>
              <td colSpan="25" style={{ padding: "0" }}>
                <div>
                  <table
                    className="table table-responsive table-bordered"
                    style={{ marginTop: "0px", marginBottom: "0px" }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#0097A7", color: "white" }}>
                        <th className="ColoretableForm">Date</th>
                        <th className="ColoretableForm">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestHistorique ? (
                        <tr>
                          <td style={{ textAlign: "center", fontWeight: "bold" }}>
                            {new Date(latestHistorique.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td>{latestHistorique.description}</td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan="2" style={{ textAlign: "center", fontStyle: "italic" }}>
                            Aucun historique correspondant au statut actuel
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  
  
  
  
  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setReclamationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  
    // ✅ Dynamically remove validation errors when the field is filled
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (value.trim() !== "") {
        delete newErrors[name]; // ✅ Remove specific field error
      }
      return newErrors;
    });
  };
  
  
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
  
    // Create errors object with only the missing fields
    const newErrors = {};
    if (!reclamationFormData.type_reclamation.trim()) newErrors.type_reclamation = "Required";
    if (!reclamationFormData.reclamer_a_travers.trim()) newErrors.reclamer_a_travers = "Required";
    if (!reclamationFormData.departement_affecte) newErrors.departement_affecte = "Required";
    if (!reclamationFormData.date) newErrors.date = "Required";
  
    // ✅ If errors exist, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Swal.fire("Erreur!", "Champs obligatoires manquants", "error");
      return;
    }
  
    // ✅ If no errors, prepare the payload
    const payload = {
      type_reclamation: reclamationFormData.type_reclamation.trim(),
      reclamer_a_travers: reclamationFormData.reclamer_a_travers.trim(),
      departement_id: parseInt(reclamationFormData.departement_affecte, 10),
      suivi: reclamationFormData.suivi || "En attente",
      reponse: reclamationFormData.reponse?.trim() || "",
      date: reclamationFormData.date,
    };
  
    try {
      const { id } = editingReclamation || {};
      const url = id 
        ? `http://localhost:8000/api/reclamations/${id}`
        : "http://localhost:8000/api/reclamations";
      const method = id ? "put" : "post";
  
      const response = await axios[method](url, payload);
  
      if ([200, 201].includes(response.status)) {
        await fetchData();
        closeForm();
        Swal.fire("Succès!", `Réclamation ${id ? 'modifiée' : 'ajoutée'}`, "success");
      }
    } catch (error) {
      Swal.fire("Erreur!", error.response?.data?.message || error.message, "error");
    }
  };
  

// Create filter options based on your departments data
// Correct if rec.departement_affecte is the department name
const filterOptions = [
  {
    label: "Département",
    key: "departement_affecte",
    placeholder: "Tous les départements",
    options: departments.map((dept) => ({
      value: dept.id.toString(),
      label: dept.designation,
    })),
  },
  {
    label: "Status",
    key: "suivi",
    placeholder: "Tous les statuts",
    options: [
      { value: "En attente", label: "En attente" },
      { value: "En cours", label: "En cours" },
      { value: "Traité", label: "Traité" },
      { value: "Résolu", label: "Résolu" },
    ],
  },
  {
    label: "Date",
    key: "date",
    type: "date",
  },
];




const handleCategoryFilterChange = (
  departmentId
) => {
  if (
    departmentId === "" ||
    departmentId === null ||
    departmentId === undefined
  ) {
    setSelectedDepartment(null);
    setPage(0);
    return;
  }

  const selectedDept = departments.find(
    (dept) =>
      String(dept.id) === String(departmentId)
  );

  setSelectedDepartment(selectedDept || null);
  setPage(0);
};







// Handler for filter changes – adjust as needed for other filters
const handleFilterChange = (key, value) => {
if (key === "departement_affecte") {
  const selectedDept = departments.find(
    (dept) =>
      String(dept.id) === String(value)
  );

  setSelectedDepartment(selectedDept || null);
  setPage(0);
}
  if (key === "suivi") {
    setSelectedStatus(value); // ✅ Track the selected status
  }
};


const handleDateFilterChange = (dateString) => {
  setSelectedDate(dateString ? new Date(`${dateString}T00:00:00`) : null);
};






// Handler for the Add button click (e.g., open the "Add Reclamation" modal)
const handleAddClick = () => {
  setShowAddReclamationModal(true);
};




const closeForm = () => {
  setReclamationFormData({
    type_reclamation: "",
    reclamer_a_travers: "",
    departement_affecte: "",
    suivi: "",
    reponse: "",
    date: "",
  });

  setErrors({});
  setHasSubmitted(false);
  setEditingReclamation(null);
  setShowAddReclamationModal(false);
  setShowEditReclamationModal(false);
  setFormContainerStyle({ right: "-100%" });

  setTableContainerStyle({
    marginRight: "0",
  });
};  

  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(reclamations.map((rec) => rec.id));
    }
    setSelectAll(!selectAll);
  };
  
  const handleCheckboxChange = (id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id]
    );
  };

  const handleEdit = (reclamation) => {
    console.log("Editing:", reclamation); // ✅ Debugging log
    setEditingReclamation(reclamation);
    handleShowFormButtonClick(reclamation);
  };
  
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Supprimer cette réclamation?",
      icon: "warning",
      showCancelButton: true,
    });
  
    if (result.isConfirmed) {
      await axios.delete(`http://localhost:8000/api/reclamations/${id}`);
      fetchData(); // Refresh the table
      Swal.fire("Supprimé!", "Réclamation supprimée.", "success");
    }
  };
  
  const handleDeleteSelected = async () => {
    const result = await Swal.fire({
      title: "Supprimer les réclamations sélectionnées?",
      icon: "warning",
      showCancelButton: true,
    });
  
    if (result.isConfirmed) {
      for (let id of selectedItems) {
        await axios.delete(`http://localhost:8000/api/reclamations/${id}`);
      }
      fetchData(); // Refresh the table
      Swal.fire("Supprimé!", "Les réclamations sélectionnées ont été supprimées.", "success");
    }
  };

const handleShowFormButtonClick = (reclamation = null) => {
  setEditingReclamation(reclamation);

  setReclamationFormData(
    reclamation
      ? {
          type_reclamation: reclamation.type_reclamation || "",
          reclamer_a_travers: reclamation.reclamer_a_travers || "",
          departement_affecte: reclamation.departement_id
            ? String(reclamation.departement_id)
            : "",
          suivi: reclamation.suivi || "",
          reponse: reclamation.reponse || "",
          date: reclamation.date ? reclamation.date.split("T")[0] : "",
        }
      : {
          type_reclamation: "",
          reclamer_a_travers: "",
          departement_affecte: "",
          suivi: "",
          reponse: "",
          date: "",
        }
  );

  setErrors({});
  setHasSubmitted(false);
  setFormContainerStyle({ right: "0" });
};  

const handleAddDepartment = async () => {
  const departmentName = String(
    newDepartment.name || ""
  ).trim();

  if (!departmentName) {
    setDepartmentErrors((previousErrors) => ({
      ...previousErrors,
      name: "Le nom est obligatoire.",
    }));

    return;
  }

  try {
    const requestData = new FormData();

    requestData.append("nom", departmentName);

    if (newDepartment.photo instanceof File) {
      requestData.append(
        "photo",
        newDepartment.photo
      );
    }

    await axios.post(
      "http://localhost:8000/api/reclamations/departements",
      requestData
    );

    await fetchData();
    closeAddDepartmentModal();

    Swal.fire(
      "Succès!",
      "Département ajouté avec succès.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erreur ajout département:",
      error.response?.data || error
    );

    const backendErrors =
      error.response?.data?.errors || {};

    const nameError =
      backendErrors.nom?.[0] || "";

    const photoError =
      backendErrors.photo?.[0] || "";

    setDepartmentErrors((previousErrors) => ({
      ...previousErrors,
      name: nameError,
      photo: photoError,
    }));

    Swal.fire(
      "Erreur!",
      nameError ||
        photoError ||
        error.response?.data?.message ||
        "Impossible d'ajouter le département.",
      "error"
    );
  }
};

const closeAddDepartmentModal = () => {
  setShowAddDepartmentModal(false);

  setNewDepartment({
    name: "",
    photo: null,
  });

  setDepartmentErrors({
    name: "",
    designation: "",
    photo: "",
  });
};

const closeEditDepartmentModal = () => {
  setShowEditDropdown(false);

  setEditingDepartment({
    id: null,
    designation: "",
    photo: null,
    existingPhoto: null,
  });

  setDepartmentErrors({
    name: "",
    designation: "",
    photo: "",
  });
};


  
  
  
  const handleDeleteDepartment = async (id) => {
    const result = await Swal.fire({
        title: "Supprimer ce département?",
        text: "Cette action est irréversible.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Oui, supprimer!",
        cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
        try {
            await axios.delete(`http://localhost:8000/api/reclamations/departements/${id}`);
            fetchData(); // Refresh departments list
            Swal.fire("Supprimé!", "Département supprimé.", "success");
        } catch (error) {
            console.error("Error deleting department:", error.response?.data); // Log the error details
            Swal.fire(
                "Erreur!",
                error.response?.data?.message || "Échec de la suppression",
                "error"
            );
        }
    }
}; 
  

const handleChangePage = (event, newPage) => {
  setPage(newPage);  // Update page number
};

const handleChangeRowsPerPage = (event) => {
  setRowsPerPage(parseInt(event.target.value, 10));  // Update rows per page
  setPage(0);  // Reset to first page when rows per page change
};

  
  
  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles }}>
        <Box component="main" className="app-page reclamation-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>
<SearchWithExportCarousel
  onSearch={setSearchTerm}
  exportToExcel={exportToExcel}
  exportToPDF={exportToPDF}
  printTable={printTable}
  categories={departments}
  selectedCategory={selectedDepartment?.id ?? ""}
  handleCategoryFilterChange={
    handleCategoryFilterChange
  }
  activeIndex={activeIndex}
  handleSelect={setActiveIndex}
  chunks={chunks}
  subtitle="Départements"
  Title="Liste des Réclamations"
  fallbackImage={departmentFallbackImage}
/>
  <DynamicFilter
  filters={filterOptions}
  onFilterChange={handleFilterChange}
  onDateFilterChange={handleDateFilterChange}  // Use the new date handler
  selectedDate={selectedDate}  // Pass the selected date to the filter
  onAddClick={() => handleShowFormButtonClick()}
  addButtonLabel="Ajouter Réclamation"
/>
  <div className="reclamation-content">
            <div
  id="formContainer"
  className="app-form-drawer"
  style={{
    ...formContainerStyle,
    width: "560px",
    maxWidth: "100%",
  }}
>
  <Form onSubmit={handleSubmit}>
    <h4 className="app-form-drawer-title">
      {editingReclamation ? "Modifier" : "Ajouter"} Réclamation
    </h4>

    <div className="row g-3">
      <Form.Group className="col-12">
        <Form.Label>Type de Réclamation *</Form.Label>
        <Form.Control
          type="text"
          name="type_reclamation"
          value={reclamationFormData.type_reclamation}
          onChange={handleChange}
          isInvalid={hasSubmitted && !!errors.type_reclamation}
        />
        <Form.Control.Feedback type="invalid">
          Required
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="col-12">
        <Form.Label>Réclamé à travers *</Form.Label>
        <Form.Control
          type="text"
          name="reclamer_a_travers"
          value={reclamationFormData.reclamer_a_travers}
          onChange={handleChange}
          isInvalid={hasSubmitted && !!errors.reclamer_a_travers}
        />
        <Form.Control.Feedback type="invalid">
          Required
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="col-md-6">
        <Form.Label>Date *</Form.Label>
        <Form.Control
          type="date"
          name="date"
          value={reclamationFormData.date}
          onChange={handleChange}
          isInvalid={hasSubmitted && !!errors.date}
        />
        <Form.Control.Feedback type="invalid">
          Required
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="col-md-6">
        <div className="d-flex align-items-center justify-content-between">
          <Form.Label className="mb-0">Département *</Form.Label>

          <button
            type="button"
            onClick={() => setShowAddDepartmentModal(true)}
            style={{
              border: "none",
              background: "transparent",
              color: "#00afaa",
              cursor: "pointer",
              fontWeight: "700",
            }}
            title="Ajouter département"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>

        <Form.Select
          name="departement_affecte"
          value={reclamationFormData.departement_affecte}
          onChange={(e) => {
            const selectedDept = departments.find(
              (dept) => dept.id === parseInt(e.target.value, 10)
            );

            setReclamationFormData((prev) => ({
              ...prev,
              departement_affecte: selectedDept?.id || "",
            }));

            setErrors((prev) => ({
              ...prev,
              departement_affecte: selectedDept ? "" : "Champ requis",
            }));
          }}
          isInvalid={hasSubmitted && !!errors.departement_affecte}
        >
          <option value="">Sélectionner un département</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.designation}
            </option>
          ))}
        </Form.Select>

        <Form.Control.Feedback type="invalid">
          Required
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="col-12">
        <Form.Label>Status</Form.Label>
        <Form.Select
          name="suivi"
          value={reclamationFormData.suivi}
          onChange={handleChange}
        >
          <option value="">Sélectionner un status</option>
          <option value="En attente">En attente</option>
          <option value="En cours">En cours</option>
          <option value="Traité">Traité</option>
          <option value="Résolu">Résolu</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="col-12">
        <Form.Label>Réponse</Form.Label>
        <Form.Control
          as="textarea"
          name="reponse"
          value={reclamationFormData.reponse || ""}
          onChange={handleChange}
          rows={3}
        />
      </Form.Group>
    </div>

    <div className="app-form-actions">
      <Button type="submit" className="app-primary-button">
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

  
<div className="app-section">
  <div
    id="tableContainer"
    className="app-table-wrapper"
    style={{ ...tableContainerStyle }}
  >
    <ExpandRTable
      columns={columns}
      data={reclamations}
      filteredData={filteredReclamations}
      searchTerm={searchTerm}
      highlightText={highlightText}
      selectAll={selectAll}
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
      toggleRowExpansion={toggleRowExpansion}
      renderExpandedRow={renderExpandedRow}
      uiVariant="app"
    />
  </div>
</div>
          </div>
        </Box>
      </Box>

<Modal
  show={showAddDepartmentModal}
  onHide={closeAddDepartmentModal}
  size="lg"
  centered
>
  <Modal.Header closeButton>
    <Modal.Title className="w-100">
      <h4 className="app-form-drawer-title" style={{ marginBottom: 0 }}>
        Gestion des Départements
      </h4>
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
<Form.Group className="mb-3">
  <Form.Label>Nom du Département</Form.Label>

  <Form.Control
    type="text"
    value={newDepartment.name}
    onChange={(e) => {
      setNewDepartment((previousData) => ({
        ...previousData,
        name: e.target.value,
      }));

      setDepartmentErrors((previousErrors) => ({
        ...previousErrors,
        name: "",
      }));
    }}
    isInvalid={!!departmentErrors.name}
  />

  <Form.Control.Feedback type="invalid">
    {departmentErrors.name}
  </Form.Control.Feedback>
</Form.Group>

<Form.Group className="mb-4">
  <Form.Label>Photo</Form.Label>

  <Form.Control
    type="file"
    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
    isInvalid={!!departmentErrors.photo}
    onChange={(e) =>
      setNewDepartment((previousData) => ({
        ...previousData,
        photo: e.target.files?.[0] || null,
      }))
    }
  />

  <Form.Control.Feedback type="invalid">
    {departmentErrors.photo}
  </Form.Control.Feedback>
</Form.Group>
    <div className="app-table-wrapper" style={{ maxHeight: "300px" }}>
      <table className="table table-bordered app-table mb-0">
        <thead>
          <tr>
  <th>Nom</th>
  <th>Photo</th>
  <th>Actions</th>
</tr>
        </thead>

        <tbody>
          {departments.map((dept) => (
            <tr key={dept.id}>
              <td>{dept.designation}</td>
              <td>
  <img
    src={getDepartmentImageUrl(dept.photo)}
    alt={dept.designation}
    loading="lazy"
    className="rounded-circle category-img"
  />
</td>

              <td>
                <div className="d-flex align-items-center justify-content-center">
                  <FontAwesomeIcon
                    icon={faEdit}
                    className="app-table-action is-edit"
                    onClick={() => {
  setEditingDepartment({
    id: dept.id,
    designation: dept.designation || "",
    photo: null,
    existingPhoto: dept.photo || null,
  });

  setDepartmentErrors({
    name: "",
    designation: "",
    photo: "",
  });

  setShowEditDropdown(true);
}}
                  />

                  <FontAwesomeIcon
                    icon={faTrash}
                    className="app-table-action is-delete"
                    onClick={() => handleDeleteDepartment(dept.id)}
                  />
                </div>
              </td>
            </tr>
          ))}

          {departments.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center">
                Aucun département disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Modal.Body>

  <Modal.Footer>
    <div className="app-form-actions" style={{ marginTop: 0 }}>
      <Button
        type="button"
        className="app-primary-button"
        onClick={handleAddDepartment}
      >
        Valider
      </Button>

      <Button
        type="button"
        className="app-secondary-button"
        onClick={closeAddDepartmentModal}
      >
        Annuler
      </Button>
    </div>
  </Modal.Footer>
</Modal>
{/* Edit Department Modal */}
<Modal
  show={showEditDropdown}
  onHide={closeEditDepartmentModal}
  size="md"
  centered
>
  {editingDepartment && (
    <>
      <Modal.Header closeButton>
        <Modal.Title className="w-100">
          <h4 className="app-form-drawer-title" style={{ marginBottom: 0 }}>
            Modifier Département
          </h4>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group className="mb-3">
  <Form.Label>Photo actuelle</Form.Label>

  <div className="mb-2">
    <img
      src={getDepartmentImageUrl(
        editingDepartment.existingPhoto
      )}
      alt={
        editingDepartment.designation ||
        "Département"
      }
      style={{
        width: "70px",
        height: "70px",
        objectFit: "cover",
        borderRadius: "50%",
        border: "1px solid #e2e8f0",
      }}
    />
  </div>

  <Form.Label>Nouvelle photo</Form.Label>

  <Form.Control
    type="file"
    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
    isInvalid={!!departmentErrors.photo}
    onChange={(e) =>
      setEditingDepartment((previousData) => ({
        ...previousData,
        photo: e.target.files?.[0] || null,
      }))
    }
  />

  <Form.Control.Feedback type="invalid">
    {departmentErrors.photo}
  </Form.Control.Feedback>
</Form.Group>

<Form.Group className="mb-4">
  <Form.Label>Nom du Département</Form.Label>

  <Form.Control
    type="text"
    value={editingDepartment.designation || ""}
    onChange={(e) => {
      setEditingDepartment((previousData) => ({
        ...previousData,
        designation: e.target.value,
      }));

      setDepartmentErrors((previousErrors) => ({
        ...previousErrors,
        designation: "",
      }));
    }}
    isInvalid={!!departmentErrors.designation}
  />

  <Form.Control.Feedback type="invalid">
    {departmentErrors.designation}
  </Form.Control.Feedback>
</Form.Group>      </Modal.Body>

      <Modal.Footer>
        <div className="app-form-actions" style={{ marginTop: 0 }}>
          <Button
            type="button"
            className="app-primary-button"
            onClick={handleEditDepartment}
          >
            Valider
          </Button>

          <Button
            type="button"
            className="app-secondary-button"
            onClick={() => {
              setShowEditDropdown(false);
              setEditingDepartment({ id: null, designation: "" });
              setDepartmentErrors((prev) => ({
                ...prev,
                designation: false,
              }));
            }}
          >
            Annuler
          </Button>
        </div>
      </Modal.Footer>
    </>
  )}
</Modal>


    </ThemeProvider>
  );
};

export default ReclamationPage;
