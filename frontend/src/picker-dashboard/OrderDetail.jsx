// OrderDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./css/OrderDetails.module.css";
import {
  FaArrowLeft,
  FaStore,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaBox,
  FaClipboardCheck,
  FaTruck,
  FaCheckCircle,
} from "react-icons/fa";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`/api/picker/orders/${orderId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrderData(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load order details");
        setLoading(false);
        console.error(err);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleAcceptOrder = async () => {
    try {
      setProcessingAction(true);
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `/api/picker/available-orders/${orderId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage("Order accepted successfully! Refreshing...");

      // Refresh order data after accepting
      setTimeout(async () => {
        try {
          const response = await axios.get(`orders/${orderId}/`, {});
          setOrderData(response.data);
          setProcessingAction(false);
          setSuccessMessage("");
        } catch (err) {
          setError("Failed to refresh order data");
          setProcessingAction(false);
          console.error(err);
        }
      }, 2000);
    } catch (err) {
      setError("Failed to accept order");
      setProcessingAction(false);
      console.error(err);
    }
  };

  const handleMarkDelivered = async () => {
    try {
      setProcessingAction(true);
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `/api/picker/deliveries/${orderId}/delivered/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage(
        "Order marked as delivered! Redirecting to deliveries..."
      );

      // Redirect to deliveries page after marking as delivered
      setTimeout(() => {
        navigate("/picker/deliveries");
      }, 2000);
    } catch (err) {
      setError("Failed to mark order as delivered");
      setProcessingAction(false);
      console.error(err);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className={styles.loader}>Loading order details...</div>;
  }

  if (error) {
    return (
      <div className={styles.orderDetailsContainer}>
        <button onClick={goBack} className={styles.backButton}>
          <FaArrowLeft /> Back
        </button>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className={styles.orderDetailsContainer}>
        <button onClick={goBack} className={styles.backButton}>
          <FaArrowLeft /> Back
        </button>
        <div className={styles.errorMessage}>Order not found</div>
      </div>
    );
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "PAID":
        return styles.statusPaid;
      case "IN_TRANSIT":
        return styles.statusTransit;
      case "DELIVERED":
        return styles.statusDelivered;
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return <FaClipboardCheck />;
      case "IN_TRANSIT":
        return <FaTruck />;
      case "DELIVERED":
        return <FaCheckCircle />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.orderDetailsContainer}>
      <div className={styles.header}>
        <button onClick={goBack} className={styles.backButton}>
          <FaArrowLeft /> Back
        </button>
        <h2>Order Details</h2>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>{successMessage}</div>
      )}

      <div className={styles.orderHeader}>
        <div>
          <h3>Order #{orderData.order_number}</h3>
          <div className={styles.orderDate}>
            Placed on {orderData.created_at}
          </div>
        </div>
        <div
          className={`${styles.orderStatus} ${getStatusClass(
            orderData.status
          )}`}
        >
          {getStatusIcon(orderData.status)} {orderData.status.replace("_", " ")}
        </div>
      </div>

      <div className={styles.infoCards}>
        <div className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <FaStore className={styles.infoIcon} />
            <h4>Vendor Information</h4>
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Name:</span>
              <span>{orderData.vendor.name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Phone:</span>
              <span>{orderData.vendor.phone}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Pickup Location:</span>
              <span>{orderData.vendor.location}</span>
            </div>
          </div>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <FaUser className={styles.infoIcon} />
            <h4>Customer Information</h4>
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Name:</span>
              <span>{orderData.customer.name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Phone:</span>
              <span>{orderData.customer.phone}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Delivery Address:</span>
              <span>
                {orderData.customer.address}
                {orderData.customer.room_number &&
                  `, Room ${orderData.customer.room_number}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.orderItems}>
        <h4>Order Items</h4>
        <div className={styles.itemsTable}>
          <div className={styles.itemsHeader}>
            <div className={styles.itemColumn}>Item</div>
            <div className={styles.quantityColumn}>Qty</div>
            <div className={styles.priceColumn}>Price</div>
            <div className={styles.totalColumn}>Total</div>
          </div>
          {orderData.items.map((item) => (
            <div key={item.id} className={styles.itemRow}>
              <div className={styles.itemColumn}>
                <div className={styles.itemName}>{item.product_name}</div>
                {(item.size || item.color) && (
                  <div className={styles.itemAttributes}>
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>
                )}
              </div>
              <div className={styles.quantityColumn}>{item.quantity}</div>
              <div className={styles.priceColumn}>
                ₦{item.price.toLocaleString()}
              </div>
              <div className={styles.totalColumn}>
                ₦{(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.orderSummary}>
        <div className={styles.summaryItem}>
          <span>Subtotal</span>
          <span>₦{orderData.subtotal.toLocaleString()}</span>
        </div>
        <div className={styles.summaryItem}>
          <span>Shipping Fee</span>
          <span>₦{orderData.shipping_fee.toLocaleString()}</span>
        </div>
        {orderData.tax > 0 && (
          <div className={styles.summaryItem}>
            <span>Tax</span>
            <span>₦{orderData.tax.toLocaleString()}</span>
          </div>
        )}
        <div className={`${styles.summaryItem} ${styles.summaryTotal}`}>
          <span>Total</span>
          <span>₦{orderData.total.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.actionButtons}>
        {orderData.status === "PAID" && !orderData.is_assigned && (
          <button
            className={styles.acceptButton}
            onClick={handleAcceptOrder}
            disabled={processingAction}
          >
            <FaBox /> Accept Order
          </button>
        )}

        {orderData.status === "IN_TRANSIT" && orderData.is_assigned_to_me && (
          <button
            className={styles.deliveredButton}
            onClick={handleMarkDelivered}
            disabled={processingAction}
          >
            <FaCheckCircle /> Mark as Delivered
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
