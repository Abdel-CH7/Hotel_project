import React, { useState, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import MuiDrawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import MenuIcon from "@mui/icons-material/Menu";
import { BiSolidPurchaseTag,BiSolidDashboard,BiSolidUser,BiSolidBuilding } from "react-icons/bi";
import {
   FaFileCircleQuestion,FaUsers,FaMoneyBillWave,
   FaCalendarCheck,FaFileInvoiceDollar,FaPercent, FaChartLine, FaBed } from "react-icons/fa6";
import { 
  MdOutlineRestaurant,
  MdOutlineMeetingRoom,
  MdOutlineDiscount,
  MdCleaningServices,
  MdOutlineBuild,
  MdAdminPanelSettings,
  MdManageAccounts
} from "react-icons/md";
import {
  ListItemButton,
  Collapse
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { styled } from "@mui/material/styles";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { Link } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useOpen } from "./OpenProvider";
import UserAvatar from "../components/UserAvatar";





const drawerWidth = 290;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: 1600,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: "#0b4d54",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    height: "100dvh",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    zIndex: 1400,
    backgroundColor:'#2c767c',
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const defaultTheme = createTheme();

const Navigation = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [isCommandsOpen, setIsCommandsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [submenuOpenvente, setSubmenuOpenvente] = useState(false);
  const [submenuOpenachat, setSubmenuOpenachat] = useState(false);
  const [stockMag, setStockMag] = useState(false);
  const [stockProd, setStockProd] = useState(false);
  const [stock, setStock] = useState(false);
  const [client, setClient] = useState(false);
  const [tarif, setTarif] = useState(false);
  const [chambre, setChambre] = useState(false);
  const [administration, setAdministration] = useState(false);
  const [production, setProduction] = useState(false);
  const [logistic, setLogistic] = useState(false);


  const { open, toggleOpen } = useOpen(); // Accéder à l'état "open" et la fonction "toggleOpen"

  const handleToggle = () => {
    toggleOpen(); // Changer l'état "open" lorsque l'utilisateur interagit avec la navigation
  };

  const toggleSubmenu = (opt) => {
    
    if(opt==='finance'){
      setSubmenuOpen(!submenuOpen);
    }
    if(opt==='vente'){
      setSubmenuOpenvente(!submenuOpenvente);

    }
    if(opt==='achat'){
      setSubmenuOpenachat(!submenuOpenachat);
    }
    if(opt==='stockmag'){
      setStockMag(!stockMag);
    }
    if(opt==='stockprod'){
      setStockProd(!stockProd);
    }
    if(opt==='production'){
      setProduction(!production);
    }
    if(opt==='Logistic'){
      setLogistic(!logistic);
    }
    if(opt==='stock'){
      setStock(!stock);
    }
    if(opt==='client'){
      setClient(!client);
    }
    if(opt==='chambre'){
      setChambre(!chambre);
    }
    if(opt==='tarif'){
      setTarif(!tarif);
    }
    if(opt==='administration'){
      setAdministration(!administration);
    }
  };
  const handleCommandsClick = () => {
    
    setIsCommandsOpen(!isCommandsOpen);
  };
  const { logout, user: authenticatedUser } = useAuth();
  const [openDrawer, setOpenDrawer] = useState(false);
  const handleOptionChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedOption(selectedValue);

    if (selectedValue === "charging") {
      navigate("/chargingCommand");
    } else if (selectedValue === "preparing") {
      navigate("/preparingCommand");
    } else if (selectedValue === "list") {
      navigate("/commandes"); //
    } else if (selectedValue === "details") {
      navigate("/details");
    } else if (selectedValue === "detailpreparations") {
      navigate("/detailpreparations");
    }
     else if (selectedValue === "preparationlogo") {
      navigate("/preparationlogo");
    }
  };
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const response = await axios.get("http://localhost:8000/api/user", {
  //         withCredentials: true,
  //       });
  //       setUser(response.data);
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //     }
  //   };

  //   fetchUserData();
  // }, []);

  // useEffect(() => {
  //   const fetchUsersData = async () => {
  //     try {
  //       const response = await axios.get("http://localhost:8000/api/users", {
  //         withCredentials: true,
  //       });
  //       setUsers(response.data);
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //     }
  //   };

  //   fetchUsersData();
  // }, []);

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const response = await axios.get("http://localhost:8000/api/user", {
  //         withCredentials: true,
  //       });
  //       if (response.data && response.data.length > 0) {
  //         setUser(response.data);
  //         const permissionsData = response.data[0].roles[0].permissions;
  
  //         // Récupérer les noms des permissions
  //         const permissionNames = permissionsData.map(
  //           (permission) => permission.name
  //         );
  
  //         // Mettre à jour l'état des permissions
  //         setPermissions(permissionNames);
  //       } else {
  //         console.error("Empty user data in response:", response.data);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //     }
  //   };
  
  //   fetchUserData();
  // }, []); // Dépendance vide pour que ce useEffect s'exécute une seule fois après le montage initial
  

  const MyListItemButton = styled(ListItemButton)(({ theme }) => ({
    minHeight: 48,
    justifyContent: "center",
    px: 2.5,
  }));
 
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // const toggleDrawer = () => {
  //   setOpen(!open);
  // };
  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ zIndex: 1400 }}>
        <CssBaseline />
        <AppBar position="fixed" open={open} className="beige-appbar">
          <Toolbar
            sx={{
              pr: "24px",
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={handleToggle}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            ></Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <ExitToAppIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" position="fixed" open={open}>
          <Box sx={{ flexShrink: 0 }}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: open ? "space-between" : "center",
              minHeight: "72px !important",
              px: [1],
            }}
          >
            {open && (
              <img
                src="../../images/SPS2.png"
                loading="lazy"
                alt="Logo SPS"
                style={{ width: "145px", maxWidth: "70%", height: "auto" }}
              />
            )}
            <IconButton onClick={handleToggle}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          </Box>
          <Box
            className="navigation-menu-scroll"
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              overscrollBehavior: "contain",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255, 255, 255, 0.5) transparent",
              "&::-webkit-scrollbar": { width: "7px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(255, 255, 255, 0.45)",
                borderRadius: "8px",
              },
              "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
            }}
          >
          <List>
          <ListItem
                        button
                        component={Link}
                        to="/dashboard"
                        className="sidBarcomposantColore"
                    >
                      <ListItemIcon>
                      <BiSolidDashboard className="iconSedBar"/>
                      </ListItemIcon>   
                      <ListItemText primary="Tableau de bord" />
                    </ListItem>
          </List>
          <List>
            <ListItem
              button
              component={Link}
              to="/reservation"
              className="sidBarcomposantColore"
            >
              <ListItemIcon>
                <FaCalendarCheck className="iconSedBar"/>
              </ListItemIcon>
              <ListItemText primary="Réservations" />
            </ListItem>
          </List>
          <List>
            <ListItem
              button
              onClick={()=>toggleSubmenu('client')}
              className="sidBarcomposantColore"
            >
              <ListItemIcon>
                <BiSolidUser className="iconSedBar"/>
              </ListItemIcon>
              <ListItemText primary="Clients" />
              {client ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </ListItem>

            <Collapse in={client} timeout="auto" unmountOnExit>
              <ListItem
                button
                component={Link}
                to="/clients_particulier"
                className="sidBarSucomposantColore"
              >
                <ListItemIcon>
                  <FaUsers className="iconSedBar"/>
                </ListItemIcon>
                <ListItemText primary="Clients particuliers" />
              </ListItem>
              <ListItem
                button
                component={Link}
                to="/clients_societe"
                className="sidBarSucomposantColore"
              >
                <ListItemIcon>
                  <BiSolidBuilding className="iconSedBar"/>
                </ListItemIcon>
                <ListItemText primary="Clients sociétés" />
              </ListItem>
            </Collapse>
          </List>
          <List>
            <ListItem
              button
              onClick={()=>toggleSubmenu('chambre')}
              className="sidBarcomposantColore"
            >
              <ListItemIcon>
                <MdOutlineMeetingRoom className="iconSedBar"/>
              </ListItemIcon>
              <ListItemText primary="Chambres" />
              {chambre ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </ListItem>

            <Collapse in={chambre} timeout="auto" unmountOnExit>
              <ListItem
                button
                component={Link}
                to="/chambre"
                className="sidBarSucomposantColore"
              >
                <ListItemIcon>
                  <FaBed className="iconSedBar"/>
                </ListItemIcon>
                <ListItemText primary="Gestion des chambres" />
              </ListItem>
              <ListItem
                button
                component={Link}
                to="/etat-chambre"
                className="sidBarSucomposantColore"
              >
                <ListItemIcon>
                  <MdCleaningServices className="iconSedBar"/>
                </ListItemIcon>
                <ListItemText primary="État des chambres" />
              </ListItem>
            </Collapse>
          </List>
          <List>
                  <ListItem
                  button
                  onClick={()=>toggleSubmenu('tarif')}
                  className="sidBarcomposantColore"
              >
                <ListItemIcon>
                <BiSolidPurchaseTag className="iconSedBar"/>

                </ListItemIcon>
                <ListItemText primary="Tarifs" />
                {tarif ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </ListItem>

              <Collapse in={tarif} timeout="auto" unmountOnExit>
                    <ListItem
                        button
                        component={Link}
                        to="/tarifs_actuel"
                        className="sidBarSucomposantColore"
                    >
                         <ListItemIcon>
                         <FaChartLine className="iconSedBar"/>
              </ListItemIcon>
                      <ListItemText primary="Périodes tarifaires" />
                    </ListItem>
                    <ListItem
                        button
                        component={Link}
                        to="/tarifs_chambre"
                        className="sidBarSucomposantColore"
                    >
                      <ListItemIcon>
                      <MdOutlineMeetingRoom className="iconSedBar"/>
                      </ListItemIcon>
                      <ListItemText primary="Tarifs des chambres" />
                    </ListItem>
                    <ListItem
                        button
                        component={Link}
                        to="/tarifs_repas"
                        className="sidBarSucomposantColore"
                    >
                        <ListItemIcon>
                        <MdOutlineRestaurant className="iconSedBar"/>
              </ListItemIcon>
                      <ListItemText primary="Tarifs des repas" />
                    </ListItem>
                    <ListItem
                        button
                        component={Link}
                        to="/tarifs_reduction"
                        className="sidBarSucomposantColore"
                    >
                      <ListItemIcon>
                      <FaPercent className="iconSedBar"/>
                      </ListItemIcon>   
                      <ListItemText primary="Réductions" />
                    </ListItem>
                  </Collapse>
          </List>
          <List>
            <ListItem
              button
              component={Link}
              to="/equipements"
              className="sidBarcomposantColore"
            >
              <ListItemIcon>
                <MdOutlineBuild className="iconSedBar"/>
              </ListItemIcon>
              <ListItemText primary="Équipements" />
            </ListItem>
          </List>
          <List>
            <ListItem
              button
              component={Link}
              to="/reclamation"
              className="sidBarcomposantColore"
            >
              <ListItemIcon>
                <FaFileInvoiceDollar className="iconSedBar"/>
              </ListItemIcon>
              <ListItemText primary="Réclamations" />
            </ListItem>
          </List>
          {authenticatedUser?.role === "admin" && (
            <List>
              <ListItem button onClick={() => toggleSubmenu('administration')} className="sidBarcomposantColore">
                <ListItemIcon><MdAdminPanelSettings className="iconSedBar" /></ListItemIcon>
                <ListItemText primary="Administration" />
                {administration ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </ListItem>
              <Collapse in={administration} timeout="auto" unmountOnExit>
                <ListItem button component={Link} to="/users" className="sidBarSucomposantColore">
                  <ListItemIcon><MdManageAccounts className="iconSedBar" /></ListItemIcon>
                  <ListItemText primary="Gestion des utilisateurs" />
                </ListItem>
              </Collapse>
            </List>
          )}
          </Box>
          <Box
            sx={{
              flexShrink: 0,
              borderTop: "1px solid rgba(255, 255, 255, 0.22)",
              backgroundColor: "#2c767c",
            }}
          >
            <List disablePadding>
              <ListItem button component={Link} to="/profile" className="navigation-user-block">
                <ListItemIcon><UserAvatar user={authenticatedUser} size={38} /></ListItemIcon>
                <ListItemText
                  primary={authenticatedUser?.name || "Utilisateur"}
                  secondary={`Mon profil · ${authenticatedUser?.role_label || (authenticatedUser?.role === "admin" ? "Administrateur" : "Employé")}`}
                />
              </ListItem>
            </List>
            <List disablePadding>
            <ListItem
              button
              onClick={handleLogout}
              style={{ color: "red", background: "white" }}
            >
              <ListItemIcon>
                <ExitToAppIcon style={{ color: "red" }} />
              </ListItemIcon>
              <ListItemText primary="Se déconnecter" />
            </ListItem>
          </List>
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

export default Navigation;
