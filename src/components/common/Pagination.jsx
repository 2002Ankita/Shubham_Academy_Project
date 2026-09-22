import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize = 10,
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize);

  return (
    <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 mt-3 px-1">
      {totalItems ? (
        <span className="small text-sa-muted">
          Showing <span className="fw-semibold text-sa-charcoal">{startItem}</span> to{' '}
          <span className="fw-semibold text-sa-charcoal">{endItem}</span> of{' '}
          <span className="fw-semibold text-sa-charcoal">{totalItems}</span> entries
        </span>
      ) : <span />}

      <nav aria-label="Page navigation">
        <ul className="pagination pagination-sm m-0 gap-1">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link rounded px-2"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
          </li>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
              <button
                className={`page-link rounded px-3 fw-semibold ${
                  currentPage === page ? 'bg-sa-primary border-0 text-white' : 'text-sa-charcoal'
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            </li>
          ))}

          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link rounded px-2"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
