import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../Acceuil/Navigation";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("API_TOKEN");
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/users/${id}/edit`,
          {
            withCredentials: true,
          }
        );

        const userData = response.data.user;

        setUser({
          name: userData.name,
          email: userData.email,
          role: userData.roles.length > 0 ? userData.roles[0].name : "", // Set role properly
          photo: userData.photo,
          password: userData.password,
        });
        setSelectedPermissions(userData.permissions || []);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    if (e.target.name === "role") {
      setUser({
        ...user,
        role: e.target.value,
      });
    } else {
      setUser({
        ...user,
        [e.target.name]:
          e.target.type === "file" ? e.target.files[0] : e.target.value,
      });
    }
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

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("role", user.role);

      if (user.password) {
        formData.append("password", user.password);
      }

      if (user.photo) {
        formData.append("photo", user.photo);
      }

      selectedPermissions.forEach((permission) => {
        formData.append("permissions[]", permission);
      });

      const csrfToken = document.querySelector(
        'meta[name="csrf-token"]'
      ).content;
      const response = await axios.put(
        `http://localhost:8000/api/users/${id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "X-CSRF-TOKEN": csrfToken,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Modification réussie",
          text: "L'utilisateur a été modifié avec succès!",
        });

        navigate("/users");
        console.log("User updated:", response.data);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 422) {
          setErrors(error.response.data.errors);
        } else if (error.response.status === 403) {
          Swal.fire({
            icon: "error",
            title: "Accès refusé",
            text: "Vous n'avez pas l'autorisation de modifier cet utilisateur.",
          });
        } else {
          console.error(
            "Erreur de serveur:",
            error.response.status,
            error.response.data
          );
        }
      } else if (error.request) {
        console.error(
          "Erreur de communication avec le serveur:",
          error.request
        );
      } else {
        console.error("Erreur de configuration de la requête:", error.message);
      }
    }
  };

  return (
    <div>
      <Navigation />
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <i className="fas fa-user-plus" aria-hidden="true"></i>
        <h2 style={{ marginBottom: "20px" }}>Modifier un utilisateur</h2>
        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ marginRight: "10px" }}>Nom:</label>
            <input
              type="text"
              name="name"
              value={user.name}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
            <span style={{ color: "red" }}>{errors.name}</span>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ marginRight: "10px" }}>Email:</label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
            <span style={{ color: "red" }}>{errors.email}</span>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ marginRight: "10px" }}>Photo:</label>
            <input
              type="file"
              name="photo"
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
            <span style={{ color: "red" }}>{errors.photo}</span>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ marginRight: "10px" }}>Role:</label>
            <input
              type="text"
              name="role"
              value={user.role}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
            <span style={{ color: "red" }}>{errors.role}</span>
          </div>
          

          <div style={{ marginBottom: "15px" }}>
            <label style={{ marginRight: "10px" }}>Mot de passe:</label>
            <input
              type="text"
              name="password"
              value={user.password}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
            <span style={{ color: "red" }}>{errors.password}</span>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ marginRight: "10px" }}>Permissions:</label>
            <div>
              <label>
                <input
                  type="checkbox"
                  value="view_all_products"
                  checked={selectedPermissions.includes("view_all_products")}
                  onChange={handlePermissionChange}
                />
                View All Products
              </label>
              <label>
                <input
                  type="checkbox"
                  value="create_product"
                  checked={selectedPermissions.includes("create_product")}
                  onChange={handlePermissionChange}
                />
                Create Product
              </label>
              <label>
                <input
                  type="checkbox"
                  value="edit_product"
                  checked={selectedPermissions.includes("edit_product")}
                  onChange={handlePermissionChange}
                />
                Edit Product
              </label>
              <label>
                <input
                  type="checkbox"
                  value="delete_product"
                  checked={selectedPermissions.includes("delete_product")}
                  onChange={handlePermissionChange}
                />
                Delete Product
              </label>
              <label>
                <input
                  type="checkbox"
                  value="view_all_fournisseurs"
                  checked={selectedPermissions.includes(
                    "view_all_fournisseurs"
                  )}
                  onChange={handlePermissionChange}
                />
                View All Fournisseur
              </label>
              <label>
                <input
                  type="checkbox"
                  value="create_fournisseurs"
                  checked={selectedPermissions.includes("create_fournisseurs")}
                  onChange={handlePermissionChange}
                />
                Create Fournisseur
              </label>
              <label>
                <input
                  type="checkbox"
                  value="update_fournisseurs"
                  checked={selectedPermissions.includes("update_fournisseurs")}
                  onChange={handlePermissionChange}
                />
                Edit Fournisseur
              </label>
              <label>
                <input
                  type="checkbox"
                  value="delete_fournisseurs"
                  checked={selectedPermissions.includes("delete_fournisseurs")}
                  onChange={handlePermissionChange}
                />
                Delete Fournisseur
              </label>
              <label>
                <input
                  type="checkbox"
                  value="view_all_clients"
                  checked={selectedPermissions.includes("view_all_clients")}
                  onChange={handlePermissionChange}
                />
                View All Clients
              </label>
              <label>
                <input
                  type="checkbox"
                  value="create_clients"
                  checked={selectedPermissions.includes("create_clients")}
                  onChange={handlePermissionChange}
                />
                Create Clients
              </label>
              <label>
                <input
                  type="checkbox"
                  value="update_clients"
                  checked={selectedPermissions.includes("update_clients")}
                  onChange={handlePermissionChange}
                />
                Edit Clients
              </label>
              <label>
                <input
                  type="checkbox"
                  value="delete_clients"
                  checked={selectedPermissions.includes("delete_clients")}
                  onChange={handlePermissionChange}
                />
                Delete Clients
              </label>
              <label>
                <input
                  type="checkbox"
                  value="view_all_users"
                  checked={selectedPermissions.includes("view_all_users")}
                  onChange={handlePermissionChange}
                />
                View All Users
              </label>
              <label>
                <input
                  type="checkbox"
                  value="create_user"
                  checked={selectedPermissions.includes("create_user")}
                  onChange={handlePermissionChange}
                />
                Create User
              </label>
              <label>
                <input
                  type="checkbox"
                  value="edit_user"
                  checked={selectedPermissions.includes("edit_user")}
                  onChange={handlePermissionChange}
                />
                Edit User
              </label>
              <label>
                <input
                  type="checkbox"
                  value="delete_user"
                  checked={selectedPermissions.includes("delete_user")}
                  onChange={handlePermissionChange}
                />
                Delete User
              </label>
            </div>
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
            Modifier
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
