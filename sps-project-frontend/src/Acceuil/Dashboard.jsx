import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { useOpen } from "../Acceuil/OpenProvider";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Toolbar,
  CircularProgress,
  IconButton,
  Divider,
  Paper,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  PeopleAlt as PeopleAltIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  DeliveryDining as DeliveryDiningIcon,
  ShoppingBasket as ShoppingBasketIcon,
  DirectionsCar as DirectionsCarIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import Alert from 'react-bootstrap/Alert';

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: "transform 0.3s, box-shadow 0.3s",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
          },
        },
      },
    },
  },
});

const StatCard = ({ title, value, icon: Icon, color, permission, permissions }) => {
  if (!permissions.includes(permission)) return null;

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ 
        bgcolor: color,
        color: 'white',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Icon sx={{ fontSize: 40, opacity: 0.8 }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </CardContent>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '150%',
            height: '100%',
            background: 'linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 76%)',
            transform: 'translateX(0)',
            animation: 'shine 3s infinite',
            '@keyframes shine': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' },
            },
          }}
        />
      </Card>
    </Grid>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    clients: 0,
    produits: 0,
    fournisseurs: 0,
    commandes: 0,
    livreurs: 0,
    vehicules: 0,
    objectifs: 0,
  });
  const [permissions, setPermissions] = useState([]);
  const [latestPreparation, setLatestPreparation] = useState(null);
  const [latestCommande, setLatestCommande] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { open } = useOpen();
  const { dynamicStyles } = useOpen();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, dashboardData, latestData] = await Promise.all([
        axios.get("http://localhost:8000/api/user", { withCredentials: true }),
        axios.get("http://localhost:8000/api/DachbordeData"),
        axios.get("http://localhost:8000/api/FicheDactulate")
      ]);

      setUser(userData.data);
      setPermissions(userData.data[0].roles[0].permissions.map(p => p.name));
      setStats(dashboardData.data);
      setLatestPreparation(latestData.data.latest_preparation);
      setLatestCommande(latestData.data.latest_commande);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Une erreur est survenue lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ ...dynamicStyles }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Tableau de Bord
            </Typography>
            <IconButton onClick={fetchData} color="primary" sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)' }}>
              <RefreshIcon />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            {/* Statistics Cards */}
            <Grid item xs={12} md={9}>
              <Grid container spacing={3}>
                <StatCard
                  title="Clients"
                  value={stats.clients}
                  icon={PeopleAltIcon}
                  color="#2196f3"
                  permission="view_all_clients"
                  permissions={permissions}
                />
                <StatCard
                  title="Produits"
                  value={stats.produits}
                  icon={ShoppingCartIcon}
                  color="#4caf50"
                  permission="view_all_products"
                  permissions={permissions}
                />
                <StatCard
                  title="Fournisseurs"
                  value={stats.fournisseurs}
                  icon={LocalShippingIcon}
                  color="#ff9800"
                  permission="view_all_fournisseurs"
                  permissions={permissions}
                />
                <StatCard
                  title="Livreurs"
                  value={stats.livreurs}
                  icon={DeliveryDiningIcon}
                  color="#e91e63"
                  permission="view_all_livreurs"
                  permissions={permissions}
                />
                <StatCard
                  title="Commandes"
                  value={stats.commandes}
                  icon={ShoppingBasketIcon}
                  color="#9c27b0"
                  permission="view_all_commandes"
                  permissions={permissions}
                />
                <StatCard
                  title="Véhicules"
                  value={stats.vehicules}
                  icon={DirectionsCarIcon}
                  color="#607d8b"
                  permission="view_all_vehicules"
                  permissions={permissions}
                />
                <StatCard
                  title="Objectifs"
                  value={stats.objectifs}
                  icon={BarChartIcon}
                  color="#795548"
                  permission="view_all_objectifs"
                  permissions={permissions}
                />
              </Grid>
            </Grid>

            {/* Notifications Sidebar */}
            <Grid item xs={12} md={3}>
              <Paper 
                elevation={3} 
                sx={{ 
                  borderRadius: 4,
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ p: 2, bgcolor: '#1976d2', color: 'white' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Notifications
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ p: 2, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                  {error && (
                    <Alert variant="danger" className="mb-3">
                      {error}
                    </Alert>
                  )}

                  {latestCommande && (
                    <Alert variant="success" className="mb-3">
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Nouvelle Commande
                      </Typography>
                      <Typography variant="body2">
                        Référence: {latestCommande.reference}
                      </Typography>
                    </Alert>
                  )}

                  {latestPreparation && (
                    <Alert variant="info" className="mb-3">
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Mise à jour Préparation
                      </Typography>
                      <Typography variant="body2">
                        Commande: {latestPreparation.commande.reference}
                        <br />
                        Statut: {latestPreparation.status_preparation}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;
