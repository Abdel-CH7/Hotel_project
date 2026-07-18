const ListState = ({ loading, error, allRowsCount, filteredRowsCount, emptyDataMessage, filteredEmptyMessage, onRetry, onResetFilters }) => {
  if (loading) return <div className="app-card app-list-state">Chargement des données…</div>;
  if (error) return <div className="app-list-state is-error" role="alert"><span>{error}</span>{onRetry && <button type="button" className="app-secondary-button" onClick={onRetry}>Réessayer</button>}</div>;
  if (allRowsCount === 0) return <div className="app-card app-list-state">{filteredEmptyMessage || emptyDataMessage}</div>;
  if (filteredRowsCount === 0) return <div className="app-card app-list-state"><span>{filteredEmptyMessage || "Aucun résultat ne correspond aux critères actuels."}</span>{onResetFilters && <button type="button" className="app-filter-reset" onClick={onResetFilters}>Réinitialiser les filtres</button>}</div>;
  return null;
};

export default ListState;
