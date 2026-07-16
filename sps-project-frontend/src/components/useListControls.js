import { useCallback, useEffect, useMemo, useState } from "react";

export const LIST_ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20, 25];

const readStoredRowsPerPage = (storageKey, fallback) => {
  if (!storageKey) return fallback;
  const stored = Number(window.localStorage.getItem(storageKey));
  return LIST_ROWS_PER_PAGE_OPTIONS.includes(stored) ? stored : fallback;
};

const useListControls = ({ allRows = [], filterRows, storageKey, initialRowsPerPage = 5 }) => {
  const [searchTerm, setSearchTermState] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPageState] = useState(() => readStoredRowsPerPage(storageKey, initialRowsPerPage));

  const setSearchTerm = useCallback((value) => {
    setSearchTermState(value ?? "");
    setPage(0);
  }, []);

  const setRowsPerPage = useCallback((value) => {
    const parsedValue = Number(value);
    const nextValue = LIST_ROWS_PER_PAGE_OPTIONS.includes(parsedValue) ? parsedValue : initialRowsPerPage;
    setRowsPerPageState(nextValue);
    setPage(0);
    if (storageKey) window.localStorage.setItem(storageKey, String(nextValue));
  }, [initialRowsPerPage, storageKey]);

  const resetPage = useCallback(() => setPage(0), []);
  const filteredRows = useMemo(() => filterRows ? filterRows(allRows, searchTerm) : allRows, [allRows, filterRows, searchTerm]);
  const totalRows = filteredRows.length;
  const lastPage = Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1);

  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [lastPage, page]);

  const visibleRows = useMemo(() => filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage), [filteredRows, page, rowsPerPage]);

  return { searchTerm, page, rowsPerPage, filteredRows, visibleRows, totalRows, lastPage, setSearchTerm, setPage, setRowsPerPage, resetPage };
};

export default useListControls;
