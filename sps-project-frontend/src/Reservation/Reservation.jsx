import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button, Modal, Carousel } from "react-bootstrap";
import Navigation from "../Acceuil/Navigation";
import { highlightText } from '../utils/textUtils';
import TablePagination from "@mui/material/TablePagination";
import "jspdf-autotable";
import Search from "../Acceuil/Search";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Select from 'react-select';  
import {
  faTrash,
  faFileExcel,
  faPlus,
  faEdit,
  faPrint,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import "../style.css";
import "./Reservation.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Checkbox, Fab, Toolbar } from "@mui/material";
import { useOpen } from "../Acceuil/OpenProvider"; // 
// Add this after your imports
import { 
  faBed, 
  faUsers, 
  faClipboardCheck, 
  faMoneyBill
} from "@fortawesome/free-solid-svg-icons";

//------------------------- Reservation ---------------------//
const Reservation = () => {
  const [reservations, setReservations] = useState([]);


  // Modal and editing state (if you use modals or separate forms)
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    reservation_num: "",
    client_id: "",
    client_type: "",
    reservation_date: "",
    date_debut: "",
    date_fin: "",
    status: "",
    selectedRooms: [] // Array to store selected room IDs (Chambre IDs)
  });

  const [stats, setStats] = useState({
    totalReservations: 0,
    totalRooms: 0,
    totalClients: 0,
    totalRevenue: 0
  });
  

  const formStyles = {
  formContainer: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  formRow: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0 -10px'
  },
  formGroup: {
    flex: '0 0 50%',
    padding: '0 10px',
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    fontSize: '14px',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ced4da',
    fontSize: '14px'
  },
  select: {
    width: '100%',
    height: '38px'
  },
  radioGroup: {
    marginTop: '8px'
  }
};
  
  const [tarifActuel, setTarifActuel] = useState(null);
const [selectedMeals, setSelectedMeals] = useState([]);
const [reductionType, setReductionType] = useState("");
const [calculatedTarif, setCalculatedTarif] = useState({
  roomCosts: 0,
  mealCosts: 0,
  reduction: 0,
  total: 0
});

const [filterClientType, setFilterClientType] = useState('all');
const [filterStatus, setFilterStatus] = useState('all');
const [filterDateStart, setFilterDateStart] = useState('');
const [filterDateEnd, setFilterDateEnd] = useState('');

  const [errors, setErrors] = useState({
    reservation_num: "",
    client_id: "",
    client_type: "",
    reservation_date: "",
    date_debut: "",
    date_fin: "",
    status: "",
    selectedRooms: []
  
  });

  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  //-------------------edit-----------------------//
  const [editingReservation, setEditingReservation] = useState(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);


  // Pagination and Search for Reservations
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filteredReservations, setFilteredReservations] = useState([]);

  const indexOfLastReservation = (page + 1) * rowsPerPage;
  const indexOfFirstReservation = indexOfLastReservation - rowsPerPage;
  const currentReservations = reservations.slice(indexOfFirstReservation, indexOfLastReservation);

  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [selectedProductsDataRep, setSelectedProductsDataRep] = useState([]);




  const fetchReservations = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/reservations", {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
  
      if (response.status === 200) {
        // Handle the nested data structure properly
        const reservationsData = response.data.reservations || response.data.data || response.data;
        
        if (Array.isArray(reservationsData)) {
          setReservations(reservationsData);
          setFilteredReservations(reservationsData);
          
          // Calculate stats
          const statsData = {
            totalReservations: reservationsData.length,
            totalRooms: reservationsData.reduce((acc, res) => acc + (res.chambres?.length || 0), 0),
            totalClients: new Set(reservationsData.map(res => res.client_id)).size,
            totalRevenue: reservationsData.reduce((acc, res) => acc + (parseFloat(res.montant_total) || 0), 0)
          };
          setStats(statsData);
        } else {
          throw new Error("Les données de réservation ne sont pas dans un format valide");
        }
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      
      let errorMessage = "Impossible de charger les réservations.";
      if (error.response) {
        errorMessage += ` (${error.response.status}: ${error.response.data?.message || error.response.statusText})`;
      } else if (error.request) {
        errorMessage += " Le serveur ne répond pas.";
      } else {
        errorMessage += ` ${error.message}`;
      }
  
      Swal.fire({
        icon: "error",
        title: "Erreur!",
        text: errorMessage,
      });
      
      // Set empty states
      setReservations([]);
      setFilteredReservations([]);
      setStats({
        totalReservations: 0,
        totalRooms: 0,
        totalClients: 0,
        totalRevenue: 0
      });
    }
  };  
  // Also add this useEffect to handle the initial fetch and periodic updates
  useEffect(() => {
    fetchReservations();
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(fetchReservations, 300000);
    
    // Cleanup on component unmount
    return () => clearInterval(intervalId);
  }, []);    

  const clearAndUpdateLocalStorage = (data) => {
    localStorage.removeItem("reservations");
  
    localStorage.setItem("reservations", JSON.stringify(data));
  }
  
  
  //---------------------------------------------
  const [clientType, setClientType] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [societeClients, setSocieteClients] = useState([]);
  const [particulierClients, setParticulierClients] = useState([]);
  const [isClientsLoading, setIsClientsLoading] = useState(false); 
  const [forceUpdate, setForceUpdate] = useState(false);  
const handleClientTypeChange = async (e) => {
  const selectedType = e.target.value;

  setClientType(selectedType);
  setFormData((prev) => ({
    ...prev,
    client_type: selectedType,
    client_id: "",
  }));

  setIsClientsLoading(true);

  try {
    let response;

    if (selectedType === "societe") {
      response = await axios.get("http://127.0.0.1:8000/api/clients");
      setSocieteClients(response.data.client || response.data.clients || response.data || []);
    } else if (selectedType === "particulier") {
      response = await axios.get("http://127.0.0.1:8000/api/clients_particulier");
      setParticulierClients(response.data.client || response.data.clients || response.data || []);
    }
  } catch (error) {
    console.error("Error fetching clients:", error);
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Impossible de charger les clients.",
    });
  } finally {
    setIsClientsLoading(false);
  }
};    
  useEffect(() => {
    console.log("Societe Clients after state update:", societeClients); 
  }, [societeClients]);  
  
  useEffect(() => {
    console.log("Societe Clients:", societeClients);
    console.log("Particulier Clients:", particulierClients);
  }, [societeClients, particulierClients]);

  const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

const isPastReservation = (reservation) => {
  const today = getTodayDate();
  return reservation?.date_fin && reservation.date_fin < today;
};

