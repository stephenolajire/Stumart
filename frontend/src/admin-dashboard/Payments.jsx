// Payments.jsx
import React, { useState, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./css/Payments.module.css";
import LoadingSpinner from "./LoadingSpinner";
import { usePaymentTransactions } from "./hooks/usePayments";

const Payments = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input for better performance
  const debouncedSearch = useDebouncedCallback((value) => {
    setDebouncedQuery(value);
  }, 500);

  // Update debounced query when query changes
  React.useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      query: debouncedQuery.trim(),
      status,
    }),
    [debouncedQuery, status]
  );

  // Fetch transactions with current filters
  const {
    data: transactions = [],
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
    isRefetching,
  } = usePaymentTransactions(filters);

  const handleSearch = React.useCallback((e) => {
    e.preventDefault();
    // The debounced search will handle the actual filtering
  }, []);

  const clearFilters = React.useCallback(() => {
    setQuery("");
    setStatus("");
    setDebouncedQuery("");
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
        return styles.statusSuccess;
      case "pending":
        return styles.statusPending;
      case "failed":
        return styles.statusFailed;
      default:
        return "";
    }
  };

  if (isLoading && !transactions.length) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className={styles.error}>
        <p>Failed to load payment transactions</p>
        <button onClick={() => refetch()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.titleSection}>
          <h2 className={styles.sectionTitle}>
            Payment Transactions
            {transactions.length > 0 && (
              <span className={styles.transactionCount}>
                ({transactions.length})
              </span>
            )}
          </h2>
          <button
            onClick={() => refetch()}
            className={styles.refreshButton}
            disabled={isFetching}
          >
            {isRefetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className={styles.filterSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search by transaction ID or order number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>

          <div className={styles.filterControls}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <button onClick={clearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {isFetching && !isRefetching && (
        <div className={styles.loadingOverlay}>
          <span>Searching...</span>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.transactionsTable}>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Order Number</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.noData}>
                  {isFetching ? "Searching..." : "No transactions found"}
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.transaction_id}</td>
                  <td>{transaction.order_number}</td>
                  <td>{transaction.customer_name}</td>
                  <td>₦{transaction.amount?.toLocaleString() || 0}</td>
                  <td>{transaction.payment_method}</td>
                  <td>{formatDate(transaction.created_at)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${getStatusClass(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
