import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  count,
  next,
  previous,
  currentPage,
  onPageChange,
  resultsPerPage = 18,
}) => {
  // Calculate total pages
  const totalPages = Math.ceil(count / resultsPerPage);

  // Extract page number from URL
  const getPageFromUrl = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]page=(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const nextPage = getPageFromUrl(next);
  const prevPage = getPageFromUrl(previous);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Handle page change
  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (previous) {
      onPageChange(prevPage || currentPage - 1);
    }
  };

  const handleNext = () => {
    if (next) {
      onPageChange(nextPage || currentPage + 1);
    }
  };

  // Don't render if there's only one page or no items
  if (totalPages <= 1 || count === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Page Info */}
      <div className="text-sm text-gray-600">
        Showing page {currentPage} of {totalPages} ({count} total items)
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={!previous}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all ${
            previous
              ? "bg-yellow-600 text-white hover:bg-yellow-700 active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-400"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`min-w-10 px-3 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-yellow-600 text-white shadow-md scale-105"
                    : "bg-white text-gray-700 hover:bg-yellow-50 border border-gray-300"
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={isActive ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!next}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all ${
            next
              ? "bg-yellow-600 text-white hover:bg-yellow-700 active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
