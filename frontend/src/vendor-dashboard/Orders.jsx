import React, { useState } from "react";
import { FaEye } from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";

const Orders = ({ orders }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getOrderStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return styles.statusDelivered;
      case "processing":
        return styles.statusProcessing;
      case "shipped":
        return styles.statusShipped;
      case "pending":
        return styles.statusPending;
      default:
        return "";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    const matchesStatus =
      filterStatus === "all" || order.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.ordersSection}>
      <div className={styles.sectionHeader}>
        <h2>Order Management</h2>
        <div className={styles.orderFilters}>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
          <input
            type="search"
            placeholder="Search orders..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Items</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className={styles.orderId}>#{order.id}</td>
                <td>{order.customer_name}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>${order.total}</td>
                <td>{order.items_count}</td>
                <td>
                  <span
                    className={`${styles.status} ${getOrderStatusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.viewButton}>
                      <FaEye />
                    </button>
                    <button className={styles.updateButton}>Update</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
