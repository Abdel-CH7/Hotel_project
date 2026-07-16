import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faFilePdf, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import Search from "../Acceuil/Search";

const SearchWithExport = ({
  Title,
  title,
  onSearch,
  onSearchChange,
  searchValue,
  exportToExcel,
  exportToPDF,
  printTable,
  onExportExcel,
  onExportPdf,
  onPrint,
  resultCount,
  loading = false,
  exportsDisabled = false,
}) => {
  const disabled = loading || exportsDisabled;
  const actions = [
    { icon: faPrint, label: "Imprimer", className: "is-muted", onClick: onPrint || printTable },
    { icon: faFilePdf, label: "Exporter en PDF", className: "is-danger", onClick: onExportPdf || exportToPDF },
    { icon: faFileExcel, label: "Exporter vers Excel", className: "is-success", onClick: onExportExcel || exportToExcel },
  ];

  return (
    <div className="app-page-header">
      <h1 className="app-page-title">{title || Title}</h1>

      <div className="app-toolbar">
        <div className="app-search-box">
          <Search
            value={searchValue}
            onChange={onSearchChange}
            onSearch={onSearchChange ? undefined : onSearch}
            type="search"
          />
        </div>

        {Number.isFinite(resultCount) && (
          <span className="app-result-count" aria-live="polite">
            {loading ? "Chargement..." : `${resultCount} résultat${resultCount > 1 ? "s" : ""}`}
          </span>
        )}

        <div className="app-export-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="app-action-button"
              onClick={action.onClick}
              disabled={disabled || !action.onClick}
              title={action.label}
              aria-label={action.label}
            >
              <FontAwesomeIcon icon={action.icon} className={`app-action-icon ${action.className}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchWithExport;
