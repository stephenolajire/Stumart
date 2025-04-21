// OrderDetail.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./css/OrderDetail.module.css";
import api from "../constant/api";
import { useParams } from "react-router-dom";

const AdminOrderDetail = ({ onBack }) => {
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const { orderId } = useParams(); 
  // console.log(orderId)
  const order_id = orderId; 
  console.log(order_id)

  useEffect(() => {
    fetchOrderDetail();
  }, [order_id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`admin-orders/${order_id}/`);
      setOrderDetail(response.data);
      setStatusUpdate(response.data.status);
      setError(null);
    } catch (err) {
      setError("Failed to fetch order details. Please try again later.");
      console.error("Error fetching order details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      setUpdateLoading(true);
      await api.put(`admin-orders/${orderId}/`, {
        status: statusUpdate,
      });
      fetchOrderDetail(); // Refresh order details after update
    } catch (err) {
      setError("Failed to update order status. Please try again later.");
      console.error("Error updating order status:", err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return styles.statusCompleted;
      case "PENDING":
        return styles.statusPending;
      case "PROCESSING":
        return styles.statusProcessing;
      case "SHIPPED":
        return styles.statusShipped;
      case "CANCELLED":
        return styles.statusCancelled;
      default:
        return "";
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading order details...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!orderDetail) {
    return <div className={styles.error}>Order not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          &larr; Back to Orders
        </button>
        <h3>Order #{orderDetail.order_number}</h3>
      </div>

      <div className={styles.orderSummary}>
        <div className={styles.summarySection}>
          <h4>Order Information</h4>
          <div className={styles.summaryContent}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Status:</span>
              <span
                className={`${styles.statusBadge} ${getStatusClass(
                  orderDetail.status
                )}`}
              >
                {orderDetail.status}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Date:</span>
              <span>{formatDate(orderDetail.created_at)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Total:</span>
              <span className={styles.total}>
                ₦{orderDetail.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.summarySection}>
          <h4>Customer Information</h4>
          <div className={styles.summaryContent}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Name:</span>
              <span>{orderDetail.customer_name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span>{orderDetail.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Phone:</span>
              <span>{orderDetail.phone}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Address:</span>
              <span>{orderDetail.address}</span>
            </div>
            {orderDetail.room_number && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Room:</span>
                <span>{orderDetail.room_number}</span>
              </div>
            )}
          </div>
        </div>

        {orderDetail.picker && (
          <div className={styles.summarySection}>
            <h4>Picker Information</h4>
            <div className={styles.summaryContent}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Name:</span>
                <span>{orderDetail.picker.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Email:</span>
                <span>{orderDetail.picker.email}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.updateSection}>
        <h4>Update Order Status</h4>
        <div className={styles.statusUpdate}>
          <select
            value={statusUpdate}
            onChange={(e) => setStatusUpdate(e.target.value)}
            disabled={updateLoading}
          >
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            className={styles.updateButton}
            onClick={handleStatusChange}
            disabled={updateLoading || statusUpdate === orderDetail.status}
          >
            {updateLoading ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>

      <div className={styles.itemsSection}>
        <h4>Order Items</h4>
        <div className={styles.itemsTable}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orderDetail.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.product_name}
                    {item.size && (
                      <span className={styles.itemAttr}>Size: {item.size}</span>
                    )}
                    {item.color && (
                      <span className={styles.itemAttr}>
                        Color: {item.color}
                      </span>
                    )}
                  </td>
                  <td>{item.vendor_name}</td>
                  <td>{item.quantity}</td>
                  <td>₦{item.price.toLocaleString()}</td>
                  <td>₦{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className={styles.summaryLabel}>
                  Subtotal
                </td>
                <td>₦{orderDetail.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan="4" className={styles.summaryLabel}>
                  Shipping Fee
                </td>
                <td>₦{orderDetail.shipping_fee.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan="4" className={styles.summaryLabel}>
                  Tax
                </td>
                <td>₦{orderDetail.tax.toLocaleString()}</td>
              </tr>
              <tr className={styles.totalRow}>
                <td colSpan="4" className={styles.summaryLabel}>
                  Total
                </td>
                <td className={styles.grandTotal}>
                  ₦{orderDetail.total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {orderDetail.transaction && (
        <div className={styles.transactionSection}>
          <h4>Payment Information</h4>
          <div className={styles.transactionDetails}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Transaction ID:</span>
              <span>{orderDetail.transaction.transaction_id}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Payment Method:</span>
              <span>{orderDetail.transaction.payment_method}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Payment Status:</span>
              <span
                className={
                  orderDetail.transaction.status === "success"
                    ? styles.success
                    : styles.pending
                }
              >
                {orderDetail.transaction.status}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Payment Date:</span>
              <span>{formatDate(orderDetail.transaction.created_at)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Amount:</span>
              <span className={styles.total}>
                ₦{orderDetail.transaction.amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;
