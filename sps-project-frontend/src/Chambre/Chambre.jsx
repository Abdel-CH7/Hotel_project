import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { sanitizeInput } from '../utils/sanitizeInput';
import { Form, Button, Modal, Carousel, Table } from "react-bootstrap";
import {
  highlightText,
  matchesNormalizedSearch,
  normalizeSearchValue,
} from '../utils/textUtils';
import SearchWithExport from "../components/SearchWithExport";
import ListFilterReset from "../components/ListFilterReset";
import ListPagination from "../components/ListPagination";
import ListState from "../components/ListState";
import useListControls from "../components/useListControls";
import {
  exportToExcel as exportRowsToExcel,
  exportToPdf as exportRowsToPdf,
  printRows,
} from "../utils/listExportUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PeopleIcon from "@mui/icons-material/People";
import { storeDataInIndexedDB } from "../indexDB";
import ExpandRTable from "../components/ExpandRTable";
import allFilterImage from "../assets/sectors/all.png";

import {
  faTrash,
  faPlus,
  faMinus,
  faCircleInfo,
  faSquarePlus,
  faEdit,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import "../style.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Checkbox, Fab, Toolbar } from "@mui/material";
import { useOpen } from "../Acceuil/OpenProvider"; // Importer le hook personnalisé
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

const ROOM_EXPORT_COLUMNS = [
  { key: "roomNumber", label: "Numéro de chambre" },
  { key: "roomType", label: "Type de chambre" },
  { key: "floor", label: "Étage" },
  { key: "view", label: "Vue" },
  { key: "beds", label: "Nombre de lits" },
  { key: "bathrooms", label: "Nombre de salles de bain" },
  { key: "airConditioning", label: "Climatisation" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "comment", label: "Commentaire" },
];

//------------------------- Chambres ---------------------//
const Chambre = () => {
  const STORAGE_URL = "http://127.0.0.1:8000/storage";

const getStorageImageUrl = (photo, fallbackImage) => {
  if (!photo) {
    return `${STORAGE_URL}/${fallbackImage}`;
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
  const [chambres, setChambres] = useState([]);
  const [vueErrors, setVueErrors] = useState({ vue: "", photo: "", vueAdd: "" });
  const [typeErrors, setTypeErrors] = useState({
    codeAdd: "", nb_litAdd: "", nb_salleAdd: "", type_chambreAdd: "", commentaireAdd: "",
    capacite_standardAdd: "", lits_supplementaires_maxAdd: ""
  });
  const [etageErrors, setEtageErrors] = useState({
  etage: "",
  etageAdd: "",
  photo: "",
});
  const [vues, setVues] = useState([]);
  const [etages, setEtages] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedVue, setSelectedVue] = useState("");
  const [selectedEtage, setSelectedEtage] = useState("");
  const [activeVueIndex, setActiveVueIndex] = useState(0);
  const [activeEtageIndex, setActiveEtageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const emptyTypeChambre = {
  code: "",
  type_chambre: "",
  nb_lit: "",
  nb_salle: "",
  capacite_standard: "",
  lits_supplementaires_max: "",
  commentaire: "",
  codeAdd: "",
  type_chambreAdd: "",
  nb_litAdd: "",
  nb_salleAdd: "",
  capacite_standardAdd: "",
  lits_supplementaires_maxAdd: "0",
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
  const [reservationReadiness, setReservationReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(true);
  const [readinessError, setReadinessError] = useState("");
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
  photo: null,
  existingPhoto: null,
});

const [newEtage, setNewEtage] = useState({
  etage: "",
  etageAdd: "",
  photo: null,
  existingPhoto: null,
});

  const [showEditModalSecteur, setShowEditModalSecteur] = useState(false);
  const [showEditModalmod, setShowEditModalmod] = useState(false);


  const [selectedCategoryId, setSelectedCategoryId] = useState([]);
  const [categorieId, setCategorie] = useState();

const [typeFilter, setTypeFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  
  
  const [formData, setFormData] = useState({
    type_chambre_id: "",
    num_chambre: "",
    etage: "",
    climat: "",
    wifi: "",
    vue: "",
  });
  const [errors, setErrors] = useState({
    type_chambre_id: "",
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
  const roomTypeModalBodyRef = useRef(null);
  const roomTypeTableRef = useRef(null);
  const [showAddCategorySite, setShowAddCategorySite] = useState(false); // Gère l'affichage du formulaire

  const [showAddRegein, setShowAddRegein] = useState(false); // Gère l'affichage du formulaire
  const [showAddRegeinSite, setShowAddRegeinSite] = useState(false); // Gère l'affichage du formulaire

  const [showAddSecteur, setShowAddSecteur] = useState(false); // Gère l'affichage du formulaire

  const [showAddMod, setShowAddMod] = useState(false); // Gère l'affichage du formulaire

  //-------------------Selected-----------------------/
  const [selectedItems, setSelectedItems] = useState([]);
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

  const resetRoomTypeModalScroll = useCallback(() => {
    if (roomTypeModalBodyRef.current) {
      roomTypeModalBodyRef.current.scrollTop = 0;
    }

    if (roomTypeTableRef.current) {
      roomTypeTableRef.current.scrollTop = 0;
      roomTypeTableRef.current.scrollLeft = 0;
    }
  }, []);

  useEffect(() => {
    if (!showAddCategory) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(resetRoomTypeModalScroll);
    return () => window.cancelAnimationFrame(frameId);
  }, [resetRoomTypeModalScroll, showAddCategory]);


  const fetchChambres = async () => {
    setLoading(true);
    setLoadError("");

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
      setLoadError(
        error.response?.data?.message || "Impossible de charger la liste des chambres."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationReadiness = async () => {
    setReadinessLoading(true);
    setReadinessError("");

    try {
      const response = await axios.get("http://localhost:8000/api/reservations/readiness");
      setReservationReadiness(response.data?.data || null);
    } catch (error) {
      console.error("Error fetching reservation readiness:", error);
      setReadinessError("Le diagnostic de préparation des réservations est indisponible.");
    } finally {
      setReadinessLoading(false);
    }
  };

  useEffect(() => {
    // Check if data exists in local storage and set the state variables accordingly


      fetchChambres();
      fetchReservationReadiness();
    
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

const handleChange = (e) => {
  const { name, value, type, files } = e.target;

  if (name === "type_chambre_id") {
    setFormData((prev) => ({
      ...prev,
      type_chambre_id: value,
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
      type_chambre_id: chambre.type_chambre_id || chambre.type_chambre?.id || '',
      num_chambre: chambre.num_chambre,
      etage: chambre.etage_id,
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
        type_chambre_id: "",
        etage: "",
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
        commentaireAdd: "",
        capacite_standardAdd: "",
        lits_supplementaires_maxAdd: ""
      });
    } else {
      const validateData = () => {
        const newErrors = { ...errors };
        const newVueErrors = { ...vueErrors };
        const newEtageErrors = { ...etageErrors };
        const newTypeErrors = { ...typeErrors };
        // Chambre Validation
        const num_chambres = chambres.filter((chambre) => chambre.num_chambre);
        newErrors.vue = formData.vue === "";
        newErrors.etage = formData.etage === "";
        newErrors.num_chambre =
          formData.num_chambre === "" ||
          (num_chambres.some(
            (chambre) =>
              sanitizeInput(chambre.num_chambre) === sanitizeInput(formData.num_chambre)
          ) &&
            sanitizeInput(formData.num_chambre) !== sanitizeInput(editingChambre?.num_chambre));
        newErrors.type_chambre_id = formData.type_chambre_id === "";
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

  const requestData = {
    type_chambre_id: formData.type_chambre_id,
    num_chambre: formData.num_chambre,
    etage_id: formData.etage,
    climat: formData.climat,
    wifi: formData.wifi,
    vue_id: formData.vue,
  };

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
              type_chambre_id: "",
              num_chambre: "",
              etage: "",
              climat: "",
              wifi: "",
              vue: "",
          });
          setErrors({
              type_chambre_id: "",
              etage: "",
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
      if (error.response?.status === 422) {
          const backendErrors = Object.fromEntries(
            Object.entries(error.response.data.errors || {}).map(([field, messages]) => [
              field,
              Array.isArray(messages) ? messages[0] : messages,
            ])
          );
          setErrors((currentErrors) => ({ ...currentErrors, ...backendErrors }));
          Swal.fire({
            icon: "error",
            title: "Erreur de validation",
            text: Object.values(backendErrors)[0] || "Veuillez vérifier les champs du formulaire.",
          });
          return;
      }

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.response?.data?.message || "Impossible d'enregistrer cette chambre.",
      });
  }
};


// Update deletion handler to use chambre.id instead of num_chambre

const handleDelete = (roomId) => {
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
        .delete(`http://localhost:8000/api/chambres/${roomId}`)
        .then(() => {
          fetchChambres();
          Swal.fire({
            icon: "success",
            title: "Succès!",
            text: "Chambre supprimée avec succès.",
          });
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: error.response?.data?.message || "Impossible de supprimer cette chambre.",
          });
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
        selectedItems.map((roomId) =>
          axios.delete(`http://localhost:8000/api/chambres/${roomId}`)
        )
      )
        .then(() => {
          Swal.fire("Succès!", "Chambres supprimées avec succès.", "success");
          setSelectedItems([]);
          fetchChambres();
        })
        .catch((error) => {
          console.error("Erreur lors de la suppression de la chambre:", error);
          Swal.fire(
            "Erreur!",
            error.response?.data?.message || "Échec de la suppression.",
            "error"
          );
        });
    }
  });
};


  //------------------------- CLIENT DELETE---------------------//

  
  //-------------------------Select Delete --------------------//


  const handleSelectAllChange = () => {
    setSelectedItems((currentItems) => {
      if (allVisibleRoomsSelected) {
        return currentItems.filter((id) => !visibleRoomIds.includes(id));
      }

      return [...new Set([...currentItems, ...visibleRoomIds])];
    });
  };
  
  const handleCheckboxChange = (roomId) => {
    setSelectedItems((currentItems) =>
      currentItems.includes(roomId)
        ? currentItems.filter((value) => value !== roomId)
        : [...currentItems, roomId]
    );
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
  resetPage();
};

const getRoomTypeRecord = (chambre) => {
  if (chambre.type_chambre && typeof chambre.type_chambre === "object") {
    return chambre.type_chambre;
  }

  return types.find((type) => String(type.id) === String(chambre.type_chambre_id)) || null;
};

const getRoomTypeName = (chambre) => getRoomTypeRecord(chambre)?.type_chambre || "";

const getRoomBedCount = (chambre) =>
  chambre.nb_lit ?? chambre.type_chambre?.nb_lit ?? "";

const getRoomBathroomCount = (chambre) =>
  chambre.nb_salle ?? chambre.type_chambre?.nb_salle ?? "";

const selectedFormType = types.find(
  (type) => String(type.id) === String(formData.type_chambre_id)
);

const getRoomEtageName = (chambre) => {
  if (chambre.etage && typeof chambre.etage === "object") {
    return chambre.etage.etage || "";
  }

  const etageId = chambre.etage_id || chambre.etage;

  return (
    etages.find((etage) => String(etage.id) === String(etageId))?.etage || ""
  );
};

const getRoomVueName = (chambre) => {
  if (chambre.vue && typeof chambre.vue === "object") {
    return chambre.vue.vue || "";
  }

  const vueId = chambre.vue_id || chambre.vue;

  return vues.find((vue) => String(vue.id) === String(vueId))?.vue || "";
};

const formatOuiNon = (value) => {
  const normalized = normalizeSearchValue(value);

  if (
    value === true ||
    value === 1 ||
    normalized === "1" ||
    normalized === "oui" ||
    normalized === "yes" ||
    normalized === "true"
  ) {
    return "Oui";
  }

  if (
    value === false ||
    value === 0 ||
    normalized === "0" ||
    normalized === "non" ||
    normalized === "no" ||
    normalized === "false"
  ) {
    return "Non";
  }

  return String(value ?? "");
};

const filterRooms = useCallback((rows, currentSearchTerm) =>
  rows.filter((chambre) => {
    const roomType = getRoomTypeRecord(chambre);
    const roomTypeName = getRoomTypeName(chambre);
    const roomEtageName = getRoomEtageName(chambre);
    const roomVueName = getRoomVueName(chambre);
    const roomClimat = formatOuiNon(chambre.climat);
    const roomWifi = formatOuiNon(chambre.wifi);
    const standardCapacity = roomType?.capacite_standard ?? chambre.capacite_standard ?? "";
    const extraCapacity = roomType?.lits_supplementaires_max ?? chambre.lits_supplementaires_max ?? "";
    const maximumCapacity = standardCapacity !== "" && extraCapacity !== ""
      ? Number(standardCapacity) + Number(extraCapacity)
      : "";

    const matchesType = typeFilter
      ? String(chambre.type_chambre_id ?? roomType?.id ?? "") === String(typeFilter)
      : true;

    const matchesVue = selectedVue
      ? String(chambre.vue?.id || chambre.vue_id || chambre.vue) === String(selectedVue)
      : true;

    const matchesEtage = selectedEtage
      ? String(chambre.etage?.id || chambre.etage_id || chambre.etage) === String(selectedEtage)
      : true;

    const matchesSearch = matchesNormalizedSearch(currentSearchTerm, [
        chambre.num_chambre,
        roomType?.code,
        roomTypeName,
        roomEtageName,
        roomVueName,
        getRoomBedCount(chambre),
        getRoomBathroomCount(chambre),
        standardCapacity,
        maximumCapacity,
        roomClimat,
        `Climatisation ${roomClimat}`,
        roomWifi,
        `Wi-Fi ${roomWifi}`,
        chambre.statut,
        chambre.status,
        chambre.commentaire,
        chambre.description,
        roomType?.commentaire,
      ]);

    return matchesType && matchesVue && matchesEtage && matchesSearch;
  }), [etages, selectedEtage, selectedVue, typeFilter, types, vues]);

const {
  searchTerm,
  page,
  rowsPerPage,
  filteredRows: filteredChambres,
  visibleRows: visibleChambres,
  totalRows,
  setSearchTerm,
  setPage,
  setRowsPerPage,
  resetPage,
} = useListControls({
  allRows: Array.isArray(chambres) ? chambres : [],
  filterRows: filterRooms,
  storageKey: "rowsPerPageChambres",
});

const visibleRoomIds = visibleChambres.map((chambre) => chambre.id);
const allVisibleRoomsSelected =
  visibleRoomIds.length > 0 && visibleRoomIds.every((id) => selectedItems.includes(id));
const filtersActive = Boolean(searchTerm || typeFilter || selectedVue || selectedEtage);

const resetFilters = useCallback(() => {
  setSearchTerm("");
  setTypeFilter("");
  setSelectedVue("");
  setSelectedEtage("");
  setActiveVueIndex(0);
  setActiveEtageIndex(0);
  resetPage();
}, [resetPage, setSearchTerm]);

const exportRows = useMemo(() => filteredChambres.map((chambre) => {
  const roomType = getRoomTypeRecord(chambre);

  return {
    roomNumber: chambre.num_chambre || "",
    roomType: getRoomTypeName(chambre),
    floor: getRoomEtageName(chambre),
    view: getRoomVueName(chambre),
    beds: getRoomBedCount(chambre),
    bathrooms: getRoomBathroomCount(chambre),
    airConditioning: formatOuiNon(chambre.climat),
    wifi: formatOuiNon(chambre.wifi),
    comment: chambre.commentaire ?? chambre.description ?? roomType?.commentaire ?? "",
  };
}), [etages, filteredChambres, types, vues]);

const exportToExcel = () => exportRowsToExcel({
  rows: exportRows,
  columns: ROOM_EXPORT_COLUMNS,
  sheetName: "Chambres",
  filename: "chambres.xlsx",
});
const exportToPDF = () => exportRowsToPdf({
  rows: exportRows,
  columns: ROOM_EXPORT_COLUMNS,
  title: "Liste des Chambres",
  filename: "chambres.pdf",
  orientation: "landscape",
});
const printTable = () => printRows({
  rows: exportRows,
  columns: ROOM_EXPORT_COLUMNS,
  title: "Liste des Chambres",
  orientation: "landscape",
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


const handleVueFilterChange = (vueId) => {
  setSelectedVue(vueId);
  resetPage();
};

const handleEtageFilterChange = (etageId) => {
  setSelectedEtage(etageId);
  resetPage();
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
    type_chambre_id: "",
    num_chambre: "",
    etage: "",
    climat: "",
    wifi: "",
    vue: "",
  });
  setErrors({
    type_chambre_id: "",
    etage: "",
    climat: "",
    wifi: "",
    vue: "",
  });
  setSelectedProductsData([])
  setSelectedProductsDataRep([])
  setEditingChambre(null); 
};
const handleAddEtage = async () => {
  const etageValue = String(
    newEtage.etageAdd || ""
  ).trim();

  if (!etageValue) {
    setEtageErrors((previousErrors) => ({
      ...previousErrors,
      etageAdd: "L'étage est obligatoire.",
    }));
    return;
  }

  try {
    const requestData = new FormData();

    requestData.append("etage", etageValue);

    if (newEtage.photo instanceof File) {
      requestData.append("photo", newEtage.photo);
    }

    await axios.post(
      "http://localhost:8000/api/etages",
      requestData
    );

    await fetchChambres();
    closeAddEtageModal();

    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Étage ajouté avec succès.",
    });
  } catch (error) {
    const backendErrors =
      error.response?.data?.errors || {};

    setEtageErrors((previousErrors) => ({
      ...previousErrors,
      etage:
        backendErrors.etage?.[0] || "",
      etageAdd:
        backendErrors.etage?.[0] || "",
      photo:
        backendErrors.photo?.[0] || "",
    }));

    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text:
        backendErrors.etage?.[0] ||
        backendErrors.photo?.[0] ||
        error.response?.data?.message ||
        "Impossible d'ajouter l'étage.",
    });
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
const handleEditEtage = (etage) => {
  setCategorie(etage.id);
  setEditingEtage(etage);

  setNewEtage({
    etage: etage.etage || "",
    etageAdd: "",
    photo: null,
    existingPhoto: etage.photo || null,
  });

  setEtageErrors({
    etage: "",
    etageAdd: "",
    photo: "",
  });

  setShowEditModalEtage(true);
};
const closeEditEtageModal = () => {
  setShowEditModalEtage(false);

  setNewEtage({
    etage: "",
    etageAdd: "",
    photo: null,
    existingPhoto: null,
  });

  setEditingEtage([]);
  setCategorie(null);

  setEtageErrors({
    etage: "",
    etageAdd: "",
    photo: "",
  });
};
const handleSaveEtage = async () => {
  const etageValue = String(
    newEtage.etage || ""
  ).trim();

  if (!etageValue) {
    setEtageErrors((previousErrors) => ({
      ...previousErrors,
      etage: "L'étage est obligatoire.",
    }));
    return;
  }

  try {
    const requestData = new FormData();

    requestData.append("_method", "PUT");
    requestData.append("etage", etageValue);

    if (newEtage.photo instanceof File) {
      requestData.append("photo", newEtage.photo);
    }

    await axios.post(
      `http://localhost:8000/api/etages/${categorieId}`,
      requestData
    );

    await fetchChambres();
    closeEditEtageModal();

    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Étage modifié avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur modification Étage:",
      error.response?.data || error
    );

    const backendErrors =
      error.response?.data?.errors || {};

    setEtageErrors((previousErrors) => ({
      ...previousErrors,
      etage:
        backendErrors.etage?.[0] || "",
      photo:
        backendErrors.photo?.[0] || "",
    }));

    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text:
        backendErrors.etage?.[0] ||
        backendErrors.photo?.[0] ||
        error.response?.data?.message ||
        `Erreur serveur ${error.response?.status || ""}`,
    });
  }
};

const handleAddVue = async () => {
  const vueValue = String(newVue.vueAdd || "").trim();

  if (!vueValue) {
    setVueErrors((previousErrors) => ({
      ...previousErrors,
      vueAdd: "La vue est obligatoire.",
    }));
    return;
  }

  try {
    const requestData = new FormData();

    requestData.append("vue", vueValue);

    if (newVue.photo instanceof File) {
      requestData.append("photo", newVue.photo);
    }

    await axios.post(
      "http://localhost:8000/api/vues",
      requestData
    );

    await fetchChambres();
    closeAddVueModal();

    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Vue ajoutée avec succès.",
    });
  } catch (error) {
    const backendErrors =
      error.response?.data?.errors || {};

    setVueErrors((previousErrors) => ({
      ...previousErrors,
      vue: backendErrors.vue?.[0] || "",
      vueAdd: backendErrors.vue?.[0] || "",
      photo: backendErrors.photo?.[0] || "",
    }));

    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text:
        backendErrors.vue?.[0] ||
        backendErrors.photo?.[0] ||
        error.response?.data?.message ||
        "Impossible d'ajouter la vue.",
    });
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
const handleEditVue = (vue) => {
  setCategorie(vue.id);
  setEditingVue(vue);

  setNewVue({
    vue: vue.vue || "",
    vueAdd: "",
    photo: null,
    existingPhoto: vue.photo || null,
  });

  setVueErrors({
    vue: "",
    vueAdd: "",
    photo: "",
  });

  setShowEditModalVue(true);
};
const closeEditVueModal = () => {
  setShowEditModalVue(false);

  setNewVue({
    vue: "",
    vueAdd: "",
    photo: null,
    existingPhoto: null,
  });

  setEditingVue([]);
  setCategorie(null);

  setVueErrors({
    vue: "",
    vueAdd: "",
    photo: "",
  });
};

