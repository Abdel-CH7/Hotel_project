import React, { useState, useEffect } from "react";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import swal from "sweetalert2";
const EditCommande = ({
  produits,
  clients,
  users,
  csrfToken,
  fetchCommandes,
  editCommandeId,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [commandeData, setCommandeData] = useState({
    client_id: "",
    user_id: "",
    status: "",
    reference: "",
    dateCommande: "",
    mode_payement: "",
  });
  const [existingLigneCommandes, setExistingLigneCommandes] = useState([]);
  const [modifiedPrixValues, setModifiedPrixValues] = useState({});
  const [modifiedQuantiteValues, setModifiedQuantiteValues] = useState({});
  useEffect(() => {
    // Fetch data for existing commande and populate the form
    if (editCommandeId) {
      axios
        .get(`http://localhost:8000/api/commandes/${editCommandeId}`)
        .then((response) => {
          const existingCommandeData = response.data.commande;
          setCommandeData({
            client_id: existingCommandeData.client_id.toString(),
            user_id: existingCommandeData.user_id.toString(),
            status: existingCommandeData.status.toString(),
            mode_payement: existingCommandeData.mode_payement.toString(),
            reference: existingCommandeData.reference.toString(),
            dateCommande: existingCommandeData.dateCommande.toString(),
            // Populate other properties as needed
          });
          console.log("commande data :", commandeData);

          // Fetch related ligne commandes
          axios
            .get(`http://localhost:8000/api/ligneCommandes/${editCommandeId}`)
            .then((ligneCommandesResponse) => {
              const existingLigneCommandes =
                ligneCommandesResponse.data.ligneCommandes;

              setExistingLigneCommandes(existingLigneCommandes);

              // Populate selectedProducts based on existing ligne commandes
              const productIds = existingLigneCommandes.map(
                (ligneCommande) => ligneCommande.produit_id
              );
              setSelectedProducts(productIds);
            })
            .catch((error) => {
              console.error("Error fetching existing ligne commandes:", error);
            });
        })
        .catch((error) => {
          console.error("Error fetching existing commande:", error);
        });
    }
  }, [editCommandeId]);
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleInputChange = (productId, inputType, event) => {
    const newValue = event.target.value;
    if (inputType === "prix_unitaire") {
      setModifiedPrixValues((prev) => ({ ...prev, [productId]: newValue }));
    } else if (inputType === "quantite") {
      setModifiedQuantiteValues((prev) => ({ ...prev, [productId]: newValue }));
    }
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleProductCheckboxChange = (productId) => {
    const updatedSelectedProducts = selectedProducts.includes(productId)
      ? selectedProducts.filter((id) => id !== productId)
      : [...selectedProducts, productId];
    setSelectedProducts(updatedSelectedProducts);

    console.log(updatedSelectedProducts);
  };

  const getElementValueById = (id) => {
    return document.getElementById(id)?.value || "";
  };

  const handleEditCommande = async (id) => {
    try {
      console.log(getElementValueById("client_id"));
      // Step 1: Update the Commande
      await axios.put(
        `http://localhost:8000/api/commandes/${editCommandeId}`,
        {
          client_id: getElementValueById("client_id"),
          //user_id: findUserId(getElementValueById("user_id")),
          status: getElementValueById("status"),
          mode_payement: getElementValueById("modePaiement"),
        },
        {
          withCredentials: true,
          headers: {
            "X-CSRF-TOKEN": csrfToken,
          },
        }
      );

      // Step 2: Update the LigneCommande
      const existingLigneCommandesResponse = await axios.get(
        `http://localhost:8000/api/ligneCommandes/${editCommandeId}`
      );
      const existingLigneCommandes =
        existingLigneCommandesResponse.data.ligneCommandes;
      const selectedProductsData = selectedProducts.map((productId) => {
        const existingLigneCommande = existingLigneCommandes.find(
          (ligneCommande) => ligneCommande.produit_id === productId
        );

        return {
          id: existingLigneCommande ? existingLigneCommande.id : undefined,
          commande_id: editCommandeId,
          produit_id: productId,
          quantite: getElementValueById(`quantite_${productId}`),
          prix_unitaire: getElementValueById(`prix_${productId}`),
          // Update other properties as needed
        };
      });

      for (const ligneCommandeData of selectedProductsData) {
        // Check if ligneCommande already exists for this produit_id and update accordingly

        console.log("existing LigneCommande:", ligneCommandeData);

        if (ligneCommandeData.id) {
          // If exists, update the existing ligneCommande
          await axios.put(
            `http://localhost:8000/api/ligneCommandes/${ligneCommandeData.id}`,
            ligneCommandeData,
            {
              withCredentials: true,
              headers: {
                "X-CSRF-TOKEN": csrfToken,
              },
            }
          );
        } else {
          // If doesn't exist, create a new ligneCommande
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
      }

      // Step 3: Update the StatusCommande
      // Assuming statusCommandeData is fetched from somewhere
      const existingStatusesResponse = await axios.get(
        "http://localhost:8000/api/statusCommande"
      );
      const existingStatuses = existingStatusesResponse.data.StatusCommande;

      const selectedStatus = getElementValueById("status");
      const statusExists = existingStatuses.some(
        (status) => status.status === selectedStatus
      );
      const statusCommandeData = {
        commande_id: editCommandeId,
        status: getElementValueById("status"),
        // Update other properties as needed
      };
      // if (!statusExists) {
      await axios.post(
        `http://localhost:8000/api/statusCommande/`,
        statusCommandeData,
        {
          withCredentials: true,
          headers: {
            "X-CSRF-TOKEN": csrfToken,
          },
        }
      );
      //}
      // Step 4: Fetch updated commandes
      swal.fire({
        icon: "success",
        title: "Commande modifiee avec succe!",
        showConfirmButton: false,
        timer: 1500, // Adjust the duration as needed
      });

      // Step 5: Close the drawer
      handleDrawerClose();
      fetchCommandes();

      console.log("Commande modifiee avec succe!");
    } catch (error) {
      handleDrawerClose();
      console.error("Error updating commande:", error);

      swal.fire({
        icon: "error",
        title: "Error updating commande",
      });
    }
  };

  const populateProductInputs = (productId, inputType) => {
    //console.log("ligneCommandes", existingLigneCommandes);
    const existingLigneCommande = existingLigneCommandes.find(
      (ligneCommande) => ligneCommande.produit_id === productId
    );

    if (existingLigneCommande) {
      return existingLigneCommande[inputType];
    }
    return "";
  };

  const renderProductInputs = () => {
    return produits.map((produit) => (
      <tr key={produit.id}>
        <td>
          <input
            type="checkbox"
            id={`produit_${produit.id}`}
            name="selectedProducts"
            value={produit.id}
            checked={selectedProducts.includes(produit.id)}
            onChange={() => handleProductCheckboxChange(produit.id)}
          />
        </td>
        <td>{produit.designation}</td>
        <td>{produit.type_quantite}</td>
        <td>{produit.calibre.calibre}</td>
        <td>
          <input
            type="text"
            id={`quantite_${produit.id}`}
            className="quantiteInput"
            placeholder="Quantite"
            value={
              modifiedQuantiteValues[produit.id] ||
              populateProductInputs(produit.id, "quantite")
            }
            onChange={(event) =>
              handleInputChange(produit.id, "quantite", event)
            }
          />
        </td>
        <td>
          <input
            type="text"
            id={`prix_${produit.id}`}
            className="prixInput"
            placeholder="Prix"
            value={
              modifiedPrixValues[produit.id] ||
              populateProductInputs(produit.id, "prix_unitaire")
            }
            onChange={(event) =>
              handleInputChange(produit.id, "prix_unitaire", event)
            }
          />
        </td>
      </tr>
    ));
  };

  return (
    <div>
      <button onClick={handleDrawerOpen} className="btn btn-sm btn-info">
        <i className="fas fa-edit"></i>
      </button>
      <Drawer anchor="right" open={open} onClose={handleDrawerClose}>
        <div style={{ padding: "20px" }}>
          <h3 className="text-center mb-5">Edit Commande</h3>
          <table className="table table-hover mb-5">
            <thead className="text-center">
              <tr>
                <th>Reference</th>
                <th>Status</th>
                <th>Mode Paiement</th>
                <th>Client</th>
                <th>Date Commande</th>
              </tr>
            </thead>
            <tbody className="text-center">
              <td>{commandeData.reference}</td>
              <td>
                <select
                  id="status"
                  className="form-select"
                  value={commandeData.status}
                  onChange={(event) =>
                    setCommandeData((prevData) => ({
                      ...prevData,
                      status: event.target.value,
                    }))
                  }
                >
                  <option disabled>Status</option>
                  <option value="EN COURS">En Cours</option>
                  <option value="VALIDE">Valide</option>
                  <option value="NON VALIDE">Non Valide</option>
                </select>
              </td>
              <td>
                <select
                  id="modePaiement"
                  className="form-select"
                  value={commandeData.mode_payement}
                  onChange={(event) =>
                    setCommandeData((prevData) => ({
                      ...prevData,
                      mode_payement: event.target.value,
                    }))
                  }
                >
                  <option disabled>Mode Paiement</option>
                  <option value="Espece">Espece</option>
                  <option value="Tpe">Tpe</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </td>
              <td>
                <select
                  id="client_id"
                  className="form-select"
                  value={commandeData.client_id}
                  onChange={(event) =>
                    setCommandeData((prevData) => ({
                      ...prevData,
                      client_id: event.target.value,
                    }))
                  }
                >
                  <option disabled>Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.raison_sociale}
                    </option>
                  ))}
                </select>
              </td>
              {/* <td>
                <select
                  id="user_id"
                  className="form-select"
                  value={commandeData.user_id}
                >
                  <option disabled selected>
                    User
                  </option>
                  {users.map((user) => (
                    <option key={user.id}>{user.name}</option>
                  ))}
                </select>
              </td> */}
              <td>{commandeData.dateCommande}</td>
            </tbody>
          </table>
          <table id="selectedProduitTable" className="table table-hover">
            <thead className="text-center">
              <tr>
                <th>Select</th>
                <th>Product</th>
                <th>Type Quantite</th>
                <th>Calibre</th>
                <th>Quantite</th>
                <th>Prix</th>
              </tr>
            </thead>
            <tbody className="text-center">{renderProductInputs()}</tbody>
          </table>
          <div></div>
          <div className="text-center">
            <Button
              variant="contained"
              className="col-3"
              onClick={handleEditCommande}
            >
              modifier
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default EditCommande;