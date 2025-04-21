// Orders.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./css/Orders.module.css";
import api from "../constant/api";
import { Link } from "react-router-dom";

const Orders = ({ onSelectOrder }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    query: "",
    status: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.query) params.append("query", filter.query);
      if (filter.status) params.append("status", filter.status);

      const response = await api.get("admin-orders/", { params });
      setOrders(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch orders. Please try again later.");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const getStatusClass = (status) => {
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
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterSection}>
        <h3>Orders</h3>
        <div className={styles.filters}>
          <div className={styles.searchInput}>
            <input
              type="text"
              name="query"
              placeholder="Search orders..."
              value={filter.query}
              onChange={handleFilterChange}
            />
          </div>
          <div className={styles.statusFilter}>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading orders...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
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
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.items_count} items</td>
                    <td>₦{order.total.toLocaleString()}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin-order-detail/${order.id}`}>
                        <button className={styles.viewButton}>
                          View Details
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={styles.noOrders}>
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
