import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

const ContextFilterChip = ({ label, onClear, clearLabel }) => (
  <div className="app-context-filter" role="status">
    <span className="app-context-filter-prefix">Contexte actif :</span>
    <strong>{label}</strong>
    <button
      type="button"
      className="app-context-filter-clear"
      onClick={onClear}
      aria-label={clearLabel || `Effacer le contexte ${label}`}
      title={clearLabel || "Effacer ce contexte"}
    >
      <FontAwesomeIcon icon={faXmark} />
    </button>
  </div>
);

export default ContextFilterChip;
