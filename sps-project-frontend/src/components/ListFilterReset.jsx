const ListFilterReset = ({ active, onReset }) => (
  <button type="button" className="app-filter-reset" onClick={onReset} disabled={!active}>
    Réinitialiser les filtres
  </button>
);

export default ListFilterReset;
