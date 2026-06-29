import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Navigation from "../Acceuil/Navigation";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Fab, Toolbar } from "@mui/material";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Link, useNavigate } from "react-router-dom";
import { Modal } from "react-bootstrap";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import "../style1.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useOpen } from "../Acceuil/OpenProvider"; // Importer le hook personnalisé

const Users = () => {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const token = localStorage.getItem("API_TOKEN");
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const navigate = useNavigate();
  const [selectAll, setSelectAll] = useState(false);

  const [users, setUsers] = useState([]);
  const [user, setUser] = useState({
    id: null,
    name: "",
    email: "",
    role: "",
    photo: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
    photo: "",
    password: "",
  });
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

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
    borderRight: "1px solid #ddd", // Ajouter une bordure à droite
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePermissionsModalOpen = () => {
    setShowPermissionsModal(true);
  };
  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedPermissions([
        "view_all_products",
        "create_product",
        "edit_product",
        "delete_product",
        "view_all_fournisseurs",
        "create_fournisseurs",
        "update_fournisseurs",
        "delete_fournisseurs",
        "view_all_livreurs",
        "create_livreurs",
        "update_livreurs",
        "delete_livreurs",
        "view_all_vehicules",
        "create_vehicules",
        "update_vehicules",
        "delete_vehicules",
        "view_all_objectifs",
        "create_objectifs",
        "update_objectifs",
        "delete_objectifs",
        "view_all_clients",
        "create_clients",
        "update_clients",
        "delete_clients",

        "view_all_commandes",
        "create_commandes",
        "update_commandes",
        "delete_commandes",
        "view_all_users",
        "create_user",
        "edit_user",
        "delete_user",
      ]);
    } else {
      setSelectedPermissions([]);
    }
  };

  const handlePermissionsModalClose = () => {
    setShowPermissionsModal(false);
  };
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/users", {
        withCredentials: true,
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la liste des utilisateurs.",
        });
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // const handleDelete = async (id) => {

  //   try {
  //     await axios.delete(`http://localhost:8000/api/users/${id}`, {
  //       withCredentials: true,
  //     });
  //     setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
  //   } catch (error) {
  //     console.error("Error deleting user:", error);
  //     if (error.response && error.response.status === 403) {
  //       Swal.fire({
  //         icon: "error",
  //         title: "Accès refusé",
  //         text: "Vous n'avez pas l'autorisation de supprimer cet utilisateur.",
  //       });
  //     }
  //   }
  // };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer cet user ?",
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
          .delete(`http://localhost:8000/api/users/${id}`)
          .then((response) => {
            fetchUsers();
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Utilisateur supprimé avec succès.",
            });
          })
          .catch((error) => {
            console.error("Error deleting user:", error);
            if (error.response && error.response.status === 403) {
              Swal.fire({
                icon: "error",
                title: "Accès refusé",
                text: "Vous n'avez pas l'autorisation de supprimer cet utlisateur.",
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la suppression du user.",
              });
            }
          });
      } else {
        console.log("Suppression annulée");
      }
    });
  };

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]:
        e.target.type === "file" ? e.target.files[0] : e.target.value,
    });
  };

  const handlePermissionChange = (e) => {
    const permission = e.target.value;
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(
        selectedPermissions.filter((p) => p !== permission)
      );
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const handleEditUser = (userData) => {
    setUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.roles[0].name,
      photo: userData.photo,
      password: userData.password,
      permissions: userData.roles[0].permissions.map(
        (permission) => permission.name
      ),
    });
    setSelectedPermissions(
      userData.roles[0].permissions.map((permission) => permission.name)
    );
    setIsEditing(true);
    handleShowFormButtonClick();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const userData = {
        name: user.name,
        email: user.email,
        role: user.role,
        // photo:user.photo,
        password: user.password,
        permissions: selectedPermissions,
      };

      const csrfToken = document.querySelector(
        'meta[name="csrf-token"]'
      ).content;

      let response;

      if (isEditing) {
        response = await axios.put(
          `http://localhost:8000/api/users/${user.id}`,
          userData,
          {
            withCredentials: true,
            headers: {
              "X-CSRF-TOKEN": csrfToken,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        const formData = new FormData();
        formData.append("name", user.name);
        formData.append("email", user.email);
        formData.append("role", user.role);
        formData.append("password", user.password);
        selectedPermissions.forEach((permission) => {
          formData.append("permissions[]", permission);
        });

        if (user.photo) {
          formData.append("photo", user.photo);
        }

        response = await axios.post(
          "http://localhost:8000/api/register",
          formData,
          {
            headers: {
              "X-CSRF-TOKEN": csrfToken,
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          }
        );
      }

      if (response.data) {
        let successMessage = "Utilisateur ajouté avec succès!";
      
        if (isEditing) {
          successMessage = "Utilisateur modifié avec succès!";
        }

        Swal.fire({
          icon: "success",
          title: successMessage,
          showConfirmButton: false,
          timer: 1500,
        });

        fetchUsers();

        setUser({
          id: null,
          name: "",
          email: "",
          role: "",
          photo: "null",
          password: "",
          permission: "",
        });

        setErrors({
          name: "",
          email: "",
          role: "",
          photo: "",
          password: "",
          permission: "",
        });

        setSelectedPermissions([]);
        setIsEditing(false);
        closeForm();
      } else {
        // Handle other response statuses if needed
      }
    } catch (error) {
      if (error.response) {
        const serverErrors = error.response.data.errors;

        if (error.response.status === 403) {
          let errorMessage = "Vous n'avez pas l'autorisation ";

          if (isEditing) {
            errorMessage += "de modifier un utilisateur.";
          } else {
            errorMessage += "d'ajouter un utilisateur.";
          }

          Swal.fire({
            icon: "error",
            title: "Accès refusé",
            text: errorMessage,
          });
        } else {
          setErrors({
            name: serverErrors?.name?.[0] || "",
            email: serverErrors?.email?.[0] || "",
            role: serverErrors?.role?.[0] || "",
            photo: serverErrors?.photo?.[0] || "",
            password: serverErrors?.password?.[0] || "",
          });
        }
      } else if (error.request) {
        console.error(
          "Erreur lors de la communication avec le serveur :",
          error.request
        );
      } else {
        console.error(
          "Erreur lors de la configuration de la requête :",
          error.message
        );
      }
    }
  };

  const handleShowFormButtonClick = () => {
    if (formContainerStyle.right === "-900px") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "620px" });
    } else {
      closeForm();
    }
  };

  const closeForm = () => {
    setSelectedPermissions([]);
    setUser({
      id: null,
      name: "",
      email: "",
      role: "",
      photo: null,
      password: "",
    });
    setErrors({
      name: "",
      email: "",
      role: "",
      photo: "",
      password: "",
      permission: "",
    });
    setIsEditing(false);
    setFormContainerStyle({ right: "-900px" });
    setTableContainerStyle({ marginRight: "0" });
  };

  // const renderPermissionsCheckbox = (value, label) => (
  //   <Form.Check
  //     type="checkbox"
  //     label={label}
  //     value={value}
  //     checked={selectedPermissions.includes(value)}
  //     onChange={handlePermissionChange}
  //   />
  // );
  const renderPermissionsCheckbox = (value, label, disabled) => (
    <Form.Check
      type="checkbox"
      label={label}
      value={value}
      checked={selectedPermissions.includes(value)}
      onChange={handlePermissionChange}
      disabled={disabled}
    />
  );

  return (
    <ThemeProvider theme={createTheme()}>
     <Box sx={{...dynamicStyles  }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3,  }}>
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ marginTop: "50px" }}
          >
            <h3 className="titreColore">
              Gestion des utilisateurs
            </h3>
          </div>
          <div className="container-d-flex justify-content-start">
            <a
              // href="#"
              onClick={handleShowFormButtonClick}
              style={{
                // textDecoration: "none",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
              className="AjouteBotton"
            >
              <i
                style={{ fontSize: "24px", marginRight: "8px" }}
                className="fas fa-user-plus"
                aria-hidden="true"
              ></i>
              Ajouter Utilisateurs
            </a>

            <div style={{ marginTop: "50px" }}>
              <div id="formContainer" style={formContainerStyle}>
                <Form className="col row" onSubmit={handleFormSubmit}>
                  <div>
                    <Form.Label
                      className="text-center m-2"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <h4
                        style={{
                          fontSize: "25px",
                          fontFamily: "Arial, sans-serif",
                          fontWeight: "bold",
                          color: "black",
                          borderBottom: "2px solid black",
                          paddingBottom: "5px",
                          flex: 1, // Permet à l'élément de s'étendre pour prendre tout l'espace disponible
                        }}
                      >
                        {isEditing ? "Modifier " : "Ajouter "} Utilisateur
                      </h4>
                      <Button
                        onClick={handlePermissionsModalOpen}
                        style={{
                          backgroundColor: "transparent",
                          color: "black",
                          marginTop: "24px",
                          border: "none",
                        }}
                      >
                        <i
                          style={{ fontSize: "24px" }}
                          className="fas fa-key"
                        ></i>
                      </Button>
                    </Form.Label>

                    <Form.Group className="col-sm-10 m-2" style={{ display: 'flex', alignItems: 'center' }} controlId="NomAgent">
                    <Form.Label style={{ flex: '1', marginRight: '10px', marginLeft: '10px' }}>Nom</Form.Label>
                      <Form.Control
                            style={{ flex: '2', marginLeft: '10px' }}

                        type="text"
                        name="name"
                        value={user.name}
                        onChange={handleChange}
                        placeholder="Entrez le nom"
                      />
                      <Form.Text className="text-danger">
                        {errors.name}
                      </Form.Text>
                    </Form.Group>
                    <Form.Group className="col-sm-10 m-2" style={{ display: 'flex', alignItems: 'center' }} controlId="NomAgent">
                    <Form.Label style={{ flex: '1', marginRight: '10px', marginLeft: '10px' }}>Email</Form.Label>
                      <Form.Control
                            style={{ flex: '2', marginLeft: '10px' }}

                        type="email"
                        name="email"
                        value={user.email}
                        onChange={handleChange}
                        placeholder="Entrez l'email"
                      />
                      <Form.Text className="text-danger">
                        {errors.email}
                      </Form.Text>
                    </Form.Group>
                    <Form.Group className="col-sm-10 m-2" style={{ display: 'flex', alignItems: 'center' }} controlId="NomAgent">
                    <Form.Label style={{ flex: '1', marginRight: '10px', marginLeft: '10px' }}>Role</Form.Label>
                      <Form.Control
                            style={{ flex: '2', marginLeft: '10px' }}

                        type="text"
                        name="role"
                        value={user.role}
                        onChange={handleChange}
                        placeholder="Entrez le rôle"
                      />
                      <Form.Text className="text-danger">
                        {errors.role}
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="col-sm-10 m-2" style={{ display: 'flex', alignItems: 'center' }} controlId="NomAgent">
                    <Form.Label style={{ flex: '1', marginRight: '10px', marginLeft: '10px' }}>Photo</Form.Label>
                      <Form.Control
                            style={{ flex: '2', marginLeft: '10px' }}

                        type="file"
                        name="photo"
                        onChange={handleChange}
                      />

                      <Form.Text className="text-danger">
                        {errors.photo}
                      </Form.Text>
                    </Form.Group>
                    <Form.Group className="col-sm-10 m-2" style={{ display: 'flex', alignItems: 'center' }} controlId="NomAgent">

                      <Form.Label style={{ flex: '1', marginRight: '10px', marginLeft: '10px' }}>Mot de passe</Form.Label>
                      <Form.Control
                            style={{ flex: '2', marginLeft: '10px' }}

                        type="text"
                        name="password"
                        value={user.password}
                        onChange={handleChange}
                        placeholder="Entrez le mot de passe"
                      />
                      <Form.Text className="text-danger">
                        {errors.password}
                      </Form.Text>
                    </Form.Group>
                  </div>

                  <Form.Group className="mt-5 d-flex justify-content-center">
        
        <Fab
    variant="extended"
    className="btn-sm Fab mb-2 mx-2"
    type="submit"
  >
    Valider
  </Fab>
  
      </Form.Group>
                </Form>
              </div>
            </div>
            <div
              id="tableContainer"
              className="table-responsive-sm"
              style={{...tableContainerStyle,marginTop:'-50px'}}
            >
              <table
                className="table table-responsive table-bordered "
                id="clientsTable"
              >
                <thead>
                  <tr>
                    <th className="tableHead widthDetails">Name</th>
                    <th className="tableHead">Email</th>
                    <th className="tableHead">Role</th>
                    <th className="tableHead">Photo</th>
                    <th className="tableHead">Password</th>
                    <th className="tableHead">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users &&
                    users.map((user) => (
                      <tr key={user.id}>
                        <td style={{ backgroundColor: "white" }}>
                          {user.name}
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          {user.email}
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          {user.roles.length > 0
                            ? user.roles[0].name
                            : "No Role"}
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          {user.photo && (
                            <img
                              src={user.photo}
                              alt="Photo de l'utilisateur"
                              style={{
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                              }}
                            />
                          )}
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          {user.password}
                        </td>{" "}
                        <td style={{ backgroundColor: "white" }}>
                          <FontAwesomeIcon
                            onClick={() => handleEditUser(user)}
                            icon={faEdit}
                            style={{
                              color: "#007bff",
                              cursor: "pointer",
                            }}
                          />
                          <span style={{ margin: "0 8px" }}></span>
                          <FontAwesomeIcon
                            onClick={() => handleDelete(user.id)}
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
          </div>

          <Modal
            show={showPermissionsModal}
            onHide={handlePermissionsModalClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "150px",
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title> gerer les Permissions</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <label>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllChange}
                />
                Check All
              </label>
              <table className="table">
                <thead>
                  <tr>
                    <th>interface</th>
                    <th>Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Produits</td>
                    <td>
                      {renderPermissionsCheckbox(
                        "view_all_products",
                        "Produits"
                      )}
                      {renderPermissionsCheckbox(
                        "create_product",
                        "Ajouter",
                        !selectedPermissions.includes("view_all_products")
                      )}
                      {renderPermissionsCheckbox(
                        "edit_product",
                        "Editer",
                        !selectedPermissions.includes("view_all_products")
                      )}
                      {renderPermissionsCheckbox(
                        "delete_product",
                        "Supprimer",
                        !selectedPermissions.includes("view_all_products")
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Fournisseurs</td>
                    <td>
                      {renderPermissionsCheckbox(
                        "view_all_fournisseurs",
                        "Fournisseurs"
                      )}
                      {renderPermissionsCheckbox(
                        "create_fournisseurs",
                        "Ajouter",
                        !selectedPermissions.includes("view_all_fournisseurs")
                      )}
                      {renderPermissionsCheckbox(
                        "update_fournisseurs",
                        "Editer",
                        !selectedPermissions.includes("view_all_fournisseurs")
                      )}
                      {renderPermissionsCheckbox(
                        "delete_fournisseurs",
                        "Supprimer",
                        !selectedPermissions.includes("view_all_fournisseurs")
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>livreurs</td>
                    <td>
                      {renderPermissionsCheckbox(
                        "view_all_livreurs",
                        "livreurs"
                      )}
                      {renderPermissionsCheckbox(
                        "create_livreurs",
                        "Ajouter",
                        !selectedPermissions.includes("view_all_livreurs")
                      )}
                      {renderPermissionsCheckbox(
                        "update_livreurs",
                        "Editer",
                        !selectedPermissions.includes("view_all_livreurs")
                      )}
                      {renderPermissionsCheckbox(
                        "delete_livreurs",
                        "Supprimer",
                        !selectedPermissions.includes("view_all_livreurs")
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>vehicules</td>
                    <td>
                      {renderPermissionsCheckbox(
                        "view_all_vehicules",
                        "vehicules"
                      )}
                      {renderPermissionsCheckbox(
                        "create_vehicules",
                        "Ajouter",
                        !selectedPermissions.includes("view_all_vehicules")
                      )}
                      {renderPermissionsCheckbox(
                        "update_vehicules",
                        "Editer",
                        !selectedPermissions.includes("view_all_vehicules")
                      )}
                      {renderPermissionsCheckbox(
                        "delete_vehicules",
                        "Supprimer",
                        !selectedPermissions.includes("view_all_vehicules")
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>objectifs</td>
                    <td>
                      {renderPermissionsCheckbox(
                        "view_all_objectifs",
                        "objectifs"
                      )}
                      {renderPermissionsCheckbox(
                        "create_objectifs",
                        "Ajouter",
                        !selectedPermissions.includes("view_all_objectifs")
                      )}
                      {renderPermissionsCheckbox(
                        "update_objectifs",
                        "Editer",
                        !selectedPermissions.includes("view_all_objectifs")
                      )}
                      {renderPermissionsCheckbox(
                        "delete_objectifs",
                        "Supprimer",
                        !selectedPermissions.includes("view_all_objectifs")
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Clients</td>
                    <td>
                      {renderPermissionsCheckbox("view_all_clients", "Clients")}
                      {renderPermissionsCheckbox(
                        "create_clients",
                        "Ajouter",
                        !selectedPermissions.includes("view_all_clients")
                      )}
                      {renderPermissionsCheckbox(
                        "update_clients",
                        "Editer",
                        !selectedPermissions.includes("view_all_clients")
                      )}
                      {renderPermissionsCheckbox(
                        "delete_clients",
                        "Supprimer",
                        !selectedPermissions.includes("view_all_clients")
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>commandes</td>
                    <td>
                      {renderPermissionsCheckbox("view_all_commandes", "Commandes")}
                      {renderPermissionsCheckbox(
                        "create_commandes",
                        "Ajouter",
                        !selectedPermissions.includes("view_all_commandes")
                      )}
                      {renderPermissionsCheckbox(
                        "update_commandes",
                        "Editer",
                        !selectedPermissions.includes("view_all_commandes")
                      )}
                      {renderPermissionsCheckbox(
                        "delete_commandes",
                        "Supprimer",
                        !selectedPermissions.includes("view_all_commandes")
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Utilisateurs</td>
                    <td>
                      {renderPermissionsCheckbox(
                        "view_all_users",
                        "Utilisateurs"
                      )}
                      {renderPermissionsCheckbox(
                        "create_user",
                        "Ajouter",
                        !selectedPermissions.includes("view_all_users")
                      )}
                      {renderPermissionsCheckbox(
                        "edit_user",
                        "Editer",
                        !selectedPermissions.includes("view_all_users")
                      )}
                      {renderPermissionsCheckbox(
                        "delete_user",
                        "Supprimer",
                        !selectedPermissions.includes("view_all_users")
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={handlePermissionsModalClose}>
                valider
              </Button>
            </Modal.Footer>
          </Modal>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Users;
