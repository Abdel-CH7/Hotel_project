import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import { Toolbar } from "@mui/material";
import { styled } from '@mui/material/styles';
import DashboardChart from "./DashboardChart"; // Import du graphique

// Styles personnalisés
const DashboardContainer = styled(Box)({
  display: 'flex',
  backgroundColor: '#f8f9fa',
  minHeight: '100vh'
});

const ContentContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginLeft: '300px', // Ajustez selon la largeur de votre menu
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const StatCard = styled(Card)(({ theme }) => ({
  height: '180px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  borderRadius: '12px',
  boxShadow: '0 6px 10px rgba(0,0,0,0.08)',
  transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
  '&:hover': {
    boxShadow: '0 10px 20px rgba(0,0,0,0.12)'
  },
  position: 'relative',
  overflow: 'hidden'
}));

const CardHeader = styled(Typography)({
  fontWeight: 600,
  marginBottom: '16px',
  color: '#424242'
});

const CardValue = styled(Typography)({
  fontWeight: 700,
  fontSize: '2.5rem',
  marginBottom: '8px'
});

const CardIcon = styled(Box)({
  position: 'absolute',
  right: '20px',
  bottom: '20px',
  opacity: 0.2,
  transform: 'scale(2)'
});

const Dashboard = () => {
  const [clientsParticuliers, setClientsParticuliers] = useState(0);
  const [clientsSocietes, setClientsSocietes] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const particuliersResponse = await axios.get("http://localhost:8000/api/DachbordeDataclients_particulier");
      setClientsParticuliers(particuliersResponse.data.clients);

      const societesResponse = await axios.get("http://localhost:8000/api/DachbordeDataclients");
      setClientsSocietes(societesResponse.data.clients);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching counts:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        marginLeft: '240px'
      }}>
        <Typography variant="h6">Chargement en cours...</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={createTheme()}>
      <DashboardContainer>
        <ContentContainer>
          <Toolbar /> {/* Compensation pour la AppBar */}
          
          <Grid container spacing={3}>
            {/* Carte Clients Particuliers */}
            <Grid item xs={12} sm={6} md={4}>
              <StatCard sx={{ 
                backgroundColor: '#ff52521a', 
                borderLeft: '4px solid #ff5252',
              }}>
                <CardContent>
                  <CardHeader variant="h6">Clients Particuliers</CardHeader>
                  <CardValue>{clientsParticuliers}</CardValue>
                  <CardIcon>
                    <PersonIcon style={{ fontSize: 60, color: '#ff5252' }} />
                  </CardIcon>
                </CardContent>
              </StatCard>
            </Grid>

            {/* Carte Clients Sociétés */}
            <Grid item xs={12} sm={6} md={4}>
              <StatCard sx={{ 
                backgroundColor: '#00afa91c', 
                borderLeft: '4px solid rgba(0, 175, 169, 0.71)'
              }}>
                <CardContent>
                  <CardHeader variant="h6">Clients Sociétés</CardHeader>
                  <CardValue>{clientsSocietes}</CardValue>
                  <CardIcon>
                    <BusinessIcon style={{ fontSize: 60, color: '#00afaa' }} />
                  </CardIcon>
                </CardContent>
              </StatCard>
            </Grid>
            <Grid container spacing={6} style={{marginTop: '20px'}}>
                    <Grid item xs={15}>
                        <DashboardChart />
                    </Grid>
                </Grid>
            {/* Vous pouvez ajouter d'autres cartes ici avec la même structure */}
          </Grid>
          
        </ContentContainer>
      </DashboardContainer>
    </ThemeProvider>
    
    
  );
  
}

export default Dashboard;