const handleSaveVue = async () => {
  const vueValue = String(newVue.vue || "").trim();

  if (!vueValue) {
    setVueErrors((previousErrors) => ({
      ...previousErrors,
      vue: "La vue est obligatoire.",
    }));
    return;
  }

  try {
    const requestData = new FormData();

    requestData.append("_method", "PUT");
    requestData.append("vue", vueValue);

    if (newVue.photo instanceof File) {
      requestData.append("photo", newVue.photo);
    }

    await axios.post(
      `http://localhost:8000/api/vues/${categorieId}`,
      requestData
    );

    await fetchChambres();
    closeEditVueModal();

    Swal.fire({
      icon: "success",
      title: "Succès!",
      text: "Vue modifiée avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur modification Vue:",
      error.response?.data || error
    );

    const backendErrors =
      error.response?.data?.errors || {};

    setVueErrors((previousErrors) => ({
      ...previousErrors,
      vue: backendErrors.vue?.[0] || "",
      photo: backendErrors.photo?.[0] || "",
    }));

    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text:
        backendErrors.vue?.[0] ||
        backendErrors.photo?.[0] ||
        error.response?.data?.message ||
        `Erreur serveur ${error.response?.status || ""}`,
    });
  }
};
const openAddVueModal = () => {
  setNewVue({
    vue: "",
    vueAdd: "",
    photo: null,
    existingPhoto: null,
  });

  setVueErrors({
    vue: "",
    vueAdd: "",
    photo: "",
  });

  setShowAddVue(true);
};

