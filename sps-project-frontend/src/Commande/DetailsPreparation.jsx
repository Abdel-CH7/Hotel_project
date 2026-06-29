import React, { useState, useEffect } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Navigation from "../Acceuil/Navigation";
import { Toolbar } from "@mui/material";

const DetailsPreparation = () => {
  const [commandes, setCommandes] = useState([]);
  const [produits, setProduits] = useState([]);
  const tableHeaderStyle = {
    background: "#e0e0e0",
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
  };
  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:8000/api/commandes"),
      axios.get("http://localhost:8000/api/produits"),
    ])
      .then(([commandesResponse, produitsResponse]) => {
        console.log("Commandes response:", commandesResponse.data);
        console.log("Produits response:", produitsResponse.data);
        setCommandes(commandesResponse.data.commandes); // Update to set commandes directly
        setProduits(produitsResponse.data.produit);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{  position:'absolute',
        top:'0px',
        left:'220px',
        width:'90%' }}>
        <Box
          component="main"
          sx={{ display: "flex", flexGrow: 1, p: 3, mt: 4 }}
        >
          <Box sx={{ flex: 1 }}>
            <Toolbar />
            <h2 style={{ color: "grey" }}>
              Détails de la préparation des commandes
            </h2>
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
              className="responsive"
            >
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Reference</th>
                  <th style={tableHeaderStyle}>CodePreparation</th>
                  {produits.map((produit, index) => (
                    <th key={index} style={tableHeaderStyle}>
                      {produit.designation} {produit.calibre.calibre}
                    </th>
                  ))}
                  <th style={tableHeaderStyle}>Prix unitaire</th>
                  <th style={tableHeaderStyle}>Lot</th>
                </tr>
              </thead>
              <tbody>
                {/* {commandes.map((commande) =>
                  commande.preparation.lignes_preparation.map((ligne) => (
                    <tr key={ligne.id}>
                      <td  style={{ border: "1px solid #dddddd", padding: "8px" }}>{commande.reference}</td>
                      {produits.map((produit, index) => {
                        const quantite = ligne.produit_id === produit.id ? ligne.quantite : 0;
                        return (
                          <td
                            key={index}
                            style={{
                              border: "1px solid #dddddd",
                              padding: "8px",
                            }}
                          >
                            {quantite}
                          </td>
                        );
                      })}
                      <td  style={{ border: "1px solid #dddddd", padding: "8px" }}>{ligne.prix_unitaire}</td>
                      <td  style={{ border: "1px solid #dddddd", padding: "8px" }}>{ligne.lot}</td>
                    </tr>
                  ))
                )} */}
                {commandes.map((commande) =>
                  commande.preparations.map((preparation) =>
                    preparation.lignes_preparation.map((ligne) => (
                      <tr key={ligne.id}>
                        <td
                          style={{
                            border: "1px solid #dddddd",
                            padding: "8px",
                          }}
                        >
                          {commande.reference}
                        </td>
                        <td
                          style={{
                            border: "1px solid #dddddd",
                            padding: "8px",
                          }}
                        >
                          {preparation.CodePreparation}
                        </td>
                        {produits.map((produit, index) => {
                          const quantite =
                            ligne.produit_id === produit.id
                              ? ligne.quantite
                              : 0;
                          return (
                            <td
                              key={index}
                              style={{
                                border: "1px solid #dddddd",
                                padding: "8px",
                              }}
                            >
                              {quantite}
                            </td>
                          );
                        })}
                        <td
                          style={{
                            border: "1px solid #dddddd",
                            padding: "8px",
                          }}
                        >
                          {ligne.prix_unitaire}
                        </td>
                        <td
                          style={{
                            border: "1px solid #dddddd",
                            padding: "8px",
                          }}
                        >
                          {ligne.lot}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default DetailsPreparation;
