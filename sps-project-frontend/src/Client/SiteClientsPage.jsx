import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Toolbar } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Navigation from "../Acceuil/Navigation";
import Swal from "sweetalert2";
import PeopleIcon from "@mui/icons-material/People";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
const SiteClientsPage = () => {
  const [siteClients, setSiteClients] = useState([]);
  const { clientId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchSiteClients = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/clients/${clientId}/siteclients`
        );
        setSiteClients(response.data.siteClients);

        // Vérifier si aucun site client n'a été récupéré
        if (response.data.siteClients.length === 0) {
          // Afficher une boîte de dialogue SweetAlert
          Swal.fire({
            icon: "info",
            title: "Aucun site client trouvé",
            text: "Le client sélectionné n'a pas de site client associé.",
          });
          navigate("/clients_logo");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des site clients:", error);
      }
    };

    fetchSiteClients();
  }, [clientId]);

  return (
    <ThemeProvider theme={createTheme()}>
     <Box sx={{
        position:'absolute',
        top:'0px',
        left:'220px',
        width:'90%'
      }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
          <Toolbar />
          {/* <Typography variant="h5" gutterBottom component="div">
            
          </Typography> */}
          <Typography
            variant="h5"
            gutterBottom
            component="div"
            sx={{
              color: "grey",
              display: "flex",
              alignItems: "center",
              marginBottom: "50px",
            }}
          >
            <PeopleIcon sx={{ fontSize: "24px", marginRight: "8px" }} />
            Liste des site clients du client sélectionné
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <div className="d-flex flex-row justify-content-start flex-wrap">
              {siteClients.map((siteClient) => (
                <Card
                  key={siteClient.id}
                  sx={{
                    maxWidth: 300,
                    marginBottom: "20px",
                    marginRight: "20px",
                    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={siteClient.logoSC}
                    alt={siteClient.raison_sociale}
                    sx={{ objectFit: "cover", height: "250px" }}
                  />
                  <CardContent>
                    <Typography
                      gutterBottom
                      variant="h6"
                      component="div"
                      style={{ textAlign: "center", fontSize: "24px" }}
                    >
                      <span style={{ fontWeight: "bold" }}>
                        {siteClient.raison_sociale}
                      </span>
                    </Typography>

                    <Typography variant="body1">
                      <span style={{ fontWeight: "bold" }}>Adresse :</span>{" "}
                      {siteClient.adresse}
                    </Typography>
                    <Typography variant="body1">
                      <span style={{ fontWeight: "bold" }}>Téléphone :</span>{" "}
                      {siteClient.tele}
                    </Typography>
                    <Typography variant="body1">
                      <span style={{ fontWeight: "bold" }}>Ville :</span>{" "}
                      {siteClient.ville}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Box>

          <Link to="/clients_logo">
            <KeyboardReturnIcon />
            return aux clients
          </Link>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default SiteClientsPage;