const closeAddVueModal = () => {
  setShowAddVue(false);

  setNewVue({
    vue: "",
    vueAdd: "",
    photo: null,
    existingPhoto: null,
  });

  setVueErrors({
    vue: "",
    vueAdd: "",
    photo: "",
  });
};
const openAddEtageModal = () => {
  setNewEtage({
    etage: "",
    etageAdd: "",
    photo: null,
    existingPhoto: null,
  });

  setEtageErrors({
    etage: "",
    etageAdd: "",
    photo: "",
  });

  setShowAddEtage(true);
};

const closeAddEtageModal = () => {
  setShowAddEtage(false);

  setNewEtage({
    etage: "",
    etageAdd: "",
    photo: null,
    existingPhoto: null,
  });

  setEtageErrors({
    etage: "",
    etageAdd: "",
    photo: "",
  });
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
    capacite_standardAdd: "",
    lits_supplementaires_maxAdd: "",
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

  const capaciteStandard = Number(newTypeChambre.capacite_standardAdd);
  if (
    newTypeChambre.capacite_standardAdd === "" ||
    !Number.isInteger(capaciteStandard) ||
    capaciteStandard < 1 ||
    capaciteStandard > 3
  ) {
    errors.capacite_standardAdd = "La capacité standard doit être un entier compris entre 1 et 3.";
  }

  const litsSupplementaires = Number(newTypeChambre.lits_supplementaires_maxAdd);
  if (
    newTypeChambre.lits_supplementaires_maxAdd === "" ||
    !Number.isInteger(litsSupplementaires) ||
    litsSupplementaires < 0
  ) {
    errors.lits_supplementaires_maxAdd = "Le nombre de lits supplémentaires doit être un entier positif ou nul.";
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
    capacite_standardAdd: "",
    lits_supplementaires_maxAdd: "0",
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
      capacite_standard: Number(newTypeChambre.capacite_standardAdd),
      lits_supplementaires_max: Number(newTypeChambre.lits_supplementaires_maxAdd),
      commentaire: newTypeChambre.commentaireAdd?.trim() || null,
    };

    console.log("Payload Type Chambre:", payload);

    const response = await axios.post(
      "http://localhost:8000/api/types-chambre",
      payload
    );

    if (response.status === 201) {
      await fetchChambres();
      await fetchReservationReadiness();

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
      const fieldMap = {
        code: "codeAdd",
        type_chambre: "type_chambreAdd",
        nb_lit: "nb_litAdd",
        nb_salle: "nb_salleAdd",
        capacite_standard: "capacite_standardAdd",
        lits_supplementaires_max: "lits_supplementaires_maxAdd",
        commentaire: "commentaireAdd",
      };
      const mappedErrors = Object.entries(validationErrors).reduce((result, [field, messages]) => {
        const targetField = fieldMap[field];
        if (targetField) {
          result[targetField] = Array.isArray(messages) ? messages[0] : messages;
        }
        return result;
      }, {});
      setTypeErrors((currentErrors) => ({ ...currentErrors, ...mappedErrors }));
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
      text: "Type de chambre supprimé avec succès.",
    });
    await fetchChambres();

  } catch (error) {
    console.error("Error deleting categorie:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: error.response?.data?.message || "Échec de la suppression du type de chambre.",
    });
  }
};
const handleEditTypeChambre
= (categorieId) => {
  setEditingType(categorieId);
  setNewTypeChambre({
    ...emptyTypeChambre,
    ...categorieId,
    capacite_standard: categorieId.capacite_standard ?? "",
    lits_supplementaires_max: categorieId.lits_supplementaires_max ?? "",
  });
  setTypeErrors({...typeErrors, 
    codeAdd: "",
    type_chambreAdd: "",
    nb_litAdd: "",
    nb_salleAdd: "",
    commentaireAdd: "",
    capacite_standard: "",
    lits_supplementaires_max: "",
    capacite_standardAdd: "",
    lits_supplementaires_maxAdd: "",
  })
  setCategorie(categorieId.id)
  setShowEditModal(true);
};
const handleSaveTypeChambre = async () => {
  try {
    const validationErrors = {};
    const capacityValue = newTypeChambre.capacite_standard;
    const extraBedsValue = newTypeChambre.lits_supplementaires_max;
    const hadCapacity = editingType?.capacite_standard !== null && editingType?.capacite_standard !== undefined;
    const hadExtraBeds = editingType?.lits_supplementaires_max !== null && editingType?.lits_supplementaires_max !== undefined;

    if (capacityValue === "" && hadCapacity) {
      validationErrors.capacite_standard = "La capacité standard configurée ne peut pas être supprimée.";
    } else if (capacityValue !== "") {
      const parsedCapacity = Number(capacityValue);
      if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 3) {
        validationErrors.capacite_standard = "La capacité standard doit être un entier compris entre 1 et 3.";
      }
    }

    if (extraBedsValue === "" && hadExtraBeds) {
      validationErrors.lits_supplementaires_max = "La valeur configurée ne peut pas être supprimée.";
    } else if (extraBedsValue !== "") {
      const parsedExtraBeds = Number(extraBedsValue);
      if (!Number.isInteger(parsedExtraBeds) || parsedExtraBeds < 0) {
        validationErrors.lits_supplementaires_max = "Le nombre de lits supplémentaires doit être un entier positif ou nul.";
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setTypeErrors((currentErrors) => ({ ...currentErrors, ...validationErrors }));
      return;
    }

    const payload = {
      code: newTypeChambre.code?.trim(),
      type_chambre: newTypeChambre.type_chambre?.trim(),
      nb_lit: Number(newTypeChambre.nb_lit),
      nb_salle: Number(newTypeChambre.nb_salle),
      capacite_standard: capacityValue === "" ? null : Number(capacityValue),
      lits_supplementaires_max: extraBedsValue === "" ? null : Number(extraBedsValue),
      commentaire: newTypeChambre.commentaire?.trim() || null,
    };

    await axios.put(`http://localhost:8000/api/types-chambre/${categorieId}`, payload);
    await fetchChambres(); // Refresh categories after adding
    await fetchReservationReadiness();
    setShowEditModal(false);
    setSelectedCategoryId([])
    // Fermer le modal
            Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Type de chambre modifié avec succès.",
      });
  } catch (error) {
    console.error("Erreur lors de la modification de la catégorie :", error);
    if (error.response?.status === 422) {
      const backendErrors = error.response.data?.errors || {};
      const mappedErrors = Object.entries(backendErrors).reduce((result, [field, messages]) => {
        result[field] = Array.isArray(messages) ? messages[0] : messages;
        return result;
      }, {});
      setTypeErrors((currentErrors) => ({ ...currentErrors, ...mappedErrors }));
      return;
    }

    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: error.response?.data?.message || "Impossible de modifier le type de chambre.",
    });
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
    capacite_standard: "",
    lits_supplementaires_max: "",
    capacite_standardAdd: "",
    lits_supplementaires_maxAdd: "",
  })
}

