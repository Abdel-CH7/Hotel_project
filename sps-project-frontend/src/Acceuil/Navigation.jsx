import React, { useState, useEffect } from "react";
import axios from "axios";
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
   FaFileInvoiceDollar,FaPercent, FaChartLine, FaBed } from "react-icons/fa6";
import { 
  MdOutlineRestaurant,
  MdOutlineMeetingRoom,
  MdOutlineDiscount,
  MdCleaningServices,
  MdOutlineBuild
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
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useOpen } from "./OpenProvider";





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
    position: "relative",
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
  const [user, setUser] = useState(null);
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
  const [equipement, setEquipement] = useState(false);
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
    if(opt==='equipement'){
      setEquipement(!equipement);
    }
  };
  const handleCommandsClick = () => {
    
    setIsCommandsOpen(!isCommandsOpen);
  };
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const token = localStorage.getItem("API_TOKEN");
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const { logout } = useAuth();
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
  useEffect(() => {
    if (!isAuthenticated) {
      // navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  

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
 
  const handleLogoutClick = async () => {
    try {
      // Logout logic
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred during logout.",
      });
    }
  };

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
      <Box sx={{
        zIndex: 1400,
        marginLeft:'-9px',
        marginTop:'-20px',
  position: 'fixed',
  maxHeight: '1010px',
  overflowY: 'auto',
  scrollbarWidth: 'thin', /* For Firefox */
  scrollbarColor: '#2c767c #e0e0e0', /* Scrollbar colors for Firefox */
  '&::-webkit-scrollbar': {
    width: '8px', /* Adjust width as needed */
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#2c767c',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#2c767c',
  },
}}
>
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
        <Drawer variant="permanent"
          position="fixed"  open={open}>

<Box
          sx={{
            
            alignItems: "center",
            justifyContent: "center",
            marginBottom:'-60px'
          }}
        >
          <img src={'../../images/SPS2.png'} loading="lazy" alt="Logo" style={{ width: "52%", height: "auto", paddingTop:"10px", marginLeft:"60px" }} />
        </Box>
          <Toolbar
            sx={{
              
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={handleToggle}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
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
                      <ListItemText primary="Dashboard" />
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
                         <FaUsers  className="iconSedBar"/>
              </ListItemIcon>
                      <ListItemText primary="Clients Particulier" />
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
                      <ListItemText primary="Clients Societe" />
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
                        to="/tarifs_repas"
                        className="sidBarSucomposantColore"
                    >
                         <ListItemIcon>
                         <MdOutlineRestaurant className="iconSedBar"/>
              </ListItemIcon>
                      <ListItemText primary="Tarifs de Repas" />
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
                      <ListItemText primary="Tarifs de Chambre" />
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
                      <ListItemText primary="Tarifs de Reduction" />
                    </ListItem>
                    <ListItem
                        button
                        component={Link}
                        to="/tarifs_actuel"
                        className="sidBarSucomposantColore"
                    >
                      <ListItemIcon>
                      <FaChartLine className="iconSedBar"/>
                      </ListItemIcon>   
                      <ListItemText primary="Tarifs Actuel" />
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
                        <ListItemText primary="Gestion Chambres" />
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
                        <ListItemText primary="État des Chambres" />
                      </ListItem>
                    </Collapse>
          </List>
          <List>
            <ListItem
              button
              onClick={()=>toggleSubmenu('equipement')}
              className="sidBarcomposantColore"
            >
              <ListItemIcon>
                <MdOutlineBuild className="iconSedBar"/>
              </ListItemIcon>
              <ListItemText primary="Équipements" />
              {equipement ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </ListItem>

            <Collapse in={equipement} timeout="auto" unmountOnExit>
              <ListItem
                button
                component={Link}
                to="/equipements"
                className="sidBarSucomposantColore"
              >
                <ListItemIcon>
                  <MdOutlineBuild className="iconSedBar"/>
                </ListItemIcon>
                <ListItemText primary="Gestion des Équipements" />
              </ListItem>
            </Collapse>
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
          <List>
            <ListItem
              button
              component={Link}
              to="/reservation"
              className="sidBarcomposantColore"
            >
              <ListItemIcon>
                <FaBed className="iconSedBar"/>
              </ListItemIcon>
              <ListItemText primary="Réservations" />
            </ListItem>
          </List>
          <List>
            <ListItem
              button
              onClick={() => {
                handleLogoutClick();
                handleLogout();
              }}
              style={{ color: "red", background: "white" ,marginTop:"20px"}}
            >
              <ListItemIcon>
                <ExitToAppIcon style={{ color: "red" }} />
              </ListItemIcon>
              <ListItemText primary="Se déconnecter" />
            </ListItem>
          </List>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

export default Navigation;

