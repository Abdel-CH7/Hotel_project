import { LIST_ROWS_PER_PAGE_OPTIONS } from "./useListControls";

const ListPagination = ({ page, rowsPerPage, totalRows, onPageChange, onRowsPerPageChange }) => {
  const start = totalRows > 0 ? page * rowsPerPage + 1 : 0;
  const end = totalRows > 0 ? Math.min((page + 1) * rowsPerPage, totalRows) : 0;
  const lastPage = Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1);

  return (
    <div className="app-table-pagination">
      <span>Lignes par page :</span>
      <select value={rowsPerPage} onChange={(event) => onRowsPerPageChange(Number(event.target.value))} aria-label="Lignes par page">
        {LIST_ROWS_PER_PAGE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <span>{`${start}-${end} sur ${totalRows}`}</span>
      <button type="button" className="app-pagination-arrow" disabled={page === 0} onClick={() => onPageChange(page - 1)} aria-label="Page précédente">‹</button>
      <button type="button" className="app-pagination-arrow" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)} aria-label="Page suivante">›</button>
    </div>
  );
};

export default ListPagination;