useEffect(() => {
  if (!showEditModalEtage)
    setEtageErrors({...etageErrors, 
      etageAdd: ""
    });
},[showEditModalEtage])

const isTypeReservationReady = (type) => {
  const capacity = Number(type?.capacite_standard);
  const extraBeds = Number(type?.lits_supplementaires_max);

  return type?.capacite_standard !== null &&
    type?.capacite_standard !== undefined &&
    Number.isInteger(capacity) &&
    capacity >= 1 &&
    capacity <= 3 &&
    type?.lits_supplementaires_max !== null &&
    type?.lits_supplementaires_max !== undefined &&
    Number.isInteger(extraBeds) &&
    extraBeds >= 0;
};

const openTypeFromReadiness = (typeId) => {
  const roomType = types.find((type) => Number(type.id) === Number(typeId));

  if (roomType) {
    handleEditTypeChambre(roomType);
    return;
  }

  resetAddTypeChambreForm();
  setShowAddCategory(true);
};

// Define table columns (customize render as needed)
const columns = [
  {
    key: "num_chambre",
    label: "Num Chambre",
    width: 130,
    render: (item) => highlightText(item.num_chambre, searchTerm),
  },
  {
    key: "type_chambre",
    label: "Type",
    width: 170,
    render: (item) => highlightText(getRoomTypeName(item), searchTerm),
  },
  {
    key: "etage",
    label: "Etage",
    width: 130,
    render: (item) => highlightText(getRoomEtageName(item), searchTerm),
  },
  {
    key: "vue",
    label: "Vue",
    width: 150,
    render: (item) => highlightText(getRoomVueName(item), searchTerm),
  },
  {
    key: "nb_lit",
    label: "Nombre de lit",
    width: 140,
    render: (item) => highlightText(getRoomBedCount(item), searchTerm),
  },
  {
    key: "nb_salle",
    label: "Nombre de Salle",
    width: 160,
    render: (item) => highlightText(getRoomBathroomCount(item), searchTerm),
  },
  {
    key: "climat",
    label: "Climat",
    width: 120,
    render: (item) => highlightText(formatOuiNon(item.climat), searchTerm),
  },
  {
    key: "wifi",
    label: "Wifi",
    width: 120,
    render: (item) => highlightText(formatOuiNon(item.wifi), searchTerm),
  },
];
  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles}}>
        <Box component="main" className="app-page chambre-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>

       
          <SearchWithExport
            Title="Liste des Chambres"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            printTable={printTable}
            exportToPDF={exportToPDF}
            exportToExcel={exportToExcel}
            resultCount={totalRows}
            loading={loading}
            exportsDisabled={loading || totalRows === 0}
          />

          <section className={`app-card app-section chambre-readiness ${reservationReadiness?.ready ? "is-ready" : "is-warning"}`}>
            <div className="chambre-readiness-header">
              <div>
                <h2>Préparation des réservations</h2>
                <p>
                  {readinessLoading
                    ? "Vérification de la configuration en cours..."
                    : reservationReadiness?.ready
                      ? "Prêt pour les réservations"
                      : "Configuration incomplète"}
                </p>
              </div>
              {!readinessLoading && !readinessError && (
                <span className={`app-status-badge ${reservationReadiness?.ready ? "is-success" : "is-warning"}`}>
                  {reservationReadiness?.ready ? "Prêt" : "À compléter"}
                </span>
              )}
            </div>

            {readinessError && <p className="chambre-readiness-error">{readinessError}</p>}

            {!readinessLoading && !readinessError && !reservationReadiness?.ready && (
              <div className="chambre-readiness-content">
                {(reservationReadiness?.room_types?.issues || []).map((roomTypeIssue) => (
                  <div className="chambre-readiness-issue" key={`room-type-${roomTypeIssue.type_chambre_id}`}>
                    <div>
                      <strong>{roomTypeIssue.type_chambre}</strong>
                      <span>{roomTypeIssue.rooms_count} chambre(s)</span>
                      <p>{roomTypeIssue.issues?.map((issue) => issue.message).join(" ")}</p>
                    </div>
                    <button
                      type="button"
                      className="app-secondary-button"
                      onClick={() => openTypeFromReadiness(roomTypeIssue.type_chambre_id)}
                    >
                      Configurer le type de chambre
                    </button>
                  </div>
                ))}

                {(reservationReadiness?.tariff_coverage?.issues || []).slice(0, 5).map((issue, index) => (
                  <div className="chambre-readiness-issue" key={`${issue.code}-${issue.tarif_actuel_id || "none"}-${issue.type_chambre_id || "none"}-${index}`}>
                    <div>
                      <strong>{issue.periode || "Périodes tarifaires"}</strong>
                      <p>{issue.message}</p>
                    </div>
                  </div>
                ))}

                <div className="chambre-readiness-actions">
                  <a className="app-secondary-button" href="/tarifs_chambre">Créer un nouveau plan tarifaire</a>
                  <a className="app-secondary-button" href="/tarifs_actuel">Préparer une période tarifaire</a>
                </div>
              </div>
            )}
          </section>

          
            <div className="app-filter-grid app-section">
            <div className="app-card app-filter-card">
              <h5 className="app-filter-title">Vues du Chambre</h5>
              <div className="bgSecteur app-filter-carousel d-flex justify-content-around">
              <Carousel 
  activeIndex={activeVueIndex}
  onSelect={handleVueSelect}
  interval={null}
  nextIcon={<FaArrowRight className="app-carousel-arrow-icon" />}
  prevIcon={<FaArrowLeft className="app-carousel-arrow-icon" />}