const handleChange = (e) => {
  const { name, value } = e.target;
  const today = getTodayDate();

  setFormData((prev) => {
    let updatedData = {
      ...prev,
      [name]: value,
    };

    // If date_debut is changed, date_fin cannot be before it
    if (name === "date_debut") {
      if (value < today) {
        Swal.fire({
          icon: "warning",
          title: "Date invalide",
          text: "La date de début ne peut pas être antérieure à aujourd'hui.",
        });

        return prev;
      }

      if (prev.date_fin && prev.date_fin < value) {
        updatedData.date_fin = "";
      }
    }

    // If date_fin is changed, it cannot be before date_debut
    if (name === "date_fin") {
      if (value < today) {
        Swal.fire({
          icon: "warning",
          title: "Date invalide",
          text: "La date de fin ne peut pas être antérieure à aujourd'hui.",
        });

        return prev;
      }

      if (prev.date_debut && value < prev.date_debut) {
        Swal.fire({
          icon: "warning",
          title: "Date invalide",
          text: "La date de fin doit être supérieure ou égale à la date de début.",
        });

        return prev;
      }
    }

    return updatedData;
  });
};
console.log("Client Type:", clientType);

    
useEffect(() => {
  if (!Array.isArray(reservations)) {
    setFilteredReservations([]);
    return;
  }

  let filtered = [...reservations];

  if (filterClientType !== "all") {
    filtered = filtered.filter(
      (reservation) => reservation.client_type === filterClientType
    );
  }

  if (filterStatus !== "all") {
    filtered = filtered.filter(
      (reservation) => reservation.status === filterStatus
    );
  }

  if (filterDateStart && filterDateEnd) {
    const startDate = new Date(filterDateStart);
    const endDate = new Date(filterDateEnd);

    filtered = filtered.filter((reservation) => {
      const reservationDate = new Date(reservation.date_debut);
      return reservationDate >= startDate && reservationDate <= endDate;
    });
  }

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();

    filtered = filtered.filter((reservation) => {
      return (
        reservation.reservation_num?.toLowerCase().includes(term) ||
        reservation.status?.toLowerCase().includes(term) ||
        reservation.client_type?.toLowerCase().includes(term) ||
        String(reservation.client_id || "").includes(term) ||
        reservation.chambres?.some((chambre) =>
          String(chambre.num_chambre || "").toLowerCase().includes(term)
        )
      );
    });
  }

  setFilteredReservations(filtered);
  setPage(0);
}, [
  reservations,
  filterClientType,
  filterStatus,
  filterDateStart,
  filterDateEnd,
  searchTerm,
]);  
  const resetFilters = () => {
    setFilterClientType('all');
    setFilterStatus('all');
    setFilterDateStart('');
    setFilterDateEnd('');
    setSearchTerm('');
  };
  useEffect(() => {
    if (reservations) {
      const statsData = {
        totalReservations: reservations.length,
        totalRooms: reservations.reduce((acc, res) => acc + (res.chambres?.length || 0), 0),
        totalClients: new Set(reservations.map(res => res.client_id)).size,
        totalRevenue: reservations.reduce((acc, res) => acc + (parseFloat(res.montant_total) || 0), 0)
      };
      setStats(statsData);
    }
  }, [reservations]);
  
  


  const handleSearch = (term) => {
    setSearchTerm(term);
  };
  
  const [numberOfRooms, setNumberOfRooms] = useState(1);

  
  const [availableEtages, setAvailableEtages] = useState([]);
  const [availableVues, setAvailableVues] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableRoomsForSelect, setAvailableRoomsForSelect] = useState([]); // For room numbers

// Fetch available rooms when date range is selected
const [availableRooms, setAvailableRooms] = useState([]);
const [roomTypes, setRoomTypes] = useState([]);
const [roomEtages, setRoomEtages] = useState([]);
const [roomVues, setRoomVues] = useState([]);
const [selectedVue, setSelectedVue] = useState("");
const [selectedEtage, setSelectedEtage] = useState("");

const [selectedRooms, setSelectedRooms] = useState([]);

const getFilteredAvailableRooms = (currentIndex) => {
  const selectedRoomIds = selectedRooms.map(room => room.id).filter(id => id);

  return availableRooms.filter(chambre =>
    !selectedRoomIds.includes(chambre.id) || chambre.id === selectedRooms[currentIndex]?.id
  );
};
const handleRoomChange = (rowIndex, field, value) => {
  setSelectedRooms((prevRooms) => {
    const updatedRooms = [...prevRooms];
    const allRooms = getRoomsForSelection();

    const norm = (v) =>
      v === null || v === undefined ? "" : String(v).trim().toLowerCase();

    const currentBeforeUpdate = updatedRooms[rowIndex] || {
      id: "",
      type: "",
      etage: "",
      vue: "",
      num_chambre: "",
    };

    if (field === "num_chambre") {
      const selectedRoom = allRooms.find(
        (room) => String(room.num_chambre) === String(value)
      );

      if (selectedRoom) {
        updatedRooms[rowIndex] = {
          id: selectedRoom.id,
          num_chambre: selectedRoom.num_chambre,
          type: selectedRoom.type_chambre,
          etage: selectedRoom.etage,
          vue: selectedRoom.vue,
        };
      } else {
        updatedRooms[rowIndex] = {
          ...currentBeforeUpdate,
          id: "",
          num_chambre: value,
        };
      }

      return updatedRooms;
    }

    const currentRoom = {
      ...currentBeforeUpdate,
      [field]: value,
    };

    const otherSelectedIds = updatedRooms
      .filter((_, idx) => idx !== rowIndex)
      .map((room) => room.id)
      .filter(Boolean)
      .map(String);

    let validRooms = allRooms.filter(
      (room) => !otherSelectedIds.includes(String(room.id))
    );

    if (currentRoom.type) {
      validRooms = validRooms.filter(
        (room) => norm(room.type_chambre) === norm(currentRoom.type)
      );
    }

    if (currentRoom.etage) {
      validRooms = validRooms.filter(
        (room) => norm(room.etage) === norm(currentRoom.etage)
      );
    }

    if (currentRoom.vue) {
      validRooms = validRooms.filter(
        (room) => norm(room.vue) === norm(currentRoom.vue)
      );
    }

    const selectedRoomStillValid =
      currentRoom.id &&
      validRooms.some((room) => String(room.id) === String(currentRoom.id));

    if (!selectedRoomStillValid) {
      currentRoom.id = "";
      currentRoom.num_chambre = "";
    }

    if (validRooms.length === 1 && validRooms[0].num_chambre) {
      updatedRooms[rowIndex] = {
        id: validRooms[0].id,
        num_chambre: validRooms[0].num_chambre,
        type: validRooms[0].type_chambre,
        etage: validRooms[0].etage,
        vue: validRooms[0].vue,
      };
    } else {
      updatedRooms[rowIndex] = currentRoom;
    }

    return updatedRooms;
  });
};
// Update useEffect for tariff calculation
useEffect(() => {
  const loadClientData = async () => {
    try {
      // Load société clients (backend: /api/clients)
      const societeResponse = await axios.get("http://127.0.0.1:8000/api/clients");
      setSocieteClients(societeResponse.data.client || societeResponse.data.clients || societeResponse.data);

      // Load particulier clients (backend: /api/clients_particulier)
      const particulierResponse = await axios.get("http://127.0.0.1:8000/api/clients_particulier");
      setParticulierClients(particulierResponse.data.client || particulierResponse.data.clients || particulierResponse.data);
    } catch (error) {
      console.error("Error loading client data:", error);
    }
  };

  loadClientData();
}, []);


const handleDeleteRoom = (rowIndex) => {
  const updatedRooms = selectedRooms.filter((_, index) => index !== rowIndex);
  setSelectedRooms(updatedRooms);
};
const addRow = () => {
  setSelectedRooms([...selectedRooms, { type: "", vue: "", etage: "", num: "" }]);
};

const getRoomsForSelection = () => {
  const roomsMap = new Map();

  availableRooms.forEach((room) => {
    roomsMap.set(String(room.id), room);
  });

  selectedRooms.forEach((room) => {
    if (room?.id) {
      roomsMap.set(String(room.id), {
        id: room.id,
        num_chambre: room.num_chambre,
        type_chambre: room.type,
        etage: room.etage,
        vue: room.vue,
      });
    }
  });

  return Array.from(roomsMap.values());
};

