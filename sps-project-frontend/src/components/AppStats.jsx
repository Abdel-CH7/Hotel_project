import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ALLOWED_VARIANTS = new Set([
  "primary",
  "success",
  "warning",
  "danger",
  "info",
  "neutral",
]);

const AppStats = ({ items = [], loading = false }) => (
  <section className="app-stats-grid" aria-busy={loading} aria-label="Statistiques">
    {items.map((item) => {
      const variant = ALLOWED_VARIANTS.has(item.variant) ? item.variant : "neutral";

      return (
        <article key={item.key} className={`app-stat-card is-${variant}`}>
          <div className="app-stat-icon" aria-hidden="true">
            <FontAwesomeIcon icon={item.icon} />
          </div>
          <div className="app-stat-content">
            <div className="app-stat-title">{item.title}</div>
            <div className="app-stat-value">
              {loading ? <span aria-label="Chargement">—</span> : item.value ?? 0}
            </div>
          </div>
        </article>
      );
    })}
  </section>
);

export default AppStats;
