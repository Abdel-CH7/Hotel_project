import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "./utils/authService";
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearStoredAuthentication,
  getStoredAuthToken,
  migrateLegacyAuthentication,
  storeAuthentication,
} from "./utils/apiClient";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  useEffect(() => {
    let active = true;
    const token = migrateLegacyAuthentication();

    if (!token) {
      setLoading(false);
      return () => { active = false; };
    }

    authService.getUser()
      .then((userData) => {
        if (!active) return;
        setUser(userData);
        setIsAuthenticated(true);
      })
      .catch(() => {
        if (!active) return;
        clearStoredAuthentication();
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    storeAuthentication(response.token);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const refreshUser = async () => {
    const userData = await authService.getUser();
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const logout = async () => {
    try {
      if (getStoredAuthToken()) await authService.logout();
    } catch (error) {
      if (error.response?.status !== 401) console.warn("La déconnexion distante a échoué.", error);
    } finally {
      clearStoredAuthentication();
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
