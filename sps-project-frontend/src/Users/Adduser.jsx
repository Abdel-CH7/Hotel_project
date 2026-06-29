import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Navigation from "../Acceuil/Navigation";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Toolbar } from "@mui/material";
const AddUser = () => {
  const token = localStorage.getItem("API_TOKEN");
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
    photo: null,
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
    photo: "",
    password: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("products");

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.type === "file" ? e.target.files[0] : e.target.value,
    });
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const getPermissionsForCategory = () => {
    switch (selectedCategory) {
      case "products":
        return ["view_all_products", "create_product", "edit_product", "delete_product"];
      case "fournisseurs":
        return ["view_all_fournisseurs", "create_fournisseurs", "update_fournisseurs", "delete_fournisseurs"];
      case "clients":
        return ["view_all_clients", "create_clients", "update_clients", "delete_clients"];
      case "users":
        return ["view_all_users", "create_user", "edit_user", "delete_user"];
      default:
        return [];
    }
  };

  const handlePermissionChange = (event) => {
    const permissionsForCategory = getPermissionsForCategory();
    const permission = event.target.value;

    if (permissionsForCategory.includes(permission)) {
      if (selectedPermissions.includes(permission)) {
        setSelectedPermissions(selectedPermissions.filter((p) => p !== permission));
      } else {
        setSelectedPermissions([...selectedPermissions, permission]);
      }
    } else {
      // Handle the case where the permission is not valid for the selected category
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("role", user.role);
      formData.append("password", user.password);
      formData.append("photo", user.photo);

      selectedPermissions.forEach((permission) => {
        formData.append("permissions[]", permission);
      });

      const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

      const response = await axios.post(
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

      Swal.fire({
        icon: "success",
        title: "Utilisateur ajouté avec succès!",
        showConfirmButton: false,
        timer: 1500,
      });

      navigate("/users");

      setUser({
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
      });
      setSelectedPermissions([]);
    } catch (error) {
      if (error.response) {
        const serverErrors = error.response.data.errors;

        if (error.response.status === 403) {
          Swal.fire({
            icon: "error",
            title: "Accès refusé",
            text: "Vous n'avez pas l'autorisation d'ajouter un utilisateur.",
          });
        } else {
          console.log("Server Validation Errors:", serverErrors);
          setErrors({
            name: serverErrors?.name?.[0] || "",
            email: serverErrors?.email?.[0] || "",
            role: serverErrors?.role?.[0] || "",
            photo: serverErrors?.photo?.[0] || "",
            password: serverErrors?.password?.[0] || "",
          });
        }
      } else if (error.request) {
        console.error("Erreur lors de la communication avec le serveur :", error.request);
      } else {
        console.error("Erreur lors de la configuration de la requête :", error.message);
      }
    }
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ display: 'flex' }}>
        <Navigation />
        <Box component="main"  sx={{ flexGrow: 1, p: 3, mt: 4 }}>
          <Toolbar />
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <i className="fas fa-user-plus" aria-hidden="true"></i>
        <h2 style={{ marginBottom: "20px" }}>Ajouter un utilisateur</h2>
        <form onSubmit={handleSubmit}>
  <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
    <label style={{ flex: "0 0 150px", marginRight: "10px" }}>Nom:</label>
    <input
      type="text"
      name="name"
      value={user.name}
      onChange={handleChange}
      style={{ flex: 1, padding: "8px", boxSizing: "border-box" }}
    />
  </div>
  <span style={{ color: "red" }}>{errors.name}</span>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
    <label style={{ flex: "0 0 150px", marginRight: "10px" }}>Email:</label>
    <input
      type="email"
      name="email"
      value={user.email}
      onChange={handleChange}
      style={{ flex: 1, padding: "8px", boxSizing: "border-box" }}
    />
  </div>
  <span style={{ color: "red" }}>{errors.email}</span>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
    <label style={{ flex: "0 0 150px", marginRight: "10px" }}>Role:</label>
    <input
      type="text"
      name="role"
      value={user.role}
      onChange={handleChange}
      style={{ flex: 1, padding: "8px", boxSizing: "border-box" }}
    />
  </div>
  <span style={{ color: "red" }}>{errors.role}</span>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
    <label style={{ flex: "0 0 150px", marginRight: "10px" }}>Photo:</label>
    <input
      type="file"
      name="photo"
      onChange={handleChange}
      style={{ flex: 1, padding: "8px", boxSizing: "border-box" }}
    />
  </div>
  <span style={{ color: "red" }}>{errors.photo}</span>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
    <label style={{ flex: "0 0 150px", marginRight: "10px" }}>Mot de passe:</label>
    <input
      type="text"
      name="password"
      value={user.password}
      onChange={handleChange}
      style={{ flex: 1, padding: "8px", boxSizing: "border-box" }}
    />
  </div>
  <span style={{ color: "red" }}>{errors.password}</span>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
    <label style={{ flex: "0 0 150px", marginRight: "10px" }}>Catégorie:</label>
    <select value={selectedCategory} onChange={handleCategoryChange} style={{ flex: 1, padding: "8px", boxSizing: "border-box" }}>
      <option value="products">Produits</option>
      <option value="fournisseurs">Fournisseurs</option>
      <option value="clients">Clients</option>
      <option value="users">Utilisateurs</option>
    </select>
  </div>

  <div style={{ marginBottom: "15px" }}>
    {getPermissionsForCategory().map((permission) => (
      <div key={permission} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
        <input
          type="checkbox"
          value={permission}
          checked={selectedPermissions.includes(permission)}
          onChange={handlePermissionChange}
          style={{ marginRight: "10px" }}
        />
        <label>
          {permission
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </label>
      </div>
    ))}
  </div>

  <button
    type="submit"
    style={{
      background: "#4CAF50",
      color: "white",
      padding: "10px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    }}
  >
    Ajouter
  </button>
</form>

      </div>
      </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AddUser;