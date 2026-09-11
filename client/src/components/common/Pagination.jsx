import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Common.css';

const getPageNumbers = (currentPage, totalPages) => {
  const pages = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (currentPage > 3) pages.push('...');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push('...');

  pages.push(totalPages);
  return pages;
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  ...rest
}) => {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination" {...rest}>
      <button
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis">
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            className={`pagination-btn${page === currentPage ? ' pagination-btn--active' : ''}`}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

export default Pagination;
