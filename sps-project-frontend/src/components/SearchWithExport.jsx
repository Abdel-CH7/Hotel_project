import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faFilePdf, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import Search from "../Acceuil/Search";

const SearchWithExport = ({ onSearch, exportToExcel, exportToPDF, printTable, Title }) => {
  return (
    <div className="app-page-header">
      <h1 className="app-page-title">{Title}</h1>

      <div className="app-toolbar">
        <div className="app-search-box">
          <Search onSearch={onSearch} type="search" />
        </div>

        <div className="app-export-actions">
          <FontAwesomeIcon
            icon={faPrint}
            onClick={printTable}
            className="app-action-icon is-muted"
          />
          <FontAwesomeIcon
            icon={faFilePdf}
            onClick={exportToPDF}
            className="app-action-icon is-danger"
          />
          <FontAwesomeIcon
            icon={faFileExcel}
            onClick={exportToExcel}
            className="app-action-icon is-success"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchWithExport;
