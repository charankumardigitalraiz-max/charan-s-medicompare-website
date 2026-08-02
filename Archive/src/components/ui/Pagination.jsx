import React from "react";

/**
 * Reusable Pagination Component styled with Tailwind CSS
 * @param {number} page - Current active page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when a page changes
 */
const Pagination = ({ page = 1, totalPages = 0, onPageChange }) => {
  if (totalPages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  // Adjust start/end to always show 5 pages if available
  let pageNumbers = [];
  let adjustedStart = start;
  let adjustedEnd = end;

  if (totalPages > 5) {
    if (page <= 3) {
      adjustedStart = 1;
      adjustedEnd = 5;
    } else if (page >= totalPages - 2) {
      adjustedStart = totalPages - 4;
      adjustedEnd = totalPages;
    }
  }

  for (let i = adjustedStart; i <= adjustedEnd; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 mb-4">
      {/* Previous Button */}
      <div
        onClick={() => page > 1 && onPageChange(page - 1)}
        className={`flex h-9 w-9 items-center justify-center !rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 cursor-pointer ${page <= 1 ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
          }`}
        title="Previous Page"
      >
        <i className="fa-solid fa-chevron-left text-xs" />
      </div>

      {/* First Page Link */}
      {adjustedStart > 1 && (
        <>
          <div
            onClick={() => onPageChange(1)}
            className="flex h-9 w-9 items-center justify-center !rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 cursor-pointer"
          >
            1
          </div>
          {adjustedStart > 2 && (
            <span className="flex h-9 w-9 items-center justify-center text-slate-400 font-medium">
              ...
            </span>
          )}
        </>
      )}

      {/* Page Numbers */}
      {pageNumbers.map((pageNum) => (
        <div
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`flex h-9 w-9 items-center justify-center !rounded-full border text-sm font-semibold transition-all duration-200 cursor-pointer ${pageNum === page
              ? "bg-[#8059ca] border-[#8059ca] text-white shadow-md shadow-[#8059ca]/15"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
        >
          {pageNum}
        </div>
      ))}

      {/* Last Page Link */}
      {adjustedEnd < totalPages && (
        <>
          {adjustedEnd < totalPages - 1 && (
            <span className="flex h-9 w-9 items-center justify-center text-slate-400 font-medium">
              ...
            </span>
          )}
          <div
            onClick={() => onPageChange(totalPages)}
            className="flex h-9 w-9 items-center justify-center !rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 cursor-pointer"
          >
            {totalPages}
          </div>
        </>
      )}

      {/* Next Button */}
      <div
        onClick={() => page < totalPages && onPageChange(page + 1)}
        className={`flex h-9 w-9 items-center justify-center !rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 cursor-pointer ${page >= totalPages ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
          }`}
        title="Next Page"
      >
        <i className="fa-solid fa-chevron-right text-xs" />
      </div>
    </div>
  );
};

export default Pagination;
