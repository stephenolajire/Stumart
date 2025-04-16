import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./css/MyDeliveries.module.css";
import api from "../constant/api";

const MyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const response = await api.get(
          `/my-deliveries/?status=${activeTab}`
        );
        setDeliveries(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching deliveries:", error);
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, [activeTab]);

  const handleMarkAsDelivered = async (orderId) => {
    try {
      await axios.post(`/api/picker/orders/${orderId}/deliver/`);
      // Remove the delivered order from active list or refresh the list
      setDeliveries(deliveries.filter((delivery) => delivery.id !== orderId));
    } catch (error) {
      console.error("Error marking order as delivered:", error);
    }
  };

  const handleViewDetails = (orderId) => {
    navigate(`/picker/orders/${orderId}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Deliveries</h1>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <div
            className={`${styles.tab} ${
              activeTab === "active" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active Deliveries
          </div>
          <div
            className={`${styles.tab} ${
              activeTab === "completed" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed Deliveries
          </div>
        </div>
      </div>

      {deliveries.length > 0 ? (
        deliveries.map((delivery) => (
          <div key={delivery.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <h3>Order #{delivery.order_number}</h3>
              <span
                className={`${styles.statusBadge} ${
                  delivery.status === "PENDING"
                    ? styles.statusPending
                    : delivery.status === "IN_TRANSIT"
                    ? styles.statusInTransit
                    : styles.statusDelivered
                }`}
              >
                {delivery.status === "PENDING"
                  ? "Pending"
                  : delivery.status === "IN_TRANSIT"
                  ? "In Transit"
                  : "Delivered"}
              </span>
            </div>

            <div className={styles.orderDetails}>
              <div className={styles.detailCol}>
                <div className={styles.detailLabel}>Vendor</div>
                <div className={styles.detailValue}>{delivery.vendor_name}</div>
              </div>
              <div className={styles.detailCol}>
                <div className={styles.detailLabel}>Customer</div>
                <div className={styles.detailValue}>
                  {delivery.customer_name}
                </div>
              </div>
              <div className={styles.detailCol}>
                <div className={styles.detailLabel}>Items</div>
                <div className={styles.detailValue}>
                  {delivery.items_count} items
                </div>
              </div>
              <div className={styles.detailCol}>
                <div className={styles.detailLabel}>Delivery Fee</div>
                <div className={styles.detailValue}>
                  ₦{delivery.shipping_fee.toFixed(2)}
                </div>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                className={`${styles.actionButton} ${styles.secondaryButton}`}
                onClick={() => handleViewDetails(delivery.id)}
              >
                View Details
              </button>

              {delivery.status === "IN_TRANSIT" && (
                <button
                  className={`${styles.actionButton} ${styles.primaryButton}`}
                  onClick={() => handleMarkAsDelivered(delivery.id)}
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className={styles.noDeliveries}>
          <p>No {activeTab} deliveries found.</p>
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;
