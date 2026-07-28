import React from "react";

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 0) return null;

  return (
    <div className="pagination dashboard-pagination" style={{ marginTop: "40px", marginBottom: "20px", display: "flex", justifyContent: "center" }}>
      <ul>
        <li>
          <a
            className={`page-link ${page <= 1 ? "disabled" : ""}`}
            onClick={() => page > 1 && onPageChange(page - 1)}
            style={{
              cursor: page <= 1 ? "not-allowed" : "pointer",
              opacity: page <= 1 ? 0.5 : 1
            }}
          >
            <i className="fa-solid fa-chevron-left" />
          </a>
        </li>

        {totalPages > 1 && page > 3 && (
          <li>
            <a className="page-link" onClick={() => onPageChange(1)} style={{ cursor: "pointer" }}>1</a>
          </li>
        )}

        {totalPages > 1 && page > 4 && (
          <li>
            <span className="page-link">...</span>
          </li>
        )}

        {(() => {
          if (totalPages === 1) {
            return (
              <li>
                <a className="page-link active">1</a>
              </li>
            );
          }

          let start = Math.max(1, page - 2);
          let end = Math.min(totalPages, page + 2);
          if (start === 1) end = Math.min(5, totalPages);
          if (end === totalPages) start = Math.max(1, totalPages - 4);

          return [...Array(end - start + 1)].map((_, i) => {
            const pageNum = start + i;
            return (
              <li key={pageNum}>
                <a
                  className={`page-link ${pageNum === page ? "active" : ""}`}
                  onClick={() => onPageChange(pageNum)}
                  style={{ cursor: "pointer" }}
                >
                  {pageNum}
                </a>
              </li>
            );
          });
        })()}

        {totalPages > 1 && page < totalPages - 3 && (
          <li>
            <span className="page-link">...</span>
          </li>
        )}

        {totalPages > 1 && page < totalPages - 2 && (
          <li>
            <a className="page-link" onClick={() => onPageChange(totalPages)} style={{ cursor: "pointer" }}>
              {totalPages}
            </a>
          </li>
        )}

        <li>
          <a
            className={`page-link ${page >= totalPages ? "disabled" : ""}`}
            onClick={() => page < totalPages && onPageChange(page + 1)}
            style={{
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              opacity: page >= totalPages ? 0.5 : 1
            }}
          >
            <i className="fa-solid fa-chevron-right" />
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Pagination;
