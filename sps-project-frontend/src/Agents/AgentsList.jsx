import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button } from "react-bootstrap";
import Navigation from "../Acceuil/Navigation";
import Search from "../Acceuil/Search";
import TablePagination from "@mui/material/TablePagination";
import ExportToPdfButton from "./exportToPdf";
import PrintList from "./PrintList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faFilePdf,
  faFileExcel,
  faPrint,
  faEdit,
  faPlus,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Fab, Toolbar } from "@mui/material";
import { BsShop } from "react-icons/bs";
import { useOpen } from "../Acceuil/OpenProvider";
import { BiPlus } from "react-icons/bi";

const AgentList = () => {
    const [agentList, setAgentList] = useState([]);

  const [produits, setProduits] = useState([]);
  const [user, setUser] = useState({});
  const [categories, setCategories] = useState([]);
  let isEdit = false;
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProduits, setFilteredProduits] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredProduitsByCategory, setFilteredProduitsByCategory] = useState(
    []
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [editingProduit, setEditingProduit] = useState(null);
  const [editingProduitId, setEditingProduitId] = useState(null);
  const [userHasDeletePermission, setUserHasDeletePermission] = useState(true);
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-900px",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    width:"100%"
  });
  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const tableHeaderStyle = {
    background: "#007bff",
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
  };



  const [showForm, setShowForm] = useState(false);
  const [calibres, setCalibres] = useState([]);

  const [formData, setFormData] = useState({
    NomAgent: "",
    PrenomAgent: "",
    SexeAgent: "",
    EmailAgent: "",
    TelAgent: "",
    AdresseAgent: "",
    VilleAgent: "",
    CodePostalAgent: "",
    type:""
   
  });
  const [errors, setErrors] = useState({
    NomAgent: "",
    PrenomAgent: "",
    SexeAgent: "",
    EmailAgent: "",
    TelAgent: "",
    AdresseAgent: "",
    VilleAgent: "",
    CodePostalAgent: "",
  });
 



  const fetchAgent = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/agents");
      setProduits(response.data.agents);
      localStorage.setItem('agentsList', JSON.stringify(response.data.agents));

    } catch (error) {
      console.error("Error fetching products or user data:", error);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la liste des Agent.",
        });
      }
    }
  };

  useEffect(() => {
    const produitsFromStorage = localStorage.getItem('agentsList');
    produitsFromStorage && setProduits(JSON.parse(produitsFromStorage));
    if (!produitsFromStorage)
    fetchAgent();
  }, []);



  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };





  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCheckboxChange = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (selectAll) {
      setSelectedItems([]);
    } else {
        setSelectedItems(Array.isArray(produits) ? produits.map((produit) => produit.id) : []);
    //   setSelectedItems(produits.map((produit) => produit.id));
    }
  };

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
        selectedItems.forEach((id) => {
          axios
            .delete(`http://localhost:8000/api/agents/${id}`)
            .then((response) => {
              fetchAgent();
            
            })
            .catch((error) => {
              console.error("Error deleting product:", error);
              if (error.response && error.response.status === 403) {
                Swal.fire({
                  icon: "error",
                  title: "Accès refusé",
                  text: "Vous n'avez pas l'autorisation de supprimer ce Agent.",
                });
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Error!",
                  text: "Échec de la suppression du Agent.",
                });
              }
            });
        });
      }
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Agent supprimé avec succès.",
      });
    });
    setSelectedItems([]);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce produit ?",
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
          .delete(`http://localhost:8000/api/agents/${id}`)
          .then((response) => {
            fetchAgent();
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Agent supprimé avec succès.",
            });
          })
          .catch((error) => {
            console.error("Error deleting product:", error);
            if (error.response && error.response.status === 403) {
              Swal.fire({
                icon: "error",
                title: "Accès refusé",
                text: "Vous n'avez pas l'autorisation de supprimer ce Agent.",
              });
            } else if (error.response && error.response.status === 400) {
              // Afficher le message d'erreur dans Swal.fire()
              Swal.fire({
                  icon: "error",
                  title: "Erreur",
                  text: error.response.data.error
              });
          } else {
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la suppression du Agent.",
              });
            }
          });
      } else {
        console.log("Suppression annulée");
      }
    });
  };
  const handleShowFormButtonClick = () => {
    if (formContainerStyle.right === "-900px") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ width:"61.5%" });
    } else {
      closeForm();
    }
  };

  const closeForm = () => {
    setFormContainerStyle({ right: "-900px" });
    setTableContainerStyle({ width:"100%" });
    setShowForm(false); // Hide the form
    setFormData({
      NomAgent: "",
      PrenomAgent: "",
      SexeAgent: "",
      EmailAgent: "",
      TelAgent: "",
      AdresseAgent: "",
      VilleAgent: "",
      CodePostalAgent: "",
          type:""

    });
    setErrors({
      NomAgent: "",
      PrenomAgent: "",
      SexeAgent: "",
      EmailAgent: "",
      TelAgent: "",
      AdresseAgent: "",
      VilleAgent: "",
      CodePostalAgent: "",
    });
    setEditingProduit(null); // Clear editing client
  };

  const handleEdit = (produit) => {
    setEditingProduit(produit);
    setFormData({
      NomAgent: produit.NomAgent,
      PrenomAgent: produit.PrenomAgent,
      SexeAgent: produit.SexeAgent,
      EmailAgent: produit.EmailAgent,
      TelAgent: produit.TelAgent,
      AdresseAgent: produit.AdresseAgent,
      VilleAgent: produit.VilleAgent,
      CodePostalAgent: produit.CodePostalAgent,
          type: produit.type

    });
    if (formContainerStyle.right === "-900px") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ width:"61.5%" });
    } else {
      closeForm();
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };
  console.log('formdata',formData)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingProduit
      ? `http://localhost:8000/api/agents/${editingProduit.id}`
      : "http://localhost:8000/api/agents";
    const method = editingProduit ? "put" : "post";
  
    const requestData = new FormData();
    Object.keys(formData).forEach((key) => {
      requestData.append(key, formData[key]);
    });
  console.log('requestData',formData);
    try {
      const response = await axios({
        method: method,
        url: url,
        data: formData,
      });
  
      fetchAgent();
      const successMessage = ` ${editingProduit ? "modifié" : "ajouté"} avec succès.`;
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: successMessage,
      });
  
      setFormData({
        NomAgent: "",
        PrenomAgent: "",
        SexeAgent: "",
        EmailAgent: "",
        TelAgent: "",
        AdresseAgent: "",
        VilleAgent: "",
        CodePostalAgent: "",
            type:""

      });
      setErrors({
        NomAgent: "",
        PrenomAgent: "",
        SexeAgent: "",
        EmailAgent: "",
        TelAgent: "",
        AdresseAgent: "",
        VilleAgent: "",
        CodePostalAgent: "",
      });
      setEditingProduit(null);
      closeForm();
    } catch (error) {
      if (error.response) {
        const serverErrors = error.response.data.errors;
        setErrors(serverErrors);
      }
    }
  };
  


  //------------------------- fournisseur export to excel ---------------------//
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(produits);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agents");
    XLSX.writeFile(wb, "Agents.xlsx");
  };

  const handleDeletecatgeorie = async (categorieId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/categories/${categorieId}`
      );
      console.log(response.data);
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Categorie supprimé avec succès.",
      });
      fetchCategories();
    } catch (error) {
      console.error("Error deleting categorie:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur!",
        text: "Échec de la suppression de la categorie.",
      });
    }
  };

  useEffect(() => {
    if (produits) {
      const filtered = produits.filter((produit) => {
        return Object.entries(produit).some(([key, value]) => {
          if (
            key === "NomAgent" ||
            key === "PrenomAgent" ||
            key === "SexeAgent" ||
            key === "EmailAgent" ||
            key === "TelAgent" ||
            key === "AdresseAgent" ||
            key === "VilleAgent" ||
            key === "CodePostalAgent"
          ) {
            if (typeof value === "string") {
              return value.toLowerCase().includes(searchTerm.toLowerCase());
            } else if (typeof value === "number") {
              return value.toString().includes(searchTerm.toString());
            }
          }
          
          return false;
        });
      });
      setFilteredProduits(filtered);
    }
  }, [produits, searchTerm]);
 


  return (
    <ThemeProvider theme={createTheme()}>
      <Box className="postionPage"
      sx={{ ...dynamicStyles}}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
          {/* <Toolbar /> */}
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ marginTop: "20px" }}
          >
           
           
            <h3 className="titreColore d-flex justify-content-between align-items-center"
      style={{
        width:'15%'
      }} >
              Liste des Employée 
              </h3>
            <div className="d-flex">
              <div style={{ width: "500px", marginRight: "20px" }}>
                <Search onSearch={handleSearch} type="search" />
              </div>
              <div>
                <PrintList
                  tableId="produitsTable"
                  title="Liste des Agents"
                  produitList={produits}
                  filteredProduits={filteredProduits}
                />
                <ExportToPdfButton
                  produits={produits}
                  selectedItems={selectedItems}
                  disabled={selectedItems.length === 0}
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
          <div className="container-d-flex justify-content-start">
            <a
              id="showFormButton"
              onClick={handleShowFormButtonClick}
              style={{
                // textDecoration: "none",
                display: "flex",
                alignItems: "center",
                cursor: "pointer", // Change cursor to indicate clickable element
                marginTop:'-15px'
              }}
              className="AjouteBotton"
            >
              <BiPlus style={{ fontSize: "24px", marginRight: "-3px" }} className="AjouteBotton" />
              Ajouter Employée
            </a>


              <div
                id="formContainer"
                className=""
                style={{...formContainerStyle,height:'830px',}}
              >
                <Form className="col row" onSubmit={handleSubmit}>
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
      {editingProduit ? "Modifier" : "Ajouter"} un Employée
    </h4>
  </Form.Label>

  <Form.Group className="row mb-3"  style={{ display: 'flex', alignItems: 'center' }}>
  <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Nom</Form.Label>
    <Form.Control
    style={{ flex: '2',marginLeft:'-90px' }}
      type="text"
      name="NomAgent"
      value={formData.NomAgent}
      onChange={handleChange}
      placeholder="Nom"
      className="form-control"
      isInvalid={!!errors.NomAgent} // Validation pour Type de Quantité

    />

  </Form.Group>

  <Form.Group className="row mb-3"  style={{ display: 'flex', alignItems: 'center' }}>
    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Prenom</Form.Label>
    <Form.Control
    style={{ flex: '2',marginLeft:'-90px' }}
      type="text"
      name="PrenomAgent"
      value={formData.PrenomAgent}
      onChange={handleChange}
      placeholder="Prenom"
      className="form-control"
      isInvalid={!!errors.PrenomAgent} // Validation pour Type de Quantité

    />
  
  </Form.Group>
  <Form.Group className="row mb-3" style={{ display: 'flex', alignItems: 'center' }}>
  <Form.Label style={{ flex: '1', marginRight: '5px', marginLeft: '10px' }}>Type</Form.Label>
  <Form.Select
    style={{ flex: '2', marginLeft: '-90px' }}
    name="type"
    value={formData.type}
    onChange={handleChange}
    className="form-control"
    isInvalid={!!errors.type} // Validation pour Type
  >
    <option value="">Sélectionner le type</option>
    <option value="Représentant">Représentant</option>
    <option value="Fonction Maintenance">Fonction Maintenance</option>
  </Form.Select>
</Form.Group>


  <Form.Group className="row mb-3"  style={{ display: 'flex', alignItems: 'center' }}>
    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Sexe</Form.Label>
    <div style={{ flex: '2' ,marginLeft:'-90px'}}>
      <Form.Check
        type="radio"
        label="Masculin"
        name="SexeAgent"
        value="Masculin"
        onChange={handleChange}
        checked={formData.SexeAgent === "Masculin"}
      />
      <Form.Check
        type="radio"
        label="Feminin"
        name="SexeAgent"
        value="Feminin"
        onChange={handleChange}
        checked={formData.SexeAgent === "Feminin"}
      />
    </div>
    <Form.Text className="text-danger">
      {errors.SexeAgent}
    </Form.Text>
  </Form.Group>

  <Form.Group className="row mb-3"  style={{ display: 'flex', alignItems: 'center' }}>
    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'20px'}}>Email</Form.Label>
    <Form.Control
    style={{ flex: '2',marginLeft:'-100px' }}
      type="email"
      name="EmailAgent"
      value={formData.EmailAgent}
      onChange={handleChange}
      placeholder="Email"
      className="form-control"
    />
    <Form.Text className="text-danger">
      {errors.EmailAgent}
    </Form.Text>
  </Form.Group>

  <Form.Group className="row mb-3"  style={{ display: 'flex', alignItems: 'center' }}>
    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Téléphone</Form.Label>
    <Form.Control
    style={{ flex: '2' ,marginLeft:'-90px'}}
      type="tel"
      name="TelAgent"
      value={formData.TelAgent}
      onChange={handleChange}
      placeholder="Téléphone"
      className="form-control"
    />
    <Form.Text className="text-danger">
      {errors.TelAgent}
    </Form.Text>
  </Form.Group>

  <Form.Group className="row mb-3"  style={{ display: 'flex', alignItems: 'center' }}>
    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Adresse</Form.Label>
    <Form.Control
    style={{ flex: '2',marginLeft:'-90px' }}
      type="text"
      name="AdresseAgent"
      value={formData.AdresseAgent}
      onChange={handleChange}
      placeholder="Adresse"
      className="form-control"
    />
    <Form.Text className="text-danger">
      {errors.AdresseAgent}
    </Form.Text>
  </Form.Group>

  <Form.Group className="row mb-3"  style={{ display: 'flex', alignItems: 'center' }}>
    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Ville</Form.Label>
    <Form.Control
    style={{ flex: '2' ,marginLeft:'-90px'}}
      type="text"
      name="VilleAgent"
      value={formData.VilleAgent}
      onChange={handleChange}
      placeholder="Ville"
      className="form-control"
    />
    <Form.Text className="text-danger">
      {errors.VilleAgent}
    </Form.Text>
  </Form.Group>

  <Form.Group className="row mb-3"  style={{ display: 'flex', alignItems: '' }}>
    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Code-Postal</Form.Label>
    <Form.Control
    style={{ flex: '2' ,marginLeft:'-90px'}}
      type="text"
      name="CodePostalAgent"
      value={formData.CodePostalAgent}
      onChange={handleChange}
      placeholder="Code-Postal"
      className="form-control"
    />
    <Form.Text className="text-danger">
      {errors.CodePostalAgent}
    </Form.Text>
  </Form.Group>

  <div className="mt-5">
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
  </div>
</Form>

              </div>

            <div className="" style={{marginTop:'px'}}>
              <div
                id="tableContainer"
                className="table-responsive-sm"
                style={{...tableContainerStyle,
                  overflowX: 'auto', minWidth: '650px',
                  maxHeight: '830px', overflow: 'auto',height:'830px',

                  marginTop:'0px',
                  backgroundColor: "#ffff", // Set background color
                  border: "3px solid #ddd", // Add border to the table
                  borderCollapse: "collapse", // Collapse borders
                }}
              >
                <table
                  className="table table-responsive table-bordered "
                  id="produitsTable"
                  style={{ 
                    marginTop:"-5px"
                   }}
                >
                  <thead className="text-center">
                    <tr>
                      <th className="tableHead widthDetails">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAllChange}
                        />
                      </th>
                      <th className="tableHead">Nom</th>
                      <th className="tableHead">Prenom</th>
                      <th className="tableHead">Type</th>
                      <th className="tableHead">Sexe</th>
                      <th className="tableHead">Email</th>
                      <th className="tableHead">Téléphone</th>
                      <th className="tableHead">	Adresse</th>
                      <th className="tableHead">Ville</th>
                      <th className="tableHead">Code-Postal</th>
                      <th className="tableHead" style={{width:'100px'}}>Action</th>

                    </tr>
                  </thead>
                  <tbody>
                    {filteredProduitsByCategory.length > 0
                      ? filteredProduitsByCategory
                          .filter((produit) => {
                            return Object.entries(produit).some(
                              ([key, value]) => {
                                if (
                                  key === "Code_produit" ||
                                  key === "designation" ||
                                  key === "type_quantite" ||
                                  key === "unite" ||
                                  key === "seuil_alerte" ||
                                  key === "stock_initial" ||
                                  key === "etat_produit" ||
                                  key === "prix_vente"
                                ) {
                                  if (typeof value === "string") {
                                    return value
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase());
                                  } else if (typeof value === "number") {
                                    return value
                                      .toString()
                                      .includes(searchTerm.toString());
                                  }
                                }
                                return false;
                              }
                            );
                          })
                          .slice(
                            page * rowsPerPage,
                            page * rowsPerPage + rowsPerPage
                          )
                          .map((produit) => (
                            <tr key={produit.id}>
                              <td style={{ backgroundColor: "white" }}>
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(produit.id)}
                                  onChange={() =>
                                    handleCheckboxChange(produit.id)
                                  }
                                />
                              </td>
                              <td style={{ backgroundColor: "white" }}>
                                {produit.NomAgent}
                              </td>
                              <td style={{ backgroundColor: "white" }}>
                                {produit.PrenomAgent}
                              </td>
                              <td style={{ backgroundColor: "white" }}>
                                {produit.type}
                              </td>
                              <td style={{ backgroundColor: "white" }}>
                                {produit.SexeAgent}
                              </td>
                              <td style={{ backgroundColor: "white" }}>
                                {produit.EmailAgent}
                              </td>
                              <td style={{ backgroundColor: "white" }}>
                                {produit.TelAgent}
                              </td>
                              <td style={{ backgroundColor: "white" }}>
                                {produit.AdresseAgent}
                              </td>
                              <td style={{ backgroundColor: "white" }}>
                                {produit.VilleAgent}
                              </td>
                              <td style={{ backgroundColor: "white" }}>
                                {produit.CodePostalAgent}
                              </td>
                              
                              <td style={{ backgroundColor: "white" }}>
                                <div>
                                   <FontAwesomeIcon
                                  onClick={() => handleEdit(produit)}
                                  icon={faEdit}
                                  style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                />
                                </div>
                               <div>
                                 <FontAwesomeIcon
                                  onClick={() => handleDelete(produit.id)}
                                  icon={faTrash}
                                  style={{
                                    color: "#ff0000",
                                    cursor: "pointer",
                                  }}
                                />
                               </div>
                               
                              </td>
                            </tr>
                          ))
                      : 
                        filteredProduits
                          .slice(
                            page * rowsPerPage,
                            page * rowsPerPage + rowsPerPage
                          )
                          .map((produit) => (
                            <tr key={produit.id}>
                            <td style={{ backgroundColor: "white" }}>
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(produit.id)}
                                onChange={() =>
                                  handleCheckboxChange(produit.id)
                                }
                              />
                            </td>
                            <td style={{ backgroundColor: "white" }}>
                              {produit.NomAgent}
                            </td>
                            <td style={{ backgroundColor: "white" }}>
                              {produit.PrenomAgent}
                            </td>
                            <td style={{ backgroundColor: "white" }}>
                                {produit.type}
                              </td>
                            <td style={{ backgroundColor: "white" }}>
                              {produit.SexeAgent}
                            </td>
                            <td style={{ backgroundColor: "white" }}>
                              {produit.EmailAgent}
                            </td>
                            <td style={{ backgroundColor: "white" }}>
                              {produit.TelAgent}
                            </td>
                            <td style={{ backgroundColor: "white" }}>
                              {produit.AdresseAgent}
                            </td>
                            <td style={{ backgroundColor: "white" }}>
                              {produit.VilleAgent}
                            </td>
                            <td style={{ backgroundColor: "white" }}>
                              {produit.CodePostalAgent}
                            </td>
                            
                            <td style={{ backgroundColor: "white" }}>
                              <FontAwesomeIcon
                                onClick={() => handleEdit(produit)}
                                icon={faEdit}
                                style={{
                                  color: "#007bff",
                                  cursor: "pointer",
                                }}
                              />
                              <span style={{ margin: "0 8px" }}></span>
                              <FontAwesomeIcon
                                onClick={() => handleDelete(produit.id)}
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
                
                <a href="">
                  <Button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedItems.length === 0}
                >
                  <FontAwesomeIcon
                    icon={faTrash}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Supprimer sélection
                </Button>
                </a>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredProduits.length}
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

const tableCellStyle = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
};

export default AgentList;