import React from "react";
import styles from "../../css/Home.module.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={styles.pageButton}
      >
        Prev
      </button>

      <div className={styles.pageNumbers}>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((num) => {
            // Show first page, last page, current page and pages around current
            return (
              num === 1 ||
              num === totalPages ||
              Math.abs(num - currentPage) <= 1
            );
          })
          .map((number, index, array) => (
            <React.Fragment key={number}>
              {index > 0 && array[index - 1] !== number - 1 && (
                <span className={styles.pageDots}>...</span>
              )}
              <button
                onClick={() => onPageChange(number)}
                className={`${styles.pageNumber} ${
                  currentPage === number ? styles.activePage : ""
                }`}
              >
                {number}
              </button>
            </React.Fragment>
          ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.pageButton}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
