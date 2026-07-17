import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getStoredAuthToken } from "../utils/apiClient";

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user || !isAuthenticated || !getStoredAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
