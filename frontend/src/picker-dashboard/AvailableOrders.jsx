// src/components/PickerDashboard/AvailableOrders/AvailableOrders.jsx
import React, { useState, useEffect } from "react";
import styles from "./css/AvailableOrders.module.css";
import { FaFilter, FaMapMarkerAlt, FaStore, FaBoxOpen } from "react-icons/fa";
import api from "../constant/api";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";

const AvailableOrders = ({ onOrderSelect }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvailableOrders = async () => {
      try {
        setIsLoading(true);

        const response = await api.get(`available-orders?filter=${filter}`);
        setOrders(response.data);
        console.log(response.data);
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
      await api.post(`available-orders/${orderId}/accept/`);
      // After accepting, redirect to my deliveries or refresh the list
      Swal.fire({
        icon: "success",
        title: "Order Accepted",
        text: "You have successfully accepted the order.",
      });
      navigate("/picker/my-deliveries");
    } catch (error) {
      console.error("Error accepting order:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to accept order",
        text: "You can not accept order now pls try again later",
      });
    }
  };


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
      ) : orders.length === 0 ? (
        <div className={styles.noOrders}>No available orders found.</div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
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
                <Link to={`/order-detail/${order.id}`}>
                  <button className={styles.viewButton}>View Details</button>
                </Link>
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