>
{chunks?.map((chunk, chunkIndex) => (
  <Carousel.Item key={chunkIndex}>
    <div className="app-carousel-strip">
      <a
        href="#"
        style={{ marginLeft: "60px" }}
        onClick={(e) => e.preventDefault()}
      >
        <div
          className={`category-item ${
            selectedVue === "" ? "active" : ""
          }`}
          onClick={() => handleVueFilterChange("")}
        >
          <img
            src={allFilterImage}
            alt="Toutes les vues"
            loading="lazy"
            className={`rounded-circle category-img ${
              selectedVue === "" ? "selected" : ""
            }`}
          />

          <p className="category-text">Tout</p>
        </div>
      </a>

      {chunk?.map((category) => (
        <a
          href="#"
          className="mx-5"
          key={category.id}
          onClick={(e) => e.preventDefault()}
        >
          <div
            className={`category-item ${
              String(selectedVue) === String(category.id)
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleVueFilterChange(category.id)
            }
          >
            <img
              src={getStorageImageUrl(
                category.photo,
                "vue-img.webp"
              )}
              alt={category.vue}
              loading="lazy"
              className={`rounded-circle category-img ${
                String(selectedVue) ===
                String(category.id)
                  ? "selected"
                  : ""
              }`}
            />

            <p className="category-text">
              {category.vue}
            </p>
          </div>
        </a>
      ))}
    </div>
  </Carousel.Item>
))}
</Carousel>
</div>
</div>
<div className="app-card app-filter-card">
              <h5 className="app-filter-title">Etages du Chambre</h5>
              <div className="bgSecteur app-filter-carousel d-flex justify-content-around">
              <Carousel 
  activeIndex={activeEtageIndex}
  onSelect={handleEtageSelect}
  interval={null}
  nextIcon={<FaArrowRight className="app-carousel-arrow-icon" />}
  prevIcon={<FaArrowLeft className="app-carousel-arrow-icon" />}
>
{chunks1?.map((chunk, chunkIndex) => (
  <Carousel.Item key={chunkIndex}>
    <div className="app-carousel-strip">
      <a
        href="#"
        style={{ marginLeft: "60px" }}
        onClick={(e) => e.preventDefault()}
      >
        <div
          className={`category-item ${
            selectedEtage === "" ? "active" : ""
          }`}
          onClick={() => handleEtageFilterChange("")}
        >
          <img
            src={allFilterImage}
            alt="Tous les étages"
            loading="lazy"
            className={`rounded-circle category-img ${
              selectedEtage === "" ? "selected" : ""
            }`}
          />

          <p className="category-text">Tout</p>
        </div>
      </a>

      {chunk?.map((category) => (
        <a
          href="#"
          className="mx-5"
          key={category.id}
          onClick={(e) => e.preventDefault()}
        >
          <div
            className={`category-item ${
              String(selectedEtage) ===
              String(category.id)
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleEtageFilterChange(category.id)
            }
          >
            <img
              src={getStorageImageUrl(
                category.photo,
                "etage-img.webp"
              )}
              alt={category.etage}
              loading="lazy"
              className={`rounded-circle category-img ${
                String(selectedEtage) ===
                String(category.id)
                  ? "selected"
                  : ""
              }`}
            />

            <p className="category-text">
              {category.etage}
            </p>
          </div>
        </a>
      ))}
    </div>
  </Carousel.Item>
))}</Carousel>
</div>
</div>
</div>


<div className="container-fluid px-0">
            <div className="app-controls-row">
             
              <a
                onClick={handleShowFormButtonClick}
                className="app-add-button"

              >
                <FontAwesomeIcon
                  icon={faPlus}
                  style={{ cursor: "pointer" ,color: "white" }}
                />
                Ajouter Chambre
              </a>

              <div className="app-filter-controls">
                <Form.Select
                  className="app-filter-select"
                  value={typeFilter}
                  onChange={handleTypeFilterChange}
                  aria-label="Filtrer par type de chambre"
                >
                  <option value="">Tous les types</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.type_chambre}
                    </option>
                  ))}
                </Form.Select>
                <ListFilterReset active={filtersActive} onReset={resetFilters} />
              </div>
            </div>
          

        <div>
        <div id="formContainer" className="app-form-drawer" style={{...formContainerStyle}}>
            <Form className="col row" onSubmit={handleSubmit}>
              <Form.Label className="text-center">
                <h4 className="app-form-drawer-title">
                  {editingChambre ? "Modifier" : "Ajouter"} une Chambre
                </h4>
              </Form.Label>
              <div className="row">
                <Form.Group className="col-md-6 mb-3" controlId="num_chambre">
                  <Form.Label>Numero de Chambre</Form.Label>
                  <Form.Control
                    type="text"
                    name="num_chambre"
                    isInvalid={submitted && !!errors.num_chambre}
                    value={formData.num_chambre}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.num_chambre}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="col-md-6 mb-3" controlId="type_chambre_id">
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
                    name="type_chambre_id"
                    isInvalid={submitted && !!errors.type_chambre_id}
                    value={formData.type_chambre_id}
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
                    {errors.type_chambre_id}
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
                      onClick={openAddVueModal}
                    />
                    <Form.Label>Vue</Form.Label>
                  </div>
                  <Form.Select
                    name="vue"
                    isInvalid={submitted && !!errors.vue}
                    value={formData.vue}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner une Vue</option>
                    {vues?.map((vue) => (
  <option key={vue.id} value={vue.id}>
    {vue.vue}
  </option>
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
                      onClick={openAddEtageModal}
                    />
                    <Form.Label>Etage</Form.Label>
                  </div>
                  <Form.Select
                    name="etage"
                    isInvalid={submitted && !!errors.etage}
                    value={formData.etage}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner un Etage</option>
                    {etages?.map((etage) => (
  <option key={etage.id} value={etage.id}>
    {etage.etage}
  </option>
))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.etage}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
                <Modal
  show={showEditModalVue}
  onHide={closeEditVueModal}
>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une Vue</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
  <Form.Label>Photo actuelle</Form.Label>

  {newVue.existingPhoto ? (
    <div className="mb-2">
      <img
        src={getStorageImageUrl(
          newVue.existingPhoto,
          "vue-img.webp"
        )}
        alt={newVue.vue || "Vue"}
        style={{
          width: "70px",
          height: "70px",
          objectFit: "cover",
          borderRadius: "50%",
          border: "1px solid #e2e8f0",
        }}
      />
    </div>
  ) : (
    <p className="text-muted">
      Aucune photo actuelle
    </p>
  )}

  <Form.Label>Nouvelle photo</Form.Label>

  <Form.Control
    type="file"
    name="photo"
    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
    isInvalid={!!vueErrors.photo}
    onChange={(e) =>
      setNewVue((previousData) => ({
        ...previousData,
        photo: e.target.files?.[0] || null,
      }))
    }
  />

  {vueErrors.photo && (
    <Form.Control.Feedback type="invalid">
      {vueErrors.photo}
    </Form.Control.Feedback>
  )}
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
    onClick={closeEditVueModal}  >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
    <Modal
  show={showEditModalEtage}
  onHide={closeEditEtageModal}
>
      <Modal.Header closeButton>
        <Modal.Title>Modifier une Etage</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
  <Form.Label>Photo actuelle</Form.Label>

  {newEtage.existingPhoto ? (
    <div className="mb-2">
      <img
        src={getStorageImageUrl(
          newEtage.existingPhoto,
          "etage-img.webp"
        )}
        alt={newEtage.etage || "Étage"}
        style={{
          width: "70px",
          height: "70px",
          objectFit: "cover",
          borderRadius: "50%",
          border: "1px solid #e2e8f0",
        }}
      />
    </div>
  ) : (
    <p className="text-muted">
      Aucune photo actuelle
    </p>
  )}

  <Form.Label>Nouvelle photo</Form.Label>

  <Form.Control
    type="file"
    name="photo"
    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
    isInvalid={!!etageErrors.photo}
    onChange={(e) =>
      setNewEtage((previousData) => ({
        ...previousData,
        photo: e.target.files?.[0] || null,
      }))
    }
  />

  {etageErrors.photo && (
    <Form.Control.Feedback type="invalid">
      {etageErrors.photo}
    </Form.Control.Feedback>
  )}
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
    onClick={closeEditEtageModal} >
    Annuler
  </Fab>
      </Form.Group>
    </Modal>
                <Modal show={showAddVue} onHide={closeAddVueModal}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Vue</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form encType="multipart/form-data">
          <Form.Group className="mb-3">
  <Form.Label>Photo</Form.Label>

  <Form.Control
    type="file"
    name="photo"
    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
    isInvalid={!!vueErrors.photo}
    onChange={(e) =>
      setNewVue((previousData) => ({
        ...previousData,
        photo: e.target.files?.[0] || null,
      }))
    }
    className="form-control"
    lang="fr"
  />

  {vueErrors.photo && (
    <Form.Control.Feedback type="invalid">
      {vueErrors.photo}
    </Form.Control.Feedback>
  )}
</Form.Group>



<Form.Group>
  <Form.Label>Vue</Form.Label>

  <Form.Control
    type="text"
    placeholder="Vue"
    name="vue"
    value={newVue.vueAdd}
    isInvalid={!!vueErrors.vueAdd}
    onChange={(e) =>
      setNewVue({
        ...newVue,
        vueAdd: e.target.value,
      })
    }
  />

  <Form.Control.Feedback type="invalid">
    {vueErrors.vueAdd}
  </Form.Control.Feedback>
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
                      src={getStorageImageUrl(
  categ.photo,
  "vue-img.webp"
)}
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
    onClick={closeAddVueModal}
  >
    Annuler
  </Fab>
  </Form.Group>
      </Modal.Body>
      </Modal>
      <Modal show={showAddEtage} onHide={closeAddEtageModal}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Etage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form encType="multipart/form-data">
<Form.Group className="mb-3">
  <Form.Label>Photo</Form.Label>

  <Form.Control
    type="file"
    name="photo"
    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
    isInvalid={!!etageErrors.photo}
    onChange={(e) =>
      setNewEtage((previousData) => ({
        ...previousData,
        photo: e.target.files?.[0] || null,
      }))
    }
    className="form-control"
    lang="fr"
  />

  {etageErrors.photo && (
    <Form.Control.Feedback type="invalid">
      {etageErrors.photo}
    </Form.Control.Feedback>
  )}
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
                        src={getStorageImageUrl(
  categ.photo,
  "etage-img.webp"
)}
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
    onClick={closeAddEtageModal}
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
            <Form.Group className="mt-3">
              <Form.Label>Capacité standard</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="3"
                name="capacite_standard"
                isInvalid={!!typeErrors.capacite_standard}
                value={newTypeChambre.capacite_standard}
                onChange={(e) => {
                  setNewTypeChambre({ ...newTypeChambre, capacite_standard: e.target.value });
                  setTypeErrors((currentErrors) => ({ ...currentErrors, capacite_standard: "" }));
                }}
              />
              <Form.Text>Nombre de personnes couvertes par le tarif normal de la chambre.</Form.Text>
              <Form.Control.Feedback type="invalid">
                {typeErrors.capacite_standard}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Lits supplémentaires maximum</Form.Label>
              <Form.Control
                type="number"
                min="0"
                name="lits_supplementaires_max"
                isInvalid={!!typeErrors.lits_supplementaires_max}
                value={newTypeChambre.lits_supplementaires_max}
                onChange={(e) => {
                  setNewTypeChambre({ ...newTypeChambre, lits_supplementaires_max: e.target.value });
                  setTypeErrors((currentErrors) => ({ ...currentErrors, lits_supplementaires_max: "" }));
                }}
              />
              <Form.Text>Nombre maximal de personnes supplémentaires pouvant être hébergées.</Form.Text>
              <Form.Control.Feedback type="invalid">
                {typeErrors.lits_supplementaires_max}
              </Form.Control.Feedback>
            </Form.Group>
            {!isTypeReservationReady(newTypeChambre) && (
              <div className="type-capacity-warning" role="alert">
                Ce type hérité n’est pas encore prêt pour la tarification des réservations. Complétez les deux valeurs ci-dessus.
              </div>
            )}
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
                  <Modal
                    show={showAddCategory}
                    onHide={() => {
                      resetAddTypeChambreForm();
                      setShowAddCategory(false);
                    }}
                    onEntered={resetRoomTypeModalScroll}
                    size="xl"
                    centered
                    scrollable
                    dialogClassName="room-type-management-modal"
                  >
        <Modal.Header closeButton>
          <Modal.Title>Ajouter et gérer les types de chambre</Modal.Title>
        </Modal.Header>
        <Modal.Body ref={roomTypeModalBodyRef} className="room-type-management-body">
          <Form className="room-type-management-form">
            <Form.Group className="room-type-form-field room-type-form-field-wide">
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
        capacite_standardAdd: "",
        lits_supplementaires_maxAdd: "0",
        commentaireAdd: "",
      }));
    }}
  >
    <option value="preset">Type prédéfini</option>
    <option value="custom">Type personnalisé</option>
  </Form.Select>
