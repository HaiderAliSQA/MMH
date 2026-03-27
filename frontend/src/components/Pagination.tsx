import React from 'react';

interface PaginationProps {
  totalResults: number;
  currentPage: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  totalResults,
  currentPage,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange
}) => {
  const totalPages = Math.ceil(totalResults / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalResults);

  if (totalResults === 0) return null;

  return (
    <div className="mmh-pagination">
      <div className="mmh-pagination-info">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{totalResults}</strong> records
      </div>
      
      <div className="mmh-pagination-controls">
        <div className="mmh-pagination-rows">
          <span className="mmh-pagination-label">Rows per page</span>
          <select 
            value={rowsPerPage} 
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="mmh-pagination-select"
          >
            {[10, 20, 30, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="mmh-pagination-main">
          <button 
            className="mmh-pagination-btn" 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous Page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          
          <div className="mmh-pagination-pill">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>

          <button 
            className="mmh-pagination-btn" 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next Page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
