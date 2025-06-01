// src/components/PickerDashboard/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import styles from "./css/Dashboard.module.css";
import Spinner from "../components/Spinner";
import {
  FaShoppingBag,
  FaTruck,
  FaMoneyBillWave,
  FaStar,
} from "react-icons/fa";
import api from "../constant/api";
import ThemeToggle from "../components/ThemeToggle";

const Dashboard = ({ onOrderSelect }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      availableOrders: 0,
      activeDeliveries: 0,
      earnings: 0,
      rating: 0,
    },
    recent_orders: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("picker/dashboard");
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div style={{ position: "fixed", top: "2rem", right: "2rem" }}>
        <ThemeToggle />
      </div>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaShoppingBag />
          </div>
          <div className={styles.statInfo}>
            <h3>{dashboardData.stats.availableOrders}</h3>
            <p>Available Orders</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaTruck />
          </div>
          <div className={styles.statInfo}>
            <h3>{dashboardData.stats.activeDeliveries}</h3>
            <p>Active Deliveries</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaMoneyBillWave />
          </div>
          <div className={styles.statInfo}>
            <h3>₦{dashboardData.stats.earnings.toLocaleString()}</h3>
            <p>Total Earnings</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaStar />
          </div>
          <div className={styles.statInfo}>
            <h3>{dashboardData.stats.rating.toFixed(1)}</h3>
            <p>Rating</p>
          </div>
        </div>
      </div>

      <div className={styles.recentOrdersCard}>
        <h2 className={styles.cardTitle}>Recent Orders</h2>

        {dashboardData.recent_orders.length === 0 ? (
          <p className={styles.noOrders}>No recent orders found.</p>
        ) : (
          <div className={styles.recentOrdersList}>
            {dashboardData.recent_orders.map((order) => (
              <div
                key={order.id}
                className={styles.orderItem}
                onClick={() => onOrderSelect(order.id)}
              >
                <div className={styles.orderInfo}>
                  <h4>{order.order_number}</h4>
                  <p className={styles.vendorName}>{order.vendor_name}</p>
                  <p className={styles.location}>{order.delivery_location}</p>
                </div>
                <div className={styles.orderStatus}>
                  <span
                    className={`${styles.badge} ${
                      order.status === "Pending"
                        ? styles.badgePending
                        : order.status === "In Progress"
                        ? styles.badgeActive
                        : styles.badgeCompleted
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
