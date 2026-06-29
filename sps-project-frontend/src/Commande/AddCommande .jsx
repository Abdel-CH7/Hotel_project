import React, { useState } from "react";
//import Drawer from "@mui/material/Drawer";
//import Button from "@mui/material/Button";

import Drawer from "react-bootstrap/Drawer";
import Button from "react-bootstrap/Button";
import axios from "axios";
import swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Form from "react-bootstrap/Form";
import Select from "react-dropdown-select";

const AddCommande = ({ produits, clients, csrfToken, fetchCommandes }) => {
  const [open, setOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleProductCheckboxChange = (selectedOptions) => {
    const selectedProductIds = selectedOptions.map((option) => option.value);

    const updatedSelectedProducts = produits
      .map((produit) => ({
        ...produit,
        prix: produit.prix_vente, // Initialize prix with prix_vente
      }))
      .filter((produit) => selectedProductIds.includes(produit.id));

    setSelectedProducts(updatedSelectedProducts);
    console.log("selectedProducts :", selectedProducts);
  };
  const handlePrixChange = (productId, newPrix) => {
    setSelectedProducts((prevSelectedProducts) =>
      prevSelectedProducts.map((produit) =>
        produit.id === productId ? { ...produit, prix: newPrix } : produit
      )
    );
  };

  const getElementValueById = (id) => {
    return document.getElementById(id)?.value || "";
  };

  const handleAddCommande = async () => {
    try {
      const userResponse = await axios.get("http://localhost:8000/api/users", {
        withCredentials: true,
        headers: {
          "X-CSRF-TOKEN": csrfToken,
        },
      });

      const authenticatedUserId = userResponse.data[0].id;
      console.log("auth user", authenticatedUserId);
      const commandeResponse = await axios.post(
        "http://localhost:8000/api/commandes",
        {
          client_id: findClientId(getElementValueById("client_id")),
          mode_payement: getElementValueById("modePaiement"),
          user_id: authenticatedUserId,
          dateCommande: getElementValueById("dateCommande"),
        },
        {
          withCredentials: true,
          headers: {
            "X-CSRF-TOKEN": csrfToken,
          },
        }
      );

      console.log(commandeResponse);
      const selectedProductsData = selectedProducts.map((selectedProduct) => {
        return {
          commande_id: commandeResponse.data.commande.id,
          produit_id: selectedProduct.id,

          quantite: getElementValueById(`quantite_${selectedProduct.id}`),
          prix_unitaire: getElementValueById(`prix_${selectedProduct.id}`),
        };
      });
      console.log("selectProducts", selectedProducts);

      for (const ligneCommandeData of selectedProductsData) {
        await axios.post(
          "http://localhost:8000/api/ligneCommandes",
          ligneCommandeData,
          {
            withCredentials: true,
            headers: {
              "X-CSRF-TOKEN": csrfToken,
            },
          }
        );
      }

      const statusCommandeData = {
        commande_id: commandeResponse.data.commande.id,
        status: "EN COURS",
      };
      await axios.post(
        "http://localhost:8000/api/statusCommande",
        statusCommandeData,
        {
          withCredentials: true,
          headers: {
            "X-CSRF-TOKEN": csrfToken,
          },
        }
      );

      swal.fire({
        icon: "success",
        title: "Commande ajoutée avec succès!",
        showConfirmButton: false,
        timer: 1500,
      });
      setSelectedProducts([]);
      handleDrawerClose();
      fetchCommandes();
      console.log("Commande ajoutée avec succès!");
    } catch (error) {
      console.error("Error adding commande:", error);
      swal.fire({
        icon: "error",
        title: "Error adding commande",
        text: "An error occurred while adding the commande. Please try again.",
      });
    }
  };

  const findClientId = (raisonSociale) => {
    return clients.find((client) => client.raison_sociale === raisonSociale)
      ?.id;
  };

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleDrawerOpen}
        style={{ marginBottom: "10px" }}
      >
        <FontAwesomeIcon icon={faPlus} style={{ marginRight: "5px" }} />
      </Button>

      <Drawer show={open} onHide={handleDrawerClose} placement="right">
        <Drawer.Header closeButton>
          <Drawer.Title>Add Commande</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <Form>
            <Form.Group controlId="client_id">
              <Form.Label>Client:</Form.Label>
              <Form.Select>
                <option disabled selected>
                  Client
                </option>
                {clients.map((client) => (
                  <option key={client.id}>{client.raison_sociale}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="modePaiement">
              <Form.Label>Mode Paiement:</Form.Label>
              <Form.Select>
                <option disabled selected>
                  Mode de Paiement
                </option>
                <option value="Espece">Espece</option>
                <option value="Tpe">Tpe</option>
                <option value="Virement">Cheque</option>
                {/* Add more payment types as needed */}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="dateCommande">
              <Form.Label>Date Commande:</Form.Label>
              <Form.Control type="date" />
            </Form.Group>

            <Form.Group controlId="selectedProduit">
              <Form.Label>Produit:</Form.Label>
              <Select
                options={produits.map((produit) => ({
                  value: produit.id,
                  label: produit.designation,
                }))}
                onChange={handleProductCheckboxChange}
                multi
              />
            </Form.Group>

            <Form.Group controlId="selectedProduitTable">
              {/* Selected Product Table */}
            </Form.Group>
          </Form>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={handleDrawerClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleAddCommande}>
            Add Commande
          </Button>
        </Drawer.Footer>
      </Drawer>
    </div>
  );
};

export default AddCommande;