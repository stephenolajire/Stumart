import React, { useState, useEffect } from "react";
import styles from "./css/MyDeliveries.module.css";
import { FaMapMarkerAlt, FaUser, FaBox, FaCheck } from "react-icons/fa";
import api from "../constant/api";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

const MyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`my-deliveries?status=${activeTab}`);
        setDeliveries(response.data);
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, [activeTab]);

  const handleMarkAsDelivered = async (orderId) => {
    try {
      await api.post(`orders/${orderId}/deliver/`, {
        status: "DELIVERED",
      });

      // Remove the order from active deliveries list
      setDeliveries((prevDeliveries) =>
        prevDeliveries.filter((delivery) => delivery.id !== orderId)
      );

      Swal.fire({
        icon: "success", // Fixed: Added quotes around success
        text: "Thank you for an amazing job. Go on to accept more orders",
        title: "Order Delivered",
      });
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      Swal.fire({
        icon: "error", // Fixed: Added quotes around error
        title: "Status Error",
        text: "Order status failed, pls try again later",
      });
    }
  };

  return (
    <div className={styles.myDeliveries}>
      <h1 className={styles.pageTitle}>My Deliveries</h1>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "active" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("active")}
        >
          Active Deliveries
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "completed" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Deliveries
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading deliveries...</div>
      ) : deliveries.length === 0 ? (
        <div className={styles.noDeliveries}>
          No {activeTab === "active" ? "active" : "completed"} deliveries found.
        </div>
      ) : (
        <div className={styles.deliveriesList}>
          {deliveries.map((delivery) => (
            <div key={delivery.id} className={styles.deliveryCard}>
              <div className={styles.deliveryHeader}>
                <div>
                  <h3>{delivery.order_number}</h3>
                  <p className={styles.timestamp}>{delivery.created_at}</p>
                </div>
                <span
                  className={`${styles.status} ${
                    delivery.status === "IN_TRANSIT"
                      ? styles.statusActive
                      : styles.statusCompleted
                  }`}
                >
                  {delivery.status === "IN_TRANSIT"
                    ? "In Transit"
                    : "Delivered"}
                </span>
              </div>

              <div className={styles.deliveryDetails}>
                <div className={styles.detailItem}>
                  <FaUser className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Customer</span>
                    <p>{delivery.customer_name}</p>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <FaMapMarkerAlt className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>
                      Delivery Location
                    </span>
                    <p>{delivery.delivery_location}</p>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <FaBox className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Items</span>
                    <p>{delivery.items_count} item(s)</p>
                  </div>
                </div>
              </div>

              <div className={styles.deliveryFooter}>
                <div className={styles.deliveryFinancials}>
                  <div>
                    <span className={styles.financialLabel}>Order Total</span>
                    <p className={styles.financialValue}>
                      ₦{delivery.total.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className={styles.financialLabel}>Your Fee</span>
                    <p className={styles.financialValue}>
                      ₦{delivery.shipping_fee.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className={styles.deliveryActions}>
                  <Link to={`/order-detail/${delivery.id}`}>
                    <button className={styles.viewButton}>View Details</button>
                  </Link>

                  {delivery.status === "IN_TRANSIT" && (
                    <button
                      className={styles.deliveredButton}
                      onClick={() => handleMarkAsDelivered(delivery.id)}
                    >
                      <FaCheck /> Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;