</Form.Group>

          <Form.Group className="room-type-form-field">
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
<Form.Group className="room-type-form-field">
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
            <Form.Group className="room-type-form-field">
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
            <Form.Group className="room-type-form-field">
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
            <Form.Group className="room-type-form-field">
              <Form.Label>Capacité standard</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="3"
                required
                value={newTypeChambre.capacite_standardAdd}
                isInvalid={!!typeErrors.capacite_standardAdd}
                onChange={(e) => {
                  setNewTypeChambre({
                    ...newTypeChambre,
                    capacite_standardAdd: e.target.value,
                  });
                  setTypeErrors((currentErrors) => ({ ...currentErrors, capacite_standardAdd: "" }));
                }}
              />
              <Form.Text>Nombre de personnes couvertes par le tarif normal de la chambre.</Form.Text>
              <Form.Control.Feedback type="invalid">
                {typeErrors.capacite_standardAdd}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="room-type-form-field">
              <Form.Label>Lits supplémentaires maximum</Form.Label>
              <Form.Control
                type="number"
                min="0"
                required
                value={newTypeChambre.lits_supplementaires_maxAdd}
                isInvalid={!!typeErrors.lits_supplementaires_maxAdd}
                onChange={(e) => {
                  setNewTypeChambre({
                    ...newTypeChambre,
                    lits_supplementaires_maxAdd: e.target.value,
                  });
                  setTypeErrors((currentErrors) => ({ ...currentErrors, lits_supplementaires_maxAdd: "" }));
                }}
              />
              <Form.Text>Nombre maximal de personnes supplémentaires pouvant être hébergées.</Form.Text>
              <Form.Control.Feedback type="invalid">
                {typeErrors.lits_supplementaires_maxAdd}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="room-type-form-field room-type-form-field-wide">
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
          
            <section className="room-type-existing-section room-type-form-field-wide">
              <div className="room-type-existing-heading">
                <div>
                  <h3>Types de chambre existants</h3>
                  <p>Faites défiler horizontalement pour voir toutes les informations.</p>
                </div>
                <span className="room-type-existing-count">
                  {types?.length ?? 0} {(types?.length ?? 0) === 1 ? "type" : "types"}
                </span>
              </div>
            <div ref={roomTypeTableRef} className="room-type-table-wrapper">
            <table className="table table-bordered room-type-management-table">
              <thead>
                <tr>
                  <th className="room-type-cell-nowrap">Code</th>
                  <th>Type</th>
                  <th className="room-type-cell-nowrap">Lits</th>
                  <th className="room-type-cell-nowrap">Salles</th>
                  <th>Capacité</th>
                  <th className="room-type-cell-nowrap">Lits suppl.</th>
                  <th className="room-type-cell-nowrap">Statut</th>
                  <th className="room-type-comment-cell">Commentaire</th>
                  <th className="room-type-cell-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {types?.map(categ => (
                  <tr key={categ.id}>
                    <td className="room-type-cell-nowrap">{categ.code}</td>
                    <td>{categ.type_chambre}</td>
                    <td className="room-type-cell-nowrap">{categ.nb_lit}</td>
                    <td className="room-type-cell-nowrap">{categ.nb_salle}</td>
                    <td className="room-type-cell-nowrap">
                      {categ.capacite_standard ?? "Non configurée"}
                    </td>
                    <td className="room-type-cell-nowrap">
                      {categ.lits_supplementaires_max ?? "Non configuré"}
                    </td>
                    <td className="room-type-cell-nowrap">
                      <span
                        className={`app-status-badge ${
                          isTypeReservationReady(categ) ? "is-success" : "is-warning"
                        }`}
                      >
                        {isTypeReservationReady(categ) ? "Prêt" : "Non prêt"}
                      </span>
                    </td>
                    <td className="room-type-comment-cell">{categ.commentaire || "—"}</td>
                    <td className="room-type-cell-nowrap">
                      <div className="app-table-actions">
                        <button
                          type="button"
                          className="room-type-action-button"
                          onClick={() => handleEditTypeChambre(categ)}
                          title="Modifier ce type"
                          aria-label="Modifier ce type"
                        >
                          <FontAwesomeIcon icon={faEdit} className="app-table-action is-edit" />
                        </button>
                        <button
                          type="button"
                          className="room-type-action-button"
                          onClick={() => handleDeleteTypeChambre(categ.id)}
                          title="Supprimer ce type"
                          aria-label="Supprimer ce type"
                        >
                          <FontAwesomeIcon icon={faTrash} className="app-table-action is-delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </section>
            
          </Form>
        </Modal.Body>
        
          
          
        <Modal.Footer className="room-type-management-footer">
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
    onClick={() => {
      resetAddTypeChambreForm();
      setShowAddCategory(false);
    }}
  >
    Annuler
  </Fab>
        </Modal.Footer>
      </Modal>