const getFilteredOptions = (filterType, rowIndex) => {
  let validRooms = getRoomsForSelection();
  const currentRoom = selectedRooms[rowIndex];

  const norm = (v) =>
    v === null || v === undefined ? "" : String(v).trim().toLowerCase();

  const otherSelectedRoomIds = selectedRooms
    .filter((_, index) => index !== rowIndex)
    .map((room) => room.id)
    .filter(Boolean)
    .map(String);

  validRooms = validRooms.filter((room) => {
    return (
      !otherSelectedRoomIds.includes(String(room.id)) ||
      String(room.id) === String(currentRoom?.id)
    );
  });

  if (filterType !== "type" && currentRoom?.type) {
    validRooms = validRooms.filter(
      (room) => norm(room.type_chambre) === norm(currentRoom.type)
    );
  }

  if (filterType !== "etage" && currentRoom?.etage) {
    validRooms = validRooms.filter(
      (room) => norm(room.etage) === norm(currentRoom.etage)
    );
  }

  if (filterType !== "vue" && currentRoom?.vue) {
    validRooms = validRooms.filter(
      (room) => norm(room.vue) === norm(currentRoom.vue)
    );
  }

  switch (filterType) {
    case "type":
      return [...new Set(validRooms.map((room) => room.type_chambre).filter(Boolean))];

    case "etage":
      return [...new Set(validRooms.map((room) => room.etage).filter(Boolean))];

    case "vue":
      return [...new Set(validRooms.map((room) => room.vue).filter(Boolean))];

    case "num_chambre":
      return [...new Set(validRooms.map((room) => room.num_chambre).filter(Boolean))];

    default:
      return [];
  }
};
console.log('Available rooms:', availableRooms);
console.log('Number of rooms selected:', numberOfRooms);
// Add this function after other useEffect declarations
// Update the calculateReservationTarif function
const calculateReservationTarif = async () => {
  if (!formData.date_debut || !formData.date_fin) {
    setCalculatedTarif({ roomCosts: 0, mealCosts: 0, reduction: 0, total: 0 });
    return null;
  }

  const chambreIds = selectedRooms.filter((room) => room?.id).map((room) => room.id);

  if (!chambreIds.length) {
    setCalculatedTarif({ roomCosts: 0, mealCosts: 0, reduction: 0, total: 0 });
    return null;
  }

  try {
    const requestData = {
      date_debut: formData.date_debut,
      date_fin: formData.date_fin,
      chambre_ids: chambreIds,
      repas_ids: selectedMeals.map((meal) => meal.value),
      reduction_type: reductionType || null,
    };

    const response = await axios.post(
      "http://localhost:8000/api/reservations/calculate-tarif",
      requestData
    );

    if (response.data?.status !== "success") {
      throw new Error(response.data?.message || "Failed to calculate tariff");
    }

    const tariffDetails = response.data.tariff_details || {};

    setCalculatedTarif({
      roomCosts: tariffDetails.roomCosts || 0,
      mealCosts: tariffDetails.mealCosts || 0,
      reduction: tariffDetails.reduction || 0,
      total: tariffDetails.total || 0,
    });

    return tariffDetails;
  } catch (error) {
    console.error("Tariff calculation error:", error);
    setCalculatedTarif({ roomCosts: 0, mealCosts: 0, reduction: 0, total: 0 });
    return null;
  }
};
useEffect(() => {
  calculateReservationTarif();
}, [formData.date_debut, formData.date_fin, selectedRooms, selectedMeals, reductionType]);
/*const handleRoomChange = (index, field, value) => {
  setSelectedRooms(prevRooms => {
    const updatedRooms = [...prevRooms];
    updatedRooms[index][field] = value;

    if (field === "chambre" && value) {
      const selectedRoom = availableRooms.find(room => room.id === parseInt(value));
      if (selectedRoom) {
        updatedRooms[index].type = selectedRoom.type_chambre;
        updatedRooms[index].etage = selectedRoom.etage;
        updatedRooms[index].vue = selectedRoom.vue;
      }
    }

    return updatedRooms;
  });
};*/

const handleAddEmptyRow = () => {
    if (!availableRooms.length) {
        Swal.fire({
            icon: "warning",
            title: "Aucune chambre disponible",
            text: "Il n'y a pas de chambres disponibles pour ces dates.",
        });
        return;
    }
    
    const alreadySelectedRoomIds = selectedRooms.map(room => room.id).filter(id => id);
    const remainingRooms = availableRooms.filter(room => !alreadySelectedRoomIds.includes(room.id));

    if (remainingRooms.length === 0) {
        Swal.fire({
            icon: "warning",
            title: "Limite atteinte",
            text: "Vous avez sélectionné toutes les chambres disponibles.",
        });
        return;
    }

    setSelectedRooms(prev => [...prev, { type: "", etage: "", vue: "", num_chambre: "" }]);
};


const handleNumberOfRoomsChange = (e) => {
  const number = parseInt(e.target.value);
  
  if (availableRooms.length > 0 && number <= availableRooms.length) {
    setNumberOfRooms(number);  
  } else {
    alert(`You cannot select more rooms than the available rooms (${availableRooms.length}).`);
    setNumberOfRooms(availableRooms.length);  
  }
};


  /*const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.type === "file" ? e.target.files[0] : e.target.value,
    });
  };*/

  //------------------------- CHAMBRE EDIT---------------------//noow

  const handleEdit = async (reservation) => {
    try {
      // Debug log the full reservation object
      console.log("Full reservation data:", reservation);
      
      // Validate required fields
      if (!reservation.id) {
        throw new Error("Missing reservation ID");
      }

      if (isPastReservation(reservation)) {
  Swal.fire({
    icon: "warning",
    title: "Réservation terminée",
    text: "Cette réservation est déjà passée. Elle ne peut plus être modifiée depuis ce formulaire.",
  });
  return;
}
  
      // Set editing state with full reservation object
      setEditingReservation({
        ...reservation,
        id: reservation.id // Ensure ID is present
      });
      
      // Log the state update
      console.log("Setting editing state:", {
        id: reservation.id,
        reservation_num: reservation.reservation_num
      });
  
      // Set client type
      setClientType(reservation.client_type);
  
      // Set form data
      const formDataToSet = {
        reservation_num: reservation.reservation_num,
        client_id: reservation.client_id,
        client_type: reservation.client_type,
        reservation_date: reservation.reservation_date,
        date_debut: reservation.date_debut,
        date_fin: reservation.date_fin,
        status: reservation.status
      };
  
      console.log("Setting form data:", formDataToSet);
      setFormData(formDataToSet);
  
      // Handle rooms
      if (reservation.chambres?.length) {
        const formattedRooms = reservation.chambres.map(chambre => ({
          id: chambre.id,
          type: chambre.type_chambre || "",
          etage: chambre.etage || "",
          vue: chambre.vue || "",
           num_chambre: chambre.num_chambre || "",
        }));
        console.log("Setting room data:", formattedRooms);
        setSelectedRooms(formattedRooms);
      }else {
        setSelectedRooms([]);
      }
  
      // Show form
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
  
    } catch (error) {
      console.error("Edit error:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur!",
        text: "Erreur lors du chargement des données"
      });
    }
  };
  
useEffect(() => {
  const loadAvailableRooms = async () => {
    if (!formData.date_debut || !formData.date_fin) {
      setAvailableRooms([]);
      setRoomTypes([]);
      setRoomEtages([]);
      setRoomVues([]);
      return;
    }

    try {
      const response = await axios.get("http://localhost:8000/api/available-rooms", {
        params: {
          date_debut: formData.date_debut,
          date_fin: formData.date_fin,
          reservation_num: editingReservation?.reservation_num || null,
        },
      });

      if (response.data.status === "success") {
        const rooms = response.data.rooms || [];
        setAvailableRooms(rooms);

        setRoomTypes([...new Set(rooms.map((room) => room.type_chambre).filter(Boolean))]);
        setRoomEtages([...new Set(rooms.map((room) => room.etage).filter(Boolean))]);
        setRoomVues([...new Set(rooms.map((room) => room.vue).filter(Boolean))]);
      } else {
        setAvailableRooms([]);
        setRoomTypes([]);
        setRoomEtages([]);
        setRoomVues([]);
      }
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      setAvailableRooms([]);
      setRoomTypes([]);
      setRoomEtages([]);
      setRoomVues([]);
    }
  };

  loadAvailableRooms();
}, [formData.date_debut, formData.date_fin, editingReservation?.reservation_num]);

