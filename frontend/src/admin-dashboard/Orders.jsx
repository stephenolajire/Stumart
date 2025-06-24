import React, { useState, useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Link } from "react-router-dom";
import styles from "./css/Orders.module.css";
import LoadingSpinner from "./LoadingSpinner";
import { useOrders } from "./hooks/useOrders";

const Orders = ({ onSelectOrder }) => {
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

  // Fetch orders with current filters
  const {
    data: orders = [],
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
    isRefetching,
  } = useOrders(filters);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // The debounced search will handle the actual filtering
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setStatus("");
    setDebouncedQuery("");
  }, []);

  const getStatusClass = useCallback((status) => {
    switch (status) {
      case "COMPLETED":
        return styles.statusCompleted;
      case "PENDING":
        return styles.statusPending;
      case "IN_TRANSIT":
        return styles.statusProcessing;
      case "DELIVERED":
        return styles.statusShipped;
      case "CANCELLED":
        return styles.statusCancelled;
      default:
        return "";
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }, []);

  if (isLoading && !orders.length) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className={styles.error}>
        <p>Failed to load orders</p>
        <button onClick={() => refetch()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.filterSection}>
        <div className={styles.titleSection}>
          <h3>
            Orders
            {orders.length > 0 && (
              <span className={styles.orderCount}>({orders.length})</span>
            )}
          </h3>
          <button
            onClick={() => refetch()}
            className={styles.refreshButton}
            disabled={isFetching}
          >
            {isRefetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchInput}>
              <input
                type="text"
                placeholder="Search orders..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className={styles.searchButton}>
                Search
              </button>
            </div>
          </form>

          <div className={styles.filterControls}>
            <div className={styles.statusFilter}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

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

      <div className={styles.ordersTable}>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.noOrders}>
                  {isFetching ? "Searching..." : "No orders found"}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.orderNumber}>{order.order_number}</td>
                  <td className={styles.customerName}>{order.customer_name}</td>
                  <td className={styles.itemsCount}>
                    {order.items_count}{" "}
                    {order.items_count === 1 ? "item" : "items"}
                  </td>
                  <td className={styles.orderTotal}>
                    ₦{order.total.toLocaleString()}
                  </td>
                  <td className={styles.orderDate}>
                    {formatDate(order.created_at)}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <Link to={`/admin-order-detail/${order.id}`}>
                        <button className={styles.viewButton}>
                          View Details
                        </button>
                      </Link>
                      {onSelectOrder && (
                        <button
                          onClick={() => onSelectOrder(order)}
                          className={styles.selectButton}
                        >
                          Select
                        </button>
                      )}
                    </div>
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

export default Orders;
