// OrderDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUser, FaMapMarkerAlt, FaBox, FaCheck } from "react-icons/fa";
import api from "../constant/api";
import styles from "./css/OrderDetails.module.css";
import Swal from "sweetalert2";

const DeliveryDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`orders/${orderId}/`);
        console.log('Order Data:', response.data);
        setOrderData(response.data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleMarkDelivered = async () => {
    try {
      setProcessingAction(true);
      await api.post(`orders/${orderId}/deliver/`, {
        status: "DELIVERED",
      });

      Swal.fire({
        icon: "success",
        title: "Order Delivered",
        text: "Thank you for an amazing job. Go on to accept more orders",
      });

      navigate("/my-deliveries");
    } catch (error) {
      console.error("Error marking as delivered:", error);
      Swal.fire({
        icon: "error",
        title: "Status Error",
        text: "Order status failed, please try again later",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const goBack = () => navigate(-1);

  if (loading) {
    return (
      <div className={styles.orderDetailsContainer}>
        <div className={styles.header}>
          <button onClick={goBack} className={styles.backButton}>
            <FaArrowLeft /> Back
          </button>
          <h2>Order Details</h2>
        </div>
        <div className={styles.loader}>Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.orderDetailsContainer}>
        <div className={styles.header}>
          <button onClick={goBack} className={styles.backButton}>
            <FaArrowLeft /> Back
          </button>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!orderData) return null;

  return (
    <div className={styles.orderDetailsContainer}>
      <div className={styles.header}>
        <button onClick={goBack} className={styles.backButton}>
          <FaArrowLeft /> Back
        </button>
        <h2>Order Details</h2>
      </div>

      <div className={styles.orderHeader}>
        <div>
          <h3>Order #{orderData.order_number}</h3>
          <div className={styles.orderDate}>{orderData.created_at}</div>
        </div>
        <div className={styles.orderStatus}>
          {orderData.status}
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailCard}>
          <FaUser className={styles.icon} />
          <div className={styles.detailContent}>
            <h4>Customer</h4>
            <p>{orderData.customer.name}</p>
            <p>{orderData.customer.phone}</p>
          </div>
        </div>

        <div className={styles.detailCard}>
          <FaMapMarkerAlt className={styles.icon} />
          <div className={styles.detailContent}>
            <h4>Delivery Location</h4>
            <p>{orderData.customer.address}</p>
            {orderData.customer.room_number && (
              <p className={styles.roomNumber}>Room: {orderData.customer.room_number}</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.itemsSection}>
        <h3>Order Items</h3>
        {orderData.vendors.map((vendor) => (
          <div key={vendor.vendor_info.id} className={styles.vendorSection}>
            <div className={styles.vendorHeader}>
              <h4>{vendor.vendor_info.name}</h4>
              <span className={styles.vendorLocation}>{vendor.vendor_info.location}</span>
            </div>
            
            <div className={styles.itemsList}>
              {vendor.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemName}>{item.product_name}</span>
                    <span className={styles.itemQuantity}>x{item.quantity}</span>
                  </div>
                  <span className={styles.itemPrice}>₦{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>₦{orderData.order_summary.subtotal.toLocaleString()}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Shipping Fee</span>
          <span>₦{orderData.order_summary.shipping_fee.toLocaleString()}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Tax</span>
          <span>₦{orderData.order_summary.tax.toLocaleString()}</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span>Total</span>
          <span>₦{orderData.order_summary.total.toLocaleString()}</span>
        </div>
      </div>

      {orderData.status === "IN_TRANSIT" && (
        <div className={styles.actions}>
          <button
            className={styles.deliverButton}
            onClick={handleMarkDelivered}
            disabled={processingAction}
          >
            <FaCheck /> Mark as Delivered
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliveryDetail;
