// CommandeDetails.jsx
import React, { useState, useEffect } from "react";
import "./commande.css";
import TablePagination from "@mui/material/TablePagination";
import Search from "../Acceuil/Search";
import axios from "axios";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
const CommandeDetails = ({ produits, commande }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [ligneCommandes, setLigneCommandes] = useState(commande.ligne_commandes);
  const [filteredProduits, setFilteredProduits] = useState([]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const produitLookup = (produitId) => {
    const produit = produits.find((p) => p.id === produitId);
    return produit ? produit.nom : "... loading";
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    // Filter commandes based on the search term
    const filtered = produits.filter((commande) =>
      commande.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredProduits(filtered);
  }, [produits, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const ligneCommandeDetails = ligneCommandes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const fetchLigneCommandes = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/ligneCommandes"
      );

      console.log("API Response for ligneCommandes:", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchStatusCommandes = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/statusCommande"
      );

      console.log("API Response for ligneCommandes:", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const statusCommandeDetails = commande.status_commandes;
  const handleDeleteLigneCommande = (id) => {
    const isConfirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer ce commande ?"
    );

    if (isConfirmed) {
      axios
        .delete(`http://localhost:8000/api/ligneCommandes/${id}`)
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Succès!",
            text: "Ligne Commande supprimé avec succès.",
          });

          setLigneCommandes((prevLigneCommandes) =>
            prevLigneCommandes.filter(
              (ligneCommande) => ligneCommande.id !== id
            )
          );
        })
        .catch((error) => {
          console.error("Erreur lors de la suppression du commande:", error);
          Swal.fire({
            icon: "error",
            title: "Erreur!",
            text: "Échec de la suppression du commande.",
          });
        });
    } else {
      console.log("Suppression annulée");
    }
  };

  return (
    <div style={{ backgroundColor: "#E1E1E1", position:'absolute',
      top:'0px',
      left:'220px',
      width:'90%' }}>
      <div className="details-container col row"  id="commande">
        <div className="ligne-commande-table col-5 text-center mt-2 mx-5">
            {/* <Search  onSearch={handleSearch}/> */}
          <table className="table table-hover mt-2" style={{ backgroundColor: "#F1F1F1" }}>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Quantite</th>
                <th>Prix Unitaire</th>
              </tr>
            </thead>
            <tbody>
              {ligneCommandeDetails.map((ligneCommande) => (
                <tr key={ligneCommande.id}>
                  <td>{produitLookup(ligneCommande.produit_id)}</td>
                  <td>{ligneCommande.quantite}</td>
                  <td>{ligneCommande.prix_unitaire}</td>
                  <td className="no-print">
                    <button className="btn btn-danger" onClick={() => handleDeleteLigneCommande(ligneCommande.id)}>                     
                      <FontAwesomeIcon icon={faTrash}/>                
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={commande.ligne_commandes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            className="no-print"
          /> 
        </div>
        <div className="status-commande-table col-5 text-center mt-5">
          <table className="table table-hover" style={{ backgroundColor: "#F1F1F1" }}>
            <thead>
              <tr>
                <th colspan="2">{commande.reference}</th>
              </tr>
              <tr>
                <th>Status</th>
                <th>Date Status</th>
              </tr>
            </thead>
            <tbody>
              {statusCommandeDetails.map((statusCommande) => (
                <tr key={statusCommande.id}>
                  <td>{statusCommande.status}</td>
                  <td>{statusCommande.date_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommandeDetails;