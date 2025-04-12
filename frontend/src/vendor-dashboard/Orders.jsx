import React, { useState } from "react";
import { FaEye } from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";

const Orders = ({ orders }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getOrderStatusClass = (status) => {
    if (!status) return ""; // Check if status is null or undefined

    switch (status.toLowerCase()) {
      case "delivered":
        return styles.statusDelivered;
      case "paid":
        return styles.statusPaid;
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
    const customerName =
      order.shipping?.first_name + " " + order.shipping?.last_name;
    const matchesSearch =
      customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.includes(searchTerm);
    const matchesStatus =
      filterStatus === "all" ||
      (order.order_status && order.order_status.toLowerCase() === filterStatus);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.ordersSection}>
      <div className={styles.sectionHeader}>
        <h2 style={{ marginBottom: "2rem" }}>Order Management</h2>
        <div className={styles.orderFilters}>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
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
                <td className={styles.orderId}>{order.order_number}</td>
                <td>
                  {order.first_name} {order.last_name}
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>₦{order.subtotal}</td>
                <td>{order.order_items?.length || 0}</td>
                <td>
                  <span
                    className={`${styles.status} ${getOrderStatusClass(
                      order.order_status
                    )}`}
                  >
                    {order.order_status || "N/A"}
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
