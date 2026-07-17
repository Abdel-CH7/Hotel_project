import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faBroom,
  faCalendarCheck,
  faComments,
  faDoorOpen,
  faPersonWalkingArrowRight,
  faRotate,
  faScrewdriverWrench,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useOpen } from "../Acceuil/OpenProvider";
import AppStats from "../components/AppStats";
import apiClient from "../utils/apiClient";
import "../style.css";

const EMPTY_SUMMARY = {
  total_clients: 0,
  total_chambres: 0,
  reservations_confirmees: 0,
  arrivees_aujourdhui: 0,
  departs_aujourdhui: 0,
  chambres_non_nettoyees: 0,
  reclamations_ouvertes: 0,
  equipements_en_maintenance: 0,
};

const Dashboard = () => {
  const { dynamicStyles } = useOpen();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await apiClient.get("/dashboard/summary");
      setSummary({ ...EMPTY_SUMMARY, ...(response.data?.data || {}) });
    } catch (requestError) {
      console.error("Impossible de charger le tableau de bord:", requestError);
      setError("Impossible de charger les statistiques du tableau de bord.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const stats = useMemo(
    () => [
      {
        key: "total-clients",
        title: "Total clients",
        value: summary.total_clients,
        icon: faUsers,
        variant: "primary",
      },
      {
        key: "total-chambres",
        title: "Total chambres",
        value: summary.total_chambres,
        icon: faBed,
        variant: "info",
      },
      {
        key: "reservations-confirmees",
        title: "Réservations confirmées",
        value: summary.reservations_confirmees,
        icon: faCalendarCheck,
        variant: "success",
      },
      {
        key: "arrivees-aujourdhui",
        title: "Arrivées aujourd’hui",
        value: summary.arrivees_aujourdhui,
        icon: faDoorOpen,
        variant: "primary",
      },
      {
        key: "departs-aujourdhui",
        title: "Départs aujourd’hui",
        value: summary.departs_aujourdhui,
        icon: faPersonWalkingArrowRight,
        variant: "info",
      },
      {
        key: "chambres-non-nettoyees",
        title: "Chambres non nettoyées",
        value: summary.chambres_non_nettoyees,
        icon: faBroom,
        variant: "warning",
      },
      {
        key: "reclamations-ouvertes",
        title: "Réclamations ouvertes",
        value: summary.reclamations_ouvertes,
        icon: faComments,
        variant: "danger",
      },
      {
        key: "equipements-maintenance",
        title: "Équipements en maintenance",
        value: summary.equipements_en_maintenance,
        icon: faScrewdriverWrench,
        variant: "warning",
      },
    ],
    [summary]
  );

  return (
    <Box
      sx={{
        ...dynamicStyles,
        width: "auto",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Box
        component="main"
        className="app-page dashboard-page"
        sx={{
          flexGrow: 1,
          p: 3,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        <header className="dashboard-page-heading">
          <div>
            <h1>Tableau de bord</h1>
            <p>Vue d’ensemble de l’activité de l’hôtel</p>
          </div>
          <button
            type="button"
            className="app-secondary-button dashboard-refresh-button"
            onClick={() => fetchSummary({ refresh: true })}
            disabled={loading || refreshing}
            title="Actualiser les statistiques"
            aria-label="Actualiser les statistiques"
          >
            <FontAwesomeIcon icon={faRotate} spin={refreshing} />
            <span>{refreshing ? "Actualisation…" : "Actualiser"}</span>
          </button>
        </header>

        {error ? (
          <div className="dashboard-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="app-secondary-button"
              onClick={() => fetchSummary()}
              disabled={loading}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <AppStats items={stats} loading={loading} />
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
