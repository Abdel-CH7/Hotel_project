import React, { useState, useEffect } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Navigation from "../Acceuil/Navigation";
import { Toolbar } from "@mui/material";

const tableHeaderStyle = {
  background: "#e0e0e0",
  padding: "10px",
  textAlign: "left",
  borderBottom: "1px solid #ddd",
};

const Details = () => {
  const [commandes, setCommandes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-500px",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:8000/api/commandes"),
      axios.get("http://localhost:8000/api/produits"),
    ])
      .then(([commandesResponse, produitsResponse]) => {
        setCommandes(commandesResponse.data.commandes);
        setProduits(produitsResponse.data.produit);
        console.log(commandesResponse.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ position:'absolute',
        top:'0px',
        left:'220px',
        width:'90%'}}>
        <Box
          component="main"
          sx={{ display: "flex", flexGrow: 1, p: 3, mt: 4 }}
        >
          <Box sx={{ flex: 1 }}>
            <Toolbar />
            <h2  style={{ color: "grey" }}>Liste des commandes detailés </h2>
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
              className="responsive"
            >
              <thead>
                <tr>
                  <th  style={tableHeaderStyle}>
                    Reference
                  </th>
                  <th style={tableHeaderStyle}>
                    Date de saisie
                  </th>
                  <th  style={tableHeaderStyle}>
                    Date de commande
                  </th>
                  <th  style={tableHeaderStyle}>
                    Mode de paiement
                  </th>
                  <th  style={tableHeaderStyle}>
                    Status
                  </th>
                  <th  style={tableHeaderStyle}>
                    Client
                  </th>
                  {produits.map((produit, index) => (
                    <React.Fragment key={index}>
                      <th
                         style={tableHeaderStyle}
                      >
                        {produit.designation} {produit.calibre.calibre}
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commandes.map((commande) => (
                  <tr key={commande.id}>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {commande.reference}
                    </td>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {commande.dateSaisis}
                    </td>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {commande.dateCommande}
                    </td>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {commande.mode_payement}
                    </td>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {commande.status}
                    </td>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {commande.client.CodeClient}{" "}
                      {commande.client.raison_sociale}
                    </td>
                    {produits.map((produit, index) => {
                      const ligneCommande = commande.ligne_commandes.find(
                        (ligne) => ligne.produit_id === produit.id
                      );
                      const quantite = ligneCommande
                        ? ligneCommande.quantite
                        : 0; // Mettre 0 si la quantité n'existe pas
                      return (
                        <React.Fragment key={index}>
                          <td
                            style={{
                              border: "1px solid #dddddd",
                              padding: "8px",
                            }}
                          >
                            {quantite}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Details;
