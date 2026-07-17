import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import Button from '@mui/material/Button';
import "../style.css";

const ExpandRTable = ({
  columns,
  data,
  filteredData,
  searchTerm,
  highlightText,
  selectAll,
  selectedItems,
  handleSelectAllChange,
  handleCheckboxChange,
  handleEdit,
  handleDelete,
  handleDeleteSelected,
  rowsPerPage,
  page,
  handleChangePage,
  handleChangeRowsPerPage,
  expandedRows,
  toggleRowExpansion,
  renderExpandedRow,
  renderCustomActions,
  uiVariant = "default",
  externalPagination = false,
  paginationComponent = null,
  forceHorizontalScroll = false,
}) => {
  const hasActions = handleEdit || handleDelete || renderCustomActions;
  const displayData = filteredData || data || [];
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
const [containerWidth, setContainerWidth] = useState(0);
const isAppTable = uiVariant === "app";
const scrollContainerRef = useRef(null);

const checkboxColumnWidth = 50;
const actionColumnWidth = forceHorizontalScroll ? 92 : 80;

const getColumnWidth = (column) => {
  return Number(column.width || column.minWidth || 140);
};

const dataColumnsWidth = columns.reduce(
  (acc, col) => acc + getColumnWidth(col),
  0
);

const fixedColumnsWidth =
  checkboxColumnWidth + (hasActions ? actionColumnWidth : 0);

const totalMinWidth = fixedColumnsWidth + dataColumnsWidth;

/*
  Desktop: table must fit inside the card, no horizontal scrollbar.
  Mobile: scrollbar is allowed if the table is too wide.
*/
const shouldScrollHorizontally =
  isAppTable &&
  containerWidth > 0 &&
  (forceHorizontalScroll || isMobile) &&
  totalMinWidth > containerWidth;

const tableWidth =
  isAppTable && forceHorizontalScroll
    ? totalMinWidth
    : isAppTable && containerWidth > 0
    ? shouldScrollHorizontally
      ? totalMinWidth
      : containerWidth
    : totalMinWidth;

const availableDataWidth =
  isAppTable && containerWidth > 0 && !shouldScrollHorizontally
    ? Math.max(containerWidth - fixedColumnsWidth, 0)
    : dataColumnsWidth;

const getEffectiveColumnWidth = (column) => {
  const baseWidth = getColumnWidth(column);

  if (
    !isAppTable ||
    forceHorizontalScroll ||
    shouldScrollHorizontally ||
    containerWidth <= 0 ||
    dataColumnsWidth <= 0
  ) {
    return baseWidth;
  }

  return (baseWidth / dataColumnsWidth) * availableDataWidth;
};
useEffect(() => {
  const updateLayout = () => {
    setIsMobile(window.innerWidth < 768);

    if (scrollContainerRef.current) {
      setContainerWidth(scrollContainerRef.current.clientWidth || 0);
    }
  };

  updateLayout();

  let observer;

  if (typeof ResizeObserver !== "undefined" && scrollContainerRef.current) {
    observer = new ResizeObserver(updateLayout);
    observer.observe(scrollContainerRef.current);
  }

  window.addEventListener("resize", updateLayout);

  return () => {
    window.removeEventListener("resize", updateLayout);
    if (observer) observer.disconnect();
  };
}, []);
  useEffect(() => {
    if (scrollContainerRef.current && isMobile) {
      const scrollContainer = scrollContainerRef.current;
      setTimeout(() => {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      }, 100);
    }
  }, [isMobile, displayData]);

  const wrapperStyle = isAppTable
    ? {
        backgroundColor: 'white',
        borderRadius: 0,
        padding: 0,
        margin: 0,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
      }
    : {
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '15px',
        margin: '10px 0',
        width: '100%',
      };

  const tableClassName = isAppTable ? 'app-table' : undefined;
  const stickyContainerClassName = isAppTable
    ? 'sticky-table-container app-table-scroll'
    : 'sticky-table-container';

  return (
    <div className={`expand-table-container ${isAppTable ? 'app-expand-table' : ''}`} style={wrapperStyle}>
      <style dangerouslySetInnerHTML={{__html: `
        .sticky-table-container {
          -webkit-overflow-scrolling: touch !important;
        }
        .sticky-left {
          position: sticky;
          left: 0;
          z-index: 2;
          background-color: white;
        }
        .sticky-right {
          position: sticky;
          right: 0;
          z-index: 2;
          background-color: white;
        }
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 2;
          background-color: #00afaa;
          color: white;
        }
        .sticky-header-left {
          position: sticky;
          left: 0;
          top: 0;
          z-index: 3;
          background-color: #00afaa;
          color: white;
        }
        .sticky-header-right {
          position: sticky;
          right: 0;
          top: 0;
          z-index: 3;
          background-color: #00afaa;
          color: white;
        }
        .sticky-header-right.status-header {
          right: 80px;
        }
        .sticky-right.status-cell {
          right: 80px;
        }
        @media (max-width: 768px) {
          .sticky-shadow-right {
            box-shadow: -5px 0 10px -5px rgba(0,0,0,0.3);
          }
          .sticky-shadow-left {
            box-shadow: 5px 0 10px -5px rgba(0,0,0,0.3);
          }
        }
      `}} />

      <div
        ref={scrollContainerRef}
        className={stickyContainerClassName}
        style={{
  width: "100%",
  overflowX: isAppTable
    ? forceHorizontalScroll || shouldScrollHorizontally
      ? "auto"
      : "hidden"
    : "auto",
  position: "relative",
}}
      >
        <table
          className={tableClassName}
          style={{
  width: isAppTable && (forceHorizontalScroll || containerWidth > 0) ? `${tableWidth}px` : "100%",
  minWidth:
    isAppTable && (forceHorizontalScroll || containerWidth > 0)
      ? `${tableWidth}px`
      : isMobile
      ? `${totalMinWidth}px`
      : "100%",
  tableLayout: isAppTable ? "fixed" : "auto",
  borderCollapse: isAppTable ? "collapse" : "separate",
  borderSpacing: 0,
}}
        >
          {isAppTable && (
  <colgroup>
    <col style={{ width: `${checkboxColumnWidth}px` }} />

    {columns.map((column) => (
      <col
        key={`col-${column.key}`}
        style={{ width: `${getEffectiveColumnWidth(column)}px` }}
      />
    ))}

    {hasActions && <col style={{ width: `${actionColumnWidth}px` }} />}
  </colgroup>
)}
          <thead>
            <tr>
              <th
                className="sticky-header-left sticky-shadow-left"
                style={{
                  width: `${checkboxColumnWidth}px`,
minWidth: `${checkboxColumnWidth}px`,
maxWidth: `${checkboxColumnWidth}px`,
                  padding: isAppTable ? '8px' : '10px',
                  textAlign: "center",
                  borderColor: isAppTable ? "#00afaa" : undefined,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllChange}
                  aria-label="Select all rows"
                />
              </th>

              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`sticky-header ${column.stickyRight ? 'sticky-column-right sticky-shadow-right' : ''}`.trim()}
                  style={{
width: isAppTable ? `${getEffectiveColumnWidth(column)}px` : undefined,
minWidth: isAppTable
  ? `${getEffectiveColumnWidth(column)}px`
  : column.minWidth || "120px",
maxWidth: isAppTable ? `${getEffectiveColumnWidth(column)}px` : undefined,
padding: isAppTable ? "8px" : "10px",
textAlign: isAppTable ? "center" : "left",
fontWeight: "bold",
overflow: "hidden",
textOverflow: "ellipsis",
whiteSpace: "nowrap",
                    borderColor: isAppTable ? "#00afaa" : undefined,
                    ...(column.stickyRight ? {
                      position: 'sticky',
                      right: `${column.stickyRightOffset ?? actionColumnWidth}px`,
                      zIndex: 3,
                      backgroundColor: '#00afaa',
                    } : {}),
                  }}
                >
                  {column.label}
                </th>
              ))}

              {hasActions && (
                <th
                  className="sticky-header-right sticky-shadow-right"
                  style={{
                    width: `${actionColumnWidth}px`,
minWidth: `${actionColumnWidth}px`,
maxWidth: `${actionColumnWidth}px`,
                    padding: isAppTable ? '8px' : '10px',
                    textAlign: 'center',
                    right: 0,
                    zIndex: 4,
                  }}
                >
                  Action
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {(externalPagination
              ? displayData
              : displayData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            ).map((item) => (
              <React.Fragment key={item.id || `row-${Math.random()}`}>
                <tr>
                  <td
                    className="sticky-left sticky-shadow-left"
                    style={{
                      width: `${checkboxColumnWidth}px`,
minWidth: `${checkboxColumnWidth}px`,
maxWidth: `${checkboxColumnWidth}px`,
                      padding: '8px',
                      borderBottom: "1px solid #eee",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleCheckboxChange(item.id)}
                      aria-label={`Select row ${item.id}`}
                    />
                  </td>

                  {columns.map((column) => (
                    <td
                      key={`${item.id}-${column.key}`}
                      className={column.stickyRight ? 'sticky-column-right sticky-shadow-right' : undefined}
                      style={{
                        width: isAppTable ? `${getEffectiveColumnWidth(column)}px` : undefined,
minWidth: isAppTable ? `${getEffectiveColumnWidth(column)}px` : undefined,
maxWidth: isAppTable ? `${getEffectiveColumnWidth(column)}px` : undefined,
backgroundColor: "white",
padding: "8px",
borderBottom: "1px solid #eee",
overflow: "hidden",
textOverflow: "ellipsis",
whiteSpace: "nowrap",
textAlign: isAppTable ? "center" : "left",
                        ...(column.stickyRight ? {
                          position: 'sticky',
                          right: `${column.stickyRightOffset ?? actionColumnWidth}px`,
                          zIndex: 2,
                          backgroundColor: 'white',
                        } : {}),
                      }}
                    >
                      {column.render
                        ? column.render(item, searchTerm, toggleRowExpansion)
                        : (highlightText(item[column.key], searchTerm) || '')}
                    </td>
                  ))}

                  {hasActions && (
                    <td
                      className="sticky-right sticky-shadow-right"
                      style={{
                        width: `${actionColumnWidth}px`,
minWidth: `${actionColumnWidth}px`,
maxWidth: `${actionColumnWidth}px`,
                        padding: '8px',
                        borderBottom: '1px solid #eee',
                        textAlign: 'center',
                        right: 0,
                        zIndex: 3,
                        backgroundColor: 'white',
                      }}
                    >
                      <div
                        className="app-table-actions"
                        style={forceHorizontalScroll ? { gap: '12px', flexWrap: 'nowrap' } : undefined}
                      >
                        {handleEdit && (
                          <FontAwesomeIcon
                            onClick={() => handleEdit(item)}
                            icon={faEdit}
                            className={isAppTable ? 'app-table-action is-edit' : undefined}
                            style={isAppTable ? undefined : {
                              color: '#007bff',
                              cursor: 'pointer',
                              fontSize: '16px',
                            }}
                            aria-label="Edit"
                          />
                        )}
                        {handleDelete && (
                          <FontAwesomeIcon
                            onClick={() => handleDelete(item.id)}
                            icon={faTrash}
                            className={isAppTable ? 'app-table-action is-delete' : undefined}
                            style={isAppTable ? undefined : {
                              color: '#ff0000',
                              cursor: 'pointer',
                              fontSize: '16px',
                            }}
                            aria-label="Delete"
                          />
                        )}
                        {renderCustomActions && renderCustomActions(item)}
                      </div>
                    </td>
                  )}
                </tr>

                {expandedRows[item.id] && (
                  <tr className="expanded-row">
                    <td
                      colSpan={columns.length + 1 + (hasActions ? 1 : 0)}
                      style={{
                        padding: '15px',
                        backgroundColor: '#f9f9f9',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      {renderExpandedRow(item)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {displayData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1 + (hasActions ? 1 : 0)}
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  Aucune donnee disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        className={isAppTable ? 'app-table-footer' : undefined}
        style={isAppTable ? undefined : {
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginTop: '20px',
          gap: '15px',
        }}
      >
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteSelected}
          disabled={!selectedItems || selectedItems.length === 0}
          className={isAppTable ? 'app-danger-button' : undefined}
          style={isAppTable ? undefined : {
            borderRadius: '8px',
            fontWeight: 'bold',
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            fontSize: isMobile ? '12px' : '14px',
          }}
          startIcon={<FontAwesomeIcon icon={faTrash} />}
        >
          Supprimer selection
        </Button>

        {paginationComponent || <div
          className={isAppTable ? 'app-table-pagination' : undefined}
          style={isAppTable ? undefined : { display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span>Lignes par page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => handleChangeRowsPerPage({ target: { value: e.target.value }})}
            style={isAppTable ? undefined : { marginRight: '15px', padding: '5px' }}
          >
            {[5, 10, 15, 20, 25].map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <span>{`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, displayData.length)} sur ${displayData.length}`}</span>
        </div>}
      </div>
    </div>
  );
};

export default ExpandRTable;