<div className="row">
                <Form.Group className="col-md-6 mb-3" controlId="nb_salle">
                  <Form.Label>Nombre de salles — défini par le type</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedFormType?.nb_salle ?? ""}
                    disabled
                  />
                </Form.Group>

<Form.Group className="col-md-6 mb-3" controlId="nb_lit">
                  <Form.Label>Nombre de lits — défini par le type</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedFormType?.nb_lit ?? ""}
                    disabled
                  />
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
              <Form.Group className="app-form-actions">
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
              </Form.Group>
            </Form>
          </div>

        </div>
            
        <ListState
          loading={loading}
          error={loadError}
          allRowsCount={chambres.length}
          filteredRowsCount={totalRows}
          emptyDataMessage="Aucune chambre enregistrée."
          onRetry={fetchChambres}
          onResetFilters={resetFilters}
        />
        {!loading && !loadError && totalRows > 0 && (
        <div>
          <div
            id="tableContainer"
            className="app-table-wrapper"
            style={{...tableContainerStyle, marginTop: "20px"}}
          >
            <ExpandRTable
            columns={columns}
            data={chambres}
            filteredData={visibleChambres}
            searchTerm={searchTerm}
            highlightText={highlightText}
            selectAll={allVisibleRoomsSelected}
            selectedItems={selectedItems}
            handleSelectAllChange={handleSelectAllChange}
            handleCheckboxChange={handleCheckboxChange}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleDeleteSelected={handleDeleteSelected}
            rowsPerPage={rowsPerPage}
            page={page}
            expandedRows={expandedRows}
            toggleRowExpansion={toggleRow}
            renderExpandedRow={(item) => <></>}
            renderCustomActions={null}
            uiVariant="app"
            externalPagination
            paginationComponent={(
              <ListPagination
                page={page}
                rowsPerPage={rowsPerPage}
                totalRows={totalRows}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
              />
            )}
          />
    </div>
 
              
        </div>
        )}
      </div>
           
    </Box>
    </Box>
    </ThemeProvider>
   );
 };
 
export default Chambre;
