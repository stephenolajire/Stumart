import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./css/AvailableOrders.module.css";
import api from "../constant/api";

const AvailableOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchAvailableOrders = async () => {
      try {
        const response = await api.get("/available-orders/", {
          params: { filter },
        });
        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching available orders:", error);
        setLoading(false);
      }
    };

    fetchAvailableOrders();
  }, [filter]);

  const handleAcceptOrder = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/accept/`);
      // Remove the accepted order from the list
      setOrders(orders.filter((order) => order.id !== orderId));
    } catch (error) {
      console.error("Error accepting order:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Available Orders</h1>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Orders</option>
          <option value="nearby">Nearby Orders</option>
          <option value="high_value">High Value Orders</option>
        </select>
      </div>

      {orders.length > 0 ? (
        orders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <h3>Order #{order.order_number}</h3>
              <span>₦{order.total.toFixed(2)}</span>
            </div>

            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Vendor:</span>
                <span className={styles.detailValue}>{order.vendor_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Pickup Location:</span>
                <span className={styles.detailValue}>
                  {order.pickup_location}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Delivery Location:</span>
                <span className={styles.detailValue}>
                  {order.delivery_location}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Distance:</span>
                <span className={styles.detailValue}>{order.distance} km</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Delivery Fee:</span>
                <span className={styles.detailValue}>
                  ₦{order.shipping_fee.toFixed(2)}
                </span>
              </div>
            </div>

            <div className={styles.orderItems}>
              <h4>Order Items ({order.items.length})</h4>
              {order.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <span>{item.product_name}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>

            <button
              className={`${styles.actionButton} ${styles.acceptButton}`}
              onClick={() => handleAcceptOrder(order.id)}
            >
              Accept Order
            </button>
          </div>
        ))
      ) : (
        <div className={styles.noOrders}>
          <p>No available orders at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default AvailableOrders;
