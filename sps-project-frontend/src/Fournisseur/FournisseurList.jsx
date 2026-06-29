import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button } from "react-bootstrap";
import "../style1.css";
import Navigation from "../Acceuil/Navigation";
import Search from "../Acceuil/Search";
import TablePagination from "@mui/material/TablePagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faFilePdf,
  faFileExcel,
  faPrint,
  faEdit,
  faPlus,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Fab, Toolbar } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import ExportPdfButton from "./exportToPdf";
import PrintList from "./PrintList";
import { useOpen } from "../Acceuil/OpenProvider"; // Importer le hook personnalisé

const FournisseurList = () => {
  // const [existingFournisseur, setExistingFournisseur] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFournisseurs, setFilteredFournisseurs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [fournisseurs, setFournisseurs] = useState([]);
  // const [users, setUsers] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  //-------------------edit-----------------------//
  const [editingFournisseur, setEditingFournisseur] = useState(null); // State to hold the fournisseur being edited
  const [editingFournisseurId, setEditingFournisseurId] = useState(null);
  const { open } = useOpen();
  const { dynamicStyles } = useOpen();

  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [expandedRowsContact, setExpandedRowsContact] = useState([]);

  //---------------form-------------------//
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    CodeFournisseur: "",
    raison_sociale: "",
    abreviation: "",
    adresse: "",
    tele: "",
    ville: "",
    ice: "",
    code_postal: "",
    user_id: "",
    email: "",
  });
  const [errors, setErrors] = useState({
    CodeFournisseur: "",
    raison_sociale: "",
    abreviation: "",
    adresse: "",
    tele: "",
    ville: "",
    ice: "",
    code_postal: "",
    user_id: "",
    email: "",
  });
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-900px",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  const tableHeaderStyle = {
    background: "#007bff",
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
  };

  const fetchFournisseurs = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/fournisseurs"
      );

      console.log("API Response:", response.data);

      setFournisseurs(response.data.fournisseurs);

      // const usersResponse = await axios.get("http://localhost:8000/api/users");
      // setUsers(usersResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la liste des fournisseurs.",
        });
      }
    }
  };

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  useEffect(() => {
    const filtered =
      fournisseurs &&
      fournisseurs.filter((fournisseur) =>
        Object.values(fournisseur).some((value) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          } else if (typeof value === "number") {
            return value.toString().includes(searchTerm.toLowerCase());
          }
          return false;
        })
      );
    setFilteredFournisseurs(filtered);
  }, [fournisseurs, searchTerm]);

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
  //------------------------- fournisseur Delete Selected ---------------------//

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
            .delete(`http://localhost:8000/api/fournisseurs/${id}`)
            .then((response) => {
              fetchFournisseurs();
              Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "fournisseur supprimé avec succès.",
              });
            })
            .catch((error) => {
              console.error(
                "Erreur lors de la suppression du fournisseur:",
                error
              );

              if (error.response && error.response.status === 403) {
                Swal.fire({
                  icon: "error",
                  title: "Accès refusé",
                  text: "Vous n'avez pas l'autorisation de supprimer un  fournisseur.",
                });
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Erreur!",
                  text: "Échec de la suppression du fournisseur.",
                });
              }
            });
        });
      }
    });

    setSelectedItems([]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(fournisseurs.map((fournisseur) => fournisseur.id));
    }
  };

  //------------------------- fournisseur export to excel ---------------------//

  const exportToExcel = () => {
    const selectedFournisseurs = fournisseurs.filter((fournisseur) =>
      selectedItems.includes(fournisseur.id)
    );
    const ws = XLSX.utils.json_to_sheet(selectedFournisseurs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fournisseurs");
    XLSX.writeFile(wb, "fournisseurs.xlsx");
  };

  //------------------------- fournisseur Delete---------------------//
  const handleDelete = (id) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce fournisseur ?",
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
          .delete(`http://localhost:8000/api/fournisseurs/${id}`)
          .then((response) => {
            if (response.data.message) {
              // Successful deletion
              fetchFournisseurs();
              Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "fournisseur supprimé avec succès",
              });
            } else if (response.data.error) {
              // Error occurred
              if (
                response.data.error.includes(
                  "Impossible de supprimer ou de mettre à jour une ligne parent : une contrainte de clé étrangère échoue"
                )
              ) {
                Swal.fire({
                  icon: "error",
                  title: "Erreur!",
                  text: "Impossible de supprimer le fournisseur car il a des produits associés.",
                });
              }
            }
          })
          .catch((error) => {
            console.error(
              "Erreur lors de la suppression du fournisseur:",
              error
            );

            if (error.response && error.response.status === 403) {
              Swal.fire({
                icon: "error",
                title: "Accès refusé",
                text: "Vous n'avez pas l'autorisation de supprimer un  fournisseur.",
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la suppression du fournisseur.",
              });
            }
          });
      } else {
        console.log("Suppression annulée");
      }
    });
  };
  //------------------------- fournisseur EDIT---------------------//

  const handleEdit = (fournisseurs) => {
    setEditingFournisseur(fournisseurs); // Set the fournisseurs to be edited
    // Populate form data with fournisseurs details
    setFormData({
      CodeFournisseur: fournisseurs.CodeFournisseur,
      raison_sociale: fournisseurs.raison_sociale,
      abreviation: fournisseurs.abreviation,
      adresse: fournisseurs.adresse,
      tele: fournisseurs.tele,
      ville: fournisseurs.ville,
      ice: fournisseurs.ice,
      code_postal: fournisseurs.code_postal,
      user_id: fournisseurs.user_id,
      email: fournisseurs.email,
    });
    setSelectedProductsData(fournisseurs.contact_fornisseur.map(contact => ({ ...contact })));
    if (formContainerStyle.right === "-900px") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    } else {
      closeForm();
    }
    // Show form
    // setShowForm(true);
  };
  useEffect(() => {
    if (editingFournisseurId !== null) {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    }
  }, [editingFournisseurId]);

  //------------------------- fournisseur SUBMIT---------------------//

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  const handleSubmit =async (e) => {
    e.preventDefault();
    const url = editingFournisseur
      ? `http://localhost:8000/api/fournisseurs/${editingFournisseur.id}`
      : "http://localhost:8000/api/fournisseurs";
      const urlContact = editingFournisseur
      ? `http://localhost:8000/api/contactClient`
      : "http://localhost:8000/api/contactClient";
    const method = editingFournisseur ? "put" : "post";
    const response = await axios({
      method: method,
      url: url,
      data: formData,
    })
    console.log('response',response.data.fournisseur)
    const formDataContact = {
      contacts: selectedProductsData.map(contact => ({
        ...contact,
        idClient: response.data.fournisseur.id ,
        type: 'F'  // Ajoute la variable constante à chaque élément
      }))
    };
    
    const responseContact = await axios({
      method: method,
      url: urlContact,
      data: formDataContact,
    })
      .then(() => {
        fetchFournisseurs();
        Swal.fire({
          icon: "success",
          title: "Succès!",
          text: `fournisseur ${
            editingFournisseur ? "modifié" : "ajouté"
          } avec succès.`,
        });
        setFormData({
          CodeFournisseur: "",
          raison_sociale: "",
          abreviation: "",
          adresse: "",
          tele: "",
          ville: "",
          ice: "",
          code_postal: "",
          user_id: "",
          email: "",
        });
        setEditingFournisseur(null); // Clear editing fournisseur
        closeForm();
      })
      .catch((error) => {
        if (error.response) {
          const serverErrors = error.response.data.error;
          console.log(serverErrors);
          setErrors({
            CodeFournisseur: serverErrors.CodeFournisseur
              ? serverErrors.CodeFournisseur[0]
              : "",
            raison_sociale: serverErrors.raison_sociale
              ? serverErrors.raison_sociale[0]
              : "",
            abreviation: serverErrors.abreviation
              ? serverErrors.abreviation[0]
              : "",
            adresse: serverErrors.adresse ? serverErrors.adresse[0] : "",
            tele: serverErrors.tele ? serverErrors.tele[0] : "",
            ville: serverErrors.ville ? serverErrors.ville[0] : "",
            ice: serverErrors.ice ? serverErrors.ice[0] : "",
            code_postal: serverErrors.code_postal
              ? serverErrors.code_postal[0]
              : "",
          });

          if (error.response.status === 403) {
            Swal.fire({
              icon: "error",
              title: "Accès refusé",
              text: `Vous n'avez pas l'autorisation de ${
                editingFournisseur ? "modifier" : "ajouter"
              } un fournisseur.`,
            });
          }
        } else {
          console.error(error); // Gérez les erreurs qui ne proviennent pas de la réponse du serveur
        }
      });
  };

  //------------------------- fournisseur FORM---------------------//

  const handleShowFormButtonClick = () => {
    if (formContainerStyle.right === "-900px") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "650px" });
    } else {
      closeForm();
    }
  };

  const closeForm = () => {
    setFormContainerStyle({ right: "-900px" });
    setTableContainerStyle({ marginRight: "0" });
    setShowForm(false); // Hide the form
    setFormData({
      CodeFournisseur: "",
      raison_sociale: "",
      abreviation: "",
      adresse: "",
      tele: "",
      ville: "",
      ice: "",
      code_postal: "",
      user_id: "",
    });
    setErrors({
      CodeFournisseur: "",
      raison_sociale: "",
      abreviation: "",
      adresse: "",
      tele: "",
      ville: "",
      ice: "",
      code_postal: "",
      user_id: "",
    });
    setEditingFournisseur(null); 
    setSelectedProductsData([])
  };

  const handleAddEmptyRow = () => {
    setSelectedProductsData([...selectedProductsData, {}]);
    console.log("selectedProductData", selectedProductsData);
};
const handleDeleteProduct = (index, id) => {
  const updatedSelectedProductsData = [...selectedProductsData];
  updatedSelectedProductsData.splice(index, 1);
  setSelectedProductsData(updatedSelectedProductsData);
  if (id) {
      axios
          .delete(`http://localhost:8000/api/contactClient/${id}`)
          .then(() => {
            fetchClients();
          });
  }
};
const handleInputChange = (index, field, value) => {
  const updatedProducts = [...selectedProductsData];
  updatedProducts[index][field] = value;
  setSelectedProductsData(updatedProducts);
};
const toggleRowContact = (clientId) => {
  setExpandedRowsContact((prevExpandedRows) =>
    prevExpandedRows.includes(clientId)
      ? prevExpandedRows.filter((id) => id !== clientId)
      : [...prevExpandedRows, clientId]
  );
};
  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{...dynamicStyles }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
          {/* <Toolbar /> */}
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ marginTop: "30px" }}
          >
            <h3 className="titreColore">
              {/* <BusinessIcon style={{ fontSize: "24px", marginRight: "8px" }} /> */}
              Liste des Fournisseurs
            </h3>
            <div className="d-flex">
              <div style={{ width: "500px", marginRight: "20px" }}>
                <Search onSearch={handleSearch} type="search" />
              </div>{" "}
              <PrintList
                tableId="fournisseurTable"
                title="Liste des Fournisseurs"
                FournisseurList={fournisseurs}
                filtredFournisseurs={filteredFournisseurs}
              />{" "}
              <ExportPdfButton
                fournisseurs={fournisseurs}
                selectedItems={selectedItems}
              />{" "}
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
          <div className="container-d-flex justify-content-start">
            <div className="add-Ajout-form">
              <a
                // href="#"
                onClick={handleShowFormButtonClick}
                style={{
                  // textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer", // Change cursor to indicate clickable element
                }}
                className="AjouteBotton"
              >
                <BusinessIcon
                  style={{ fontSize: "24px", marginRight: "8px" }}
                  className="AjouteBotton"
                />
                Ajouter Fournisseur
              </a>
              </div>
              <div style={{ marginTop:"1px" }}>

              <div
                id="formContainer"
                className="mt-2"
                style={formContainerStyle}
              >
                <Form className="col row" onSubmit={handleSubmit}>
                  <Form.Label className="text-center m-2">
                    <h4
                     style={{
                      fontSize: "25px", // Ajustez la taille de la police au besoin
                      fontFamily: "Arial, sans-serif", // Définissez la famille de police souhaitée
                      fontWeight: "bold", // Rendez le texte en gras
                      color: "black", // Définissez la couleur du texte
                      borderBottom: "2px solid black", // Ajoutez une bordure inférieure
                      paddingBottom: "5px", // Espace entre le texte et la bordure
                      // Ajoutez des styles supplémentaires au besoin
                    }}
                    >
                      {editingFournisseur
                        ? "Modifier Fournisseur"
                        : "Ajouter un Fournisseur"}
                    </h4>
                  </Form.Label>
  <Form.Group className="col-sm-5 m-2"  style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}> CodeFournisseur</Form.Label>
                    <Form.Control
                        style={{ flex: '2' }}

                      type="text"
                      placeholder="CodeFournisseur"
                      name="CodeFournisseur"
                      value={formData.CodeFournisseur}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-danger">
                      {errors.CodeFournisseur}
                    </Form.Text>
                  </Form.Group>
  <Form.Group className="col-sm-5 m-2"  style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Raison Sociale</Form.Label>
                    <Form.Control
                        style={{ flex: '2' }}

                      type="text"
                      placeholder="Raison Sociale"
                      name="raison_sociale"
                      value={formData.raison_sociale}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-danger">
                      {errors.raison_sociale}
                    </Form.Text>
                  </Form.Group>
  <Form.Group className="col-sm-5 m-2"  style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Abreviation</Form.Label>
                    <Form.Control
                        style={{ flex: '2' }}

                      type="text"
                      placeholder="Abréviation"
                      name="abreviation"
                      value={formData.abreviation}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-danger">
                      {errors.abreviation}
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="col-sm-5 m-2"  style={{ display: 'flex', alignItems: 'center' }}>
                  <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Adresse</Form.Label>
                    <Form.Control
                        style={{ flex: '2' }}

                      type="text"
                      placeholder="Adresse"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-danger">
                      {errors.adresse}
                    </Form.Text>
                  </Form.Group>
  <Form.Group className="col-sm-5 m-2"  style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Téléphone</Form.Label>
                    <Form.Control
                        style={{ flex: '2' }}

                      type="text"
                      placeholder="Téléphone"
                      name="tele"
                      value={formData.tele}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-danger">{errors.tele}</Form.Text>
                  </Form.Group>
                  <Form.Group className="col-sm-5 m-2"  style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Email</Form.Label>
                    <Form.Control
                        style={{ flex: '2' }}

                      type="text"
                      placeholder="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-danger">{errors.tele}</Form.Text>
                  </Form.Group>
  <Form.Group className="col-sm-5 m-2"  style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Ville</Form.Label>
                    <Form.Control
                        style={{ flex: '2' }}

                      type="text"
                      placeholder="Ville"
                      name="ville"
                      value={formData.ville}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-danger">
                      {errors.ville}
                    </Form.Text>
                  </Form.Group>
  <Form.Group className="col-sm-5 m-2"  style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>ICE</Form.Label>
                    <Form.Control
                        style={{ flex: '2' }}

                      type="text"
                      placeholder="ice"
                      name="ice"
                      value={formData.ice}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-danger">{errors.ice}</Form.Text>
                  </Form.Group>
  <Form.Group className="col-sm-5 m-2"  style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label style={{ flex: '1', marginRight: '5px' ,marginLeft:'10px'}}>Code Postal</Form.Label>
                    <Form.Control
                        style={{ flex: '2' }}

                      type="text"
                      placeholder="code_postal"
                      name="code_postal"
                      value={formData.code_postal}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-danger">
                      {errors.code_postal}
                    </Form.Text>
                  </Form.Group>
                  {/* <Form.Group className="col-sm-4 m-2" controlId="user_id">
                    <Form.Label>Utilisateur</Form.Label>
                    <Form.Control
                      type="text"
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleChange}
                      placeholder="user_id"
                      className="form-control-sm"
                    />
                  </Form.Group> */}
                                  <div style={{ marginLeft: '10px' }}>
      <Button className="btn btn-sm mb-2" variant="primary" onClick={handleAddEmptyRow}>
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <strong>Ajouter Produit</strong>
    </div>
                      <Form.Group controlId="selectedProduitTable">
    <div className="table-responsive">
  <table className="table table-bordered" style={{ width: '100%' }}>
    <thead>
      <tr>
        <th className="ColoretableForm">Nom</th>
        <th className="ColoretableForm">Prenom</th>
        <th className="ColoretableForm">Telephone</th>
        <th className="ColoretableForm">Email</th>
        <th className="ColoretableForm">Action</th>
      </tr>
    </thead>
    <tbody>
      {selectedProductsData.map((productData, index) => (
        <tr key={index}>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="text"
              value={productData.name}
              onChange={(e) => handleInputChange(index, 'name', e.target.value)}
              placeholder="Nom"
            />
          </td>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="text"
              value={productData.prenom}
              onChange={(e) => handleInputChange(index, 'prenom', e.target.value)}
              placeholder="Prenom"
            />
          </td>
          <td style={{ backgroundColor: 'white',width: '20%' }}>
            <Form.Control
              type="text"
              value={productData.telephone}
              onChange={(e) => handleInputChange(index, 'telephone', e.target.value)}
              placeholder="Telephone"
            />
          </td>
          <td style={{ backgroundColor: 'white', width: '20%' }}>
            <Form.Control
              type="email"
              value={productData.email}
              onChange={(e) => handleInputChange(index, 'email', e.target.value)}
              placeholder="Email"
            />
          </td>
          <td>
            <Button
              className="btn btn-danger btn-sm m-1"
              onClick={() => handleDeleteProduct(index, productData.id)}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </td>
        </tr>
      ))}
      {errors.products && (
        <tr>
          <td colSpan="5" className="text-danger text-center">
            {errors.products}
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

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
              className="table-responsive-sm"
              style={tableContainerStyle}
            >
<table
  className="table table-responsive table-bordered"
  id="fournisseurTable"
  style={{ marginTop: "10px" }}
>
  <thead>
    <tr>
      <th className="tableHead widthDetails">
        <input type="checkbox" onChange={handleSelectAllChange} />
      </th>
      <th className="tableHead">Code Fournisseur</th>
      <th className="tableHead">Raison Sociale</th>
      <th className="tableHead">Adresse</th>
      <th className="tableHead">Téléphone</th>
      <th className="tableHead">Email</th>
      <th className="tableHead">Ville</th>
      <th className="tableHead">Abréviation</th>
      <th className="tableHead">Code Postal</th>
      <th className="tableHead">ICE</th>
      <th className="tableHead">Action</th>
    </tr>
  </thead>
  <tbody>
    {filteredFournisseurs
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .map((fournisseurs) => {
        return (
          <React.Fragment key={fournisseurs.id}>
            <tr>
              <td style={{ backgroundColor: "white" }}>
                <input
                  type="checkbox"
                  onChange={() => handleCheckboxChange(fournisseurs.id)}
                  checked={selectedItems.includes(fournisseurs.id)}
                />
              </td>
              <td style={{ backgroundColor: "white" }}>
                {fournisseurs.CodeFournisseur}
              </td>
              <td style={{ backgroundColor: "white" }}>
                {fournisseurs.raison_sociale}
              </td>
              <td style={{ backgroundColor: "white" }}>
                {fournisseurs.adresse}
              </td>
              <td style={{ backgroundColor: "white" }}>
                {fournisseurs.tele}
                <button
                  onClick={() => toggleRowContact(fournisseurs.id)}
                  style={{
                    border: "none",
                    backgroundColor: "white",
                  }}
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
              </td>
              <td style={{ backgroundColor: "white" }}>
                {fournisseurs.email}
              </td>
              <td style={{ backgroundColor: "white" }}>
                {fournisseurs.ville}
              </td>
              <td style={{ backgroundColor: "white" }}>
                {fournisseurs.abreviation}
              </td>
              <td style={{ backgroundColor: "white" }}>
                {fournisseurs.code_postal}
              </td>
              <td style={{ backgroundColor: "white" }}>
                {fournisseurs.ice}
              </td>
              <td style={{ backgroundColor: "white" }}>
                <FontAwesomeIcon
                  onClick={() => handleEdit(fournisseurs)}
                  icon={faEdit}
                  style={{ color: "#007bff", cursor: "pointer" }}
                />
                <span style={{ margin: "0 8px" }}></span>
                <FontAwesomeIcon
                  onClick={() => handleDelete(fournisseurs.id)}
                  icon={faTrash}
                  style={{ color: "#ff0000", cursor: "pointer" }}
                />
              </td>
            </tr>

            {expandedRowsContact.includes(fournisseurs.id) &&
              fournisseurs.contact_fornisseur && (
                <tr>
                  <td colSpan="16">
                    <div>
                      <table
                        className="table table-responsive table-bordered"
                        style={{ marginTop: "0px", marginBottom: "0px" }}
                      >
                        <thead>
                          <tr>
                            <th style={{ backgroundColor: "#adb5bd" }}>Nom</th>
                            <th style={{ backgroundColor: "#adb5bd" }}>
                              Prenom
                            </th>
                            <th style={{ backgroundColor: "#adb5bd" }}>
                              Telephone
                            </th>
                            <th style={{ backgroundColor: "#adb5bd" }}>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fournisseurs.contact_fornisseur.map(
                            (contact_fornisseur) => {
                              return (
                                <tr key={contact_fornisseur.id}>
                                  <td>{contact_fornisseur.name}</td>
                                  <td>{contact_fornisseur.prenom}</td>
                                  <td>{contact_fornisseur.telephone}</td>
                                  <td>{contact_fornisseur.email}</td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
          </React.Fragment>
        );
      })}
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
                  Supprimer selection
                </Button>
                </a>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredFournisseurs.length}
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

export default FournisseurList;
