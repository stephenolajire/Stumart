// src/components/PickerDashboard/AvailableOrders/AvailableOrders.jsx
import React, { useState, useEffect } from "react";
import styles from "./css/AvailableOrders.module.css";
import { FaFilter, FaMapMarkerAlt, FaStore, FaBoxOpen } from "react-icons/fa";
import axios from "axios";
import api from "../constant/api";

const AvailableOrders = ({ onOrderSelect }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableOrders = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API endpoint
        const response = await api.get(
          `available-orders?filter=${filter}`
        );
        setOrders(response.data);
        console.log(response.data)
      } catch (error) {
        console.error("Error fetching available orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableOrders();
  }, [filter]);

  const handleAcceptOrder = async (orderId) => {
    try {
      // Replace with your actual API endpoint
      await axios.post(`/api/picker/available-orders/${orderId}`);
      // After accepting, redirect to my deliveries or refresh the list
      alert("Order accepted successfully!");
    } catch (error) {
      console.error("Error accepting order:", error);
      alert("Failed to accept order. Please try again.");
    }
  };

  // For demonstration purposes using mock data
  

  // Use mock data for now
  const displayOrders = isLoading ? [] : orders.length ? orders : " ";

  return (
    <div className={styles.availableOrders}>
      <h1 className={styles.pageTitle}>Available Orders</h1>

      <div className={styles.filtersContainer}>
        <button
          className={`${styles.filterButton} ${
            filter === "all" ? styles.active : ""
          }`}
          onClick={() => setFilter("all")}
        >
          All Orders
        </button>
        <button
          className={`${styles.filterButton} ${
            filter === "nearby" ? styles.active : ""
          }`}
          onClick={() => setFilter("nearby")}
        >
          Nearby
        </button>
        <button
          className={`${styles.filterButton} ${
            filter === "high_value" ? styles.active : ""
          }`}
          onClick={() => setFilter("high_value")}
        >
          High Value
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading available orders...</div>
      ) : displayOrders.length === 0 ? (
        <div className={styles.noOrders}>No available orders found.</div>
      ) : (
        <div className={styles.ordersList}>
          {displayOrders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <h3>{order.order_number}</h3>
                <span className={styles.shippingFee}>
                  ₦{order.shipping_fee} Fee
                </span>
              </div>

              <div className={styles.vendorInfo}>
                <FaStore className={styles.infoIcon} />
                <span>{order.vendor_name}</span>
              </div>

              <div className={styles.locationInfo}>
                <div className={styles.location}>
                  <FaMapMarkerAlt className={styles.infoIcon} />
                  <span>Pickup: {order.pickup_location}</span>
                </div>
                <div className={styles.location}>
                  <FaMapMarkerAlt className={styles.infoIcon} />
                  <span>Deliver to: {order.delivery_location}</span>
                </div>
              </div>

              <div className={styles.itemsList}>
                <h4>
                  <FaBoxOpen className={styles.infoIcon} /> Order Items (
                  {order.items.length})
                </h4>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.product_name} x{item.quantity}
                      </span>
                      <span>₦{item.price.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className={styles.orderTotal}>
                  <span>Order Total:</span>
                  <span>₦{order.total.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.orderActions}>
                <button
                  className={styles.viewButton}
                  onClick={() => onOrderSelect(order.id)}
                >
                  View Details
                </button>
                <button
                  className={styles.acceptButton}
                  onClick={() => handleAcceptOrder(order.id)}
                >
                  Accept Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableOrders;
