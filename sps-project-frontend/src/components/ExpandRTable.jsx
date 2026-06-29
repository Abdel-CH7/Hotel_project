import React, { useEffect, useState } from 'react';
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
}) => {
  
  const hasActions = handleEdit || handleDelete || renderCustomActions;
  const displayData = filteredData || data || [];
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Calculate total minimum width including all columns
  const totalMinWidth = 50 + // Checkbox column
    columns.reduce((acc, col) => acc + (col.minWidth || 120), 0) + // Data columns
    100 + // Status column
    (hasActions ? 80 : 0); // Action column

  // Track window size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Create a ref for scrollable container
  const scrollContainerRef = React.useRef(null);

  // Scroll to the right when table is first rendered to show action column
  useEffect(() => {
    if (scrollContainerRef.current && isMobile) {
      const scrollContainer = scrollContainerRef.current;
      // Small delay to ensure table is rendered
      setTimeout(() => {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      }, 100);
    }
  }, [isMobile, displayData]);

  return (
    <div className="expand-table-container" style={{ 
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '15px',
      margin: '10px 0',
      width: '100%'
    }}>
      {/* Fixed CSS by properly wrapping in an object */}
      <style dangerouslySetInnerHTML={{__html: `
        .sticky-table-container {
          -webkit-overflow-scrolling: touch !important;
        }
        .sticky-left {
          position: sticky;
          left: 0;
          z-index: 5;
          background-color: white;
        }
        .sticky-right {
          position: sticky;
          right: 0;
          z-index: 5;
          background-color: white;
        }
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #00afaa;
          color: white;
        }
        .sticky-header-left {
          position: sticky;
          left: 0;
          top: 0;
          z-index: 15;
          background-color: #00afaa;
          color: white;
        }
        .sticky-header-right {
          position: sticky;
          right: 0;
          top: 0;
          z-index: 15;
          background-color: #00afaa;
          color: white;
        }
        .sticky-header-right.status-header {
          right: 80px; /* Space for action column */
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

      {/* Scrollable table container with ref */}
      <div 
        ref={scrollContainerRef}
        className="sticky-table-container" 
        style={{ 
          width: '100%', 
          overflowX: 'auto',
          position: 'relative'
        }}
      >
        <table style={{ 
          width: '100%',
          minWidth: isMobile ? `${totalMinWidth}px` : '100%',
          borderCollapse: 'separate',
          borderSpacing: 0
        }}>
          <thead>
            <tr>
              {/* Checkbox Column */}
              <th className="sticky-header-left sticky-shadow-left" style={{ 
                width: '50px',
                minWidth: '50px',
                padding: '10px'
              }}>
                <input 
                  type="checkbox" 
                  checked={selectAll} 
                  onChange={handleSelectAllChange} 
                  aria-label="Select all rows"
                />
              </th>
              
              {/* Data Columns */}
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className="sticky-header"
                  style={{ 
                    minWidth: column.minWidth || '120px',
                    padding: '10px',
                    textAlign: 'left',
                    fontWeight: 'bold'
                  }}
                >
                  {column.label}
                </th>
              ))}
              {/* Actions Column */}
              {hasActions && (
                <th 
                  className="sticky-header-right sticky-shadow-right" 
                  style={{ 
                    width: '80px',
                    minWidth: '80px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  Action
                </th>
              )}
            </tr>
          </thead>
          
          <tbody>
            {displayData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
              <React.Fragment key={item.id || `row-${Math.random()}`}>
                <tr>
                  {/* Checkbox Cell */}
                  <td className="sticky-left sticky-shadow-left" style={{ 
                    width: '50px',
                    minWidth: '50px',
                    padding: '8px',
                    borderBottom: '1px solid #eee'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleCheckboxChange(item.id)}
                      aria-label={`Select row ${item.id}`}
                    />
                  </td>
                  
                  {/* Data Cells */}
                  {columns.map((column) => (
                    <td 
                      key={`${item.id}-${column.key}`} 
                      style={{ 
                        backgroundColor: "white",
                        padding: '8px',
                        borderBottom: '1px solid #eee',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {column.render 
                        ? column.render(item, searchTerm, toggleRowExpansion) 
                        : (highlightText(item[column.key], searchTerm) || '')}
                    </td>
                  ))}
                  

                  
                  {/* Actions Cell */}
                  {hasActions && (
                    <td 
                      className="sticky-right sticky-shadow-right" 
                      style={{ 
                        width: '80px',
                        minWidth: '80px',
                        padding: '8px',
                        borderBottom: '1px solid #eee',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "center",
                        gap: "10px"
                      }}>
                        {handleEdit && (
                          <FontAwesomeIcon
                            onClick={() => handleEdit(item)}
                            icon={faEdit}
                            style={{ 
                              color: "#007bff", 
                              cursor: "pointer",
                              fontSize: '16px'
                            }}
                            aria-label="Edit"
                          />
                        )}
                        {handleDelete && (
                          <FontAwesomeIcon
                            onClick={() => handleDelete(item.id)}
                            icon={faTrash}
                            style={{ 
                              color: "#ff0000", 
                              cursor: "pointer",
                              fontSize: '16px'
                            }}
                            aria-label="Delete"
                          />
                        )}
                        {renderCustomActions && renderCustomActions(item)}
                      </div>
                    </td>
                  )}
                </tr>
                
                {/* Expanded Row Content */}
                {expandedRows[item.id] && (
                  <tr className="expanded-row">
                    <td 
                      colSpan={columns.length + (hasActions ? 3 : 2)} 
                      style={{ 
                        padding: "15px",
                        backgroundColor: "#f9f9f9",
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      {renderExpandedRow(item)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            
            {/* Empty State */}
            {displayData.length === 0 && (
              <tr>
                <td 
                  colSpan={columns.length + (hasActions ? 3 : 2)} 
                  style={{ 
                    textAlign: 'center', 
                    padding: '20px' 
                  }}
                >
                  Aucune donnée disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        marginTop: '20px',
        gap: '15px'
      }}>
        {/* Delete Selected Button */}
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteSelected}
          disabled={!selectedItems || selectedItems.length === 0}
          style={{ 
            borderRadius: "8px", 
            fontWeight: "bold", 
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            fontSize: isMobile ? '12px' : '14px',
          }}
          startIcon={<FontAwesomeIcon icon={faTrash} />}
        >
          SUPPRIMER SELECTION
        </Button>

        {/* Pagination Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Lignes par page:</span>
          <select 
            value={rowsPerPage}
            onChange={(e) => handleChangeRowsPerPage({ target: { value: e.target.value }})}
            style={{ marginRight: '15px', padding: '5px' }}
          >
            {[5, 10, 15, 20, 25].map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <span>{`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, displayData.length)} sur ${displayData.length}`}</span>
        </div>
      </div>
    </div>
  );
};

export default ExpandRTable;