useEffect(() => {
  if (
    formContainerStyle.right === "0" &&
    !editingReservation &&
    formData.date_debut &&
    formData.date_fin &&
    availableRooms.length > 0 &&
    selectedRooms.length === 0
  ) {
    setSelectedRooms([{ type: "", etage: "", vue: "", num_chambre: "", id: "" }]);
  }
}, [
  formContainerStyle.right,
  editingReservation,
  formData.date_debut,
  formData.date_fin,
  availableRooms,
  selectedRooms.length,
]);

  useEffect(() => {
    const validateData = () => {
      const newErrors = { ...errors };
      newErrors.reservation_num = formData.reservation_num === "";
      newErrors.client_id = formData.client_id === "";
      newErrors.reservation_date = formData.reservation_date === "";
      newErrors.date_debut = formData.date_debut === "";
      newErrors.date_fin = formData.date_fin === ""
        || new Date(formData.date_fin) < new Date(formData.date_debut);
      newErrors.status = formData.status === "";
  

      setErrors(newErrors);
    };
  
    validateData();
  }, [formData]); // Run validation whenever formData changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);

    
    try {
      // Add debug logging
      console.log('Submit Data:', {
        formData,
        selectedRooms,
        editingReservation
      });
  
      // Validation
     // Validation
      if (
        !formData.client_id ||
        !formData.client_type ||
        !formData.date_debut ||
        !formData.date_fin ||
        !formData.status ||
        !selectedRooms.filter((room) => room.id).length
      ) {
        Swal.fire({
          icon: "error",
          title: "Erreur!",
          text: "Veuillez remplir tous les champs obligatoires.",
        });
        return;
      }  

      const today = getTodayDate();

if (formData.date_debut < today) {
  Swal.fire({
    icon: "error",
    title: "Date invalide",
    text: "La date de début ne peut pas être antérieure à aujourd'hui.",
  });
  return;
}

if (formData.date_fin < today) {
  Swal.fire({
    icon: "error",
    title: "Date invalide",
    text: "La date de fin ne peut pas être antérieure à aujourd'hui.",
  });
  return;
}

if (formData.date_fin < formData.date_debut) {
  Swal.fire({
    icon: "error",
    title: "Date invalide",
    text: "La date de fin doit être supérieure ou égale à la date de début.",
  });
  return;
}


      // Prepare request data
      const requestData = {
        client_id: formData.client_id,
        client_type: formData.client_type,
        reservation_date: formData.reservation_date || new Date().toISOString().split('T')[0],
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        status: formData.status,
        chambre_ids: selectedRooms.filter(room => room.id).map(room => room.id),
        repas_ids: selectedMeals.map(meal => meal.value),
        reduction_type: reductionType || null
      };
  
      let response;
      if (editingReservation) {
        // Calculate tariff first
        const tariffResponse = await axios.post(
          'http://localhost:8000/api/reservations/calculate-tarif',
          {
            date_debut: formData.date_debut,
            date_fin: formData.date_fin,
            chambre_ids: selectedRooms.filter(room => room.id).map(room => room.id),
            repas_ids: selectedMeals.map(meal => meal.value),
            reduction_type: reductionType || null
          }
        );
  
        if (!tariffResponse.data || tariffResponse.data.status !== 'success') {
          throw new Error(tariffResponse.data?.message || 'Failed to calculate tariff');
        }
  
        // Update reservation
        response = await axios.put(
          `http://localhost:8000/api/reservations/${editingReservation.reservation_num}`,
          {
            ...requestData,
            reservation_num: editingReservation.reservation_num,
            montant_total: tariffResponse.data.tariff_details.total,
            montant_reduction: tariffResponse.data.tariff_details.reduction
          }
        );
      } else {
        // For new reservations
        const timestamp = Date.now().toString().slice(-6);
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        requestData.reservation_num = `R${timestamp}${randomStr}`;
        
        response = await axios.post("http://localhost:8000/api/reservations", requestData);
      }
  
      // Check response
      if (!response.data || !response.data.status) {
        throw new Error('Invalid response from server');
      }
  
      if (response.data.status === 'success') {
        Swal.fire({
          icon: "success",
          title: "Succès!",
          text: editingReservation 
            ? "Réservation modifiée avec succès."
            : "Réservation créée avec succès.",
        });
  
        // Reset form and refresh
        resetForm();
        await fetchReservations();
        closeForm();
      } else {
        throw new Error(response.data.message || 'Operation failed');
      }
  
    } catch (error) {
      console.error("Error Details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: error.config
      });
  
      let errorMessage = "Une erreur s'est produite lors de la soumission de la réservation.";
      
      if (error.response?.status === 404) {
        errorMessage = "La réservation n'a pas été trouvée. Veuillez rafraîchir la page.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
  
      Swal.fire({
        icon: "error",
        title: "Erreur!",
        text: errorMessage
      });
    }
  };  console.log("Selected rooms:", selectedRooms);

  const generateReservationNumber = () => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 random chars
    return `R${timestamp}${random}`;
  };
  
  //------------------------- CLIENT PAGINATION---------------------//
  const logReservationState = () => {
    console.log('Current Reservation State:', {
      formData,
      editingReservation,
      selectedRooms,
      selectedMeals,
      clientType,
      reductionType
    });
  };
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
    const savedRowsPerPage = localStorage.getItem('rowsPerPageReservations');
    if (savedRowsPerPage) {
      setRowsPerPage(parseInt(savedRowsPerPage, 10));
    }
  }, []);

