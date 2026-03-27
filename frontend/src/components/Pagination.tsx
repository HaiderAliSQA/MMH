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
        Showing <span>{start}</span> to <span>{end}</span> of <span>{totalResults}</span> records
      </div>
      
      <div className="mmh-pagination-controls">
        <div className="mmh-pagination-rows">
          <label>Rows per page:</label>
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

        <div className="mmh-pagination-buttons">
          <button 
            className="mmh-pagination-btn" 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>
          <div className="mmh-pagination-page-indicator">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            className="mmh-pagination-btn" 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
