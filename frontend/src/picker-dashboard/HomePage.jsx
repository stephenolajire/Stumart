// HomePage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./css/HomePage.module.css";
import api from "../constant/api";

const HomePage = () => {
  const [stats, setStats] = useState({
    availableOrders: 0,
    activeDeliveries: 0,
    earnings: 0,
    rating: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/picker/dashboard/");
        setStats(response.data.stats);
        setRecentOrders(response.data.recent_orders);
        console.log(response.data)
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.homeContainer}>
      <h1>Dashboard</h1>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Available Orders</h3>
          <p>{stats ?.availableOrders}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Active Deliveries</h3>
          <p>{stats ?.activeDeliveries}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Earnings</h3>
          <p>₦{stats ?.earnings.toFixed(2)}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Rating</h3>
          <p>{stats ?.rating.toFixed(1)}/5.0</p>
        </div>
      </div>

      <div className={styles.ordersGrid}>
        <div className={styles.ordersCard}>
          <h3>Recent Orders</h3>
          {recentOrders?.length > 0 ? (
            <ul className={styles.ordersList}>
              {recentOrders.map((order) => (
                <li key={order.id} className={styles.orderItem}>
                  <div className={styles.orderDetails}>
                    <h4>Order #{order.order_number}</h4>
                    <p>
                      From {order.vendor_name} to {order.delivery_location}
                    </p>
                  </div>
                  <span
                    className={`${styles.orderStatus} ${
                      styles[`status${order.status.replace(/\s/g, "")}`]
                    }`}
                  >
                    {order.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent orders</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
