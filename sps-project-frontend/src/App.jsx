import './App.css';
import { AuthProvider } from './AuthContext';
import Navigation from './Acceuil/Navigation';
import { Suspense, lazy } from 'react';
import { OpenProvider } from './Acceuil/OpenProvider.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const Login = lazy(() => import('./Login/Login'));
// const Dashboard = lazy(() => import('./Acceuil/Dashboard'));
const Dashboard = lazy(() => import('./Client/Dashboard'));
const ClientList = lazy(() => import('./Client/ClientList'));
const ClientParticulierr = lazy(() => import('./Client/ClientParticulierr'));
const TarifsActuel = lazy(() => import('./Tarifs/TarifsActuel'));
const TarifChambre = lazy(() => import('./Tarifs/TarifChambre'));
const TarifRepas = lazy(() => import('./Tarifs/TarifRepas'));
const TarifReduction = lazy(() => import('./Tarifs/TarifReduction'));
const Chambre = lazy(() => import('./Chambre/Chambre'));
const EtatChambre = lazy(() => import('./Chambre/EtatChambre'));
const GestionEquipements = lazy(() => import('./Equipements/Equipements'));
const ReclamationPage = lazy(() => import('./reclamation/ReclamationPage'));

const Reservation = lazy(() => import('./Reservation/Reservation'));
const ProfilePage = lazy(() => import('./profile/ProfilePage'));
const UserManagement = lazy(() => import('./Users/UserManagement'));

// const AgentList = lazy(() => import('./Agents/AgentList'));

import { Routes, Route, useLocation } from 'react-router-dom';


const App = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== '/login';
  return (
    <AuthProvider>
      <OpenProvider>
      {showNavigation && <Navigation />}
      <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients_societe"
          element={
            <ProtectedRoute>
              <ClientList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients_particulier"
          element={
            <ProtectedRoute>
              <ClientParticulierr />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chambre"
          element={
            <ProtectedRoute>
              <Chambre />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etat-chambre"
          element={
            <ProtectedRoute>
              <EtatChambre />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tarifs_actuel"
          element={
            <ProtectedRoute>
              <TarifsActuel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tarifs_chambre"
          element={
            <ProtectedRoute>
              <TarifChambre />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tarifs_repas"
          element={
            <ProtectedRoute>
              <TarifRepas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tarifs_reduction"
          element={
            <ProtectedRoute>
              <TarifReduction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipements"
          element={
            <ProtectedRoute>
              <GestionEquipements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reclamation"
          element={
            <ProtectedRoute>
              <ReclamationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservation"
          element={
            <ProtectedRoute>
              <Reservation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
      </Suspense>
      </OpenProvider>
    </AuthProvider>
  );
};

export default App;
