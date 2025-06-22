import React from "react";
import { FaStore } from "react-icons/fa";
import ShopCard from "./ShopCard";
import Pagination from "./Pagination";
import Spinner from "../Spinner";
import styles from "../../css/Home.module.css";

const ShopsGrid = ({
  loading,
  isInitialized,
  shops,
  currentPage,
  totalPages,
  onPageChange,
  noResultsMessage,
  hasFilters,
  onResetFilter,
}) => {
  if (loading && !isInitialized) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
      </div>
    );
  }

  if (!shops || shops.length === 0) {
    return (
      <div className={styles.noResults}>
        <FaStore className={styles.noResultsIcon} />
        <p>{noResultsMessage}</p>
        {hasFilters && (
          <button onClick={onResetFilter} className={styles.resetFiltersButton}>
            Switch Institution
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={styles.shopsGrid}>
        {shops.map((shop) =>
          shop.business_category !== "others" ? (
            <ShopCard key={shop.id} shop={shop} />
          ) : null
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};

export default ShopsGrid;