const resetForm = () => {
  setFormData({
    reservation_num: "",
    client_id: "",
    client_type: "",
    reservation_date: "",
    date_debut: "",
    date_fin: "",
    status: "confirmé",
    selectedRooms: [],
  });

  setClientType("");
  setSelectedRooms([]);
  setSelectedMeals([]);
  setReductionType("");
  setCalculatedTarif({ roomCosts: 0, mealCosts: 0, reduction: 0, total: 0 });
  setEditingReservation(null);
  setTarifActuel(null);
};
  //------------------------- CLIENT DELETE---------------------//

  const handleDelete = (reservation_num) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer cette réservation ?",
      text: "Cette action est irréversible!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler"
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`http://localhost:8000/api/reservations/${reservation_num}`)
          .then((response) => {
            if (response.status === 200) {
              Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Réservation supprimée avec succès.",
              });
              fetchReservations(); 
            }
          })
          .catch((error) => {
            console.error("Erreur lors de la suppression:", error);
            Swal.fire({
              icon: "error",
              title: "Erreur!",
              text: error.response?.data?.message || "Erreur lors de la suppression de la réservation.",
            });
          });
      }
    });
  };

   //-------------------------Select Delete --------------------//
   const handleDeleteSelected = () => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer?",
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
        // Log selected items and URLs before deletion
        console.log("Selected items for deletion:", selectedItems);
        
        Promise.all(
          selectedItems.map((reservationNum) => {
            const url = `http://localhost:8000/api/reservations/${reservationNum}`;
            console.log("Attempting to delete:", url);
            return axios.delete(url);
          })
        )
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Succès!",
            text: "Réservations supprimées avec succès.",
          });
          setSelectedItems([]);
          fetchReservations();
        })
        .catch((error) => {
          console.error("Full error details:", error);
          console.error("Failed URLs:", selectedItems.map(num => 
            `http://localhost:8000/api/reservations/${num}`
          ));
          
          Swal.fire({
            icon: "error",
            title: "Erreur!",
            text: `Échec de la suppression: ${error.message}`,
          });
        });
      }
    });
  };  
  
  const handleSelectAllChange = () => {
  setSelectAll(!selectAll);
  const newSelection = !selectAll 
    ? filteredReservations?.map(res => res.reservation_num) || []
    : [];
  console.log("Select all new selection:", newSelection); // Debug log
  setSelectedItems(newSelection);
};
  
  const handleCheckboxChange = (itemId) => {
    console.log("Toggling item:", itemId); // Debug log
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
    console.log("Updated selection:", selectedItems); // Debug log
  };

  const exportToExcel = () => {
    // Create a new array with properly formatted data
    const excelData = filteredReservations?.map(reservation => {
      // Format client information
      const client = reservation.client_type === "societe" 
        ? societeClients.find(c => c.id === reservation.client_id)
        : particulierClients.find(c => c.id === reservation.client_id);
      
      const clientInfo = client ? (
        reservation.client_type === "societe"
          ? `${client.raison_sociale || ''} (${client.CodeClient || ''})`
          : `${client.name || ''} ${client.prenom || ''} (${client.CodeClient || ''})` 
      ) : 'N/A';
  
      // Format room numbers
      const roomNumbers = reservation.chambres 
        ? reservation.chambres.map(chambre => chambre.num_chambre).join(', ')
        : '';
  
      // Format dates
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
      };
  
      return {
        'Code Réservation': reservation.reservation_num || '',
        'Client': clientInfo,
        'Chambres': roomNumbers,
        'Date Reservation': formatDate(reservation.reservation_date),
        'Date Début': formatDate(reservation.date_debut),
        'Date Fin': formatDate(reservation.date_fin),
        'Status': reservation.status || '',
        'Tarif Total': reservation.montant_total ? `${reservation.montant_total} DH` : '0 DH'
      };
    });
  
    // Create a new workbook
    const wb = XLSX.utils.book_new();
  
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
  
    // Add title and export date
    XLSX.utils.sheet_add_aoa(ws, [
      ['Liste des Réservations'],
      [`Date d'exportation: ${new Date().toLocaleDateString('fr-FR')}`],
      [''] // Empty row for spacing
    ], { origin: 'A1' });
  
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Code Réservation
      { wch: 40 }, // Client
      { wch: 20 }, // Chambres
      { wch: 15 }, // Date Reservation
      { wch: 15 }, // Date Début
      { wch: 15 }, // Date Fin
      { wch: 15 }, // Status
      { wch: 15 }  // Tarif Total
    ];
    ws['!cols'] = columnWidths;
  
    // Add styling
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (!ws[cell_ref]) continue;
        
        // Add cell styling
        ws[cell_ref].s = {
          font: { sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }
    }
  
    // Add total count
    XLSX.utils.sheet_add_aoa(ws, [
      [''],
      [`Nombre total de réservations: ${filteredReservations?.length || 0}`]
    ], { origin: -1 });
  
    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Reservations');
  
    // Generate & Save Excel file
    XLSX.writeFile(wb, 'liste_reservations.xlsx');
  };  
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title and date
    doc.setFontSize(18);
    doc.text('Liste des Réservations', doc.internal.pageSize.width/2, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Date d'exportation: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width/2, 22, { align: 'center' });
    
    // Configure the table
    doc.autoTable({
      head: [[
        'Code Réservation',
        'Client',
        'Chambres',
        'Date Reservation',
        'Date Début',
        'Date Fin',
        'Status',
        'Tarif Total'
      ]],
      body: filteredReservations?.map(reservation => [
        reservation.reservation_num || '',
        (() => {
          const client = reservation.client_type === "societe" 
            ? societeClients.find(c => c.id === reservation.client_id)
            : particulierClients.find(c => c.id === reservation.client_id);
          
          if (client) {
            return reservation.client_type === "societe"
              ? `${client.raison_sociale || ''} (${client.CodeClient || ''})`
              : `${client.name || ''} ${client.prenom || ''} (${client.CodeClient || ''})`;
          }
          return 'N/A';
        })(),
        reservation.chambres ? reservation.chambres.map(chambre => chambre.num_chambre).join(', ') : '',
        reservation.reservation_date || '',
        reservation.date_debut || '',
        reservation.date_fin || '',
        reservation.status || '',
        reservation.montant_total ? `${reservation.montant_total} DH` : '0 DH'
      ]),
      startY: 30,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'center'
      },
      headStyles: {
        fillColor: '#007bff',
        textColor: '#ffffff',
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: '#f8f9fa'
      },
      margin: { top: 30 }
    });
  
    // Add total count at the bottom
    const finalY = doc.autoTable.previous.finalY || 30;
    doc.setFontSize(10);
    doc.text(
      `Nombre total de réservations: ${filteredReservations?.length || 0}`,
      14,
      finalY + 10
    );
  
    // Save the PDF
    doc.save('liste_reservations.pdf');
  };  

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    
    // Create a more sophisticated print layout
    printWindow.document.write(`
      <html>
        <head>
          <title>Liste des Réservations</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #333;
              margin-bottom: 10px;
            }
            .header p {
              color: #666;
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px 8px;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
              color: #333;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f8f8f8;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Liste des Réservations</h1>
            <p>Date d'impression: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Code Réservation</th>
                <th>Client</th>
                <th>Chambres</th>
                <th>Date Reservation</th>
                <th>Date Début</th>
                <th>Date Fin</th>
                <th>Status</th>
                <th>Tarif Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReservations?.map(reservation => `
                <tr>
                  <td>${reservation.reservation_num || ''}</td>
                  <td>${(() => {
                    const client = reservation.client_type === "societe" 
                      ? societeClients.find(c => c.id === reservation.client_id)
                      : particulierClients.find(c => c.id === reservation.client_id);
                    
                    if (client) {
                      return reservation.client_type === "societe"
                        ? `${client.raison_sociale || ''} (${client.CodeClient || ''})`
                        : `${client.name || ''} ${client.prenom || ''} (${client.CodeClient || ''})`;
                    }
                    return 'N/A';
                  })()}</td>
                  <td>${reservation.chambres ? reservation.chambres.map(chambre => chambre.num_chambre).join(', ') : ''}</td>
                  <td>${reservation.reservation_date || ''}</td>
                  <td>${reservation.date_debut || ''}</td>
                  <td>${reservation.date_fin || ''}</td>
                  <td>${reservation.status || ''}</td>
                  <td>${reservation.montant_total ? `${reservation.montant_total} DH` : '0 DH'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Nombre total de réservations: ${filteredReservations?.length || 0}</p>
          </div>
        </body>
      </html>
    `);
  
    printWindow.document.close();
    
    // Wait for all content to load before printing
    printWindow.onload = function() {
      printWindow.print();
    };
  };  

  


const filteredcReservations = reservations?.filter((reservation) => {
  return (
    (searchTerm
      ? (
          reservation.reservation_num?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (reservation.client_data?.name && reservation.client_data.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          reservation.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (reservation.chambre?.num_chambre && reservation.chambre.num_chambre.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : true)
  );
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
    await fetchReservations(); // Refresh categories after adding

    // Récupérer les nouvelles catégories après suppression
   
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Erreur!",
      text: "Ce type est associé à une autre reservation.",
    });
  }
};

const [activeIndex, setActiveIndex] = useState(0);
const [filtreclientBySect,setFiltreClientBySect] = useState([])
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


const handleShowFormButtonClick = () => {
  if (formContainerStyle.right === "-100%") {
    setEditingReservation(null);
    setSelectedRooms([]);
    setAvailableRooms([]);

    setFormData({
      reservation_num: generateReservationNumber(),
      client_id: "",
      client_type: "",
      reservation_date: "",
      date_debut: "",
      date_fin: "",
      status: "confirmé",
      selectedRooms: [],
    });

    setClientType("");

    setFormContainerStyle({ right: "0" });
    setTableContainerStyle({ marginRight: "650px" });
  } else {
    closeForm();
  }
};
// Ensure reservation number is generated once when opening the form
useEffect(() => {
  if (formContainerStyle.right !== "0") return;

  setShowForm(true);

  setFormData((prev) => ({
    ...prev,
    reservation_num: prev.reservation_num || generateReservationNumber(),
  }));
}, [formContainerStyle.right]);

  const closeForm = () => {
  setFormContainerStyle({ right: "-100%" });
  setTableContainerStyle({ marginRight: "0" });
  setShowForm(false); 
  setFormData({
    reservation_num: generateReservationNumber(), // Add this line
    client_id: "",
    client_type: "",
    reservation_date: "",
    date_debut: "",
    date_fin: "",
    status: "confirmé",
    selectedRooms: []
  });
  setErrors({
    reservation_num: "",
    client_id: "",
    client_type: "",
    reservation_date: "",
    date_debut: "",
    date_fin: "",
    status: "",
    selectedRooms: []
  });
  setSelectedProductsData([])
  setSelectedProductsDataRep([])
  setEditingReservation(null); 
  setHasSubmitted(false);
 };

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles}}>
        <Box component="main" className="app-page reservation-page" sx={{ flexGrow: 1, p: 3, mt: 0 }}>
<div className="app-page-header">
  <h1 className="app-page-title">Liste des Réservations</h1>

  <div className="app-toolbar">
    <div className="app-search-box">
      <Search onSearch={handleSearch} type="search" />
    </div>

    <div className="app-export-actions">
      <FontAwesomeIcon
        icon={faPrint}
        onClick={printTable}
        className="app-action-icon is-muted"
      />

      <FontAwesomeIcon
        icon={faFilePdf}
        onClick={exportToPDF}
        className="app-action-icon is-danger"
      />

      <FontAwesomeIcon
        icon={faFileExcel}
        onClick={exportToExcel}
        className="app-action-icon is-success"
      />
    </div>
  </div>
</div>



<div className="app-section app-stats-grid">
  {[
    {
      title: "Réservations Totales",
      value: stats.totalReservations || 0,
      color: "#00afaa",
      icon: faClipboardCheck,
    },
    {
      title: "Chambres Réservées",
      value: stats.totalRooms || 0,
      color: "#1565c0",
      icon: faBed,
    },
    {
      title: "Clients Totaux",
      value: stats.totalClients || 0,
      color: "#e65100",
      icon: faUsers,
    },
    {
      title: "Revenu Total",
      value: `${Number(stats.totalRevenue || 0).toFixed(2)} DH`,
      color: "#6a1b9a",
      icon: faMoneyBill,
    },
  ].map((stat, index) => (
    <div
      key={index}
      className="app-stat-card"
      style={{ borderTopColor: stat.color }}
    >
      <div
        className="app-stat-icon"
        style={{ backgroundColor: `${stat.color}20` }}
      >
        <FontAwesomeIcon
          icon={stat.icon}
          style={{ color: stat.color, fontSize: "20px" }}
        />
      </div>

      <div>
        <div className="app-stat-title">{stat.title}</div>
        <div className="app-stat-value" style={{ color: stat.color }}>
          {stat.value}
        </div>
      </div>
    </div>
  ))}
</div>
          <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center mb-4">
    {/* Add Button - Left side */}
    <div>
      <a
        onClick={handleShowFormButtonClick}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          backgroundColor: "#00afaa",
          color: "white",
          borderRadius: "10px",
          fontWeight: "bold",
          padding: "6px 15px",
          height: "40px",
        }}
        className="gap-2 AjouteBotton"
      >
        <FontAwesomeIcon
          icon={faPlus}
          className="AjouteBotton"
          style={{ cursor: "pointer", color: "white", marginRight: "8px" }}
        />
        Ajouter Réservation
      </a>
    </div>

    {/* Filters - Right side */}
    <div className="d-flex gap-3 align-items-center">
      <Form.Select 
        value={filterClientType}
        onChange={(e) => setFilterClientType(e.target.value)}
        style={{
          width: "200px",
          height: "40px",
          cursor: "pointer",
          borderRadius: "10px",
          color: "black",
          fontWeight: "bold",
        }}
      >
        <option value="all">Type de client</option>
        <option value="societe">Société</option>
        <option value="particulier">Particulier</option>
      </Form.Select>

      <Form.Select 
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        style={{
          width: "200px",
          height: "40px",
          cursor: "pointer",
          borderRadius: "10px",
          color: "black",
          fontWeight: "bold",
        }}
      >
        <option value="all">Status</option>
        <option value="en attente">En attente</option>
        <option value="confirmé">Confirmé</option>
        <option value="annulé">Annulé</option>
      </Form.Select>

      <div className="d-flex align-items-center gap-2">
        <Form.Control
          type="date"
          value={filterDateStart}
          onChange={(e) => setFilterDateStart(e.target.value)}
          style={{
            height: "40px",
            width: "150px",
            borderRadius: "10px",
          }}
        />
        <span>à</span>
        <Form.Control
          type="date"
          value={filterDateEnd}
          onChange={(e) => setFilterDateEnd(e.target.value)}
          style={{
            height: "40px",
            width: "150px",
            borderRadius: "10px",
          }}
        />
      </div>

      <Button 
  variant="secondary"
  onClick={resetFilters}
  style={{
    height: "40px",
    cursor: "pointer",
    borderRadius: "10px",
    fontWeight: "bold",
  }}
>
  ⟳
</Button>    </div>
  </div>
      
<div
  id="formContainer"
  className="reservation-form-panel"
  style={{
    ...formContainerStyle,
    marginTop: "0px",
    maxHeight: "700px",
    overflowY: "auto",
    overflowX: "hidden",
    padding: "0 10px",
    boxSizing: "border-box",
    width: "min(650px, calc(100vw - 10px))",
    maxWidth: "calc(100vw - 10px)",
  }}
>  
<Form
  className="d-flex flex-column align-items-start"
  onSubmit={handleSubmit}
  style={{
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
    boxSizing: "border-box",
  }}
>
                  <Form.Label className="text-center ">
                <h4
            style={{
              fontSize: "28px",
              fontFamily: "Arial, sans-serif",
              fontWeight: "bold",
              color: "black",
              borderBottom: "2px solid black",
              paddingBottom: "15px",
              marginBottom: "20px"
                    }}
                    >
                      {editingReservation ? "Modifier" : "Ajouter"} une réservation</h4>
                </Form.Label>

                <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Code Réservation
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="reservation_num"
                  placeholder="Sélectionner un client"
              
                  value={formData.reservation_num}
                  isInvalid={hasSubmitted && errors.reservation_num}
                    onChange={handleChange}
                  />
                  {hasSubmitted && errors.reservation_num && (
                    <Form.Control.Feedback type="invalid">
                      Required
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Type de Client
                  </Form.Label>
        <div>
          <Form.Check
            type="radio"
            label="Société"
            name="client_type"
            value="societe"
            checked={clientType === "societe"}
            onChange={handleClientTypeChange}
            inline
          />
          <Form.Check
            type="radio"
            label="Particulier"
            name="client_type"
            value="particulier"
            checked={clientType === "particulier"}
            onChange={handleClientTypeChange}
            inline
          />
        </div></Form.Group>



                </div>


                <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
 <Form.Label style={{ fontWeight: "bold" }}>
      Code Client
  </Form.Label>

  {/* Only show the dropdown once the client data has been fetched */}
  <Select
    name="client_id"
    value={
      (clientType === "societe" ? societeClients : particulierClients).find(client => client.id === formData.client_id) 
      ? { 
          value: formData.client_id, 
          label: (clientType === "societe" ? societeClients : particulierClients).find(client => client.id === formData.client_id)[clientType === "societe" ? "CodeClient" : "CodeClient"] 
        }
      : null
    }
    onChange={(selectedOption) => {
      setFormData({
        ...formData,
        client_id: selectedOption ? selectedOption.value : "",
      });
    }}
    options={(clientType === "societe" ? societeClients : particulierClients).map((client) => ({
      value: client.id,
      label: clientType === "societe" ? client.CodeClient : client.CodeClient,
    }))}
    placeholder="Sélectionner un client"
    isSearchable
    styles={{
      container: (provided) => ({
        ...provided,
        width: "100%", // Ensure full width for the Select dropdown
      }),
      control: (provided) => ({
        ...provided,
        width: "100%", // Ensure the input control takes up the full width
      }),
    }}
  />
</Form.Group>
<Form.Group style={{ flex: 1 }}>
                <Form.Label style={{ fontWeight: "bold" }}>
                  Client
                </Form.Label>
    <Select
      name="client_id"
      value={
        (clientType === "societe" ? societeClients : particulierClients).find(client => client.id === formData.client_id)
          ? {
              value: formData.client_id,
              label:
                clientType === "societe"
                  ? (societeClients.find(client => client.id === formData.client_id) || {}).raison_sociale
                  : `${(particulierClients.find(client => client.id === formData.client_id) || {}).name} ${(particulierClients.find(client => client.id === formData.client_id) || {}).prenom}`,  // Adjust based on client type
            }
          : null
      }
      onChange={(selectedOption) => {
        handleChange({
          target: {
            name: "client_id",
            value: selectedOption ? selectedOption.value : "",
          },
        });
      }}
      options={
        clientType === "societe"
          ? societeClients.map((client) => ({
              value: client.id,
              label: client.raison_sociale, // For societe, we use CodeClient
            }))
          : particulierClients.map((client) => ({
              value: client.id,
              label: `${client.name} ${client.prenom}`, // For particulier, we use nom and prenom
            }))
      }
      placeholder="Sélectionner un client"
      isSearchable
      styles={{
        container: (provided) => ({
          ...provided,
          width: "100%", // Ensure full width for the Select dropdown
        }),
        control: (provided) => ({
          ...provided,
          width: "100%", // Ensure the input control takes up the full width
        }),
      }}
    />
</Form.Group>


 </div>





               


              <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
              Date Debut</Form.Label>
                <Form.Control
                type="date"
                name="date_debut"
                placeholder="Date Debut"
                //isInvalid={!!errors.date_debut}
                value={formData.date_debut}
                min={getTodayDate()}
                onChange={handleChange}
              />
              <Form.Text className="text-danger">
                {errors.type_chambre}
              </Form.Text>
                </Form.Group>

                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Date Fin
                </Form.Label>
                <Form.Control
                type="date"
                name="date_fin"
                placeholder="Date Fin"
                //isInvalid={!!errors.date_fin}
                value={formData.date_fin}
                min={formData.date_debut || getTodayDate()}
                onChange={handleChange}
              />
              <Form.Text className="text-danger">
                {errors.type_chambre}
              </Form.Text>
                </Form.Group>
                </div>

                <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Staut
                </Form.Label>
  <Form.Control
    as="select"
    name="status"
    value={formData.status}
    onChange={handleChange}
    className="form-control"
  >
    <option value="">Sélectionner un status</option>
    <option value="en attente">En attente</option>
    <option value="confirmé">Confirmé</option>
    <option value="annulé">Annulé</option>
  </Form.Control>
  <Form.Text className="text-danger">{errors.status}</Form.Text>
</Form.Group>





                <Form.Group style={{ flex: 1 }}>
                  <Form.Label style={{ fontWeight: "bold" }}>
                  Date Réservation
                </Form.Label>
                <Form.Control
                type="date"
                name="reservation_date"
                placeholder="Date Réservation"
                //isInvalid={!!errors.reservation_date}
                value={formData.reservation_date}
                onChange={handleChange}
              />
              <Form.Text className="text-danger">
                {errors.type_chambre}
              </Form.Text>
                </Form.Group>
                </div>

                
                <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                <a href="#" onClick={handleAddEmptyRow}>
<Button
  className="btn btn-sm"
  variant="primary"
  disabled={
    !formData.date_debut ||
    !formData.date_fin ||
    availableRooms.length === 0 ||
    selectedRooms.filter((room) => room.id).length >= availableRooms.length
  }
>      <FontAwesomeIcon icon={faPlus} />
    </Button>
    <span style={{ margin: "0 8px" }}></span>
<strong style={{ color: "black" }}>
  {!formData.date_debut || !formData.date_fin
    ? "Choisir les dates d'abord"
    : "Ajouter Chambre"}
</strong>
  </a>
</div>

<Form.Group style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
  <div className="reservation-rooms-table-wrapper">
    <table className="table table-bordered align-middle reservation-rooms-table">
      <colgroup>
        <col style={{ width: "24%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "20%" }} />
        <col style={{ width: "25%" }} />
        <col style={{ width: "13%" }} />
      </colgroup>
      <thead>
        <tr>
          <th colSpan={5}>Liste des Chambres</th>
        </tr>
<tr>
  <th className="ColoretableForm" style={{ width: "28%" }}>Type</th>
  <th className="ColoretableForm" style={{ width: "18%" }}>Étage</th>
  <th className="ColoretableForm" style={{ width: "20%" }}>Vue</th>
  <th className="ColoretableForm" style={{ width: "22%" }}>Numéro</th>
  <th className="ColoretableForm text-center" style={{ width: "12%" }}>Action</th>
</tr>
      </thead>
      <tbody>
        {selectedRooms.length > 0 ? (
          selectedRooms.map((room, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                <Form.Control
                  as="select"
                  size="sm"
                  value={room.type || ''}
                  onChange={(e) => handleRoomChange(rowIndex, "type", e.target.value)}
                  style={{ width: "100%", fontSize: "13px", padding: "4px 6px" }}

                >
                  <option value="">Sélectionner un type</option>
                  {getFilteredOptions("type", rowIndex).map((type_chambre) => (
                    <option key={type_chambre} value={type_chambre}>
                      {type_chambre}
                    </option>
                  ))}
                </Form.Control>
              </td>

              <td>
                <Form.Control
                  as="select"
                  size="sm"
                  value={room.etage || ''}
                  onChange={(e) => handleRoomChange(rowIndex, "etage", e.target.value)}
                    style={{ width: "100%", fontSize: "13px", padding: "4px 6px" }}

                >
                  <option value="">Sélectionner un étage</option>
                  {getFilteredOptions("etage", rowIndex).map((etage) => (
                    <option key={etage} value={etage}>
                      {etage}
                    </option>
                  ))}
                </Form.Control>
              </td>

              <td>
                <Form.Control
                  as="select"
                  size="sm"
                  value={room.vue || ''}
                  onChange={(e) => handleRoomChange(rowIndex, "vue", e.target.value)}
                  style={{ width: "100%", fontSize: "13px", padding: "4px 6px" }}
                >
                  <option value="">Sélectionner une vue</option>
                  {getFilteredOptions("vue", rowIndex).map((vue) => (
                    <option key={vue} value={vue}>
                      {vue}
                    </option>
                  ))}
                </Form.Control>
              </td>

              <td>
                <Form.Control
                  as="select"
                  size="sm"
                  value={room.num_chambre || ''}
                  onChange={(e) => handleRoomChange(rowIndex, "num_chambre", e.target.value)}
                    style={{ width: "100%", fontSize: "13px", padding: "4px 6px" }}

                >
                  <option value="">Sélectionner une chambre</option>
                  {getFilteredOptions("num_chambre", rowIndex).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </Form.Control>
              </td>

              <td>
                <FontAwesomeIcon
                  color="red"
                  onClick={() => handleDeleteRoom(rowIndex)}
                  icon={faTrash}
                  style={{ cursor: "pointer" }}
                />
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="text-center">Aucune chambre ajoutée</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</Form.Group>


{/* Replace the existing tarif section with this */}
<Form.Group controlId="tarifDetails" className="mt-4 px-3">
  <div className="row">
    <div className="col-12 mb-4">
      <h5 style={{
        fontSize: "20px",
        color: "#2c3e50",
        fontWeight: "600",
        position: "relative",
        paddingBottom: "10px",
        marginBottom: "20px"
      }}>
        Détails du Tarif
        <div style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          width: "50px",
          height: "3px",
          background: "#00afaa",
          borderRadius: "2px"
        }}/>
      </h5>
    </div>
    
    <div className="col-md-8">
      <div style={{ 
        background: "#f8f9fa",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
      }}>
        <Form.Group className="mb-4">
          <Form.Label style={{ fontWeight: "500", color: "#2c3e50", marginBottom: "10px" }}>
            Repas
          </Form.Label>
          <Select
            isMulti
            name="meals"
            value={selectedMeals}
            onChange={setSelectedMeals}
            options={[
              { value: 'breakfast', label: 'Petit-déjeuner' },
              { value: 'lunch', label: 'Déjeuner' },
              { value: 'dinner', label: 'Dîner' }
            ]}
            className="basic-multi-select"
            classNamePrefix="select"
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "none",
                "&:hover": {
                  border: "1px solid #00afaa"
                }
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: "#e6f7f6",
                borderRadius: "6px"
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: "#00afaa"
              })
            }}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label style={{ fontWeight: "500", color: "#2c3e50", marginBottom: "10px" }}>
            Réduction
          </Form.Label>
          <Form.Select
            value={reductionType}
            onChange={(e) => setReductionType(e.target.value)}
            style={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              padding: "10px",
              color: "#2c3e50",
              cursor: "pointer"
            }}
          >
            <option value="">Aucune réduction</option>
            <option value="senior">Senior</option>
            <option value="group">Groupe</option>
            <option value="fidelity">Fidélité</option>
          </Form.Select>
        </Form.Group>
      </div>
    </div>

    <div className="col-md-4">
      <div style={{
        background: "white",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 6px rgba(0,0,0,0.07)"
      }}>
        <div style={{
          background: "#00afaa",
          color: "white",
          padding: "15px",
          fontSize: "16px",
          fontWeight: "600"
        }}>
          Résumé
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px",
            color: "#64748b"
          }}>
            <span>Repas</span>
            <span>{calculatedTarif.mealCosts} DH</span>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px",
            color: "#dc2626"
          }}>
            <span>Réduction</span>
            <span>-{calculatedTarif.reduction} DH</span>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "15px 0",
            borderTop: "2px dashed #e2e8f0",
            fontWeight: "600",
            color: "#00afaa",
            fontSize: "18px"
          }}>
            <span>Total</span>
            <span>{calculatedTarif.total} DH</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</Form.Group>
              <Form.Group className="mt-5 tarif-button-container">
                <div className="button-container">
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
                </div>
              </Form.Group>
              </Form>
        </div>

            
            <div className="">
              <div
                id="tableContainer"
                className="table-responsive"
                style={{...tableContainerStyle, overflowX: 'auto', minWidth: '650px',
                  maxHeight: '700px', overflow: 'auto',

                  marginTop:'0px',
                }}
              >
                 <table className="table table-bordered app-table" id="reservationsTable" style={{ marginTop: "-5px", }}>
<thead className="text-center table-secondary" style={{ position: 'sticky', top: -1, backgroundColor: '#ddd', zIndex: 1, padding:'10px'}}>
  <tr className="tableHead">
    <th className="tableHead">
      <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
    </th>
    <th className="tableHead">Code Réservation</th>
    <th className="tableHead">Client (Code Client)</th>
    <th className="tableHead">Chambres</th>
    <th className="tableHead">Date Reservation</th>
    <th className="tableHead">Date Début</th>
    <th className="tableHead">Date Fin</th>
    <th className="tableHead">Status</th>
    <th className="tableHead">Tarif Total</th>
    <th className="tableHead">Action</th>
  </tr>
</thead>
  <tbody className="text-center" style={{ backgroundColor: '#007bff' }}>
    {filteredReservations
      ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      ?.map((reservation) => {
      return(
         <React.Fragment key={reservation.reservation_num}>
          <tr>
          <td style={{ backgroundColor: "white" }}>
          <input
  type="checkbox"
  checked={selectedItems.some((item) => item === reservation.reservation_num)}
  onChange={() => handleCheckboxChange(reservation.reservation_num)}
/>
        </td>
          <td style={{ backgroundColor: "white" }}>{highlightText(reservation.reservation_num, searchTerm) || ''}</td>
          <td style={{ backgroundColor: "white" }}>
  {(() => {

    const client = reservation.client_type === "societe" 
      ? societeClients.find(c => c.id === parseInt(reservation.client_id))
      : particulierClients.find(c => c.id === parseInt(reservation.client_id));
    
    let displayText = '';
    
    if (client) {
      if (reservation.client_type === "societe") {
        displayText = `${client.raison_sociale || ''} (${client.CodeClient || ''})`;
      } else {
        displayText = `${client.name || ''} ${client.prenom || ''} (${client.CodeClient || ''})`;
      }
      return highlightText(displayText, searchTerm);
    }
    return 'N/A';
  })()}
</td>     <td style={{ backgroundColor: "white" }}>{reservation.chambres ? highlightText(reservation.chambres.map(chambre=>chambre.num_chambre).join(', '), searchTerm) : ''}</td>
          <td style={{ backgroundColor: "white" }}>{highlightText(reservation.reservation_date, searchTerm) || ''}</td>
          <td style={{ backgroundColor: "white" }}>{highlightText(reservation.date_debut, searchTerm) || ''}</td>
          <td style={{ backgroundColor: "white" }}>{highlightText(reservation.date_fin, searchTerm) || ''}</td>
          <td style={{ backgroundColor: "white" }}>{highlightText(reservation.status, searchTerm) || ''}</td>
          <td style={{ backgroundColor: "white" }}>{reservation.montant_total ? `${reservation.montant_total} ` : '0 '}</td>
          <td style={{ backgroundColor: "white", whiteSpace: "nowrap" }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    <FontAwesomeIcon
      onClick={() => handleEdit(reservation)}
      icon={faEdit}
      className="app-table-action is-edit"
    />
    <FontAwesomeIcon
      onClick={() => handleDelete(reservation.reservation_num)}
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
      {filteredReservations.length > 0
        ? `${page * rowsPerPage + 1}-${Math.min(
            (page + 1) * rowsPerPage,
            filteredReservations.length
          )} sur ${filteredReservations.length}`
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
      disabled={(page + 1) * rowsPerPage >= filteredReservations.length}
      onClick={(e) => handleChangePage(e, page + 1)}
      aria-label="Page suivante"
    >
      ›
    </button>
  </div>
</div>              </div>
            </div>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};


export default Reservation;