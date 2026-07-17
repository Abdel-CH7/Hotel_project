import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../AuthContext";
import AnimatedBackground from "../components/AnimatedBackground";

const CREDENTIALS_ERROR = "Adresse e-mail ou mot de passe incorrect.";
const NETWORK_ERROR = "Serveur inaccessible. Vérifiez que l’API Laravel est démarrée.";
const GENERIC_ERROR = "Connexion impossible. Veuillez réessayer.";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (user && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);
    try {
      await login(formData.email.trim(), formData.password);
      const requestedRoute = location.state?.from;
      const destination = requestedRoute
        ? `${requestedRoute.pathname}${requestedRoute.search || ""}${requestedRoute.hash || ""}`
        : "/dashboard";
      navigate(destination, { replace: true });
    } catch (requestError) {
      if (!requestError.response) setError(NETWORK_ERROR);
      else if ([401, 422].includes(requestError.response.status)) setError(CREDENTIALS_ERROR);
      else setError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="login-page" sx={{ minHeight: "100dvh", overflowX: "hidden" }}>
      <AnimatedBackground />
      <Container
        component="main"
        maxWidth="xs"
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 420,
            boxSizing: "border-box",
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Box
            component="img"
            src="/sps-logo.svg"
            alt="SPS Technologies"
            sx={{ display: "block", width: "min(180px, 70%)", mx: "auto", mb: 3 }}
          />

          <Typography component="h1" variant="h5" align="center" sx={{ color: "#0b4d54", fontWeight: 700 }}>
            Connexion
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Accédez à votre espace de gestion hôtelière
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              required
              fullWidth
              autoFocus
              type="email"
              id="email"
              name="email"
              label="Adresse e-mail"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
              sx={{ mb: 2 }}
            />

            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={submitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      disabled={submitting}
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                mt: 3,
                minHeight: 48,
                backgroundColor: "#0b4d54",
                textTransform: "none",
                "&:hover": { backgroundColor: "#0b4d54", opacity: 0.92 },
                "&:focus-visible": { outline: "3px solid rgba(11, 77, 84, 0.35)", outlineOffset: 2 },
              }}
            >
              {submitting ? (
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" /> Connexion…
                </Box>
              ) : "Se connecter"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
